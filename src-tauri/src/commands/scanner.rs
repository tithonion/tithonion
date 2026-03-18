use std::collections::HashSet;
use std::path::Path;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

use super::frontmatter::{extract_h1_title, parse_frontmatter, unquote};
use super::types::{FileEntry, InstanceInfo, ProjectInfo, RecentFile};

// ─────────────────────────────────────────────
// 定数
// ─────────────────────────────────────────────

pub(crate) const SKIP_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "src",
    "static",
    "build",
    ".docusaurus",
    "dist",
    ".tithonion",
    "coverage",
    "target",
    ".cache",
    "public",
    "i18n",
    "versioned_docs",
    "versioned_sidebars",
];

// ─────────────────────────────────────────────
// プロジェクト判定
// ─────────────────────────────────────────────

/// ルートディレクトリが Docusaurus プロジェクトかどうかを判定する。
pub(crate) fn is_docusaurus_project(root: &Path) -> bool {
    [
        "docusaurus.config.js",
        "docusaurus.config.ts",
        "docusaurus.config.mjs",
        "docusaurus.config.cjs",
        "docusaurus.config.json5",
    ]
    .iter()
    .any(|f| root.join(f).exists())
}

/// `package.json` の `name` フィールドを返す。
pub(crate) fn read_package_name(root: &Path) -> Option<String> {
    let content = std::fs::read_to_string(root.join("package.json")).ok()?;
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("\"name\"") {
            if let Some(colon_pos) = trimmed.find(':') {
                let val = trimmed[colon_pos + 1..].trim().trim_end_matches(',').trim();
                return Some(unquote(val).to_owned());
            }
        }
    }
    None
}

/// 先頭だけ大文字にする。
pub(crate) fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
    }
}

/// ディレクトリに YYYY-MM-DD* パターンのエントリがあるか確認する（ブログ判定用）。
pub(crate) fn has_date_prefixed_entries(dir: &Path) -> bool {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let s = name.to_str().unwrap_or("");
            if s.len() >= 10 && s.as_bytes()[4] == b'-' && s.as_bytes()[7] == b'-' {
                let year = &s[..4];
                if year.chars().all(|c| c.is_ascii_digit()) {
                    return true;
                }
            }
        }
    }
    false
}

// ファイルシステムユーティリティ
fn is_leap(year: u32) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

fn format_date_from_secs(secs: u64) -> String {
    let days = secs / 86400;
    let mut remaining = days;
    let mut year = 1970u32;

    loop {
        let days_in_year = if is_leap(year) { 366u64 } else { 365u64 };
        if remaining < days_in_year {
            break;
        }
        remaining -= days_in_year;
        year += 1;
    }

    let months: [u64; 12] = [
        31,
        if is_leap(year) { 29 } else { 28 },
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ];
    let mut month = 1u32;
    for &days_in_month in &months {
        if remaining < days_in_month {
            break;
        }
        remaining -= days_in_month;
        month += 1;
    }

    let day = remaining + 1;
    format!("{:04}-{:02}-{:02}", year, month, day)
}

/// ファイルの最終更新日を `YYYY-MM-DD` 文字列で返す。
pub(crate) fn get_modified_time(path: &Path) -> String {
    std::fs::metadata(path)
        .and_then(|m| m.modified())
        .map(|t| {
            let secs = t.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
            format_date_from_secs(secs)
        })
        .unwrap_or_else(|_| "1970-01-01".to_string())
}

// ─────────────────────────────────────────────
// ディレクトリ日付抽出
// ─────────────────────────────────────────────

/// 相対パスの先頭セグメントから YYYY-MM-DD を抽出する。
/// 例: `2024-01-15-my-post/index.md` → `Some("2024-01-15")`
pub(crate) fn extract_dir_date(rel_path: &str) -> Option<String> {
    let first_seg = rel_path.split('/').next()?;
    // ファイル名の場合は拡張子を除く
    let seg = first_seg.splitn(2, '.').next().unwrap_or(first_seg);
    if seg.len() >= 10 {
        let b = seg.as_bytes();
        if b[4] == b'-'
            && b[7] == b'-'
            && b[..4].iter().all(|c| c.is_ascii_digit())
            && b[5..7].iter().all(|c| c.is_ascii_digit())
            && b[8..10].iter().all(|c| c.is_ascii_digit())
        {
            return Some(seg[..10].to_owned());
        }
    }
    None
}

