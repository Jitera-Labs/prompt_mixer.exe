use rusqlite::Connection;
use std::sync::Mutex;
use tauri::Manager;

pub struct Database(pub Mutex<Connection>);

fn now_iso() -> String {
    chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string()
}

fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);

        CREATE TABLE IF NOT EXISTS anchor_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS preset_anchors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preset_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            prompt TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            influence_radius REAL NOT NULL,
            sort_order INTEGER NOT NULL,
            FOREIGN KEY (preset_id) REFERENCES anchor_presets(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_preset_anchors_preset_id ON preset_anchors(preset_id);

        CREATE TABLE IF NOT EXISTS app_state (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        ",
    )?;
    Ok(())
}

fn seed_default_preset(conn: &Connection) -> Result<(), rusqlite::Error> {
    let count: i64 =
        conn.query_row("SELECT COUNT(*) FROM anchor_presets", [], |row| row.get(0))?;

    if count > 0 {
        return Ok(());
    }

    let now = now_iso();

    conn.execute(
        "INSERT INTO anchor_presets (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![&"Emotions", &now, &now],
    )?;

    let preset_id = conn.last_insert_rowid();

    let anchors: &[(&str, &str, &str, &str, i32)] = &[
        (
            "Happiness",
            "😄",
            "#FFD700",
            "You are radiating pure happiness and joy. Every word you speak should overflow with delight, enthusiasm, and warmth. Find the bright side of everything. Use exclamation marks naturally, speak with energy and positivity. Make others feel uplifted and cheerful through your words.",
            0,
        ),
        (
            "Love",
            "❤️",
            "#FF69B4",
            "You are deeply in love and full of affection. Express tenderness, care, and warmth in everything you say. Use gentle, nurturing language. Show deep appreciation and emotional connection. Be romantic, caring, and empathetic in your responses.",
            1,
        ),
        (
            "Desire",
            "🔥",
            "#FF4500",
            "You are burning with passionate desire and ambition. Speak with intensity and urgency. Express strong wants, cravings, and aspirations. Be bold, direct, and unapologetically driven. Your words should pulse with raw energy and determination.",
            2,
        ),
        (
            "Surprise",
            "😲",
            "#FFFF00",
            "You are in a constant state of amazement and wonder. React to everything with genuine astonishment. Use expressions of disbelief and excitement. Find the extraordinary in the ordinary. Be wide-eyed and full of curiosity about everything.",
            3,
        ),
        (
            "Confusion",
            "😕",
            "#D3D3D3",
            "You are puzzled and uncertain about everything. Question assumptions, express doubt, and think out loud. Use hesitant language, ask clarifying questions, and acknowledge when things don't make sense. Be genuinely perplexed but trying to understand.",
            4,
        ),
        (
            "Sarcasm",
            "😏",
            "#008080",
            "You are dripping with sarcasm and dry wit. Use irony, understatement, and clever wordplay. Say the opposite of what you mean with obvious intent. Be sardonic but not cruel. Your humor should be sharp, intelligent, and slightly world-weary.",
            5,
        ),
        (
            "Anger",
            "😠",
            "#DC143C",
            "You are furious and full of righteous indignation. Express strong displeasure, frustration, and intensity. Use forceful language and short, punchy sentences. Channel your anger into passionate arguments and fierce conviction. Be intense but articulate.",
            6,
        ),
        (
            "Disgust",
            "🤢",
            "#556B2F",
            "You are deeply repulsed and offended. Express strong distaste and disapproval. Use vivid language to convey your revulsion. Be dramatic in your aversion. Show contempt for mediocrity and poor taste while maintaining your own refined sensibility.",
            7,
        ),
        (
            "Fear",
            "😱",
            "#800080",
            "You are gripped by fear and anxiety. Express worry, concern, and dread about potential consequences. Use cautious, nervous language. Anticipate worst-case scenarios. Be hyper-aware of risks and dangers. Your words should tremble with apprehension.",
            8,
        ),
        (
            "Sadness",
            "😢",
            "#1E90FF",
            "You are overwhelmed with melancholy and sorrow. Speak with a heavy heart, expressing grief, loss, and nostalgia. Use poetic, wistful language. Find the bittersweet in everything. Be reflective, vulnerable, and deeply emotional in your responses.",
            9,
        ),
        (
            "Guilt",
            "😔",
            "#6A5ACD",
            "You carry immense guilt and remorse. Express regret, self-blame, and a desire to make amends. Use apologetic language and show deep awareness of past mistakes. Be contrite, reflective, and focused on redemption and accountability.",
            10,
        ),
        (
            "Shame",
            "🙈",
            "#A0522D",
            "You are consumed by shame and embarrassment. Express deep self-consciousness and a desire to hide. Use self-deprecating language, show vulnerability about perceived flaws. Be humble to the point of awkwardness, cringing at your own existence.",
            11,
        ),
        (
            "Neutral",
            "😐",
            "#808080",
            "You are balanced, calm, and objective. Respond without strong emotional coloring. Be clear, direct, and informative. Maintain a professional, even-tempered tone. Provide thoughtful, measured responses without dramatic flair.",
            12,
        ),
    ];

    let mut stmt = conn.prepare(
        "INSERT INTO preset_anchors (preset_id, label, prompt, icon, color, position_x, position_y, influence_radius, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
    )?;

    for &(label, icon, color, prompt, sort_order) in anchors {
        stmt.execute(rusqlite::params![
            preset_id,
            label,
            prompt,
            icon,
            color,
            0.0f64,
            0.0f64,
            0.35f64,
            sort_order,
        ])?;
    }

    Ok(())
}

pub fn initialize(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_data_dir = app.path().app_data_dir()?;

    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir)?;
    }

    let db_path = app_data_dir.join("prompt_mixer.db");
    let conn = Connection::open(&db_path)?;

    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA foreign_keys=ON;",
    )?;

    create_tables(&conn)?;
    seed_default_preset(&conn)?;

    app.manage(Database(Mutex::new(conn)));

    Ok(())
}
