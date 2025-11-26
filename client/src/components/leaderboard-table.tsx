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
import { formatWeight, convertFromOunces, parseWeight } from "@shared/weight-utils";

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
        <div className="flex items-center gap-1">
          <Trophy className={`h-4 w-4 sm:h-5 sm:w-5 ${getMedalColor(position)}`} />
          <span className="font-bold text-xs sm:text-sm">{position}</span>
        </div>
      );
    }
    return <span className="font-medium text-xs sm:text-sm">{position}</span>;
  };

  const formatWeightCompact = (totalOunces: number | string) => {
    const ounces = typeof totalOunces === 'string' ? parseWeight(totalOunces) : totalOunces;
    
    if (isNaN(ounces) || ounces === 0) {
      return "0lb 0oz";
    }
    
    const { pounds, ounces: oz } = convertFromOunces(Math.round(ounces));
    return `${pounds}lb ${oz}oz`;
  };

  const formatWeightTwoRows = (totalOunces: number | string) => {
    const ounces = typeof totalOunces === 'string' ? parseWeight(totalOunces) : totalOunces;
    
    if (isNaN(ounces) || ounces === 0) {
      return { pounds: "0 lb", ounces: "0 oz" };
    }
    
    const { pounds, ounces: oz } = convertFromOunces(Math.round(ounces));
    return { pounds: `${pounds} lb`, ounces: `${oz} oz` };
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 sm:w-16 px-1 sm:px-4">Pos</TableHead>
            <TableHead className="px-1 sm:px-4">Angler</TableHead>
            <TableHead className="text-center w-10 sm:w-14 px-1 sm:px-4">Peg</TableHead>
            <TableHead className="text-right w-16 sm:w-24 px-1 sm:px-4">Weight</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const weight = formatWeightTwoRows(entry.weight);
            const weightCompact = formatWeightCompact(entry.weight);
            return (
              <TableRow
                key={`${entry.position}-${entry.pegNumber}`}
                className={`${index % 2 === 0 ? "bg-muted/30" : ""} ${
                  entry.position <= 3 ? "font-medium" : ""
                }`}
                data-testid={`row-leaderboard-${entry.position}`}
              >
                <TableCell data-testid={`text-position-${entry.position}`} className="py-2 px-1 sm:px-4">
                  {getPositionBadge(entry.position)}
                </TableCell>
                <TableCell className="py-2 px-1 sm:px-4">
                  <div className="flex items-center gap-1.5 sm:gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      <AvatarImage src={entry.anglerAvatar} className="object-cover" />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {entry.anglerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      {entry.username ? (
                        <Link href={`/profile/${entry.username}`}>
                          <div className="font-medium hover:underline cursor-pointer text-xs sm:text-base truncate max-w-[80px] sm:max-w-none" data-testid={`text-angler-${entry.position}`}>
                            {entry.anglerName}
                          </div>
                        </Link>
                      ) : (
                        <div className="font-medium text-xs sm:text-base truncate max-w-[80px] sm:max-w-none" data-testid={`text-angler-${entry.position}`}>
                          {entry.anglerName}
                        </div>
                      )}
                      {entry.club && (
                        <div className="text-[10px] sm:text-sm text-muted-foreground hidden sm:block truncate">{entry.club}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center py-2 px-1 sm:px-4">
                  <Badge variant="outline" className="font-mono text-[10px] sm:text-sm px-1.5 sm:px-2" data-testid={`badge-peg-${entry.position}`}>
                    {entry.pegNumber}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-2 px-1 sm:px-4">
                  <div className="hidden sm:flex flex-col items-end" data-testid={`text-weight-${entry.position}`}>
                    <span className="font-mono font-bold text-lg leading-tight">
                      {weight.pounds}
                    </span>
                    <span className="font-mono font-bold text-base leading-tight text-muted-foreground">
                      {weight.ounces}
                    </span>
                  </div>
                  <div className="sm:hidden font-mono font-bold text-xs leading-tight" data-testid={`text-weight-mobile-${entry.position}`}>
                    {weightCompact}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {isLive && (
        <div className="p-4 border-t flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
          Live updates enabled
        </div>
      )}
    </Card>
  );
}
