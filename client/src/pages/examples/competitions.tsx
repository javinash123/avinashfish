import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Competitions from "../competitions";

export default function CompetitionsExample() {
  return (
    <ThemeProvider>
      <Header />
      <Competitions />
    </ThemeProvider>
  );
}
