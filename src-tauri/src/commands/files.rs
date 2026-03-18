use std::path::{Path, PathBuf};

use super::scanner::scan_directory;
use super::types::FileEntry;

/// 指定インスタンス配下の全 Markdown ファイル一覧を返す。
#[tauri::command]
pub fn list_instance_files(
    root_path: String,
    instance_path: String,
) -> Result<Vec<FileEntry>, String> {
    let root = Path::new(&root_path);
    let instance_dir: PathBuf = root.join(instance_path.trim_end_matches('/'));

    if !instance_dir.exists() {
        return Err(format!(
            "ディレクトリが存在しません: {}",
            instance_dir.display()
        ));
    }

    let mut files = scan_directory(&instance_dir, &instance_dir);

    // ソート: frontmatter date → modified_at 降順、次いでパス昇順
    files.sort_by(|a, b| {
        let da = a.date.as_deref().unwrap_or(&a.modified_at);
        let db = b.date.as_deref().unwrap_or(&b.modified_at);
        db.cmp(da).then_with(|| a.relative_path.cmp(&b.relative_path))
    });

    Ok(files)
}
