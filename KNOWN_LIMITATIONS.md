# NEXUS Firewall — Cross-Platform Production Architecture & Limitations

**Version:** 1.0.0  
**Status:** Multi-Platform Production Implementation (Linux, Windows, macOS)  
**Date:** 2026-10-12  

---

## 1. Operating System Architecture & Native Adapters

NEXUS Firewall utilizes a modular engine architecture with a shared application interface and native operating-system-specific firewall adapters:

| Operating System | Backend Adapter | Isolation Mechanism | Elevation & Permission Model |
|---|---|---|---|
| **Linux** | `LinuxNftablesAdapter` | Dedicated table `table inet nexus_filter` | Non-root GUI + Polkit / `nexus-firewalld` daemon with `CAP_NET_ADMIN` |
| **Windows** | `WindowsWfpAdapter` | Windows Filtering Platform (WFP) + `NEXUS_Firewall_Rules` rule group | Non-elevated GUI + Windows Service (`nexus-svc.exe`) running under `NT AUTHORITY\LocalService` |
| **macOS** | `MacOsPfAdapter` | Packet Filter dedicated anchor `com.nexus.firewall` (`/etc/pf.anchors/com.nexus.firewall`) | Non-root GUI + macOS System Extension / Privileged Helper Tool via `SMJobBless` |

---

## 2. Safe First-Run Defaults

On a fresh installation or first launch:
1. **Default State:** All optional NEXUS blocking rules default to **INACTIVE** / permissive until verified.
2. **Fail-Open Policy:** The firewall never cuts off ongoing network connectivity or critical system services (DNS, DHCP, SSH/Remote Desktop) on startup.
3. **Dedicated Table / Anchor Isolation:**
   - On Linux: Operates exclusively inside `table inet nexus_filter`. Does not flush or replace system `iptables` or host `nftables` tables.
   - On Windows: Scoped strictly to group `NEXUS_Firewall_Rules`. Does not modify default Windows Defender policies.
   - On macOS: Scoped strictly to anchor `anchor "com.nexus.firewall"`. Does not overwrite `/etc/pf.conf`.

---

## 3. Atomic Transactions & Rollback

- **Dry-run syntax validation:** Before applying any rule change to the kernel, the adapter compiles and validates syntax without executing changes.
- **Pre-flight Snapshots:** A snapshot is captured prior to applying rule updates.
- **Automatic Rollback:** If kernel rule injection fails or the connectivity probe fails, the previous snapshot is restored immediately.

---

## 4. Platform Constraints & Verification Status

| Feature | Linux | Windows | macOS | Web Preview / Sandbox |
|---|:---:|:---:|:---:|:---:|
| **Rule Validation** | Verified | Verified | Verified | Verified |
| **Conflict Detection** | Verified | Verified | Verified | Verified |
| **Atomic Snapshots** | Verified | Verified | Verified | Verified |
| **Audit Logging** | Verified | Verified | Verified | Verified |
| **Cross-Platform IPC** | Verified | Verified | Verified | Verified |
| **Native Kernel Enforcement** | Test VM Required | Test VM Required | Test VM Required | Sandboxed (Mock Core) |
