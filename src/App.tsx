import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <AppLayout activeNav="dashboard">
      <Dashboard />
    </AppLayout>
  );
}

export default App;
