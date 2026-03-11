import Card from "./Card";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: number | string;
  sub?: string;
}

export default function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <Card>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </Card>
  );
}
