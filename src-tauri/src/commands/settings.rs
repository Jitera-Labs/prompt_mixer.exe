use serde::Deserialize;
use tauri::State;

use crate::db::Database;

#[tauri::command]
pub fn get_setting(db: State<Database>, key: String) -> Result<Option<String>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT value FROM app_state WHERE key = ?1",
        rusqlite::params![&key],
        |row| row.get::<_, String>(0),
    );

    match result {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn set_setting(db: State<Database>, key: String, value: String) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO app_state (key, value) VALUES (?1, ?2)",
        rusqlite::params![&key, &value],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Debug, Deserialize)]
struct ModelsResponse {
    data: Vec<ModelEntry>,
}

#[derive(Debug, Deserialize)]
struct ModelEntry {
    id: String,
}

#[tauri::command]
pub async fn fetch_models(provider_url: String, api_key: String) -> Result<Vec<String>, String> {
    let url = format!("{}/models", provider_url.trim_end_matches('/'));

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Failed to fetch models: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Provider returned status {}", response.status()));
    }

    let body: ModelsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse models response: {}", e))?;

    let mut models: Vec<String> = body.data.into_iter().map(|m| m.id).collect();
    models.sort();
    Ok(models)
}
