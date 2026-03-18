#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub relative_path: String,
    pub title: Option<String>,
    pub date: Option<String>,
    /// ディレクトリ名 (YYYY-MM-DD-xxx) から抽出した日付
    pub dir_date: Option<String>,
    pub tags: Vec<String>,
    pub description: Option<String>,
    pub slug: Option<String>,
    pub authors: Vec<String>,
    pub modified_at: String,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RecentFile {
    pub path: String,
    pub instance_id: String,
    pub instance_label: String,
    pub title: Option<String>,
    pub modified_at: String,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct InstanceInfo {
    pub id: String,
    pub label: String,
    #[serde(rename = "type")]
    pub instance_type: String,
    pub path: String,
    pub count: u32,
}

#[derive(serde::Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInfo {
    pub name: String,
    pub root_path: String,
    pub instances: Vec<InstanceInfo>,
    pub tag_count: u32,
    pub recent_files: Vec<RecentFile>,
}

/// `.tithonion/` ディレクトリ配下の設定ファイルをまとめた構造体。
/// 各フィールドはファイルが存在しない場合 `None`。
#[derive(serde::Serialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct TithonionConfig {
    /// `.tithonion/config.json` (チーム共有設定)
    pub config: Option<serde_json::Value>,
    /// `.tithonion/tasks.json` (カスタムタスク)
    pub tasks: Option<serde_json::Value>,
    /// `.tithonion/schema.json` (フロントマタースキーマ)
    pub schema: Option<serde_json::Value>,
    /// `.tithonion/local.json` (個人設定 / gitignore 対象)
    pub local: Option<serde_json::Value>,
}
