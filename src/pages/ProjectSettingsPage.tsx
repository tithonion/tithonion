import { ArrowLeft, FileCode, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  listTemplates,
  loadProjectConfig,
  readTemplate,
  saveConfig,
  saveTemplate,
  deleteTemplate,
} from "../services/project";
import type {
  AppRoute,
  RegisteredProject,
  SchemaField,
  TithonionConfigJson,
  TithonionLocalJson,
  TithonionTasks,
} from "../types/project";
import styles from "./ProjectSettingsPage.module.css";

interface ProjectSettingsPageProps {
  project: RegisteredProject;
  onNameChange: (rootPath: string, newName: string) => void;
  navigate: (route: AppRoute) => void;
  onBack: () => void;
}

export default function ProjectSettingsPage({
  project,
  onNameChange,
  onBack,
}: ProjectSettingsPageProps) {
  const [displayName, setDisplayName] = useState(project.name);

  // config.json
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  const [tools, setTools] = useState<Record<string, string>>({});
  const [autoWebp, setAutoWebp] = useState(false);
  const [assetOutputDir, setAssetOutputDir] = useState("");
  const [tasks, setTasks] = useState<TithonionTasks>({});
  const [localToolPaths, setLocalToolPaths] = useState<Record<string, string>>({});

  // schema.json
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);

  // templates
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setConfigLoading(true);
    loadProjectConfig(project.rootPath)
      .then((cfg) => {
        if (cfg.config) {
          setTools(cfg.config.tools ?? {});
          setAutoWebp(cfg.config.assets?.autoWebp ?? false);
          setAssetOutputDir(cfg.config.assets?.outputDir ?? "");
        }
        if (cfg.tasks) {
          setTasks(cfg.tasks as TithonionTasks);
        }
        if (cfg.local) {
          const loc = cfg.local as TithonionLocalJson;
          setLocalToolPaths(loc.toolPaths ?? {});
        }
        // schema.json
        if (cfg.schema) {
          const raw = cfg.schema as unknown;
          if (Array.isArray(raw)) {
            setSchemaFields(raw as SchemaField[]);
          }
        }
      })
      .catch((e) => setConfigError(String(e)))
      .finally(() => setConfigLoading(false));

    // templates
    listTemplates(project.rootPath).then(setTemplateNames).catch(() => {});
  }, [project.rootPath]);

  async function handleLoadTemplate(name: string) {
    setTemplateLoading(true);
    setSelectedTemplate(name);
    try {
      const content = await readTemplate(project.rootPath, name);
      setTemplateContent(content);
    } catch (e) {
      setConfigError(String(e));
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleSaveTemplate() {
    if (!selectedTemplate) return;
    try {
      await saveTemplate(project.rootPath, selectedTemplate, templateContent);
    } catch (e) {
      setConfigError(String(e));
    }
  }

  async function handleCreateTemplate() {
    const name = newTemplateName.trim();
    if (!name) return;
    const filename = name.endsWith(".md") || name.endsWith(".mdx") ? name : `${name}.md`;
    try {
      await saveTemplate(project.rootPath, filename, "---\ntitle: \"\"\n---\n\n# \n");
      setTemplateNames((prev) => [...prev, filename].sort());
      setNewTemplateName("");
      setSelectedTemplate(filename);
      setTemplateContent("---\ntitle: \"\"\n---\n\n# \n");
    } catch (e) {
      setConfigError(String(e));
    }
  }

  async function handleDeleteTemplate(name: string) {
    try {
      await deleteTemplate(project.rootPath, name);
      setTemplateNames((prev) => prev.filter((n) => n !== name));
      if (selectedTemplate === name) {
        setSelectedTemplate(null);
        setTemplateContent("");
      }
    } catch (e) {
      setConfigError(String(e));
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveSuccess(false);
    setConfigError(null);
    try {
      const configJson: TithonionConfigJson = {
        tools: Object.keys(tools).length > 0 ? tools : undefined,
        assets:
          autoWebp || assetOutputDir
            ? { autoWebp: autoWebp || undefined, outputDir: assetOutputDir || undefined }
            : undefined,
      };
      const localJson: TithonionLocalJson = {
        toolPaths:
          Object.keys(localToolPaths).length > 0 ? localToolPaths : undefined,
      };
      await saveConfig(project.rootPath, "config.json", configJson);
      await saveConfig(project.rootPath, "local.json", localJson);
      await saveConfig(project.rootPath, "schema.json", schemaFields);
      onNameChange(project.rootPath, displayName.trim() || project.name);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setConfigError(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeft size={14} />
          <span>戻る</span>
        </button>
        <h1 className={styles.title}>プロジェクト設定</h1>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving || configLoading}
        >
          {saving ? (
            <Loader2 size={14} className={styles.spinIcon} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "保存中…" : saveSuccess ? "保存しました" : "保存"}
        </button>
      </header>

      {configLoading && (
        <div className={styles.loadingState}>
          <Loader2 size={20} className={styles.spinIcon} />
          設定を読み込み中…
        </div>
      )}

      {configError && (
        <p className={styles.errorMsg}>{configError}</p>
      )}

      {!configLoading && (
        <div className={styles.sections}>
          {/* 基本情報 */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>基本情報</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="displayName">
                表示名
              </label>
              <input
                id="displayName"
                className={styles.textInput}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>パス</label>
              <p className={styles.pathText}>{project.rootPath}</p>
            </div>
          </section>

          {/* アセット設定 (.tithonion/config.json) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>アセット設定 (config.json)</h2>
            <div className={styles.checkField}>
              <input
                id="autoWebp"
                type="checkbox"
                className={styles.checkbox}
                checked={autoWebp}
                onChange={(e) => setAutoWebp(e.target.checked)}
              />
              <label htmlFor="autoWebp" className={styles.checkLabel}>
                画像を WebP に自動変換する
              </label>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="outputDir">
                アセット出力先ディレクトリ
              </label>
              <input
                id="outputDir"
                className={styles.textInput}
                value={assetOutputDir}
                onChange={(e) => setAssetOutputDir(e.target.value)}
                placeholder="static/img"
              />
              <p className={styles.placeholderHint}>
                プレースホルダー→ <code>[[workspace]]</code> プロジェクトルート・
                <code>[[dir]]</code> 編集ファイルのディレクトリ・
                <code>[[file]]</code> 編集ファイルのパス（拡張子なし）
              </p>
            </div>
          </section>

          {/* カスタムタスク (.tithonion/tasks.json) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              カスタムタスク (tasks.json)
            </h2>
            <p className={styles.sectionDesc}>
              UI のショートカットとして表示されるシェルコマンドを定義します。
            </p>
            <TasksEditor tasks={tasks} onChange={setTasks} />
          </section>

          {/* 必須ツール (.tithonion/config.json の tools) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              必須ツール要件 (config.json)
            </h2>
            <p className={styles.sectionDesc}>
              チームが必要とするツールとバージョン要件を指定します。
            </p>
            <KeyValueEditor
              data={tools}
              onChange={setTools}
              keyPlaceholder="ツール名 (例: bun)"
              valuePlaceholder="バージョン要件 (例: >=1.0.0)"
            />
          </section>

          {/* ローカルパス設定 (.tithonion/local.json) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              ローカルツールパス (local.json)
            </h2>
            <p className={styles.sectionDesc}>
              個人の開発環境に依存するツールの絶対パスを設定します（gitignore
              対象）。
            </p>
            <KeyValueEditor
              data={localToolPaths}
              onChange={setLocalToolPaths}
              keyPlaceholder="ツール名 (例: bun)"
              valuePlaceholder="絶対パス (例: C:/Users/me/.bun/bin/bun.exe)"
            />
          </section>

          {/* テーマはサイドバーのトグルで切り替えます */}

          {/* フロントマタースキーマ (.tithonion/schema.json) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              フロントマタースキーマ (schema.json)
            </h2>
            <p className={styles.sectionDesc}>
              各コンテンツに必要なフロントマターフィールドを定義します。
            </p>
            <SchemaEditor fields={schemaFields} onChange={setSchemaFields} />
          </section>

          {/* テンプレート (.tithonion/templates/) */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              テンプレート (templates/)
            </h2>
            <p className={styles.sectionDesc}>
              新規ファイル作成時に使用する Markdown テンプレートを管理します。
            </p>
            <div className={styles.templateLayout}>
              <div className={styles.templateList}>
                {templateNames.map((name) => (
                  <div key={name} className={styles.templateItemRow}>
                    <button
                      className={[
                        styles.templateItem,
                        selectedTemplate === name ? styles.templateItemActive : "",
                      ].join(" ")}
                      onClick={() => handleLoadTemplate(name)}
                    >
                      <FileCode size={12} />
                      {name}
                    </button>
                    <button
                      className={styles.templateDeleteBtn}
                      onClick={() => handleDeleteTemplate(name)}
                      title="削除"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <div className={styles.templateNewRow}>
                  <input
                    className={styles.templateNameInput}
                    placeholder="新規テンプレート名"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTemplate()}
                  />
                  <button
                    className={styles.templateAddBtn}
                    onClick={handleCreateTemplate}
                    disabled={!newTemplateName.trim()}
                    title="作成"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              <div className={styles.templateEditor}>
                {selectedTemplate ? (
                  <>
                    <div className={styles.templateEditorHeader}>
                      <span className={styles.templateEditorName}>{selectedTemplate}</span>
                      <button
                        className={styles.templateSaveBtn}
                        onClick={handleSaveTemplate}
                        disabled={templateLoading}
                      >
                        <Save size={12} />
                        保存
                      </button>
                    </div>
                    <textarea
                      className={styles.templateTextarea}
                      value={templateLoading ? "読み込み中…" : templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      readOnly={templateLoading}
                      spellCheck={false}
                    />
                  </>
                ) : (
                  <div className={styles.templateEmpty}>
                    テンプレートを選択してください
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// タスクエディタ サブコンポーネント
// ─────────────────────────────────────────────

function TasksEditor({
  tasks,
  onChange,
}: {
  tasks: TithonionTasks;
  onChange: (t: TithonionTasks) => void;
}) {
  const entries = Object.entries(tasks);

  function updateKey(oldKey: string, newKey: string) {
    const next: TithonionTasks = {};
    for (const [k, v] of Object.entries(tasks)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  }

  function updateValue(key: string, value: string) {
    onChange({ ...tasks, [key]: value });
  }

  function addRow() {
    onChange({ ...tasks, "": "" });
  }

  function removeRow(key: string) {
    const next = { ...tasks };
    delete next[key];
    onChange(next);
  }

  return (
    <div className={styles.kvEditor}>
      {entries.map(([key, value], i) => (
        <div key={i} className={styles.kvRow}>
          <input
            className={styles.kvKey}
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
            placeholder="名前 (例: publish)"
          />
          <input
            className={styles.kvValue}
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder="コマンド (例: bun run build)"
          />
          <button
            className={styles.kvRemove}
            onClick={() => removeRow(key)}
            title="削除"
          >
            ×
          </button>
        </div>
      ))}
      <button className={styles.kvAdd} onClick={addRow}>
        + 追加
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// スキーマエディタ サブコンポーネント
// ─────────────────────────────────────────────

const FIELD_TYPES: SchemaField["type"][] = ["string", "array", "boolean", "date"];

function SchemaEditor({
  fields,
  onChange,
}: {
  fields: SchemaField[];
  onChange: (f: SchemaField[]) => void;
}) {
  function updateField(idx: number, patch: Partial<SchemaField>) {
    onChange(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function addField() {
    onChange([...fields, { name: "", type: "string", required: false }]);
  }

  function removeField(idx: number) {
    onChange(fields.filter((_, i) => i !== idx));
  }

  return (
    <div className={styles.schemaEditor}>
      {fields.length > 0 && (
        <div className={styles.schemaHeader}>
          <span className={styles.schemaColName}>フィールド名</span>
          <span className={styles.schemaColType}>型</span>
          <span className={styles.schemaColReq}>必須</span>
          <span className={styles.schemaColDesc}>説明</span>
        </div>
      )}
      {fields.map((field, i) => (
        <div key={i} className={styles.schemaRow}>
          <input
            className={styles.schemaInput}
            value={field.name}
            onChange={(e) => updateField(i, { name: e.target.value })}
            placeholder="例: tags"
          />
          <select
            className={styles.schemaSelect}
            value={field.type}
            onChange={(e) =>
              updateField(i, { type: e.target.value as SchemaField["type"] })
            }
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="checkbox"
            className={styles.schemaCheckbox}
            checked={field.required ?? false}
            onChange={(e) => updateField(i, { required: e.target.checked })}
          />
          <input
            className={styles.schemaDescInput}
            value={field.description ?? ""}
            onChange={(e) => updateField(i, { description: e.target.value })}
            placeholder="説明 (任意)"
          />
          <button
            className={styles.kvRemove}
            onClick={() => removeField(i)}
            title="削除"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button className={styles.kvAdd} onClick={addField}>
        + フィールド追加
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// キー・バリューエディタ サブコンポーネント
// ─────────────────────────────────────────────

function KeyValueEditor({
  data,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
}: {
  data: Record<string, string>;
  onChange: (d: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const entries = Object.entries(data);

  function updateKey(oldKey: string, newKey: string) {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      next[k === oldKey ? newKey : k] = v;
    }
    onChange(next);
  }

  function updateValue(key: string, value: string) {
    onChange({ ...data, [key]: value });
  }

  function addRow() {
    onChange({ ...data, "": "" });
  }

  function removeRow(key: string) {
    const next = { ...data };
    delete next[key];
    onChange(next);
  }

  return (
    <div className={styles.kvEditor}>
      {entries.map(([key, value], i) => (
        <div key={i} className={styles.kvRow}>
          <input
            className={styles.kvKey}
            value={key}
            onChange={(e) => updateKey(key, e.target.value)}
            placeholder={keyPlaceholder}
          />
          <input
            className={styles.kvValue}
            value={value}
            onChange={(e) => updateValue(key, e.target.value)}
            placeholder={valuePlaceholder}
          />
          <button
            className={styles.kvRemove}
            onClick={() => removeRow(key)}
            title="削除"
          >
            ×
          </button>
        </div>
      ))}
      <button className={styles.kvAdd} onClick={addRow}>
        + 追加
      </button>
    </div>
  );
}
