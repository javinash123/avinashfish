import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CompetitionCard } from "@/components/competition-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { HeroSlider } from "@/components/hero-slider";
import { ArrowRight, Trophy, Users, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Competition } from "@shared/schema";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { data: competitionsData = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  // Helper function to compute competition status based on date and time
  const getCompetitionStatus = (comp: Competition): "upcoming" | "live" | "completed" => {
    const now = new Date();
    const compDate = new Date(comp.date);
    const compStartTime = comp.time ? new Date(`${comp.date}T${comp.time}`) : compDate;
    
    // If no end time specified, assume competition ends at end of day (23:59:59)
    let compEndTime: Date;
    if (comp.endTime) {
      compEndTime = new Date(`${comp.date}T${comp.endTime}`);
    } else {
      // Set to end of day (23:59:59)
      compEndTime = new Date(comp.date);
      compEndTime.setHours(23, 59, 59, 999);
    }
    
    // If current time is after end time, it's completed
    if (now > compEndTime) {
      return "completed";
    }
    
    // If current time is between start and end time, it's live
    if (now >= compStartTime && now <= compEndTime) {
      return "live";
    }
    
    // Otherwise, it's upcoming
    return "upcoming";
  };

  // Filter upcoming competitions - only show if start time is in the future
  const upcomingCompetitions = competitionsData
    .filter((comp) => {
      const now = new Date();
      const compStartTime = comp.time ? new Date(`${comp.date}T${comp.time}`) : new Date(comp.date);
      return now < compStartTime; // Only show competitions that haven't started yet
    })
    .slice(0, 3)
    .map((comp) => ({
      id: comp.id,
      name: comp.name,
      date: format(new Date(comp.date), "do MMMM yyyy"),
      venue: comp.venue,
      pegsTotal: comp.pegsTotal,
      pegsAvailable: comp.pegsTotal - comp.pegsBooked,
      entryFee: `£${comp.entryFee}`,
      prizePool: `£${comp.prizePool}`,
      status: "upcoming" as const,
      imageUrl: comp.imageUrl || undefined,
    }));

  // Get all live competitions
  const liveCompetitions = competitionsData.filter((comp) => getCompetitionStatus(comp) === "live");

  // State for selected live competition
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");

  // Update selected competition when live competitions change
  useEffect(() => {
    if (liveCompetitions.length > 0) {
      // If no selection or current selection is not in the live list, select the first one
      const isCurrentSelectionValid = liveCompetitions.some(comp => comp.id === selectedCompetitionId);
      if (!selectedCompetitionId || !isCurrentSelectionValid) {
        setSelectedCompetitionId(liveCompetitions[0].id);
      }
    } else {
      // Clear selection when no live competitions
      setSelectedCompetitionId("");
    }
  }, [liveCompetitions]);

  const { data: rawLeaderboardData = [] } = useQuery<Array<{
    position: number | null;
    anglerName: string;
    username: string;
    pegNumber: number;
    weight: string;
    club: string;
  }>>({
    queryKey: [`/api/competitions/${selectedCompetitionId}/leaderboard`],
    enabled: !!selectedCompetitionId && liveCompetitions.length > 0,
  });

  const liveLeaderboard = rawLeaderboardData.slice(0, 5).map((entry, index) => ({
    position: entry.position ?? index + 1,
    anglerName: entry.anglerName,
    username: entry.username,
    pegNumber: entry.pegNumber,
    weight: entry.weight.replace(/\s*kg\s*/gi, '').replace(/\s*lbs\s*/gi, '').trim() + ' lbs',
    club: entry.club,
  }));

  return (
    <div className="min-h-screen">
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <HeroSlider />
        
        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6" data-testid="text-hero-title">
            UK's Premier Fishing Competitions
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join the action. Book your peg. Compete for glory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/competitions">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 border-white"
                data-testid="button-hero-book-peg"
              >
                Book a Peg
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-sm bg-white/20 border-white/40 text-white hover:bg-white/30"
                data-testid="button-hero-leaderboard"
              >
                View Leaderboards
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Upcoming Competitions</h2>
            <p className="text-muted-foreground">
              Book your spot in the next big match
            </p>
          </div>
          <Link href="/competitions">
            <Button variant="outline" data-testid="button-view-all-competitions">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingCompetitions.map((comp) => (
            <CompetitionCard key={comp.id} {...comp} />
          ))}
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Live Leaderboard</h2>
              <p className="text-muted-foreground">
                Current standings from today's competitions
              </p>
            </div>
            <Link href="/leaderboard">
              <Button variant="outline" data-testid="button-view-full-leaderboard">
                View Full Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {liveCompetitions.length > 0 ? (
            <>
              {liveCompetitions.length > 1 && (
                <div className="mb-6">
                  <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
                    <SelectTrigger className="w-full md:w-[400px]" data-testid="select-live-competition">
                      <SelectValue placeholder="Select a live competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {liveCompetitions.map((comp) => (
                        <SelectItem key={comp.id} value={comp.id}>
                          {comp.name} - {comp.venue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <LeaderboardTable entries={liveLeaderboard} isLive={true} />
            </>
          ) : (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No live competitions at the moment</p>
                <p className="text-sm mt-2">Check back later or view upcoming competitions</p>
              </div>
            </Card>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3 mb-16">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                <Trophy className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Competitive Events</h3>
              <p className="text-muted-foreground">
                From qualifiers to finals, experience the thrill of match fishing
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-chart-2/10 text-chart-2 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Join the Community</h3>
              <p className="text-muted-foreground">
                Connect with anglers across the UK and build your reputation
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-chart-3/10 text-chart-3 mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Booking</h3>
              <p className="text-muted-foreground">
                Secure your peg online with instant confirmation
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the Competition?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Create your angler profile and start booking today
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              data-testid="button-cta-register"
            >
              Register Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
