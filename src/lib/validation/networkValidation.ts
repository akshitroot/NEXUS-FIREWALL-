/**
 * Network address validation utilities for NEXUS Firewall
 * Provides strict IPv4 and CIDR subnet format validation.
 */

export function validateIPv4(ip: string): { isValid: boolean; error?: string } {
  const trimmed = ip.trim();
  if (!trimmed) {
    return { isValid: false, error: 'IP address cannot be empty.' };
  }

  const parts = trimmed.split('.');
  if (parts.length !== 4) {
    return { isValid: false, error: 'IPv4 address must contain exactly 4 octets separated by dots (e.g., 192.168.1.10).' };
  }

  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    if (!/^\d+$/.test(part)) {
      return { isValid: false, error: `Octet ${i + 1} ("${part}") must contain only numeric digits.` };
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      return { isValid: false, error: `Octet ${i + 1} (${num}) is outside the valid range 0–255.` };
    }
    if (part.length > 1 && part.startsWith('0')) {
      return { isValid: false, error: `Octet ${i + 1} cannot have leading zeros ("${part}").` };
    }
  }

  return { isValid: true };
}

export function validateCIDR(cidr: string): { isValid: boolean; error?: string } {
  const trimmed = cidr.trim();
  if (!trimmed) {
    return { isValid: false, error: 'CIDR block cannot be empty.' };
  }

  const slashIndex = trimmed.indexOf('/');
  if (slashIndex === -1) {
    return { isValid: false, error: 'CIDR must include a network prefix mask (e.g., 192.168.1.0/24).' };
  }

  const ipPart = trimmed.substring(0, slashIndex);
  const maskPart = trimmed.substring(slashIndex + 1);

  const ipRes = validateIPv4(ipPart);
  if (!ipRes.isValid) {
    return { isValid: false, error: `Invalid CIDR base network: ${ipRes.error}` };
  }

  if (!/^\d+$/.test(maskPart)) {
    return { isValid: false, error: `CIDR prefix mask ("${maskPart}") must be numeric.` };
  }

  const maskNum = Number(maskPart);
  if (maskNum < 0 || maskNum > 32) {
    return { isValid: false, error: `Prefix mask /${maskNum} is outside valid IPv4 range /0 to /32.` };
  }

  return { isValid: true };
}

export function validateNetworkTarget(
  target: string, 
  mode: 'any' | 'single' | 'cidr' | 'interface'
): { isValid: boolean; error?: string } {
  const trimmed = target.trim();

  if (mode === 'any' || trimmed.toLowerCase() === 'any') {
    return { isValid: true };
  }

  if (mode === 'interface') {
    if (!trimmed) return { isValid: false, error: 'Interface name is required (e.g. eth0, wlan0, lo).' };
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      return { isValid: false, error: 'Interface contains invalid characters. Use alphanumeric names (e.g. eth0, enp3s0).' };
    }
    return { isValid: true };
  }

  if (mode === 'cidr' || trimmed.includes('/')) {
    return validateCIDR(trimmed);
  }

  if (mode === 'single') {
    return validateIPv4(trimmed);
  }

  // Automatic heuristic check
  if (trimmed.includes('/')) {
    return validateCIDR(trimmed);
  }
  return validateIPv4(trimmed);
}
