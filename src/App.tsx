import { useCallback, useEffect, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import InstanceFilesPage from "./pages/InstanceFilesPage";
import AddProjectPage from "./pages/AddProjectPage";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import SetupOverlayPage from "./pages/SetupOverlayPage";
import SetupProjectsPage from "./pages/SetupProjectsPage";
import type {
  AppRoute,
  Project,
  RegisteredProject,
} from "./types/project";

const STORAGE_KEY = "tithonion-projects";
const THEME_KEY = "tithonion-theme";

type AppTheme = "light" | "dark";

function loadStoredProjects(): RegisteredProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RegisteredProject[];
  } catch {
    return [];
  }
}

function saveStoredProjects(projects: RegisteredProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function loadStoredTheme(): AppTheme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

function applyTheme(theme: AppTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function App() {
  const [projects, setProjects] = useState<RegisteredProject[]>(loadStoredProjects);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [route, setRoute] = useState<AppRoute>({ page: "setup-projects" });
  const [theme, setTheme] = useState<AppTheme>(loadStoredTheme);

  const navigate = useCallback((r: AppRoute) => setRoute(r), []);

  // テーマ変更: CSS data-theme を適用
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // projects が変わったら localStorage に保存
  useEffect(() => {
    saveStoredProjects(projects);
  }, [projects]);

  const handleOpenProject = (p: Project, reg: RegisteredProject) => {
    setCurrentProject(p);
    // 一覧に未登録なら追加
    setProjects((prev) => {
      if (prev.some((x) => x.rootPath === reg.rootPath)) return prev;
      return [...prev, reg];
    });
    navigate({ page: "dashboard" });
  };

  const handleAddProject = (p: Project, reg: RegisteredProject) => {
    setProjects((prev) => {
      const filtered = prev.filter((x) => x.rootPath !== reg.rootPath);
      return [...filtered, reg];
    });
    setCurrentProject(p);
    navigate({ page: "dashboard" });
  };

  const handleRemoveProject = (rootPath: string) => {
    setProjects((prev) => prev.filter((x) => x.rootPath !== rootPath));
    if (currentProject?.rootPath === rootPath) {
      setCurrentProject(null);
      navigate({ page: "setup-projects" });
    }
  };

  const handleNameChange = (rootPath: string, newName: string) => {
    setProjects((prev) =>
      prev.map((x) => (x.rootPath === rootPath ? { ...x, name: newName } : x))
    );
  };

  const handleSetProject = (p: Project) => {
    setCurrentProject(p);
    navigate({ page: "dashboard" });
  };

  // サイドバーのアクティブアイテム
  function getActiveNav(): string {
    const p = route.page;
    if (p === "dashboard" || p === "instance-files") return "dashboard";
    if (p === "setup-projects" || p === "add-project" || p === "project-settings") return "setup-projects";
    if (p === "setup-wizard") return "setup-wizard";
    return p;
  }
  const activeNav = getActiveNav();

  const handleNavClick = (id: string) => {
    if (id === "dashboard" && currentProject) navigate({ page: "dashboard" });
    if (id === "setup-projects") navigate({ page: "setup-projects" });
    if (id === "setup-wizard") navigate({ page: "setup-wizard" });
  };

  return (
    <AppLayout
      activeNav={activeNav}
      onNavClick={handleNavClick}
      hasProject={currentProject !== null}
      currentTheme={theme}
      onThemeChange={setTheme}
    >
      {route.page === "setup-projects" && (
        <SetupProjectsPage
          projects={projects}
          onOpenProject={handleOpenProject}
          onRemoveProject={handleRemoveProject}
          navigate={navigate}
        />
      )}
      {route.page === "setup-wizard" && (
        <SetupOverlayPage
          rootPath={currentProject?.rootPath}
          navigate={navigate}
          onBack={() => navigate({ page: "setup-projects" })}
        />
      )}
      {route.page === "add-project" && (
        <AddProjectPage
          onAdd={handleAddProject}
          navigate={navigate}
          onBack={() => navigate({ page: "setup-projects" })}
        />
      )}
      {route.page === "project-settings" && (
        <ProjectSettingsPage
          project={route.project}
          onNameChange={handleNameChange}
          navigate={navigate}
          onBack={() => navigate({ page: "setup-projects" })}
        />
      )}
      {route.page === "dashboard" && (
        <Dashboard
          project={currentProject}
          setProject={handleSetProject}
          navigate={navigate}
        />
      )}
      {route.page === "instance-files" && currentProject && (
        <InstanceFilesPage
          project={currentProject}
          instance={route.instance}
          onBack={() => navigate({ page: "dashboard" })}
        />
      )}
    </AppLayout>
  );
}

export default App;

