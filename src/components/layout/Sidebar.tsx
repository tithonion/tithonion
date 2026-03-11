import { FileEdit, LayoutDashboard, Tags, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./Sidebar.module.css";

interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "ダッシュボード", Icon: LayoutDashboard },
  { id: "editor", label: "エディタ", Icon: FileEdit, disabled: true },
  { id: "tags", label: "タグ管理", Icon: Tags, disabled: true },
  { id: "members", label: "メンバー", Icon: Users, disabled: true },
];

interface SidebarProps {
  activeItem?: string;
}

export default function Sidebar({ activeItem = "dashboard" }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>T</span>
        <span className={styles.logoText}>Tithonion</span>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ id, label, Icon, disabled }) => (
          <button
            key={id}
            className={[
              styles.navItem,
              activeItem === id ? styles.active : "",
              disabled ? styles.disabled : "",
            ].join(" ")}
            disabled={disabled}
          >
            <Icon size={15} className={styles.navIcon} />
            <span className={styles.navLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
