/**
 * NEXUS Firewall Rule Service Abstraction
 * 
 * Future Architecture Bridge:
 *   React UI → Rule Service → Typed Tauri IPC (`invoke()`) → Rust Security Core → nftables
 * 
 * Current Phase 3:
 *   Operates on local validated frontend state with zero privileged OS calls.
 */

import { 
  FirewallRule, 
  RuleConflict, 
  RuleFilterState, 
  RuleSortField, 
  SortOrder, 
  RuleExportPackage 
} from '../types/firewall';
import { validateCompleteRule, detectRuleConflicts } from '../lib/validation/ruleValidation';

export class RuleService {
  /**
   * Sort rules based on priority, name, createdAt, updatedAt, or action
   */
  static sortRules(
    rules: FirewallRule[], 
    field: RuleSortField = 'priority', 
    order: SortOrder = 'asc'
  ): FirewallRule[] {
    return [...rules].sort((a, b) => {
      let comparison = 0;
      switch (field) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
          break;
        case 'action':
          comparison = a.action.localeCompare(b.action);
          break;
        default:
          comparison = a.priority - b.priority;
      }
      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Filter rules by search term and filter criteria
   */
  static filterRules(
    rules: FirewallRule[], 
    filters: RuleFilterState
  ): FirewallRule[] {
    const q = filters.search.trim().toLowerCase();

    return rules.filter(rule => {
      // 1. Text search across name, description, application, source, destination, port, protocol
      if (q) {
        const matchesName = rule.name.toLowerCase().includes(q);
        const matchesDesc = (rule.description || '').toLowerCase().includes(q);
        const matchesApp = (rule.application || '').toLowerCase().includes(q);
        const matchesSource = rule.source.toLowerCase().includes(q);
        const matchesDest = rule.destination.toLowerCase().includes(q);
        const matchesPort = rule.port.toLowerCase().includes(q);
        const matchesProto = rule.protocol.toLowerCase().includes(q);

        if (!matchesName && !matchesDesc && !matchesApp && !matchesSource && !matchesDest && !matchesPort && !matchesProto) {
          return false;
        }
      }

      // 2. Status Filter
      if (filters.status !== 'ALL') {
        if (filters.status === 'ENABLED' && !rule.enabled) return false;
        if (filters.status === 'DISABLED' && rule.enabled) return false;
      }

      // 3. Action Filter
      if (filters.action !== 'ALL' && rule.action !== filters.action) {
        return false;
      }

      // 4. Direction Filter
      if (filters.direction !== 'ALL' && rule.direction !== filters.direction && rule.direction !== 'BOTH') {
        return false;
      }

      // 5. Protocol Filter
      if (filters.protocol !== 'ALL' && rule.protocol !== filters.protocol && rule.protocol !== 'ALL') {
        return false;
      }

      // 6. Application Filter
      if (filters.application !== 'ALL') {
        if ((rule.application || 'Any').toLowerCase() !== filters.application.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Prepares a duplicate rule from an existing rule
   */
  static prepareDuplicateRule(sourceRule: FirewallRule, existingRules: FirewallRule[]): FirewallRule {
    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);

    // Calculate next available priority
    const highestPriority = existingRules.reduce((max, r) => Math.max(max, r.priority), 0);
    const nextPriority = highestPriority + 10;

    // Generate unique name
    let newName = `${sourceRule.name} (Copy)`;
    let counter = 2;
    while (existingRules.some(r => r.name.toLowerCase() === newName.toLowerCase())) {
      newName = `${sourceRule.name} (Copy ${counter})`;
      counter++;
    }

    return {
      ...sourceRule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newName,
      priority: nextPriority,
      enabled: false, // Default to disabled per best security practice
      createdAt: timeStr,
      updatedAt: timeStr,
      hitCount: 0,
    };
  }

  /**
   * Export rules to versioned JSON schema
   */
  static exportRules(rules: FirewallRule[]): RuleExportPackage {
    return {
      schemaVersion: 1,
      product: 'NEXUS Firewall',
      exportedAt: new Date().toISOString(),
      rulesCount: rules.length,
      rules,
    };
  }

  /**
   * Validate and parse an imported rules JSON file
   */
  static parseAndValidateImport(
    jsonString: string, 
    existingRules: FirewallRule[]
  ): { 
    isValid: boolean; 
    data?: RuleExportPackage; 
    errors: string[];
    importableCount?: number;
  } {
    const errors: string[] = [];

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e: any) {
      return { isValid: false, errors: [`JSON Syntax Error: ${e.message || 'Malformed JSON file'}`] };
    }

    // Schema checks
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, errors: ['Invalid file format: Root element must be an object.'] };
    }

    if (parsed.schemaVersion !== 1) {
      errors.push(`Unsupported schemaVersion (${parsed.schemaVersion ?? 'missing'}). Expected schemaVersion: 1.`);
    }

    if (!Array.isArray(parsed.rules)) {
      errors.push('Invalid package: "rules" must be an array of FirewallRule objects.');
      return { isValid: false, errors };
    }

    const validatedRules: FirewallRule[] = [];
    parsed.rules.forEach((r: any, idx: number) => {
      if (!r.name || typeof r.name !== 'string') {
        errors.push(`Rule #${idx + 1}: Missing or invalid "name" string.`);
      }
      if (!r.action || !['ALLOW', 'BLOCK', 'REJECT'].includes(r.action)) {
        errors.push(`Rule #${idx + 1} ("${r.name || 'unnamed'}"): Invalid action "${r.action}".`);
      }
      if (!r.direction || !['INBOUND', 'OUTBOUND', 'BOTH'].includes(r.direction)) {
        errors.push(`Rule #${idx + 1}: Invalid direction "${r.direction}".`);
      }
      if (!r.protocol || !['TCP', 'UDP', 'ICMP', 'ALL'].includes(r.protocol)) {
        errors.push(`Rule #${idx + 1}: Invalid protocol "${r.protocol}".`);
      }

      const val = validateCompleteRule(r, existingRules);
      if (!val.isValid) {
        Object.values(val.errors).forEach(err => {
          errors.push(`Rule #${idx + 1} ("${r.name}"): ${err}`);
        });
      } else {
        validatedRules.push({
          ...r,
          id: r.id || `rule-import-${Date.now()}-${idx}`,
          createdAt: r.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          hitCount: Number(r.hitCount) || 0,
          enabled: Boolean(r.enabled),
          logging: Boolean(r.logging),
          priority: Number(r.priority) || (idx + 1) * 10,
        });
      }
    });

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    return {
      isValid: true,
      data: {
        schemaVersion: 1,
        product: 'NEXUS Firewall',
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        rulesCount: validatedRules.length,
        rules: validatedRules,
      },
      errors: [],
      importableCount: validatedRules.length,
    };
  }

  /**
   * Run conflict check for a given rule against all existing rules
   */
  static getConflicts(rule: FirewallRule, allRules: FirewallRule[]): RuleConflict[] {
    return detectRuleConflicts(rule, allRules);
  }
}
