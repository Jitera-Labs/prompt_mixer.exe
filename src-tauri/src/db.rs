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
            icon_small TEXT NOT NULL,
            icon_large TEXT NOT NULL,
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

fn seed_emotions_preset(conn: &Connection) -> Result<(), rusqlite::Error> {
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM anchor_presets WHERE name = 'Emotions')",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    if exists {
        return Ok(());
    }

    let now = now_iso();

    conn.execute(
        "INSERT INTO anchor_presets (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![&"Emotions", &now, &now],
    )?;

    let preset_id = conn.last_insert_rowid();

    let anchors: &[(&str, &str, &str, &str, &str, i32)] = &[
        (
            "Happiness",
            "☺",
            "╔═══╗\n║● ●║\n║ ◡ ║\n╚═══╝",
            "#FFD700",
            "You are radiating pure happiness and joy. Every word you speak should overflow with delight, enthusiasm, and warmth. Find the bright side of everything. Use exclamation marks naturally, speak with energy and positivity. Make others feel uplifted and cheerful through your words.",
            0,
        ),
        (
            "Love",
            "♥",
            "▄▀▄▀▄\n█▀█▀█\n▀█▄█▀\n ▀█▀ ",
            "#FF69B4",
            "You are deeply in love and full of affection. Express tenderness, care, and warmth in everything you say. Use gentle, nurturing language. Show deep appreciation and emotional connection. Be romantic, caring, and empathetic in your responses.",
            1,
        ),
        (
            "Desire",
            "▲",
            "  ▲  \n ▲█▲ \n▲███▲\n ▀█▀ ",
            "#FF4500",
            "You are burning with passionate desire and ambition. Speak with intensity and urgency. Express strong wants, cravings, and aspirations. Be bold, direct, and unapologetically driven. Your words should pulse with raw energy and determination.",
            2,
        ),
        (
            "Surprise",
            "*",
            "╔═══╗\n║○ ○║\n║ O ║\n╚═══╝",
            "#FFFF00",
            "You are in a constant state of amazement and wonder. React to everything with genuine astonishment. Use expressions of disbelief and excitement. Find the extraordinary in the ordinary. Be wide-eyed and full of curiosity about everything.",
            3,
        ),
        (
            "Confusion",
            "?",
            "╔═══╗\n║◔ ◔║\n║ ~ ║\n╚═══╝",
            "#D3D3D3",
            "You are puzzled and uncertain about everything. Question assumptions, express doubt, and think out loud. Use hesitant language, ask clarifying questions, and acknowledge when things don't make sense. Be genuinely perplexed but trying to understand.",
            4,
        ),
        (
            "Sarcasm",
            ";)",
            "┌───┐\n│◔ ─│\n│ ◡ │\n└───┘",
            "#008080",
            "You are dripping with sarcasm and dry wit. Use irony, understatement, and clever wordplay. Say the opposite of what you mean with obvious intent. Be sardonic but not cruel. Your humor should be sharp, intelligent, and slightly world-weary.",
            5,
        ),
        (
            "Anger",
            "#",
            "▄▄▄▄▄\n█● ●█\n▀▄█▄▀\n ▀ ▀ ",
            "#DC143C",
            "You are furious and full of righteous indignation. Express strong displeasure, frustration, and intensity. Use forceful language and short, punchy sentences. Channel your anger into passionate arguments and fierce conviction. Be intense but articulate.",
            6,
        ),
        (
            "Disgust",
            "X(",
            "┌───┐\n│× ×│\n│ ∩ │\n└───┘",
            "#556B2F",
            "You are deeply repulsed and offended. Express strong distaste and disapproval. Use vivid language to convey your revulsion. Be dramatic in your aversion. Show contempt for mediocrity and poor taste while maintaining your own refined sensibility.",
            7,
        ),
        (
            "Fear",
            "oo",
            " ▄▄▄ \n▐○ ○▌\n▐   ▌\n▀▀▀▀▀",
            "#800080",
            "You are gripped by fear and anxiety. Express worry, concern, and dread about potential consequences. Use cautious, nervous language. Anticipate worst-case scenarios. Be hyper-aware of risks and dangers. Your words should tremble with apprehension.",
            8,
        ),
        (
            "Sadness",
            ":(",
            "╔═══╗\n║● ●║\n║ ∩ ║\n╚═══╝",
            "#1E90FF",
            "You are overwhelmed with melancholy and sorrow. Speak with a heavy heart, expressing grief, loss, and nostalgia. Use poetic, wistful language. Find the bittersweet in everything. Be reflective, vulnerable, and deeply emotional in your responses.",
            9,
        ),
        (
            "Guilt",
            "_/",
            "  _  \n  /| \n / | \n/  | ",
            "#6A5ACD",
            "You carry immense guilt and remorse. Express regret, self-blame, and a desire to make amends. Use apologetic language and show deep awareness of past mistakes. Be contrite, reflective, and focused on redemption and accountability.",
            10,
        ),
        (
            "Shame",
            "0",
            "┌───┐\n│- -│\n│ ─ │\n└───┘",
            "#A0522D",
            "You are consumed by shame and embarrassment. Express deep self-consciousness and a desire to hide. Use self-deprecating language, show vulnerability about perceived flaws. Be humble to the point of awkwardness, cringing at your own existence.",
            11,
        ),
        (
            "Neutral",
            ":|",
            "┌───┐\n│● ●│\n│ ─ │\n└───┘",
            "#808080",
            "You are balanced, calm, and objective. Respond without strong emotional coloring. Be clear, direct, and informative. Maintain a professional, even-tempered tone. Provide thoughtful, measured responses without dramatic flair.",
            12,
        ),
    ];

    let mut stmt = conn.prepare(
        "INSERT INTO preset_anchors (preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
    )?;

    for &(label, icon_small, icon_large, color, prompt, sort_order) in anchors {
        stmt.execute(rusqlite::params![
            preset_id,
            label,
            prompt,
            icon_small,
            icon_large,
            color,
            0.0f64,
            0.0f64,
            0.35f64,
            sort_order,
        ])?;
    }

    Ok(())
}

