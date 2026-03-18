import { useState, useCallback, useEffect, useRef } from "react";
import { FolderKanban, LayoutDashboard, Moon, Sun, ChevronLeft } from "lucide-react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeItem?: string;
  onNavClick?: (id: string) => void;
  hasProject?: boolean;
  currentTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

export default function Sidebar({ activeItem = "setup-projects", onNavClick, hasProject, currentTheme = "light", onThemeChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(216);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setWidth(newWidth);
        setIsCollapsed(false);
      } else if (newWidth <= 150) {
        setIsCollapsed(true);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const currentWidth = isCollapsed ? 64 : width;

  return (
    <aside
      ref={sidebarRef}
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}
      style={{ width: currentWidth, minWidth: currentWidth }}
    >
      <div className={styles.resizer} onMouseDown={startResizing} />
      
      <button 
        className={styles.toggleBtn} 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
      >
        <ChevronLeft size={14} className={styles.toggleIcon} />
      </button>

      <nav className={styles.nav}>
        <button
          className={[styles.navItem, activeItem === "setup-projects" ? styles.active : ""].join(" ")}
          onClick={() => onNavClick?.("setup-projects")}
        >
          <FolderKanban size={15} className={styles.navIcon} />
          <span className={styles.navLabel}>プロジェクト</span>
        </button>

        {hasProject && (
          <button
            className={[styles.navItem, activeItem === "dashboard" ? styles.active : ""].join(" ")}
            onClick={() => onNavClick?.("dashboard")}
          >
            <LayoutDashboard size={15} className={styles.navIcon} />
            <span className={styles.navLabel}>ダッシュボード</span>
          </button>
        )}

        <div className={styles.navFooter}>
          <button
            className={styles.themeToggleBtn}
            onClick={() => onThemeChange?.(currentTheme === "light" ? "dark" : "light")}
            title={currentTheme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
          >
            {currentTheme === "light" ? (
              <Moon size={15} className={styles.navIcon} />
            ) : (
              <Sun size={15} className={styles.navIcon} />
            )}
            <span className={styles.navLabel}>
              {currentTheme === "light" ? "ダーク" : "ライト"}
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
