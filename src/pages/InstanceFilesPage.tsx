import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  FileText,
  Folder,
  Loader2,
  Search,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import { listInstanceFiles } from "../services/project";
import type { DocusaurusInstance, FileEntry, Project } from "../types/project";
import styles from "./InstanceFilesPage.module.css";

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────

type SortDir = "asc" | "desc";

/** ブログ共通ソートキー */
type BlogSortBy = "dir-date" | "updated" | "title" | "path";
/** docs 共通ソートキー */
type DocsSortBy = "title" | "path" | "updated";

type SortBy = BlogSortBy | DocsSortBy;

const BLOG_SORT_OPTIONS: { value: BlogSortBy; label: string }[] = [
  { value: "dir-date", label: "作成日" },
  { value: "updated", label: "更新日" },
  { value: "title", label: "タイトル" },
  { value: "path", label: "ファイルパス" },
];

const DOCS_SORT_OPTIONS: { value: DocsSortBy; label: string }[] = [
  { value: "title", label: "タイトル" },
  { value: "path", label: "ファイルパス" },
  { value: "updated", label: "更新日" },
];

interface InstanceFilesPageProps {
  project: Project;
  instance: DocusaurusInstance;
  onBack: () => void;
}

const TYPE_ICON = {
  blog: FileText,
  docs: BookOpen,
} as const;

// ─────────────────────────────────────────────
// ソート・フィルタユーティリティ
// ─────────────────────────────────────────────

function fileDisplayName(f: FileEntry): string {
  return f.title ?? f.relativePath;
}

function sortFiles(files: FileEntry[], by: SortBy, dir: SortDir): FileEntry[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...files].sort((a, b) => {
    let cmp = 0;
    switch (by) {
      case "dir-date": {
        const da = a.dirDate ?? a.date ?? a.modifiedAt;
        const db = b.dirDate ?? b.date ?? b.modifiedAt;
        cmp = da.localeCompare(db);
        break;
      }
      case "updated": {
        cmp = a.modifiedAt.localeCompare(b.modifiedAt);
        break;
      }
      case "title":
        cmp = fileDisplayName(a).localeCompare(fileDisplayName(b), "ja");
        break;
      case "path":
        cmp = a.relativePath.localeCompare(b.relativePath);
        break;
    }
    return cmp !== 0
      ? cmp * sign
      : a.relativePath.localeCompare(b.relativePath);
  });
}

/** relativePath の先頭ディレクトリを返す (ルート直下なら "(ルート)") */
function topDir(relativePath: string): string {
  const idx = relativePath.indexOf("/");
  return idx === -1 ? "" : relativePath.slice(0, idx);
}

// ─────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────

export default function InstanceFilesPage({
  project,
  instance,
  onBack,
}: InstanceFilesPageProps) {
  const isBlog = instance.type === "blog";

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>(isBlog ? "dir-date" : "title");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  /** docs のカテゴリフィルタ (空文字 = すべて) */
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const Icon = TYPE_ICON[instance.type];
  const sortOptions = isBlog ? BLOG_SORT_OPTIONS : DOCS_SORT_OPTIONS;

  useEffect(() => {
    setLoading(true);
    setError(null);
    listInstanceFiles(project.rootPath, instance.path)
      .then(setFiles)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [project.rootPath, instance.path]);

  // docs のカテゴリ一覧
  const categories = useMemo<string[]>(() => {
    if (isBlog) return [];
    const dirs = new Set(files.map((f) => topDir(f.relativePath)).filter(Boolean));
    return Array.from(dirs).sort();
  }, [files, isBlog]);

  const filtered = useMemo(() => {
    let result = files;

    // カテゴリフィルタ (docs のみ)
    if (!isBlog && categoryFilter) {
      result = result.filter(
        (f) => topDir(f.relativePath) === categoryFilter
      );
    }

    // 全文検索
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          (f.title ?? "").toLowerCase().includes(q) ||
          f.relativePath.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)) ||
          (f.description ?? "").toLowerCase().includes(q)
      );
    }

    return sortFiles(result, sortBy, sortDir);
  }, [files, searchQuery, sortBy, sortDir, categoryFilter, isBlog]);

  function toggleSortDir() {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  return (
    <div className={styles.page}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          <span>ダッシュボード</span>
        </button>

        <div className={styles.instanceMeta}>
          <div className={styles.instanceIcon}>
            <Icon size={15} />
          </div>
          <h1 className={styles.instanceTitle}>{instance.label}</h1>
          <span className={styles.instanceType}>{instance.type}</span>
          <span className={styles.instancePath}>{instance.path}</span>
        </div>

        <div className={styles.headerStats}>
          <span className={styles.statChip}>
            <span className={styles.statNum}>{files.length}</span> コンテンツ
          </span>
        </div>
      </header>

      {/* docs: カテゴリフィルタ */}
      {!isBlog && categories.length > 0 && (
        <div className={styles.categoryBar}>
          <Folder size={12} className={styles.categoryIcon} />
          <div className={styles.filterGroup}>
            <button
              className={[styles.filterBtn, categoryFilter === "" ? styles.filterBtnActive : ""].join(" ")}
              onClick={() => setCategoryFilter("")}
            >
              すべて
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={[styles.filterBtn, categoryFilter === cat ? styles.filterBtnActive : ""].join(" ")}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* コントロールバー */}
      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="タイトル・パス・タグで検索…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.sortRow}>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            className={styles.sortDirBtn}
            onClick={toggleSortDir}
            title={sortDir === "asc" ? "昇順" : "降順"}
          >
            {sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          </button>
        </div>
      </div>

      {/* 件数サマリー */}
      <div className={styles.resultSummary}>
        {loading
          ? "読み込み中…"
          : error
          ? ""
          : `${filtered.length} 件 / 全 ${files.length} 件`}
      </div>

      {/* コンテンツ */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinIcon} />
          <span>読み込み中…</span>
        </div>
      ) : error ? (
        <div className={styles.errorState}>{error}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>ファイルが見つかりません</div>
      ) : (
        <ul className={styles.fileList}>
          {filtered.map((f) => (
            <FileRow key={f.relativePath} file={f} isBlog={isBlog} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ファイル行
// ─────────────────────────────────────────────

function FileRow({ file, isBlog }: { file: FileEntry; isBlog: boolean }) {
  const displayDate = isBlog
    ? (file.dirDate ?? file.date ?? file.modifiedAt)
    : file.modifiedAt;

  return (
    <li className={styles.fileRow}>
      <div className={styles.fileMain}>
        <div className={styles.fileTitle}>
          <span className={styles.fileTitleText}>
            {file.title ?? (
              <span className={styles.noTitle}>{file.relativePath}</span>
            )}
          </span>
        </div>

        <div className={styles.fileSub}>
          <span className={styles.filePath}>{file.relativePath}</span>
          {displayDate && (
            <span className={styles.fileDate}>{displayDate}</span>
          )}
          {file.modifiedAt && isBlog && file.dirDate && file.modifiedAt !== file.dirDate && (
            <span className={styles.fileUpdated}>更新: {file.modifiedAt}</span>
          )}
          {file.authors.length > 0 && (
            <span className={styles.fileAuthors}>
              {file.authors.join(", ")}
            </span>
          )}
        </div>
      </div>

      <div className={styles.fileRight}>
        {file.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="default">
            <Tag size={9} style={{ marginRight: 2 }} />
            {tag}
          </Badge>
        ))}
        {file.tags.length > 3 && (
          <span className={styles.moreTags}>+{file.tags.length - 3}</span>
        )}
      </div>
    </li>
  );
}

