import { FolderOpen, FolderSearch, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import Badge from "../components/ui/Badge";
import InstanceCard from "../components/ui/InstanceCard";
import { loadProject, pickProjectFolder } from "../services/project";
import type { AppRoute, Project } from "../types/project";
import styles from "./Dashboard.module.css";

interface DashboardProps {
  project: Project | null;
  setProject: (p: Project) => void;
  navigate: (route: AppRoute) => void;
}

export default function Dashboard({
  project,
  setProject,
  navigate,
}: DashboardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenProject() {
    setError(null);
    setLoading(true);
    try {
      const folderPath = await pickProjectFolder();
      if (!folderPath) return;
      const loaded = await loadProject(folderPath);
      setProject(loaded);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleReload() {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const loaded = await loadProject(project.rootPath);
      setProject(loaded);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // ─── プロジェクト未選択 ───────────────────────
  if (!project) {
    return (
      <div className={styles.emptyState}>
        <FolderSearch size={48} className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>プロジェクトを開く</h2>
        <p className={styles.emptyDesc}>
          Docusaurus プロジェクトのフォルダを選択してください。
          <br />
          <span className={styles.emptySubDesc}>
            docusaurus.config.js / .ts があるフォルダを選んでください。
          </span>
        </p>
        {error && <p className={styles.errorMsg}>{error}</p>}
        <button
          className={styles.openButton}
          onClick={handleOpenProject}
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className={styles.spinIcon} />
          ) : (
            <FolderOpen size={16} />
          )}
          {loading ? "読み込み中…" : "フォルダを選択"}
        </button>
      </div>
    );
  }

  // ─── プロジェクト読み込み済み ─────────────────

  return (
    <div className={styles.dashboard}>
      {/* プロジェクトヘッダー */}
      <header className={styles.header}>
        <div className={styles.projectMeta}>
          <FolderOpen size={18} className={styles.projectIcon} />
          <div>
            <h1 className={styles.title}>{project.name}</h1>
            <p className={styles.path}>{project.rootPath}</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconButton}
            onClick={() => navigate({ page: "setup-wizard" })}
            title="依存確認"
          >
            <FolderSearch size={14} />
          </button>
          {error && <span className={styles.errorMsg}>{error}</span>}
          <button
            className={styles.iconButton}
            onClick={handleReload}
            disabled={loading}
            title="再読み込み"
          >
            {loading ? (
              <Loader2 size={14} className={styles.spinIcon} />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
          <button
            className={styles.iconButton}
            onClick={handleOpenProject}
            disabled={loading}
            title="別のプロジェクトを開く"
          >
            <FolderOpen size={14} />
          </button>
        </div>
      </header>

      {/* インスタンス一覧 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>インスタンス</h2>
        <div className={styles.instanceGrid}>
          {project.instances.map((inst) => (
            <InstanceCard
              key={`${inst.type}-${inst.id}-${inst.path}`}
              instance={inst}
              onClick={() => navigate({ page: "instance-files", instance: inst })}
            />
          ))}
        </div>
      </section>

      {/* 最近のファイル */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>最近のファイル</h2>
        {project.recentFiles.length > 0 ? (
          <ul className={styles.fileList}>
            {project.recentFiles.map((file) => {
              const instance = project.instances.find(
                (i) => i.id === file.instanceId
              );
              return (
                <li
                  key={file.path}
                  className={`${styles.fileItem} ${instance ? styles.fileItemClickable : ""}`}
                  onClick={() =>
                    instance &&
                    navigate({ page: "instance-files", instance })
                  }
                >
                  <span className={styles.fileName}>
                    {file.title ?? file.path}
                  </span>
                  <div className={styles.fileMeta}>
                    <Badge variant="default">{file.instanceLabel}</Badge>
                    <span className={styles.fileDate}>{file.modifiedAt}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.emptyListMsg}>ファイルがありません</p>
        )}
      </section>
    </div>
  );
}

