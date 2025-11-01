import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompetitionCard } from "@/components/competition-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { HeroSlider } from "@/components/hero-slider";
import { ArrowRight, Trophy, Users, Calendar, Newspaper, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Competition, News, GalleryImage } from "@shared/schema";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { getCompetitionStatus } from "@/lib/uk-timezone";

export default function Home() {
  const { data: competitionsData = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const { data: featuredNews = [] } = useQuery<News[]>({
    queryKey: ["/api/news/featured"],
  });

  const { data: featuredGallery = [] } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery/featured"],
  });

  // Filter upcoming competitions - only show if status is upcoming
  const upcomingCompetitions = competitionsData
    .filter((comp) => getCompetitionStatus(comp) === "upcoming")
    .slice(0, 3)
    .map((comp) => ({
      id: comp.id,
      name: comp.name,
      date: format(new Date(comp.date), "do MMMM yyyy"),
      venue: comp.venue,
      pegsTotal: comp.pegsTotal,
      pegsAvailable: comp.pegsTotal - comp.pegsBooked,
      entryFee: `£${comp.entryFee}`,
      prizePool: (comp.prizeType === "pool" || !comp.prizeType) ? `£${comp.prizePool}` : comp.prizePool,
      prizeType: comp.prizeType || "pool",
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
    weight: entry.weight,
    club: entry.club,
  }));

  return (
    <div className="min-h-screen">
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <HeroSlider />
        
        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6" data-testid="text-hero-title">
            UK's Premier Fishing Competitions
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join the action. Book your peg. Compete for glory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/competitions" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 border-white w-full"
                data-testid="button-hero-book-peg"
              >
                Book a Peg
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/leaderboard" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="backdrop-blur-sm bg-white/20 border-white/40 text-white hover:bg-white/30 w-full"
                data-testid="button-hero-leaderboard"
              >
                View Leaderboards
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Upcoming Competitions</h2>
            <p className="text-muted-foreground">
              Book your spot in the next big match
            </p>
          </div>
          <Link href="/competitions">
            <Button variant="outline" data-testid="button-view-all-competitions" className="w-full sm:w-auto">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Live Leaderboard</h2>
              <p className="text-muted-foreground">
                Current standings from today's competitions
              </p>
            </div>
            <Link href="/leaderboard">
              <Button variant="outline" data-testid="button-view-full-leaderboard" className="w-full sm:w-auto">
                View Full Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          {liveCompetitions.length > 0 ? (
            <>
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

      {featuredNews.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold">Featured News</h2>
              </div>
              <Link href="/news">
                <Button variant="outline" data-testid="button-view-all-news">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredNews.slice(0, 3).map((news) => (
                <Card key={news.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full" data-testid={`card-news-${news.id}`}>
                  {news.image && (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {format(new Date(news.date), "dd MMM yyyy")}
                      </div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{news.title}</h3>
                      <p className="text-muted-foreground line-clamp-3">{news.excerpt}</p>
                    </div>
                    <Link href={`/news/${news.id}`} className="mt-auto">
                      <Button variant="ghost" size="sm" data-testid={`button-read-more-${news.id}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredGallery.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold">Featured Gallery</h2>
              </div>
              <Link href="/gallery">
                <Button variant="outline" data-testid="button-view-all-gallery">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredGallery.slice(0, 4).map((image) => (
                <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow h-full" data-testid={`card-gallery-${image.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={image.urls[0]}
                      alt={image.title}
                      className="w-full h-full object-cover"
                    />
                    {image.urls.length > 1 && (
                      <div className="absolute bottom-2 left-2">
                        <Badge variant="secondary" className="bg-black/70 text-white">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {image.urls.length} images
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div>
                      <h3 className="font-bold line-clamp-1">{image.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                      {image.weight && (
                        <div className="flex items-center gap-2 mt-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold">{image.weight}</span>
                        </div>
                      )}
                    </div>
                    <Link href="/gallery" className="mt-auto">
                      <Button variant="ghost" size="sm" data-testid={`button-view-gallery-${image.id}`}>
                        View Gallery
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

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

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the Competition?
          </h2>
          <p className="text-xl mb-8 text-muted-foreground">
            Create your angler profile and start booking today
          </p>
          <Link href="/register">
            <Button
              size="lg"
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
