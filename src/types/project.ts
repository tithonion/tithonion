/** Docusaurus のコンテンツプラグイン種別 */
export type InstanceType = "blog" | "docs";

/**
 * Docusaurus のプラグインインスタンスひとつを表す。
 * blog / docs それぞれ複数インスタンスを持てる。
 */
export interface DocusaurusInstance {
  /** docusaurus.config.js の id (デフォルトは "default") */
  id: string;
  /** 表示ラベル */
  label: string;
  /** コンテンツプラグイン種別 */
  type: InstanceType;
  /** プロジェクトルートからの相対パス */
  path: string;
  /** コンテンツ数 */
  count: number;
}

/** 最近更新されたファイルのサマリー (ダッシュボード表示用) */
export interface RecentFile {
  /** プロジェクトルートからの相対パス */
  path: string;
  instanceId: string;
  instanceLabel: string;
  title: string | null;
  modifiedAt: string;
}

/**
 * このアプリで管理する Docusaurus プロジェクトを表す。
 * Tauri コマンド経由で読み込む。
 */
export interface Project {
  name: string;
  /** ローカルのフルパス */
  rootPath: string;
  instances: DocusaurusInstance[];
  /** プロジェクト全体のタグ数 */
  tagCount: number;
  /** 最近更新されたファイル (top 5) */
  recentFiles: RecentFile[];
}

/** インスタンス内の各 Markdown ファイルを表す */
export interface FileEntry {
  relativePath: string;
  title: string | null;
  date: string | null;
  /** ディレクトリ名 (YYYY-MM-DD-xxx) から抽出した日付 */
  dirDate: string | null;
  tags: string[];
  description: string | null;
  slug: string | null;
  authors: string[];
  modifiedAt: string;
}

// ─────────────────────────────────────────────
// .tithonion/ 設定ファイル型
// ─────────────────────────────────────────────

/** .tithonion/config.json — チーム共有設定 */
export interface TithonionConfigJson {
  /** 必須ツールとバージョン要件 e.g. { bun: ">=1.0.0" } */
  tools?: Record<string, string>;
  assets?: {
    /** アセット保存先ディレクトリ (プロジェクトルートからの相対) */
    outputDir?: string;
    /** 画像を自動で WebP 変換するか */
    autoWebp?: boolean;
  };
}

/** .tithonion/tasks.json — カスタムタスク (key: ラベル、value: シェルコマンド) */
export type TithonionTasks = Record<string, string>;

/** .tithonion/schema.json — フロントマタースキーマ */
export type TithonionSchema = Record<string, unknown>;

/** .tithonion/local.json — 個人設定 (gitignore 対象) */
export interface TithonionLocalJson {
  /** ツールのローカル絶対パス e.g. { bun: "C:/Users/me/.bun/bin/bun.exe" } */
  toolPaths?: Record<string, string>;
  /** テーマ: 'light' | 'dark' */
  theme?: 'light' | 'dark';
  [key: string]: unknown;
}

/** .tithonion/schema.json — フロントマタースキーマフィールド定義 */
export interface SchemaField {
  name: string;
  type: 'string' | 'array' | 'boolean' | 'date';
  required?: boolean;
  description?: string;
}

export type TithonionSchemaJson = SchemaField[];

/** load_project_config コマンドの戻り値 */
export interface TithonionConfig {
  config: TithonionConfigJson | null;
  tasks: TithonionTasks | null;
  schema: TithonionSchema | null;
  local: TithonionLocalJson | null;
}

// ─────────────────────────────────────────────
// プロジェクト一覧 (localStorage 管理)
// ─────────────────────────────────────────────

/** アプリが記憶しているプロジェクトエントリ */
export interface RegisteredProject {
  rootPath: string;
  /** 表示名 (package.json の name, またはユーザー編集値) */
  name: string;
  addedAt: string;
}

// ─────────────────────────────────────────────
// ルーティング
// ─────────────────────────────────────────────

/** アプリ内ルーティング */
export type AppRoute =
  | { page: "setup-projects" }
  | { page: "setup-wizard" }
  | { page: "add-project" }
  | { page: "project-settings"; project: RegisteredProject }
  | { page: "dashboard" }
  | { page: "instance-files"; instance: DocusaurusInstance };