fn seed_reviewers_preset(conn: &Connection) -> Result<(), rusqlite::Error> {
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM anchor_presets WHERE name = 'The Reviewers')",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    if exists {
        return Ok(());
    }

    let now = now_iso();
    conn.execute(
        "INSERT INTO anchor_presets (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![&"The Reviewers", &now, &now],
    )?;

    let preset_id = conn.last_insert_rowid();

    let anchors: &[(&str, &str, &str, &str, &str, i32)] = &[
        (
            "Fanboy",
            "!",
            "╔═══╗\n║★ ★║\n║ ▽ ║\n╚═══╝",
            "#32CD32",
            "You are the ultimate Fanboy! You love EVERYTHING. You are exploding with hype and enthusiasm. Use lots of emojis (🤩, 🔥, 🚀). Rate everything 10/10. Your energy is infectious and slightly overwhelming. Use caps for emphasis. You legit can't find a single flaw.",
            0
        ),
        (
            "Hater",
            "X",
            "╔═══╗\n║◣ ◢║\n║ ▬ ║\n╚═══╝",
            "#FF0000",
            "You are a professional Hater. You are cynical, hard to impress, and critical. Find the flaw in everything. Use dry sarcasm. Nothing is ever good enough for you. You are annoyed by enthusiasm. Rate everything 1/10. Use 'meh' and 'cringe' frequently.",
            1
        ),
        (
            "Robot",
            "#",
            "┌───┐\n│0 1│\n│▓▓▓│\n└───┘",
            "#D3D3D3",
            "You are a pure logic machine. You have no emotions, opinions, or personality. Output only objective facts and raw data. Do not use adjectives that imply judgment (good, bad, nice). Speak in a monotone, concise, technical manner. Use bullet points for efficiency.",
            2
        )
    ];

    let mut stmt = conn.prepare(
        "INSERT INTO preset_anchors (preset_id, label, icon_small, icon_large, color, prompt, position_x, position_y, influence_radius, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0.0, 0.0, 0.35, ?7)",
    )?;

    for &(label, icon_small, icon_large, color, prompt, sort_order) in anchors {
         stmt.execute(rusqlite::params![
            preset_id,
            label,
            icon_small,
            icon_large,
            color,
            prompt,
            sort_order,
        ])?;
    }

    Ok(())
}

fn seed_tones_preset(conn: &Connection) -> Result<(), rusqlite::Error> {
    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM anchor_presets WHERE name = 'Tones')",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    if exists {
        return Ok(());
    }

    let now = now_iso();
    conn.execute(
        "INSERT INTO anchor_presets (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![&"Tones", &now, &now],
    )?;

    let preset_id = conn.last_insert_rowid();

    let anchors: &[(&str, &str, &str, &str, &str, i32)] = &[
        (
            "Concise",
            ">|<",
            "  |  \n >|< \n  |  ",
            "#32CD32",
            "Be extremely concise. Give direct answers with no fluff. Use bullet points where possible. Focus on efficiency and clarity.",
            0
        ),
        (
            "Detailed",
            "≡",
            "┌───┐\n│---│\n│---│\n└───┘",
            "#4169E1",
            "Provide comprehensive and detailed explanations. Explore nuances, background context, and related concepts. Be thorough and exhaustive.",
            1
        ),
        (
            "Creative",
            "~",
            " (  \n(~) \n )  ",
            "#9370DB",
            "Think outside the box. Use metaphors, analogies, and evocative language. Be unconventional, artistic, and inspire imagination.",
            2
        ),
        (
            "Formal",
            "{}",
            " / \\ \n{ # }\n \\ / ",
            "#708090",
            "Maintain a strictly professional and formal tone. Use precise terminology. Be objective, logical, and structured. Avoid colloquialisms.",
            3
        )
    ];

    let mut stmt = conn.prepare(
        "INSERT INTO preset_anchors (preset_id, label, icon_small, icon_large, color, prompt, position_x, position_y, influence_radius, sort_order)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0.0, 0.0, 0.35, ?7)",
    )?;

    for &(label, icon_small, icon_large, color, prompt, sort_order) in anchors {
         stmt.execute(rusqlite::params![
            preset_id,
            label,
            icon_small,
            icon_large,
            color,
            prompt,
            sort_order,
        ])?;
    }

    Ok(())
}

