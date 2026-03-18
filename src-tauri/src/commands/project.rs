use std::path::Path;

use super::scanner::{build_project, is_docusaurus_project, read_package_name};
use super::types::ProjectInfo;

/// Docusaurus プロジェクトをスキャンしてメタデータを返す。
#[tauri::command]
pub fn load_project(root_path: String) -> Result<ProjectInfo, String> {
    let root_path_clone = root_path.clone();
    let root = Path::new(&root_path_clone);

    if !root.exists() {
        return Err(format!("パスが存在しません: {}", root_path));
    }

    if !is_docusaurus_project(root) {
        return Err(
            "Docusaurus プロジェクトが見つかりません (docusaurus.config.* が存在しません)"
                .to_string(),
        );
    }

    let name = read_package_name(root).unwrap_or_else(|| {
        root.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_owned()
    });

    build_project(root, name, root_path)
}
