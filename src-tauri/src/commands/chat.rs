use tauri::State;

use crate::db::Database;
use crate::models::{self, Chat, ChatWithPreview};

#[tauri::command]
pub fn create_chat(db: State<Database>, title: String) -> Result<Chat, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let timestamp = models::now();

    conn.execute(
        "INSERT INTO chats (title, created_at, updated_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![&title, &timestamp, &timestamp],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    Ok(Chat {
        id,
        title,
        created_at: timestamp.clone(),
        updated_at: timestamp,
    })
}

#[tauri::command]
pub fn list_chats(db: State<Database>) -> Result<Vec<ChatWithPreview>, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.title, c.created_at, c.updated_at, m.content, m.role
             FROM chats c
             LEFT JOIN messages m ON m.id = (
                 SELECT m2.id FROM messages m2
                 WHERE m2.chat_id = c.id
                 ORDER BY m2.id DESC
                 LIMIT 1
             )
             ORDER BY c.updated_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let content: Option<String> = row.get(4)?;
            let truncated = content.map(|c| {
                match c.char_indices().nth(100) {
                    Some((idx, _)) => {
                        let mut t = c[..idx].to_string();
                        t.push('…');
                        t
                    }
                    None => c,
                }
            });

            Ok(ChatWithPreview {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
                last_message: truncated,
                last_message_role: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut chats = Vec::new();
    for row in rows {
        chats.push(row.map_err(|e| e.to_string())?);
    }

    Ok(chats)
}

#[tauri::command]
pub fn get_chat(db: State<Database>, chat_id: i64) -> Result<Chat, String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, title, created_at, updated_at FROM chats WHERE id = ?1",
        rusqlite::params![chat_id],
        |row| {
            Ok(Chat {
                id: row.get(0)?,
                title: row.get(1)?,
                created_at: row.get(2)?,
                updated_at: row.get(3)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_chat(db: State<Database>, chat_id: i64) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM chats WHERE id = ?1", rusqlite::params![chat_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn update_chat_title(
    db: State<Database>,
    chat_id: i64,
    title: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| e.to_string())?;
    let timestamp = models::now();

    conn.execute(
        "UPDATE chats SET title = ?1, updated_at = ?2 WHERE id = ?3",
        rusqlite::params![&title, &timestamp, chat_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
