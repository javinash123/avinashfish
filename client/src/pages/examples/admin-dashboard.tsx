import { ThemeProvider } from "@/components/theme-provider";
import AdminDashboard from "../admin-dashboard";

export default function AdminDashboardExample() {
  return (
    <ThemeProvider>
      <AdminDashboard />
    </ThemeProvider>
  );
}
