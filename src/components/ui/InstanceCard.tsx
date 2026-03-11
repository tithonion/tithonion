import * as Progress from "@radix-ui/react-progress";
import { BookOpen, FileText } from "lucide-react";
import type { DocusaurusInstance } from "../../types/project";
import Badge from "../ui/Badge";
import styles from "./InstanceCard.module.css";

interface InstanceCardProps {
  instance: DocusaurusInstance;
}

const TYPE_META = {
  blog: { label: "Blog", Icon: FileText },
  docs: { label: "Docs", Icon: BookOpen },
} as const;

export default function InstanceCard({ instance }: InstanceCardProps) {
  const { label: typeLabel, Icon } = TYPE_META[instance.type];
  const total = instance.publishedCount + instance.draftCount;
  const publishedPct = total > 0 ? Math.round((instance.publishedCount / total) * 100) : 0;

  return (
    <div className={styles.card}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon size={16} />
        </div>
        <div className={styles.meta}>
          <span className={styles.label}>{instance.label}</span>
          <span className={styles.typeBadge}>{typeLabel}</span>
        </div>
        {instance.draftCount > 0 && (
          <Badge variant="warning">{instance.draftCount} 下書き</Badge>
        )}
      </div>

      {/* パス */}
      <div className={styles.path}>{instance.path}</div>

      {/* 統計 */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{total}</span>
          <span className={styles.statLabel}>総コンテンツ</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{instance.publishedCount}</span>
          <span className={styles.statLabel}>公開中</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{instance.draftCount}</span>
          <span className={styles.statLabel}>下書き</span>
        </div>
      </div>

      {/* プログレスバー */}
      <Progress.Root
        className={styles.progressBar}
        value={publishedPct}
        max={100}
      >
        <Progress.Indicator
          className={styles.progressFill}
          style={{ transform: `translateX(-${100 - publishedPct}%)` }}
        />
      </Progress.Root>
      <div className={styles.progressLabel}>{publishedPct}% 公開済み</div>
    </div>
  );
}
