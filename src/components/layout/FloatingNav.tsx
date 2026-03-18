import { useState, useRef, useEffect } from "react";
import { FolderKanban, LayoutDashboard, Moon, Sun, Menu } from "lucide-react";
import styles from "./FloatingNav.module.css";

interface FloatingNavProps {
  activeItem?: string;
  onNavClick?: (id: string) => void;
  hasProject?: boolean;
  currentTheme?: "light" | "dark";
  onThemeChange?: (theme: "light" | "dark") => void;
}

export default function FloatingNav({ activeItem = "setup-projects", onNavClick, hasProject, currentTheme = "light", onThemeChange }: FloatingNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // 画面外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.floatingNav} ref={navRef}>
      <button
        className={`${styles.toggleBtn} ${isOpen ? styles.activeToggle : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        <Menu size={22} className={isOpen ? styles.iconOpen : styles.iconClosed} />
      </button>

      <div className={`${styles.menuContainer} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.menuItems}>
          <button
            className={`${styles.navBtn} ${activeItem === "setup-projects" ? styles.active : ""}`}
            onClick={() => {
              onNavClick?.("setup-projects");
              setIsOpen(false);
            }}
            title="プロジェクト管理"
          >
            <FolderKanban size={18} />
          </button>

          {hasProject && (
            <button
              className={`${styles.navBtn} ${activeItem === "dashboard" ? styles.active : ""}`}
              onClick={() => {
                onNavClick?.("dashboard");
                setIsOpen(false);
              }}
              title="ダッシュボード"
            >
              <LayoutDashboard size={18} />
            </button>
          )}

          <div className={styles.divider} />

          <button
            className={styles.navBtn}
            onClick={() => onThemeChange?.(currentTheme === "light" ? "dark" : "light")}
            title={currentTheme === "light" ? "ダークモードに切り替え" : "ライトモードに切り替え"}
          >
            {/* 現在のテーマのアイコンを表示（lightならSun, darkならMoon） */}
            {currentTheme === "light" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
