import styles from "./Card.module.css";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className, title }: CardProps) {
  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
        </div>
      )}
      <div className={styles.cardBody}>{children}</div>
    </div>
  );
}
