import { ThemeProvider } from "../theme-provider";
import { LeaderboardTable } from "../leaderboard-table";

export default function LeaderboardTableExample() {
  const mockEntries = [
    {
      position: 1,
      anglerName: "James Mitchell",
      pegNumber: 23,
      weight: "45.8 kg",
      club: "Thames Anglers"
    },
    {
      position: 2,
      anglerName: "Sarah Thompson",
      pegNumber: 12,
      weight: "42.3 kg",
      club: "Bristol Fishing Club"
    },
    {
      position: 3,
      anglerName: "David Brown",
      pegNumber: 8,
      weight: "39.5 kg",
    },
    {
      position: 4,
      anglerName: "Michael Green",
      pegNumber: 31,
      weight: "37.2 kg",
      club: "Manchester Carp"
    },
    {
      position: 5,
      anglerName: "Emma Wilson",
      pegNumber: 19,
      weight: "35.9 kg",
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
