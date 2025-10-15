import { ThemeProvider } from "@/components/theme-provider";
import Login from "../login";

export default function LoginExample() {
  return (
    <ThemeProvider>
      <Login />
    </ThemeProvider>
  );
}
