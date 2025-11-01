import { ThemeProvider } from "../theme-provider";
import { LeaderboardTable } from "../leaderboard-table";

export default function LeaderboardTableExample() {
  const mockEntries = [
    {
      position: 1,
      anglerName: "James Mitchell",
      pegNumber: 23,
      weight: "100.0 lbs",
      club: "Thames Anglers"
    },
    {
      position: 2,
      anglerName: "Sarah Thompson",
      pegNumber: 12,
      weight: "92.5 lbs",
      club: "Bristol Fishing Club"
    },
    {
      position: 3,
      anglerName: "David Brown",
      pegNumber: 8,
      weight: "86.3 lbs",
    },
    {
      position: 4,
      anglerName: "Michael Green",
      pegNumber: 31,
      weight: "81.2 lbs",
      club: "Manchester Carp"
    },
    {
      position: 5,
      anglerName: "Emma Wilson",
      pegNumber: 19,
      weight: "78.5 lbs",
    },
  ];

  return (
    <ThemeProvider>
      <div className="p-8 max-w-4xl">
        <LeaderboardTable entries={mockEntries} isLive={true} />
      </div>
    </ThemeProvider>
  );
}
