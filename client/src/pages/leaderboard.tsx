import { LeaderboardTable } from "@/components/leaderboard-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Competition } from "@shared/schema";
import { getCompetitionStatus } from "@/lib/uk-timezone";

export default function Leaderboard() {
  const { data: competitionsData = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const competitions = competitionsData
    .map((comp) => {
      const status = getCompetitionStatus(comp);
      return {
        id: comp.id,
        name: comp.name,
        status: status,
        date: new Date(comp.date),
      };
    })
    .filter((comp) => comp.status === "live" || comp.status === "completed")
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const [selectedCompetition, setSelectedCompetition] = useState(
    competitions.length > 0 ? competitions[0].id : ""
  );

  useEffect(() => {
    if (competitions.length > 0 && !selectedCompetition) {
      setSelectedCompetition(competitions[0].id);
    }
  }, [competitions, selectedCompetition]);

  const { data: rawLeaderboardData = [], isLoading: isLoadingLeaderboard } = useQuery<Array<{
    position: number | null;
    anglerName: string;
    username: string;
    pegNumber: number;
    weight: string;
    club: string;
    anglerAvatar?: string;
    isTeam?: boolean;
    teamId?: string;
    fishCount?: number;
  }>>({
    queryKey: [`/api/competitions/${selectedCompetition}/leaderboard`],
    enabled: !!selectedCompetition,
  });

  const leaderboardData = rawLeaderboardData.map((entry, index) => ({
    position: entry.position ?? index + 1,
    anglerName: entry.anglerName,
    username: entry.username,
    anglerAvatar: entry.anglerAvatar,
    pegNumber: entry.pegNumber,
    weight: entry.weight,
    club: entry.club,
    isTeam: entry.isTeam,
    teamId: entry.teamId,
    fishCount: entry.fishCount,
  }));

  if (isLoadingLeaderboard) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedComp = competitions.find(c => c.id === selectedCompetition);
  const isLive = selectedComp?.status === "live";

  const getStatusBadge = (status: string) => {
    if (status === "live") {
      return (
        <Badge variant="default" className="bg-chart-4 hover:bg-chart-4 ml-2">
          Live
        </Badge>
      );
    }
    if (status === "completed") {
      return (
        <Badge variant="secondary" className="ml-2">
          Completed
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Leaderboards</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
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
                  <div className="flex items-center justify-between w-full">
                    <span>{comp.name}</span>
                    {getStatusBadge(comp.status)}
                  </div>
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