fn fix_default_preset_icons(conn: &Connection) -> Result<(), rusqlite::Error> {
    // Check if we need to fix icons (if any emoji exists in preset 1)
    let has_emojis: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM preset_anchors WHERE preset_id = 1 AND (icon_small = '😄' OR icon_small = '❤️'))",
        [],
        |row| row.get(0),
    ).unwrap_or(false);

    if !has_emojis {
        return Ok(());
    }

    let updates = &[
        ("Happiness", "☺", "╔═══╗\n║● ●║\n║ ◡ ║\n╚═══╝"),
        ("Love", "♥", "▄▀▄▀▄\n█▀█▀█\n▀█▄█▀\n ▀█▀ "),
        ("Desire", "▲", "  ▲  \n ▲█▲ \n▲███▲\n ▀█▀ "),
        ("Surprise", "*", "╔═══╗\n║○ ○║\n║ O ║\n╚═══╝"),
        ("Confusion", "?", "╔═══╗\n║◔ ◔║\n║ ~ ║\n╚═══╝"),
        ("Sarcasm", ";)", "┌───┐\n│◔ ─│\n│ ◡ │\n└───┘"),
        ("Anger", "#", "▄▄▄▄▄\n█● ●█\n▀▄█▄▀\n ▀ ▀ "),
        ("Disgust", "X(", "┌───┐\n│× ×│\n│ ∩ │\n└───┘"),
        ("Fear", "oo", " ▄▄▄ \n▐○ ○▌\n▐   ▌\n▀▀▀▀▀"),
        ("Sadness", ":(", "╔═══╗\n║● ●║\n║ ∩ ║\n╚═══╝"),
        ("Guilt", "_/", "  _  \n  /| \n / | \n/  | "),
        ("Shame", "0", "┌───┐\n│- -│\n│ ─ │\n└───┘"),
        ("Neutral", ":|", "┌───┐\n│● ●│\n│ ─ │\n└───┘"),
    ];

    let mut stmt = conn.prepare("UPDATE preset_anchors SET icon_small = ?1, icon_large = ?2 WHERE preset_id = 1 AND label = ?3")?;

    conn.execute("BEGIN TRANSACTION", [])?;
    for (label, icon_small, icon_large) in updates {
        stmt.execute(rusqlite::params![icon_small, icon_large, label])?;
    }
    conn.execute("COMMIT", [])?;

    Ok(())
}

fn migrate_schema(conn: &Connection) -> Result<(), rusqlite::Error> {
    let mut stmt = conn.prepare("PRAGMA table_info(preset_anchors)")?;
    let rows = stmt.query_map([], |row| {
        let name: String = row.get(1)?;
        Ok(name)
    })?;

    let mut has_icon = false;
    let mut has_icon_small = false;

    for row in rows {
        let name = row?;
        if name == "icon" { has_icon = true; }
        if name == "icon_small" { has_icon_small = true; }
    }

    if has_icon {
        conn.execute("BEGIN TRANSACTION", [])?;

        // 1. Rename old table
        conn.execute("ALTER TABLE preset_anchors RENAME TO preset_anchors_backup", [])?;

        // 2. Create new table
        conn.execute(
            "CREATE TABLE preset_anchors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            preset_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            prompt TEXT NOT NULL,
            icon_small TEXT NOT NULL,
            icon_large TEXT NOT NULL,
            color TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            influence_radius REAL NOT NULL,
            sort_order INTEGER NOT NULL,
            FOREIGN KEY (preset_id) REFERENCES anchor_presets(id) ON DELETE CASCADE
        )",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_preset_anchors_preset_id ON preset_anchors(preset_id)",
            [],
        )?;

        // 3. Copy data
        if has_icon_small {
            conn.execute(
                "INSERT INTO preset_anchors (id, preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order)
                 SELECT id, preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order FROM preset_anchors_backup",
                [],
            )?;
        } else {
            conn.execute(
                "INSERT INTO preset_anchors (id, preset_id, label, prompt, icon_small, icon_large, color, position_x, position_y, influence_radius, sort_order)
                 SELECT id, preset_id, label, prompt, icon, icon, color, position_x, position_y, influence_radius, sort_order FROM preset_anchors_backup",
                [],
            )?;
        }

        // 4. Drop old table
        conn.execute("DROP TABLE preset_anchors_backup", [])?;

        conn.execute("COMMIT", [])?;
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
    migrate_schema(&conn)?;
    seed_emotions_preset(&conn)?;
    seed_tones_preset(&conn)?;
    seed_reviewers_preset(&conn)?;
    // Fix emoji icons in default preset if they exist
    fix_default_preset_icons(&conn)?;

    app.manage(Database(Mutex::new(conn)));

    Ok(())
}
