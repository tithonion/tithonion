import Sidebar from "./Sidebar";
import styles from "./AppLayout.module.css";

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
}

export default function AppLayout({ children, activeNav }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <Sidebar activeItem={activeNav} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
