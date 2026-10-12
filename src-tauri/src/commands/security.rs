use tauri::State;

use crate::audit::AuditEvent;
use crate::firewall::models::{FirewallRule, FirewallRuleDto};
use crate::firewall::snapshot::{ConfigurationSnapshot, SnapshotMetadata};
use crate::models::IpcResponse;
use crate::security::conflicts::RuleConflict;
use crate::security::policy::SecurityProfile;
use crate::security::validation::ValidationError;
use crate::AppState;

/// Validates a firewall rule definition against security constraints.
#[tauri::command]
pub async fn validate_rule(
    state: State<'_, AppState>,
    rule: FirewallRuleDto,
) -> Result<IpcResponse<Vec<ValidationError>>, String> {
    let domain_rule = FirewallRule::from(rule);
    match state.security_engine.validate(&domain_rule) {
        Ok(()) => Ok(IpcResponse::success(Vec::new())),
        Err(errors) => Ok(IpcResponse::success(errors)),
    }
}

/// Checks candidate rule for conflicts against existing rules.
#[tauri::command]
pub async fn check_conflicts(
    state: State<'_, AppState>,
    rule: FirewallRuleDto,
) -> Result<IpcResponse<Vec<RuleConflict>>, String> {
    let domain_rule = FirewallRule::from(rule);
    match state.security_engine.check_conflicts(&domain_rule) {
        Ok(conflicts) => Ok(IpcResponse::success(conflicts)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

/// Takes a point-in-time configuration snapshot.
#[tauri::command]
pub async fn create_snapshot(
    state: State<'_, AppState>,
    name: String,
    description: Option<String>,
) -> Result<IpcResponse<ConfigurationSnapshot>, String> {
    let desc = description.unwrap_or_else(|| "Manual snapshot taken via desktop UI".to_string());
    match state.security_engine.create_snapshot(&name, &desc, "desktop-ui") {
        Ok(snap) => Ok(IpcResponse::success(snap)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

/// Lists all saved configuration snapshots.
#[tauri::command]
pub async fn list_snapshots(
    state: State<'_, AppState>,
) -> Result<IpcResponse<Vec<SnapshotMetadata>>, String> {
    match state.security_engine.list_snapshots() {
        Ok(snapshots) => Ok(IpcResponse::success(snapshots)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

/// Rolls back configuration state to a previous snapshot.
#[tauri::command]
pub async fn rollback_snapshot(
    state: State<'_, AppState>,
    snapshot_id: String,
) -> Result<IpcResponse<ConfigurationSnapshot>, String> {
    match state.security_engine.rollback_to_snapshot(&snapshot_id, "desktop-ui") {
        Ok(restored) => Ok(IpcResponse::success(restored)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}

/// Retrieves security audit log records.
#[tauri::command]
pub async fn get_audit_events(
    state: State<'_, AppState>,
    limit: Option<usize>,
) -> Result<IpcResponse<Vec<AuditEvent>>, String> {
    let limit = limit.unwrap_or(50);
    let events = state.security_engine.get_audit_events(limit);
    Ok(IpcResponse::success(events))
}

/// Retrieves available security profiles.
#[tauri::command]
pub async fn get_security_profiles(
    state: State<'_, AppState>,
) -> Result<IpcResponse<Vec<SecurityProfile>>, String> {
    let profiles = state.security_engine.list_profiles();
    Ok(IpcResponse::success(profiles))
}

/// Applies a security profile.
#[tauri::command]
pub async fn set_security_profile(
    state: State<'_, AppState>,
    profile_id: String,
) -> Result<IpcResponse<SecurityProfile>, String> {
    match state.security_engine.apply_profile(&profile_id, "desktop-ui") {
        Ok(profile) => Ok(IpcResponse::success(profile)),
        Err(err) => Ok(IpcResponse::failure(err.to_string())),
    }
}
