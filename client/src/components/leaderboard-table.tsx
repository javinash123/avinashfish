import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { Link } from "wouter";
import { formatWeight } from "@shared/weight-utils";

interface LeaderboardEntry {
  position: number;
  anglerName: string;
  username?: string;
  anglerAvatar?: string;
  pegNumber: number;
  weight: string;
  club?: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLive?: boolean;
}

export function LeaderboardTable({ entries, isLive = false }: LeaderboardTableProps) {
  const getMedalColor = (position: number) => {
    if (position === 1) return "text-chart-3";
    if (position === 2) return "text-muted-foreground";
    if (position === 3) return "text-chart-4";
    return "";
  };

  const getPositionBadge = (position: number) => {
    if (position <= 3) {
      return (
        <div className="flex items-center gap-2">
          <Trophy className={`h-5 w-5 ${getMedalColor(position)}`} />
          <span className="font-bold">{position}</span>
        </div>
      );
    }
    return <span className="font-medium">{position}</span>;
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Position</TableHead>
              <TableHead>Angler</TableHead>
              <TableHead className="text-center">Peg</TableHead>
              <TableHead className="text-right">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow
                key={`${entry.position}-${entry.pegNumber}`}
                className={`${index % 2 === 0 ? "bg-muted/30" : ""} ${
                  entry.position <= 3 ? "font-medium" : ""
                }`}
                data-testid={`row-leaderboard-${entry.position}`}
              >
                <TableCell data-testid={`text-position-${entry.position}`}>
                  {getPositionBadge(entry.position)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={entry.anglerAvatar} />
                      <AvatarFallback>
                        {entry.anglerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {entry.username ? (
                        <Link href={`/profile/${entry.username}`}>
                          <div className="font-medium hover:underline cursor-pointer" data-testid={`text-angler-${entry.position}`}>
                            {entry.anglerName}
                          </div>
                        </Link>
                      ) : (
                        <div className="font-medium" data-testid={`text-angler-${entry.position}`}>
                          {entry.anglerName}
                        </div>
                      )}
                      {entry.club && (
                        <div className="text-sm text-muted-foreground">{entry.club}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono" data-testid={`badge-peg-${entry.position}`}>
                    {entry.pegNumber}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-bold text-lg" data-testid={`text-weight-${entry.position}`}>
                    {formatWeight(entry.weight)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {isLive && (
        <div className="p-4 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
          Live updates enabled
        </div>
      )}
    </Card>
  );
}
