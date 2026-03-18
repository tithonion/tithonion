use std::path::Path;

use super::types::TithonionConfig;

/// パストラバーサル検証。
fn validate_safe_filename(name: &str) -> Result<(), String> {
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err("Invalid template name".to_owned());
    }
    Ok(())
}

// ─────────────────────────────────────────────
// 読み込み
// ─────────────────────────────────────────────

/// `.tithonion/` 配下の設定ファイルをまとめて読み込む。
/// 存在しないファイルは `null` として返す。
#[tauri::command]
pub fn load_project_config(root_path: String) -> Result<TithonionConfig, String> {
    let tithonion_dir = Path::new(&root_path).join(".tithonion");

    let read_json = |filename: &str| -> Option<serde_json::Value> {
        let content = std::fs::read_to_string(tithonion_dir.join(filename)).ok()?;
        serde_json::from_str(&content).ok()
    };

    Ok(TithonionConfig {
        config: read_json("config.json"),
        tasks: read_json("tasks.json"),
        schema: read_json("schema.json"),
        local: read_json("local.json"),
    })
}

// ─────────────────────────────────────────────
// 保存
// ─────────────────────────────────────────────

/// `.tithonion/config.json` を上書き保存する。
/// ディレクトリが存在しない場合は作成する。
#[tauri::command]
pub fn save_config(
    root_path: String,
    filename: String,
    data: serde_json::Value,
) -> Result<(), String> {
    validate_safe_filename(&filename)?;

    match filename.as_str() {
        "config.json" | "local.json" | "schema.json" => {}
        _ => return Err(format!("Unsupported config filename: {}", filename)),
    }

    let dir = Path::new(&root_path).join(".tithonion");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    let file_path = dir.join(filename);
    std::fs::write(file_path, json).map_err(|e| e.to_string())
}

/// `.tithonion/templates/` 配下のテンプレートファイル名一覧を返す。
#[tauri::command]
pub fn list_templates(root_path: String) -> Result<Vec<String>, String> {
    let templates_dir = Path::new(&root_path)
        .join(".tithonion")
        .join("templates");
    if !templates_dir.exists() {
        return Ok(vec![]);
    }
    let mut names: Vec<String> = std::fs::read_dir(&templates_dir)
        .map_err(|e| e.to_string())?
        .flatten()
        .filter_map(|e| {
            let path = e.path();
            let ext = path.extension().and_then(|x| x.to_str()).unwrap_or("");
            if ext == "md" || ext == "mdx" {
                path.file_name()
                    .and_then(|n| n.to_str())
                    .map(|n| n.to_owned())
            } else {
                None
            }
        })
        .collect();
    names.sort();
    Ok(names)
}

/// `.tithonion/templates/<name>` の内容を読み込む。
#[tauri::command]
pub fn read_template(root_path: String, name: String) -> Result<String, String> {
    validate_safe_filename(&name)?;
    let path = Path::new(&root_path)
        .join(".tithonion")
        .join("templates")
        .join(&name);
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// `.tithonion/templates/<name>` にテンプレート内容を保存する。
#[tauri::command]
pub fn save_template(root_path: String, name: String, content: String) -> Result<(), String> {
    validate_safe_filename(&name)?;
    let dir = Path::new(&root_path)
        .join(".tithonion")
        .join("templates");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    std::fs::write(dir.join(&name), content).map_err(|e| e.to_string())
}

/// `.tithonion/templates/<name>` を削除する。
#[tauri::command]
pub fn delete_template(root_path: String, name: String) -> Result<(), String> {
    validate_safe_filename(&name)?;
    let path = Path::new(&root_path)
        .join(".tithonion")
        .join("templates")
        .join(&name);
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
