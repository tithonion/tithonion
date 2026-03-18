import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { checkTool, loadProjectConfig } from "../services/project";
import type { AppRoute } from "../types/project";
import styles from "./SetupOverlayPage.module.css";

// ─────────────────────────────────────────────
// 既知ツールのメタ情報 (表示名・説明・インストール先 URL)
// ─────────────────────────────────────────────
interface ToolMeta {
  label: string;
  description: string;
  installUrl: string;
}

const KNOWN_TOOL_META: Record<string, ToolMeta> = {
  git: {
    label: "Git",
    description: "バージョン管理。コンテンツの同期・公開に必要。",
    installUrl: "https://git-scm.com/downloads",
  },
  bun: {
    label: "Bun",
    description: "Docusaurus の起動・ビルドに使用。",
    installUrl: "https://bun.sh",
  },
  node: {
    label: "Node.js",
    description: "npm エコシステム全般のランタイム。",
    installUrl: "https://nodejs.org",
  },
  npm: {
    label: "npm",
    description: "Node.js 付属のパッケージマネージャ。",
    installUrl: "https://www.npmjs.com",
  },
  yarn: {
    label: "Yarn",
    description: "高速な代替パッケージマネージャ。",
    installUrl: "https://yarnpkg.com",
  },
  pnpm: {
    label: "pnpm",
    description: "ディスク効率の良いパッケージマネージャ。",
    installUrl: "https://pnpm.io",
  },
  gh: {
    label: "GitHub CLI",
    description: "PR 作成・マージなどの自動化タスクに利用。",
    installUrl: "https://cli.github.com",
  },
  deno: {
    label: "Deno",
    description: "TypeScript ネイティブのランタイム。",
    installUrl: "https://deno.land",
  },
};

function getToolMeta(name: string): ToolMeta {
  return (
    KNOWN_TOOL_META[name] ?? {
      label: name,
      description: "プロジェクト設定で定義されたツールです。",
      installUrl: `https://www.google.com/search?q=${encodeURIComponent(name + " install")}`,
    }
  );
}

// ─────────────────────────────────────────────
// 型
// ─────────────────────────────────────────────
type ToolStatus = "pending" | "checking" | "ok" | "missing";

interface SetupOverlayPageProps {
  /** 現在開いているプロジェクトのルートパス。未選択なら undefined */
  rootPath?: string;
  navigate: (route: AppRoute) => void;
  onBack: () => void;
}

export default function SetupOverlayPage({
  rootPath,
  navigate: _navigate,
  onBack,
}: SetupOverlayPageProps) {
  /** config.tools から読み込んだ { ツール名 → バージョン要件 } */
  const [configTools, setConfigTools] = useState<Record<string, string> | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  const [statuses, setStatuses] = useState<Record<string, ToolStatus>>({});
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);

  // ── プロジェクト設定を読み込む ──
  useEffect(() => {
    if (!rootPath) {
      setConfigTools(null);
      return;
    }
    setConfigLoading(true);
    loadProjectConfig(rootPath)
      .then((cfg) => {
        const tools = cfg.config?.tools ?? null;
        setConfigTools(tools && Object.keys(tools).length > 0 ? tools : null);
      })
      .catch(() => setConfigTools(null))
      .finally(() => setConfigLoading(false));
  }, [rootPath]);

  // ── ツールチェックを実行する ──
  async function runChecks(tools: Record<string, string>) {
    const names = Object.keys(tools);
    setChecking(true);
    setStatuses(Object.fromEntries(names.map((n) => [n, "checking"])));
    setVersions({});

    await Promise.all(
      names.map(async (name) => {
        try {
          const ver = await checkTool(name);
          setStatuses((prev) => ({ ...prev, [name]: ver !== null ? "ok" : "missing" }));
          if (ver !== null) {
            setVersions((prev) => ({ ...prev, [name]: ver }));
          }
        } catch {
          setStatuses((prev) => ({ ...prev, [name]: "missing" }));
        }
      })
    );

    setChecking(false);
  }

  // configTools が確定したら自動チェック
  useEffect(() => {
    if (configTools) runChecks(configTools);
  }, [configTools]);

  const toolNames = configTools ? Object.keys(configTools) : [];
  const allOk = toolNames.length > 0 && toolNames.every((n) => statuses[n] === "ok");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          <span>戻る</span>
        </button>
        <h1 className={styles.title}>依存確認</h1>
        <button
          className={styles.refreshButton}
          onClick={() => configTools && runChecks(configTools)}
          disabled={checking || !configTools}
          title="再チェック"
        >
          {checking ? (
            <Loader2 size={14} className={styles.spinIcon} />
          ) : (
            <RefreshCw size={14} />
          )}
        </button>
      </header>

      {/* プロジェクト未選択 */}
      {!rootPath && (
        <div className={styles.noProjectBanner}>
          プロジェクトを選択すると、<code>.tithonion/config.json</code> の{" "}
          <code>tools</code> からチェック対象のツール一覧が読み込まれます。
        </div>
      )}

      {/* 設定読み込み中 */}
      {configLoading && (
        <div className={styles.loadingState}>
          <Loader2 size={16} className={styles.spinIcon} />
          設定ファイルを読み込み中…
        </div>
      )}

      {/* tools 未定義 */}
      {rootPath && !configLoading && configTools === null && (
        <div className={styles.noToolsBanner}>
          <code>.tithonion/config.json</code> に <code>tools</code>{" "}
          が定義されていません。プロジェクト設定からチェックしたいツールを追加してください。
        </div>
      )}

      {/* 全OK バナー */}
      {allOk && !checking && (
        <div className={styles.allOkBanner}>
          <CheckCircle2 size={16} />
          必須ツールがすべて揃っています。
        </div>
      )}

      {/* ツール一覧 */}
      {configTools && (
        <ul className={styles.toolList}>
          {toolNames.map((name) => {
            const meta = getToolMeta(name);
            const required = configTools[name];
            const status = statuses[name] ?? "pending";
            const version = versions[name];
            return (
              <li key={name} className={styles.toolItem}>
                <StatusIcon status={status} />
                <div className={styles.toolInfo}>
                  <div className={styles.toolHeader}>
                    <span className={styles.toolLabel}>{meta.label}</span>
                    {required && required !== "*" && (
                      <span className={styles.versionReq}>{required}</span>
                    )}
                    {version && (
                      <span className={styles.versionText}>{version}</span>
                    )}
                  </div>
                  <p className={styles.toolDesc}>{meta.description}</p>
                </div>
                {status === "missing" && (
                  <a
                    href={meta.installUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.installLink}
                  >
                    インストール
                    <ExternalLink size={11} />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: ToolStatus }) {
  switch (status) {
    case "checking":
      return (
        <Loader2
          size={16}
          className={styles.spinIcon}
          style={{ color: "var(--color-text-muted)" }}
        />
      );
    case "ok":
      return (
        <CheckCircle2
          size={16}
          style={{ color: "var(--color-success)", flexShrink: 0 }}
        />
      );
    case "missing":
      return (
        <XCircle
          size={16}
          style={{ color: "var(--color-danger)", flexShrink: 0 }}
        />
      );
    default:
      return <span className={styles.pendingDot} />;
  }
}

