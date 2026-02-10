use tauri::State;

use crate::db::Database;
use crate::models::{self, AnchorPreset, NewPresetAnchor, PresetAnchor};

#[tauri::command]
pub fn list_presets(db: State<Database>) -> Result<Vec<AnchorPreset>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT id, name, created_at, updated_at FROM anchor_presets ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(AnchorPreset {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut presets = Vec::new();
    for row in rows {
        presets.push(row.map_err(|e| e.to_string())?);
    }

    Ok(presets)
}

#[tauri::command]
pub fn create_preset(
    db: State<Database>,
    name: String,
    anchors: Vec<NewPresetAnchor>,
) -> Result<AnchorPreset, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let timestamp = models::now();

    conn.execute(
        "INSERT INTO anchor_presets (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![&name, &timestamp, &timestamp],
    )
    .map_err(|e| e.to_string())?;

    let preset_id = conn.last_insert_rowid();

    let mut stmt = conn
        .prepare(
            "INSERT INTO preset_anchors (preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        )
        .map_err(|e| e.to_string())?;

    for anchor in &anchors {
        stmt.execute(rusqlite::params![
            preset_id,
            &anchor.label,
            &anchor.prompt,
            &anchor.icon_small,
            &anchor.icon_large,
            &anchor.color,
            anchor.position_x,
            anchor.position_y,
            anchor.influence_radius,
            anchor.sort_order,
        ])
        .map_err(|e| e.to_string())?;
    }

    Ok(AnchorPreset {
        id: preset_id,
        name,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

#[tauri::command]
pub fn update_preset(
    db: State<Database>,
    preset_id: i64,
    name: String,
    anchors: Vec<NewPresetAnchor>,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let timestamp = models::now();

    conn.execute(
        "UPDATE anchor_presets SET name = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![&name, &timestamp, preset_id],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM preset_anchors WHERE preset_id = ?1",
        rusqlite::params![preset_id],
    )
    .map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "INSERT INTO preset_anchors (preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        )
        .map_err(|e| e.to_string())?;

    for anchor in &anchors {
        stmt.execute(rusqlite::params![
            preset_id,
            &anchor.label,
            &anchor.prompt,
            &anchor.icon_small,
            &anchor.icon_large,
            &anchor.color,
            anchor.position_x,
            anchor.position_y,
            anchor.influence_radius,
            anchor.sort_order,
        ])
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn rename_preset(
    db: State<Database>,
    preset_id: i64,
    name: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let timestamp = models::now();

    conn.execute(
        "UPDATE anchor_presets SET name = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![&name, &timestamp, preset_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn delete_preset(db: State<Database>, preset_id: i64) -> Result<(), String> {
    if preset_id == 1 {
        return Err("Cannot delete the default preset".to_string());
    }

    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM anchor_presets WHERE id = ?1",
        rusqlite::params![preset_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_preset_anchors(
    db: State<Database>,
    preset_id: i64,
) -> Result<Vec<PresetAnchor>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order
             FROM preset_anchors
             WHERE preset_id = ?1
             ORDER BY sort_order ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![preset_id], |row| {
            Ok(PresetAnchor {
                id: row.get(0)?,
                preset_id: row.get(1)?,
                label: row.get(2)?,
                prompt: row.get(3)?,
                icon_small: row.get(4)?,
                icon_large: row.get(5)?,
                color: row.get(6)?,
                position_x: row.get(7)?,
                position_y: row.get(8)?,
                influence_radius: row.get(9)?,
                sort_order: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut anchors = Vec::new();
    for row in rows {
        anchors.push(row.map_err(|e| e.to_string())?);
    }

    Ok(anchors)
}
