/**
 * Complete Firewall Rule Validation & Conflict Detection Engine
 * Note: Frontend validation acts as UI guidance and does NOT serve as an OS security boundary.
 */

import { FirewallRule, RuleConflict } from '../../types/firewall';
import { validateNetworkTarget } from './networkValidation';
import { validatePortExpression } from './portValidation';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateRuleName(
  name: string, 
  existingRules: FirewallRule[] = [], 
  excludeRuleId?: string
): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Rule name is required.' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Rule name must be at least 3 characters long.' };
  }
  if (trimmed.length > 64) {
    return { isValid: false, error: 'Rule name cannot exceed 64 characters.' };
  }

  // Check duplicate rule name
  const duplicate = existingRules.find(
    r => r.name.toLowerCase() === trimmed.toLowerCase() && r.id !== excludeRuleId
  );
  if (duplicate) {
    return { isValid: false, error: `A rule with the name "${trimmed}" already exists.` };
  }

  return { isValid: true };
}

export function validatePriority(
  priority: number | string,
  existingRules: FirewallRule[] = [],
  excludeRuleId?: string
): { isValid: boolean; error?: string; isDuplicate?: boolean } {
  const num = typeof priority === 'string' ? Number(priority) : priority;

  if (isNaN(num) || !Number.isInteger(num) || num < 1) {
    return { isValid: false, error: 'Priority must be a positive integer greater than 0.' };
  }

  if (num > 99999) {
    return { isValid: false, error: 'Priority cannot exceed 99,999.' };
  }

  const dup = existingRules.find(r => r.priority === num && r.id !== excludeRuleId);
  if (dup) {
    return { 
      isValid: true, // Still allow, but flag duplicate priority conflict
      isDuplicate: true,
      error: `Warning: Priority ${num} is already used by rule "${dup.name}". Lower priorities evaluate first.` 
    };
  }

  return { isValid: true };
}

export function validateApplicationPath(path?: string): { isValid: boolean; error?: string } {
  if (!path || !path.trim() || path.trim() === 'Any') {
    return { isValid: true };
  }

  const trimmed = path.trim();
  if (!trimmed.startsWith('/')) {
    return { isValid: false, error: 'Executable path must be an absolute path starting with "/" (e.g., /usr/bin/example).' };
  }

  if (/[<>:"|?*]/.test(trimmed)) {
    return { isValid: false, error: 'Executable path contains invalid filesystem characters.' };
  }

  return { isValid: true };
}

export function validateCompleteRule(
  rule: Partial<FirewallRule>, 
  existingRules: FirewallRule[] = [], 
  currentRuleId?: string
): ValidationResult {
  const errors: Record<string, string> = {};

  // 1. Name
  const nameRes = validateRuleName(rule.name || '', existingRules, currentRuleId);
  if (!nameRes.isValid && nameRes.error) {
    errors.name = nameRes.error;
  }

  // 2. Priority
  const prioRes = validatePriority(rule.priority ?? 1, existingRules, currentRuleId);
  if (!prioRes.isValid && prioRes.error) {
    errors.priority = prioRes.error;
  }

  // 3. Protocol & Port
  const proto = rule.protocol || 'TCP';
  const port = rule.port || '443';
  const portRes = validatePortExpression(port, proto);
  if (!portRes.isValid && portRes.error) {
    errors.port = portRes.error;
  }

  // 4. Source
  const source = rule.source || 'Any';
  const sourceRes = validateNetworkTarget(source, source.includes('/') ? 'cidr' : source === 'Any' ? 'any' : 'single');
  if (!sourceRes.isValid && sourceRes.error) {
    errors.source = sourceRes.error;
  }

  // 5. Destination
  const dest = rule.destination || 'Any';
  const destRes = validateNetworkTarget(dest, dest.includes('/') ? 'cidr' : dest === 'Any' ? 'any' : 'single');
  if (!destRes.isValid && destRes.error) {
    errors.destination = destRes.error;
  }

  // 6. Application Path
  if (rule.applicationPath) {
    const appRes = validateApplicationPath(rule.applicationPath);
    if (!appRes.isValid && appRes.error) {
      errors.applicationPath = appRes.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Frontend preliminary conflict detection
 * Analyzes rule priority overlaps, identical target collisions, and contradictory verdicts.
 */
export function detectRuleConflicts(
  targetRule: FirewallRule, 
  allRules: FirewallRule[]
): RuleConflict[] {
  const conflicts: RuleConflict[] = [];

  for (const other of allRules) {
    if (other.id === targetRule.id) continue;

    // 1. Duplicate Priority Conflict
    if (other.priority === targetRule.priority) {
      conflicts.push({
        ruleId: targetRule.id,
        conflictingRuleId: other.id,
        conflictingRuleName: other.name,
        type: 'duplicate_priority',
        severity: 'warning',
        message: `Shares identical priority #${targetRule.priority} with "${other.name}". Rule evaluation order may be ambiguous in netfilter.`,
      });
    }

    // Check traffic selector similarity
    const sameDirection = other.direction === targetRule.direction || other.direction === 'BOTH' || targetRule.direction === 'BOTH';
    const sameProtocol = other.protocol === targetRule.protocol || other.protocol === 'ALL' || targetRule.protocol === 'ALL';
    const sameSource = other.source.toLowerCase() === targetRule.source.toLowerCase();
    const sameDest = other.destination.toLowerCase() === targetRule.destination.toLowerCase();
    const samePort = other.port.toLowerCase() === targetRule.port.toLowerCase();

    const matchesTraffic = sameDirection && sameProtocol && sameSource && sameDest && samePort;

    if (matchesTraffic) {
      if (other.action !== targetRule.action) {
        // 2. Contradictory Verdict Conflict
        conflicts.push({
          ruleId: targetRule.id,
          conflictingRuleId: other.id,
          conflictingRuleName: other.name,
          type: 'contradictory_verdict',
          severity: 'error',
          message: `Contradicts "${other.name}": Both rules target identical traffic, but this rule specifies ${targetRule.action} while "${other.name}" specifies ${other.action}. Evaluated by priority #${Math.min(targetRule.priority, other.priority)}.`,
        });
      } else {
        // 3. Redundant / Identical Rule
        conflicts.push({
          ruleId: targetRule.id,
          conflictingRuleId: other.id,
          conflictingRuleName: other.name,
          type: 'identical_target',
          severity: 'warning',
          message: `Redundant policy with "${other.name}": Both rules define identical ${targetRule.action} actions for matching selectors.`,
        });
      }
    }
  }

  return conflicts;
}
