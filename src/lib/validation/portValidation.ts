/**
 * Port number and range validation utilities for NEXUS Firewall
 * Enforces valid TCP/UDP ports (1-65535) and protocol compatibility.
 */

export function validateSinglePort(port: number | string): { isValid: boolean; error?: string } {
  const str = String(port).trim();
  if (!str) {
    return { isValid: false, error: 'Port number cannot be empty.' };
  }

  if (!/^\d+$/.test(str)) {
    return { isValid: false, error: 'Port must be a positive integer.' };
  }

  const num = Number(str);
  if (num < 1 || num > 65535) {
    return { isValid: false, error: `Port ${num} is out of valid range (1–65535).` };
  }

  return { isValid: true };
}

export function validatePortRange(start: number | string, end: number | string): { isValid: boolean; error?: string } {
  const startRes = validateSinglePort(start);
  if (!startRes.isValid) {
    return { isValid: false, error: `Start port: ${startRes.error}` };
  }

  const endRes = validateSinglePort(end);
  if (!endRes.isValid) {
    return { isValid: false, error: `End port: ${endRes.error}` };
  }

  const startNum = Number(start);
  const endNum = Number(end);

  if (startNum > endNum) {
    return { isValid: false, error: `Start port (${startNum}) must be less than or equal to end port (${endNum}).` };
  }

  return { isValid: true };
}

export function validatePortExpression(
  portStr: string, 
  protocol: string
): { isValid: boolean; error?: string } {
  const proto = protocol.toUpperCase();
  const trimmed = portStr.trim();

  // ICMP does not accept port numbers
  if (proto === 'ICMP') {
    if (trimmed && trimmed.toLowerCase() !== 'any') {
      return { 
        isValid: false, 
        error: 'ICMP protocol operates at the network layer and does not support transport ports. Port must be "Any".' 
      };
    }
    return { isValid: true };
  }

  if (!trimmed || trimmed.toLowerCase() === 'any') {
    return { isValid: true };
  }

  // Range syntax: e.g. "8000-8080"
  if (trimmed.includes('-')) {
    const [start, end] = trimmed.split('-');
    return validatePortRange(start.trim(), end.trim());
  }

  // Comma-separated list: e.g. "80,443,8080"
  if (trimmed.includes(',')) {
    const items = trimmed.split(',');
    for (const item of items) {
      const res = validateSinglePort(item.trim());
      if (!res.isValid) return res;
    }
    return { isValid: true };
  }

  // Single port
  return validateSinglePort(trimmed);
}
