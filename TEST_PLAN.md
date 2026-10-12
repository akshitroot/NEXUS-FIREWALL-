# NEXUS Firewall — Master Test Plan (Phase 11)

**Application:** NEXUS Firewall  
**Version:** 0.1.0  
**Identifier:** `com.nexus.firewall`  
**Security Baseline:** Phase 7 Security Core + Phase 8 nftables Architecture  
**Document Status:** Approved for Phase 11 Beta Readiness Gate  

---

## 1. Scope & Objectives

The purpose of this test plan is to define all validation procedures, execution boundaries, and pass/fail criteria for the NEXUS Firewall before public beta distribution.

### Core Testing Pillars:
1. **Frontend Integrity & Presentation**: TypeScript compilation, Vite build output, zero-pill UI adherence, navigation, rule inspection, audit log display.
2. **IPC & Communication Security**: Tauri v2 command dispatch, parameter sanitization, type safety, absence of arbitrary shell evaluation.
3. **Rust Security Core Logic**: Rule validation algorithms, conflict/shadowing detection, point-in-time snapshot persistence, atomic rollback.
4. **Linux nftables Ownership Isolation**: Scoped operation within `table inet nexus_filter`, non-destructive coexistence with Docker/UFW/host tables.
5. **Security Hardening**: Strict Content Security Policy (CSP), capability scoping, absence of leaked tokens or elevated GUI permissions.

---

## 2. Test Environments

| Environment ID | Description | Execution Capabilities | Host Protection |
|---|---|---|---|
| **ENV-CLOUD-DEV** | AI Studio Cloud Container (Debian Linux, Node.js, Vite) | TypeScript, Vite build, Linter, Static Code Analysis, CSP audit | Read-only, unprivileged, host firewall cannot be modified |
| **ENV-LINUX-VM** | Disposable Linux Virtual Machine (Kernel 6.x, nftables, Polkit) | Native Tauri runtime, Rust unit tests, nftables rule generation, atomic rollback verification | Isolated network namespace, disposable disk |

---

## 3. Test Suites Matrix

| Suite ID | Test Suite Name | Target Module | Target Environment | Automated / Manual |
|---|---|---|---|---|
| **TS-FE-01** | Frontend Static Type Safety | `src/**/*.ts`, `src/**/*.tsx` | ENV-CLOUD-DEV | Automated (`npx tsc --noEmit`) |
| **TS-FE-02** | Frontend Production Compilation | `vite.config.ts`, `dist/` | ENV-CLOUD-DEV | Automated (`npm run build`) |
| **TS-FE-03** | UI Linter & Syntax Validation | Root project | ENV-CLOUD-DEV | Automated (`npm run lint`) |
| **TS-SEC-01** | Secret & Credential Leakage Audit | All source files | ENV-CLOUD-DEV | Automated (`grep / regex`) |
| **TS-SEC-02** | Tauri Capability & CSP Verification | `tauri.conf.json`, `default.json` | ENV-CLOUD-DEV | Automated inspection |
| **TS-SEC-03** | Command Execution Guardrail Audit | `src-tauri/` | ENV-CLOUD-DEV | Automated static analysis |
| **TS-CORE-01** | Rust Rule Validation Engine | `src-tauri/src/security/validation.rs` | ENV-LINUX-VM | Automated (`cargo test`) |
| **TS-CORE-02** | Rule Conflict & Shadowing Detection | `src-tauri/src/security/conflicts.rs` | ENV-LINUX-VM | Automated (`cargo test`) |
| **TS-CORE-03** | Snapshot & Atomic Rollback Logic | `src-tauri/src/security/engine.rs` | ENV-LINUX-VM | Automated (`cargo test`) |
| **TS-NFT-01** | nftables Table Scoping Isolation | Dedicated table `inet nexus_filter` | ENV-LINUX-VM | Automated / Polkit probe |
| **TS-NFT-02** | Non-Destructive Host Coexistence | Docker / host rulesets | ENV-LINUX-VM | Manual / Scripted check |

---

## 4. Pass / Fail Criteria for Beta Readiness

1. **Mandatory Pass**:
   - Zero TypeScript compile or type-checking errors.
   - Successful production frontend bundle generation.
   - Strict Content Security Policy configured without wildcard script sources.
   - Zero instances of `sudo`, `pkexec`, `sh`, `bash`, or unescaped process spawners in Tauri commands.
   - Rust Security Core unit test suite passing in isolated testbed.
2. **Conditional Gate (Beta Blocker)**:
   - Any unverified real Linux kernel enforcement must be clearly documented as requiring the disposable VM testbed.
   - Host firewall modification must remain strictly blocked in development environments.
