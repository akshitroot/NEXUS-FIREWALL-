# NEXUS Firewall — Architecture, Security, Packaging & Operations Manual

Version: 0.1.0  
Status: **Pre-Release Candidate (Gated: Phase 8/9 Pending Kernel Verification)**  
Identifier: `com.nexus.firewall`  
Target Platform: Linux (x86_64, aarch64)  
Desktop Runtime: Tauri v2 + React 19 + TypeScript + Vite  

---

## 1. System Architecture Overview

NEXUS Firewall is structured as a decoupled, multi-tier desktop security controller:

```text
React 19 Frontend (UI / Visual System)
        │
        ▼  Typed IPC via Tauri v2 Bridge (`src/services/tauriBridge.ts`)
Tauri v2 IPC Router (`src-tauri/src/commands/`)
        │
        ▼  Strict Parameter Validation & Type Deserialization
Rust Security Core (`src-tauri/src/security/engine.rs`)
   ├── Rule Validation & Type Safety
   ├── Policy Conflict & Shadowing Detection
   ├── Snapshot Engine (Point-in-time state & Rollback)
   └── Cryptographic / Audit Event Logger
        │
        ▼  Platform Security Adapter (Pending Phase 8 Verification)
Dedicated Linux nftables Driver (`table inet nexus_filter`)
```

### Key Security Guardrails
1. **No Arbitrary Shell or Process Execution**: The codebase contains **zero** instances of `std::process::Command`, `sh`, `bash`, `pkexec`, or `sudo`. Commands cannot be executed from frontend inputs.
2. **Dedicated Table Isolation**: When the platform adapter generates rules, they are strictly scoped to the `inet nexus_filter` table. NEXUS never flushes global rulesets or interferes with Docker, Kubernetes, or system-managed chains.
3. **Transaction Safety & Rollback**: Every state mutation produces an atomic snapshot in `SecurityEngine`. If a change is contested or violates policy, `rollback_to_snapshot` restores the last-known-good state.
4. **Hardened Tauri Capabilities**: Capabilities in `src-tauri/capabilities/default.json` allow only standard window operations (`close`, `minimize`, `maximize`). All firewall mutations are routed exclusively through explicit, typed Rust commands.
5. **Content Security Policy (CSP)**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ipc: http://localhost:3000`.

---

## 2. Linux nftables Isolation Specification

NEXUS implements table-scoped isolation to guarantee non-destructive coexistence with host network services:

```text
table inet nexus_filter {
    chain input {
        type filter hook input priority filter; policy drop;
        ct state established,related accept
        iif "lo" accept
        # NEXUS Managed Input Rules
    }

    chain output {
        type filter hook output priority filter; policy accept
        # NEXUS Managed Output Rules
    }

    chain forward {
        type filter hook forward priority filter; policy drop;
    }
}
```

* Rules are applied inside atomic transactions (`nft -f -` or netlink socket).
* NEXUS cleans up **only** its own table (`delete table inet nexus_filter`) during uninstall or reset.

---

## 3. Installation Guide (Linux)

### Prerequisites
* Operating System: Linux (Kernel >= 5.4, nftables >= 0.9.8)
* Polkit daemon (`polkitd`) for privileged helper authorization
* Architecture: x86_64 or aarch64

### Option A: Binary Package (.deb / .rpm)
```bash
# Debian / Ubuntu
sudo dpkg -i nexus-firewall_0.1.0_amd64.deb
sudo apt-get install -f # resolve dependencies if needed

# Fedora / RHEL
sudo rpm -i nexus-firewall-0.1.0-1.x86_64.rpm
```

### Option B: AppImage
```bash
chmod +x nexus-firewall_0.1.0_amd64.AppImage
./nexus-firewall_0.1.0_amd64.AppImage
```

---

## 4. Configuration & Policy Administration

NEXUS configuration files reside in:
* Configuration: `~/.config/nexus-firewall/config.json`
* Snapshots: `~/.config/nexus-firewall/snapshots/`
* Audit Logs: `~/.local/share/nexus-firewall/audit.log`

### Pre-defined Security Profiles
* **Strict Enterprise**: Default DROP on input/forward; explicit outbound white-listing; stealth mode active.
* **Balanced Workstation**: Default DROP on incoming; established/related accepted; standard outbound ports permitted.
* **Developer Mode**: Local loopback and local subnet development ports (3000-9000) permitted with prompt alerts.

---

## 5. Troubleshooting & Diagnostics

### Problem: Application fails to start or IPC times out
* **Cause**: Polkit authentication canceled or Tauri IPC bridge failure.
* **Resolution**:
  1. Check system logs: `journalctl -xe | grep nexus-firewall`
  2. Verify Polkit agent is active in your desktop session (`polkit-gnome-authentication-agent-1` or `lxqt-policykit`).

### Problem: Network traffic blocked unexpectedly
* **Cause**: Strict policy active without necessary port exceptions.
* **Emergency Recovery**:
  ```bash
  # Restore last known good snapshot via CLI helper:
  nexus-firewall-cli rollback --last-good

  # Emergency bypass (flushes only NEXUS table, preserving host firewall):
  sudo nft delete table inet nexus_filter
  ```

---

## 6. Safe Uninstallation & Cleanup

To cleanly remove NEXUS Firewall without leaving orphan kernel firewall rules:

```bash
# Step 1: Remove the dedicated NEXUS nftables table
sudo nft delete table inet nexus_filter 2>/dev/null || true

# Step 2: Remove application package
# For Debian/Ubuntu:
sudo apt-get remove --purge nexus-firewall

# For Fedora/RHEL:
sudo dnf remove nexus-firewall

# Step 3: Remove user-space configuration (optional)
rm -rf ~/.config/nexus-firewall ~/.local/share/nexus-firewall
```

---

## 7. Packaging & Build Pipeline

To compile and package the application from source in a system with Cargo and Node.js:

```bash
# Frontend build & type check
npm run lint
npm run build

# Tauri bundle generation (requires cargo and host libwebkit2gtk-4.1-dev)
npm run tauri:build
```
Artifacts will be produced in `src-tauri/target/release/bundle/`.
