import { invoke } from "@tauri-apps/api/core";
import type {
  FileEntry,
  Project,
  TithonionConfig,
  TithonionConfigJson,
  TithonionLocalJson,
} from "../types/project";

// ─────────────────────────────────────────────
// ダイアログ
// ─────────────────────────────────────────────

/** フォルダ選択ダイアログを開いてパスを返す */
export function pickProjectFolder(): Promise<string | null> {
  return invoke<string | null>("pick_project_folder");
}

// ─────────────────────────────────────────────
// プロジェクト
// ─────────────────────────────────────────────

/** Docusaurus プロジェクトをスキャンして ProjectInfo を返す */
export function loadProject(rootPath: string): Promise<Project> {
  return invoke<Project>("load_project", { rootPath });
}

/** 指定インスタンス配下のファイル一覧を返す */
export function listInstanceFiles(
  rootPath: string,
  instancePath: string
): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("list_instance_files", { rootPath, instancePath });
}

// ─────────────────────────────────────────────
// .tithonion/ 設定ファイル
// ─────────────────────────────────────────────

/** `.tithonion/` 配下の設定ファイルをまとめて読み込む */
export function loadProjectConfig(rootPath: string): Promise<TithonionConfig> {
  return invoke<TithonionConfig>("load_project_config", { rootPath });
}

export type SaveConfigFilename = "config.json" | "local.json" | "schema.json";

/** `.tithonion/*.json` を保存する */
export function saveConfig(
  rootPath: string,
  filename: SaveConfigFilename,
  data: TithonionConfigJson | TithonionLocalJson | unknown
): Promise<void> {
  return invoke<void>("save_config", { rootPath, filename, data });
}

/** `.tithonion/templates/` のファイル名一覧を返す */
export function listTemplates(rootPath: string): Promise<string[]> {
  return invoke<string[]>("list_templates", { rootPath });
}

/** テンプレートの内容を読み込む */
export function readTemplate(rootPath: string, name: string): Promise<string> {
  return invoke<string>("read_template", { rootPath, name });
}

/** テンプレートを保存する */
export function saveTemplate(
  rootPath: string,
  name: string,
  content: string
): Promise<void> {
  return invoke<void>("save_template", { rootPath, name, content });
}

/** テンプレートを削除する */
export function deleteTemplate(rootPath: string, name: string): Promise<void> {
  return invoke<void>("delete_template", { rootPath, name });
}

// ─────────────────────────────────────────────
// アセットパス解決
// ─────────────────────────────────────────────

/**
 * アセット出力先ディレクトリのプレースホルダーを展開する。
 * [[workspace]] → プロジェクトルート
 * [[dir]]       → 編集中ファイルのディレクトリ
 * [[file]]      → 編集中ファイルのパス（拡張子なし）
 */
export function resolveAssetOutputDir(
  template: string,
  context: { workspace: string; dir?: string; file?: string }
): string {
  return template
    .replace(/\[\[workspace\]\]/g, context.workspace)
    .replace(/\[\[dir\]\]/g, context.dir ?? context.workspace)
    .replace(/\[\[file\]\]/g, context.file ?? "");
}

// ─────────────────────────────────────────────
// セットアップ
// ─────────────────────────────────────────────

/**
 * 指定ツールが PATH 上に存在するか確認し、バージョン文字列を返す。
 * 見つからない場合は `null`。
 */
export function checkTool(name: string): Promise<string | null> {
  return invoke<string | null>("check_tool", { name });
}
