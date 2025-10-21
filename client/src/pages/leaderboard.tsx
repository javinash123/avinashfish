import { LeaderboardTable } from "@/components/leaderboard-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Competition } from "@shared/schema";

export default function Leaderboard() {
  const { data: competitionsData = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const competitions = competitionsData.map((comp) => ({
    id: comp.id,
    name: `${comp.name}${comp.status === "live" ? " - Live" : ""}`,
  }));

  const [selectedCompetition, setSelectedCompetition] = useState(
    competitions.length > 0 ? competitions[0].id : ""
  );

  useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
  }, [competitions, selectedCompetition]);

  const { data: rawLeaderboardData = [] } = useQuery<Array<{
    position: number | null;
    anglerName: string;
    username: string;
    pegNumber: number;
    weight: string;
    club: string;
  }>>({
    queryKey: [`/api/competitions/${selectedCompetition}/leaderboard`],
    enabled: !!selectedCompetition,
  });

  const leaderboardData = rawLeaderboardData.map((entry, index) => ({
    position: entry.position ?? index + 1,
    anglerName: entry.anglerName,
    username: entry.username,
    pegNumber: entry.pegNumber,
    weight: entry.weight.replace(/\s*kg\s*/gi, '').replace(/\s*lbs\s*/gi, '').trim() + ' lbs',
    club: entry.club,
  }));

  const selectedComp = competitions.find(c => c.id === selectedCompetition);
  const isLive = selectedComp?.name.includes("Live") || false;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Leaderboards</h1>
          </div>
          <p className="text-muted-foreground">
            View live standings and results from competitions
          </p>
        </div>

        <div className="mb-8">
          <Select
            value={selectedCompetition}
            onValueChange={setSelectedCompetition}
          >
            <SelectTrigger className="w-full md:w-96" data-testid="select-competition">
              <SelectValue placeholder="Select a competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <LeaderboardTable
          entries={leaderboardData}
          isLive={isLive}
        />
      </div>
    </div>
  );
}
