import { CompetitionCard } from "@/components/competition-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Competition } from "@shared/schema";
import { format } from "date-fns";
import { getCompetitionStatus } from "@/lib/uk-timezone";

export default function Competitions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: competitionsData = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const competitions = competitionsData.map((comp) => ({
    id: comp.id,
    name: comp.name,
    date: format(new Date(comp.date), "do MMMM yyyy"),
    venue: comp.venue,
    pegsTotal: comp.pegsTotal,
    pegsAvailable: comp.pegsTotal - comp.pegsBooked,
    entryFee: comp.entryFee,
    prizePool: comp.prizePool,
    prizeType: comp.prizeType || "pool",
    status: getCompetitionStatus(comp),
    imageUrl: comp.imageUrl || undefined,
    thumbnailUrl: (comp as any).thumbnailUrl || undefined,
    thumbnailUrlMd: (comp as any).thumbnailUrlMd || undefined,
    thumbnailUrlLg: (comp as any).thumbnailUrlLg || undefined,
  }));

  const filteredCompetitions = competitions.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.venue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || comp.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const statusOrder: Record<string, number> = {
      live: 0,
      upcoming: 1,
      completed: 2
    };
    
    // Sort by status priority first
    const orderA = statusOrder[a.status] ?? 3;
    const orderB = statusOrder[b.status] ?? 3;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // If same status, sort by date (newest first for live/upcoming, newest first for completed too)
    const dateA = new Date(competitionsData.find(c => c.id === a.id)?.date || 0).getTime();
    const dateB = new Date(competitionsData.find(c => c.id === b.id)?.date || 0).getTime();
    
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Competitions</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Browse and book upcoming fishing competitions
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitions or venues..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-competitions"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Competitions</SelectItem>
              <SelectItem value="live">Live Now</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredCompetitions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompetitions.map((comp) => (
              <CompetitionCard key={comp.id} {...comp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No competitions found matching your filters
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
