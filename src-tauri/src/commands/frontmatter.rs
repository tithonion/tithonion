/// YAML フロントマターの解析結果。
pub(crate) struct Frontmatter {
    pub title: Option<String>,
    pub date: Option<String>,
    pub tags: Vec<String>,
    pub description: Option<String>,
    pub slug: Option<String>,
    pub authors: Vec<String>,
}

impl Default for Frontmatter {
    fn default() -> Self {
        Self {
            title: None,
            date: None,
            tags: Vec::new(),
            description: None,
            slug: None,
            authors: Vec::new(),
        }
    }
}

/// 文字列を囲むダブルクォートとシングルクォートを取り除く。
pub(crate) fn unquote(s: &str) -> &str {
    let s = s.trim();
    if s.len() >= 2 {
        let bytes = s.as_bytes();
        let (first, last) = (bytes[0], bytes[s.len() - 1]);
        if (first == b'"' && last == b'"') || (first == b'\'' && last == b'\'') {
            return &s[1..s.len() - 1];
        }
    }
    s
}

/// 文字列の配列をパースして配列変数に変換する。
/// ex.) r#"["a", 'b', c]"#: str -> [a, b, c]: Vec<String>
fn parse_inline_list(s: &str) -> Vec<String> {
    let s = s.trim();
    if s.starts_with('[') && s.ends_with(']') {
        s[1..s.len() - 1]
            .split(',')
            .map(|item| unquote(item.trim()).to_owned())
            .filter(|s| !s.is_empty())
            .collect()
    } else if !s.is_empty() {
        vec![unquote(s).to_owned()]
    } else {
        vec![]
    }
}

/// フロントマター部分をスキップして本文の開始位置を返す。
fn skip_frontmatter(content: &str) -> &str {
    if !content.starts_with("---") {
        return content;
    }
    let rest = if content.starts_with("---\r\n") {
        &content[5..]
    } else if content.starts_with("---\n") {
        &content[4..]
    } else {
        return content;
    };
    if let Some(end_idx) = rest.find("\n---") {
        let after = &rest[end_idx + 4..];
        if after.starts_with("\r\n") {
            &after[2..]
        } else if after.starts_with('\n') {
            &after[1..]
        } else {
            after
        }
    } else {
        content
    }
}

/// コンテンツ中の最初の H1 (`# ...`) をタイトルとして返す。
/// フロントマターがある場合はその後を検索する。
pub(crate) fn extract_h1_title(content: &str) -> Option<String> {
    let content = content.trim_start_matches('\u{feff}');
    let body = skip_frontmatter(content);
    for line in body.lines() {
        if let Some(rest) = line.trim_start().strip_prefix("# ") {
            let t = rest.trim().to_owned();
            if !t.is_empty() {
                return Some(t);
            }
        }
    }
    None
}

/// Markdown コンテンツから YAML フロントマターをパースして返す。
pub(crate) fn parse_frontmatter(content: &str) -> Frontmatter {
    let mut fm = Frontmatter::default();
    // BOM 除去
    let content = content.trim_start_matches('\u{feff}');

    if !content.starts_with("---") {
        return fm;
    }

    // "---\n" or "---\r\n" の後ろを取り出す
    let rest = if content.starts_with("---\r\n") {
        &content[5..]
    } else if content.starts_with("---\n") {
        &content[4..]
    } else {
        return fm;
    };

    let end_idx = match rest.find("\n---") {
        Some(i) => i,
        None => return fm,
    };

    let yaml = &rest[..end_idx];
    let mut current_list: Option<String> = None;

    for line in yaml.lines() {
        let trimmed = line.trim();

        // YAML リストアイテム
        if let Some(without_dash) = trimmed.strip_prefix("- ") {
            let item = unquote(without_dash.trim()).to_owned();
            if let Some(ref field) = current_list {
                match field.as_str() {
                    "tags" => fm.tags.push(item),
                    "authors" => fm.authors.push(item),
                    _ => {}
                }
            }
            continue;
        }

        current_list = None;

        // Key: value
        if let Some(colon_pos) = line.find(':') {
            let key = line[..colon_pos].trim();
            let value = line[colon_pos + 1..].trim();

            match key {
                "title" => fm.title = Some(unquote(value).to_owned()),
                "date" => fm.date = Some(unquote(value).to_owned()),
                "description" => fm.description = Some(unquote(value).to_owned()),
                "slug" => fm.slug = Some(unquote(value).to_owned()),
                "tags" => {
                    let list = parse_inline_list(value);
                    if !list.is_empty() {
                        fm.tags = list;
                    } else {
                        current_list = Some("tags".to_string());
                    }
                }
                "authors" => {
                    let list = parse_inline_list(value);
                    if !list.is_empty() {
                        fm.authors = list;
                    } else {
                        current_list = Some("authors".to_string());
                    }
                }
                _ => {}
            }
        }
    }

    fm
}
