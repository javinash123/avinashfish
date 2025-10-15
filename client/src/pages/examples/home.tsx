import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Home from "../home";

export default function HomeExample() {
  return (
    <ThemeProvider>
      <Header />
      <Home />
    </ThemeProvider>
  );
}
