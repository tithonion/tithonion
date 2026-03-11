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
  /** 公開記事・ページ数 */
  publishedCount: number;
  /** 下書き数 */
  draftCount: number;
}

/**
 * このアプリで管理する Docusaurus プロジェクトを表す。
 * 後で Tauri コマンド経由で読み込む。
 */
export interface Project {
  name: string;
  /** ローカルのフルパス */
  rootPath: string;
  instances: DocusaurusInstance[];
  /** プロジェクト全体のタグ数 */
  tagCount: number;
}