// ─────────────────────────────────────────────
// ディレクトリスキャン
// ─────────────────────────────────────────────

/// `dir` を再帰スキャンして `.md` / `.mdx` ファイルの `FileEntry` を返す。
/// `instance_dir` は相対パスの起点として使われる。
pub(crate) fn scan_directory(dir: &Path, instance_dir: &Path) -> Vec<FileEntry> {
    let mut files: Vec<FileEntry> = Vec::new();

    for entry in WalkDir::new(dir)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_str().unwrap_or("");
            !name.starts_with('.') && name != "node_modules"
        })
        .flatten()
    {
        let path = entry.path();
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "md" && ext != "mdx" {
            continue;
        }

        let rel_path = path
            .strip_prefix(instance_dir)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_else(|_| path.to_string_lossy().replace('\\', "/"));

        let modified_at = get_modified_time(path);
        let content = std::fs::read_to_string(path).unwrap_or_default();
        let fm = parse_frontmatter(&content);

        // タイトル: フロントマター → H1 見出し の順で解決
        let title = fm.title.or_else(|| extract_h1_title(&content));
        let dir_date = extract_dir_date(&rel_path);

        files.push(FileEntry {
            relative_path: rel_path,
            title,
            date: fm.date,
            dir_date,
            tags: fm.tags,
            description: fm.description,
            slug: fm.slug,
            authors: fm.authors,
            modified_at,
        });
    }

    files
}

// ─────────────────────────────────────────────
// プロジェクトビルド
// ─────────────────────────────────────────────

/// ルートディレクトリを走査して `ProjectInfo` を組み立てる。
/// バリデーション済みの `root` と `name` を受け取る。
pub(crate) fn build_project(
    root: &Path,
    name: String,
    root_path: String,
) -> Result<ProjectInfo, String> {
    let mut instances: Vec<InstanceInfo> = Vec::new();
    let mut all_tags: HashSet<String> = HashSet::new();
    // (project_relative_path, instance_id, title, sort_date)
    let mut all_recent: Vec<(String, String, Option<String>, String)> = Vec::new();

    let mut dir_entries: Vec<_> = std::fs::read_dir(root)
        .map_err(|e| e.to_string())?
        .flatten()
        .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
        .collect();
    dir_entries.sort_by_key(|e| e.file_name());

    for entry in dir_entries {
        let name_os = entry.file_name();
        let dir_name = match name_os.to_str() {
            Some(s) => s,
            None => continue,
        };

        if SKIP_DIRS.contains(&dir_name) || dir_name.starts_with('.') {
            continue;
        }

        let dir_path = entry.path();
        let files = scan_directory(&dir_path, &dir_path);

        if files.is_empty() {
            continue;
        }

        let count = files.len() as u32;

        for f in &files {
            all_tags.extend(f.tags.iter().cloned());
            let proj_rel = format!("{}/{}", dir_name, f.relative_path);
            let sort_date = f.date.clone().unwrap_or_else(|| f.modified_at.clone());
            all_recent.push((proj_rel, dir_name.to_owned(), f.title.clone(), sort_date));
        }

        let is_blog = dir_name == "blog" || has_date_prefixed_entries(&dir_path);

        instances.push(InstanceInfo {
            id: dir_name.to_owned(),
            label: capitalize(dir_name),
            instance_type: if is_blog { "blog" } else { "docs" }.to_owned(),
            path: format!("{}/", dir_name),
            count,
        });
    }

    all_recent.sort_by(|a, b| b.3.cmp(&a.3));
    let recent_files: Vec<RecentFile> = all_recent
        .into_iter()
        .take(5)
        .map(|(path, instance_id, title, modified_at)| RecentFile {
            path,
            instance_label: capitalize(&instance_id),
            instance_id,
            title,
            modified_at,
        })
        .collect();

    Ok(ProjectInfo {
        name,
        root_path,
        instances,
        tag_count: all_tags.len() as u32,
        recent_files,
    })
}
