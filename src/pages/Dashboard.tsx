import { FolderOpen } from "lucide-react";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import InstanceCard from "../components/ui/InstanceCard";
import StatCard from "../components/ui/StatCard";
import type { Project } from "../types/project";
import styles from "./Dashboard.module.css";

// ダミーデータ（後で Tauri コマンド経由で取得する）
const PROJECT: Project = {
  name: "my-website",
  rootPath: "C:/repos/my-website",
  tagCount: 11,
  instances: [
    {
      id: "default",
      label: "Blog",
      type: "blog",
      path: "blog/",
      publishedCount: 8,
      draftCount: 2,
    },
    {
      id: "default",
      label: "Docs",
      type: "docs",
      path: "docs/",
      publishedCount: 15,
      draftCount: 0,
    },
    {
      id: "tutorial",
      label: "Tutorial",
      type: "blog",
      path: "tutorial/",
      publishedCount: 4,
      draftCount: 1,
    },
  ],
};

const RECENT_FILES = [
  { path: "blog/2026-03-10-hello/index.md", instanceLabel: "Blog", status: "published" as const, updatedAt: "2026-03-10" },
  { path: "blog/2026-03-09-intro/index.md", instanceLabel: "Blog", status: "draft" as const, updatedAt: "2026-03-09" },
  { path: "docs/getting-started.md", instanceLabel: "Docs", status: "published" as const, updatedAt: "2026-03-08" },
  { path: "tutorial/intro.md", instanceLabel: "Tutorial", status: "draft" as const, updatedAt: "2026-03-07" },
  { path: "docs/tutorial.md", instanceLabel: "Docs", status: "published" as const, updatedAt: "2026-03-06" },
];

// .tithonion/tasks.json から読み込む想定
const QUICK_TASKS = [
  { id: "sync", label: "sync", description: "git pull origin main" },
  { id: "publish", label: "publish", description: "gh pr create && merge" },
  { id: "build", label: "build", description: "bun run build" },
];

function deriveStats(project: Project) {
  const totalContent = project.instances.reduce(
    (acc, i) => acc + i.publishedCount + i.draftCount,
    0
  );
  const totalPublished = project.instances.reduce((acc, i) => acc + i.publishedCount, 0);
  const totalDraft = project.instances.reduce((acc, i) => acc + i.draftCount, 0);
  const publishedPct = totalContent > 0
    ? `${Math.round((totalPublished / totalContent) * 100)}%`
    : "—";
  return [
    { label: "インスタンス数", value: project.instances.length },
    { label: "総コンテンツ数", value: totalContent },
    { label: "公開中", value: totalPublished, sub: publishedPct },
    { label: "下書き", value: totalDraft },
  ];
}

export default function Dashboard() {
  const stats = deriveStats(PROJECT);

  return (
    <div className={styles.dashboard}>
      {/* プロジェクトヘッダー */}
      <header className={styles.header}>
        <div className={styles.projectMeta}>
          <FolderOpen size={18} className={styles.projectIcon} />
          <div>
            <h1 className={styles.title}>{PROJECT.name}</h1>
            <p className={styles.path}>{PROJECT.rootPath}</p>
          </div>
        </div>
      </header>

      {/* 集計統計 */}
      <section className={styles.statsGrid}>
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </section>

      {/* インスタンス一覧 */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>インスタンス</h2>
        <div className={styles.instanceGrid}>
          {PROJECT.instances.map((inst) => (
            <InstanceCard key={`${inst.type}-${inst.id}-${inst.path}`} instance={inst} />
          ))}
        </div>
      </section>

      {/* 最近のファイル ＋ タスク */}
      <section className={styles.contentGrid}>
        <Card title="最近のファイル">
          <ul className={styles.fileList}>
            {RECENT_FILES.map((file) => (
              <li key={file.path} className={styles.fileItem}>
                <span className={styles.fileName}>{file.path}</span>
                <div className={styles.fileMeta}>
                  <Badge variant="default">{file.instanceLabel}</Badge>
                  <Badge variant={file.status === "published" ? "success" : "warning"}>
                    {file.status === "published" ? "公開" : "下書き"}
                  </Badge>
                  <span className={styles.fileDate}>{file.updatedAt}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="クイックタスク">
          <div className={styles.taskNote}>
            <span className={styles.taskNoteText}>.tithonion/tasks.json で定義</span>
          </div>
          <ul className={styles.taskList}>
            {QUICK_TASKS.map((task) => (
              <li key={task.id}>
                <button className={styles.taskButton} disabled title={task.description}>
                  <span className={styles.taskLabel}>{task.label}</span>
                  <span className={styles.taskDesc}>{task.description}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
