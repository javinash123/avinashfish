import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Coins } from "lucide-react";
import { Link } from "wouter";

interface CompetitionCardProps {
  id: string;
  name: string;
  date: string;
  venue: string;
  pegsTotal: number;
  pegsAvailable: number;
  entryFee: string;
  prizePool?: string;
  prizeType?: string;
  status: "upcoming" | "live" | "completed";
  imageUrl?: string;
  thumbnailUrl?: string;
  thumbnailUrlMd?: string;
  thumbnailUrlLg?: string;
}

export function CompetitionCard({
  id,
  name,
  date,
  venue,
  pegsTotal,
  pegsAvailable,
  entryFee,
  prizePool,
  prizeType = "pool",
  status,
  imageUrl,
  thumbnailUrl,
  thumbnailUrlMd,
  thumbnailUrlLg,
}: CompetitionCardProps) {
  const displayImage = thumbnailUrlMd || thumbnailUrl || imageUrl;
  const statusColors = {
    upcoming: "bg-accent text-accent-foreground",
    live: "bg-chart-4 text-white animate-pulse",
    completed: "bg-muted text-muted-foreground",
  };

  const statusLabels = {
    upcoming: "Upcoming",
    live: "Live Now",
    completed: "Completed",
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-competition-${name}`}>
      <div className="relative w-full bg-gradient-to-br from-primary/20 to-chart-2/20 overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16 / 9' }}>
        {displayImage ? (
          <picture>
            {thumbnailUrlLg && (
              <source media="(min-width: 1024px)" srcSet={thumbnailUrlLg} type="image/webp" />
            )}
            {thumbnailUrlMd && (
              <source media="(min-width: 640px)" srcSet={thumbnailUrlMd} type="image/webp" />
            )}
            {thumbnailUrl && (
              <source srcSet={thumbnailUrl} type="image/webp" />
            )}
            <img 
              src={displayImage} 
              alt={name} 
              className="w-full h-full object-cover object-center" 
              loading="lazy"
            />
          </picture>
        ) : (
          <div className="flex items-center justify-center">
            <div className="text-primary/20">
              <MapPin className="h-20 w-20" />
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className={statusColors[status]} data-testid={`badge-status-${status}`}>
            {statusLabels[status]}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <h3 className="text-xl font-bold line-clamp-1" data-testid="text-competition-name">{name}</h3>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span data-testid="text-date">{date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1" data-testid="text-venue">{venue}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span data-testid="text-pegs">
            {pegsAvailable} / {pegsTotal} pegs available
          </span>
        </div>
        {prizePool && prizeType !== "other" && (
          <div className="flex items-center gap-2 text-sm font-medium text-chart-3">
            <Coins className="h-4 w-4" />
            <span data-testid="text-prize-pool">
              £{prizePool} Prize Pool
            </span>
          </div>
        )}
        {prizePool && prizeType === "other" && (
          <div className="flex items-center gap-2 text-sm font-medium text-chart-3">
            <Coins className="h-4 w-4" />
            <span data-testid="text-prize-pool">
              {prizePool}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-3">
        <div className="text-lg font-bold" data-testid="text-entry-fee">£{entryFee}</div>
        <Link href={`/competition/${id}`} asChild>
          <Button
            variant={status === "live" ? "default" : "secondary"}
            data-testid="button-view-details"
          >
            {status === "completed" ? "View Results" : pegsAvailable === 0 ? "Sold Out" : "View Details"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
