import {
  Cpu,
  FolderOpen,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { loadProject } from "../services/project";
import type { AppRoute, Project, RegisteredProject } from "../types/project";
import styles from "./SetupProjectsPage.module.css";

interface SetupProjectsPageProps {
  projects: RegisteredProject[];
  onOpenProject: (p: Project, reg: RegisteredProject) => void;
  onRemoveProject: (rootPath: string) => void;
  navigate: (route: AppRoute) => void;
}

export default function SetupProjectsPage({
  projects,
  onOpenProject,
  onRemoveProject,
  navigate,
}: SetupProjectsPageProps) {
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(reg: RegisteredProject) {
    setError(null);
    setLoadingPath(reg.rootPath);
    try {
      const p = await loadProject(reg.rootPath);
      onOpenProject(p, reg);
    } catch (e) {
      setError(`「${reg.name}」を開けませんでした: ${String(e)}`);
    } finally {
      setLoadingPath(null);
    }
  }

  return (
    <div className={styles.page}>
      {/* プロジェクト一覧 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>プロジェクト</h2>
          <div className={styles.sectionActions}>
            <button
              className={styles.addButton}
              onClick={() => navigate({ page: "add-project" })}
            >
              <Plus size={14} />
              プロジェクトを追加
            </button>
          </div>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}

        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <Cpu size={40} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              まだプロジェクトが登録されていません。
            </p>
            <button
              className={styles.addButton}
              onClick={() => navigate({ page: "add-project" })}
            >
              <Plus size={14} />
              プロジェクトを追加
            </button>
          </div>
        ) : (
          <ul className={styles.projectList}>
            {projects.map((reg) => {
              const isLoading = loadingPath === reg.rootPath;
              return (
                <li key={reg.rootPath} className={styles.projectItem}>
                  <button
                    className={styles.projectMain}
                    onClick={() => handleOpen(reg)}
                    disabled={loadingPath !== null}
                  >
                    {isLoading ? (
                      <Loader2 size={16} className={styles.spinIcon} />
                    ) : (
                      <FolderOpen size={16} className={styles.projectIcon} />
                    )}
                    <div className={styles.projectInfo}>
                      <span className={styles.projectName}>{reg.name}</span>
                      <span className={styles.projectPath}>{reg.rootPath}</span>
                    </div>
                  </button>

                  <div className={styles.projectActions}>
                    <button
                      className={styles.iconBtn}
                      title="プロジェクト設定"
                      onClick={() =>
                        navigate({ page: "project-settings", project: reg })
                      }
                      disabled={loadingPath !== null}
                    >
                      <Settings size={13} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.dangerBtn}`}
                      title="一覧から削除"
                      onClick={() => {
                        if (
                          confirm(
                            `「${reg.name}」を一覧から削除しますか？\n（プロジェクトのファイルは削除されません）`
                          )
                        ) {
                          onRemoveProject(reg.rootPath);
                        }
                      }}
                      disabled={loadingPath !== null}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
