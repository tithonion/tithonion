/// フォルダ選択ダイアログを開き、選択されたパスを返す。
#[tauri::command]
pub fn pick_project_folder(app: tauri::AppHandle) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog().file().pick_folder(move |f| {
        let _ = tx.send(f);
    });
    rx.recv().ok().flatten().map(|p| p.to_string())
}
