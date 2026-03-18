import { BookOpen, FileText } from "lucide-react";
import type { DocusaurusInstance } from "../../types/project";
import styles from "./InstanceCard.module.css";

interface InstanceCardProps {
  instance: DocusaurusInstance;
  onClick?: () => void;
}

const TYPE_META = {
  blog: { label: "Blog", Icon: FileText },
  docs: { label: "Docs", Icon: BookOpen },
} as const;

export default function InstanceCard({ instance, onClick }: InstanceCardProps) {
  const { label: typeLabel, Icon } = TYPE_META[instance.type];

  return (
    <div
      className={[styles.card, onClick ? styles.cardClickable : ""].join(" ")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon size={16} />
        </div>
        <div className={styles.meta}>
          <span className={styles.label}>{instance.label}</span>
          <span className={styles.typeBadge}>{typeLabel}</span>
        </div>
      </div>

      {/* パス */}
      <div className={styles.path}>{instance.path}</div>

      {/* 統計 */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{instance.count}</span>
          <span className={styles.statLabel}>コンテンツ数</span>
        </div>
      </div>
    </div>
  );
}
