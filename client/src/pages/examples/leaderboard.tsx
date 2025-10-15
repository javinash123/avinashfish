import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import Leaderboard from "../leaderboard";

export default function LeaderboardExample() {
  return (
    <ThemeProvider>
      <Header />
      <Leaderboard />
    </ThemeProvider>
  );
}
