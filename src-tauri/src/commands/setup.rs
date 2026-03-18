/// 指定したツール名の `--version` を実行し、インストール状態とバージョン文字列を返す。
/// ツールが見つからない (PATH にない) 場合は `None` を返す。
#[tauri::command]
pub fn check_tool(name: String) -> Option<String> {
    // セキュリティ: ツール名に実行可能な文字のみ許可
    if name.is_empty()
        || name
            .chars()
            .any(|c| !c.is_alphanumeric() && c != '-' && c != '_' && c != '.')
    {
        return None;
    }

    let output = std::process::Command::new(&name)
        .arg("--version")
        // 環境によって stderr にバージョンが出るため両方取得
        .output()
        .ok()?;

    // 終了コードが非 0 でも一部ツールは出力するため stdout/stderr をトライ
    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    let version = if !stdout.is_empty() { stdout } else { stderr };
    if version.is_empty() {
        // バージョン文字列が空でも存在はしている
        Some(String::from("(version unknown)"))
    } else {
        Some(version)
    }
}
