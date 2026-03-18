import { ArrowLeft, FolderOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import { loadProject, pickProjectFolder } from "../services/project";
import type { AppRoute, Project, RegisteredProject } from "../types/project";
import styles from "./AddProjectPage.module.css";

interface AddProjectPageProps {
  onAdd: (p: Project, reg: RegisteredProject) => void;
  navigate: (route: AppRoute) => void;
  onBack: () => void;
}

export default function AddProjectPage({
  onAdd,
  onBack,
}: AddProjectPageProps) {
  const [folderPath, setFolderPath] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<{ name: string } | null>(null);

  async function handlePickFolder() {
    setError(null);
    setValidated(null);
    const path = await pickProjectFolder();
    if (!path) return;
    setFolderPath(path);
    await validatePath(path);
  }

  async function validatePath(path: string) {
    setError(null);
    setValidated(null);
    setLoading(true);
    try {
      const p = await loadProject(path);
      setValidated({ name: p.name });
      setCustomName(p.name);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!validated || !folderPath) return;
    setError(null);
    setLoading(true);
    try {
      const p = await loadProject(folderPath);
      const reg: RegisteredProject = {
        rootPath: folderPath,
        name: customName.trim() || p.name,
        addedAt: new Date().toISOString(),
      };
      onAdd(p, reg);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          <span>戻る</span>
        </button>
        <h1 className={styles.title}>プロジェクトを追加</h1>
      </header>

      <div className={styles.form}>
        {/* フォルダ選択 */}
        <div className={styles.field}>
          <label className={styles.label}>プロジェクトフォルダ</label>
          <div className={styles.pathRow}>
            <input
              className={styles.pathInput}
              type="text"
              value={folderPath}
              readOnly
              placeholder="フォルダを選択してください…"
            />
            <button
              className={styles.browseButton}
              onClick={handlePickFolder}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={14} className={styles.spinIcon} />
              ) : (
                <FolderOpen size={14} />
              )}
              参照
            </button>
          </div>
          <p className={styles.hint}>
            docusaurus.config.js / .ts があるフォルダを選択してください。
          </p>
        </div>

        {/* バリデーション結果 */}
        {validated && !loading && (
          <div className={styles.validBanner}>
            ✓ Docusaurus プロジェクトを検出しました（{validated.name}）
          </div>
        )}
        {error && <p className={styles.errorMsg}>{error}</p>}

        {/* 表示名 */}
        {validated && (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="projectName">
              表示名
            </label>
            <input
              id="projectName"
              className={styles.textInput}
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="プロジェクト名"
            />
          </div>
        )}

        {/* 追加ボタン */}
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onBack}
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            className={styles.addButton}
            onClick={handleAdd}
            disabled={!validated || loading}
          >
            {loading ? (
              <Loader2 size={14} className={styles.spinIcon} />
            ) : null}
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
