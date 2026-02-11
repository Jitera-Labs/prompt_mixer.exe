mod db;
mod models;
mod commands;

use tauri::Manager;
use commands::llm::SessionState;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            db::initialize(app)?;
            app.manage(SessionState::default());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat::create_chat,
            commands::chat::list_chats,
            commands::chat::get_chat,
            commands::chat::delete_chat,
            commands::chat::update_chat_title,
            commands::messages::get_messages,
            commands::messages::add_message,
            commands::messages::delete_messages_after,
            commands::messages::update_message,
            commands::presets::list_presets,
            commands::presets::create_preset,
            commands::presets::update_preset,
            commands::presets::rename_preset,
            commands::presets::delete_preset,
            commands::presets::get_preset_anchors,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::fetch_models,
            commands::llm::start_mixing_session,
            commands::llm::update_weights,
            commands::llm::toggle_pause,
            commands::llm::set_speed,
            commands::llm::cancel_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
