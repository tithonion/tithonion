import styles from "./AppLayout.module.css";
import FloatingNav from "./FloatingNav";

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavClick?: (id: string) => void;
  hasProject?: boolean;
  currentTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

export default function AppLayout({ children, activeNav, onNavClick, hasProject, currentTheme, onThemeChange }: AppLayoutProps) {
  return (
    <div className={styles.layout}>
      <FloatingNav
        activeItem={activeNav}
        onNavClick={onNavClick}
        hasProject={hasProject}
        currentTheme={currentTheme}
        onThemeChange={onThemeChange}
      />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
