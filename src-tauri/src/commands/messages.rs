use tauri::State;

use crate::db::Database;
use crate::models::{self, Message};

#[tauri::command]
pub fn get_messages(db: State<Database>, chat_id: i64) -> Result<Vec<Message>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, chat_id, role, content, created_at
             FROM messages
             WHERE chat_id = ?1
             ORDER BY id ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![chat_id], |row| {
            Ok(Message {
                id: row.get(0)?,
                chat_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                created_at: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut messages = Vec::new();
    for row in rows {
        messages.push(row.map_err(|e| e.to_string())?);
    }

    Ok(messages)
}

#[tauri::command]
pub fn add_message(
    db: State<Database>,
    chat_id: i64,
    role: String,
    content: String,
) -> Result<Message, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let timestamp = models::now();

    conn.execute(
        "INSERT INTO messages (chat_id, role, content, created_at) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![chat_id, &role, &content, &timestamp],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.execute(
        "UPDATE chats SET updated_at = ?1 WHERE id = ?2",
        rusqlite::params![&timestamp, chat_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(Message {
        id,
        chat_id,
        role,
        content,
        created_at: timestamp,
    })
}

#[tauri::command]
pub fn delete_messages_after(
    db: State<Database>,
    chat_id: i64,
    message_id: i64,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "DELETE FROM messages WHERE chat_id = ?1 AND id > ?2",
        rusqlite::params![chat_id, message_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn update_message(
    db: State<Database>,
    message_id: i64,
    content: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE messages SET content = ?1 WHERE id = ?2",
        rusqlite::params![&content, message_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
