import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import About from "../about";

export default function AboutExample() {
  return (
    <ThemeProvider>
      <Header />
      <About />
    </ThemeProvider>
  );
}
