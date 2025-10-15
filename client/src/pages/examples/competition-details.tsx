import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import CompetitionDetails from "../competition-details";

export default function CompetitionDetailsExample() {
  return (
    <ThemeProvider>
      <Header />
      <CompetitionDetails />
    </ThemeProvider>
  );
}
