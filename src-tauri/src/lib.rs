mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::dialog::pick_project_folder,
            commands::project::load_project,
            commands::files::list_instance_files,
            commands::config::load_project_config,
            commands::config::save_config,
            commands::config::list_templates,
            commands::config::read_template,
            commands::config::save_template,
            commands::config::delete_template,
            commands::setup::check_tool,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
