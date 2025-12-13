import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompetitionCard } from "@/components/competition-card";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { HeroSlider } from "@/components/hero-slider";
import { ArrowRight, Trophy, Users, Calendar, Newspaper, Image as ImageIcon, Clock, Fish, Youtube, Play } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Competition, News, GalleryImage, YoutubeVideo } from "@shared/schema";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { getCompetitionStatus } from "@/lib/uk-timezone";
import { formatWeight } from "@shared/weight-utils";
import { updateMetaTags } from "@/lib/meta-tags";

export default function Home() {
  const { data: competitionsData = [] } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const { data: featuredNews = [] } = useQuery<News[]>({
    queryKey: ["/api/news/featured"],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: featuredGallery = [] } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery/featured"],
  });

  const { data: youtubeVideos = [] } = useQuery<YoutubeVideo[]>({
    queryKey: ["/api/youtube-videos"],
  });

  // State for randomly selected featured news by category
  const [randomFeaturedNews, setRandomFeaturedNews] = useState<News[]>([]);

  // Update featured news when featured news data changes - one from each category
  useEffect(() => {
    if (featuredNews.length > 0) {
      // Group news by category
      const byCategory = {
        announcement: featuredNews.filter(n => n.category === 'announcement'),
        matchReport: featuredNews.filter(n => n.category === 'match-report'),
        news: featuredNews.filter(n => n.category === 'news'),
      };

      // Pick one random from each category
      const selected: News[] = [];
      
      if (byCategory.announcement.length > 0) {
        const randomIdx = Math.floor(Math.random() * byCategory.announcement.length);
        selected.push(byCategory.announcement[randomIdx]);
      }
      
      if (byCategory.matchReport.length > 0) {
        const randomIdx = Math.floor(Math.random() * byCategory.matchReport.length);
        selected.push(byCategory.matchReport[randomIdx]);
      }
      
      if (byCategory.news.length > 0) {
        const randomIdx = Math.floor(Math.random() * byCategory.news.length);
        selected.push(byCategory.news[randomIdx]);
      }
      
      setRandomFeaturedNews(selected);
    } else {
      setRandomFeaturedNews([]);
    }
  }, [featuredNews]);

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
      entryFee: comp.entryFee,
      prizePool: comp.prizePool,
      prizeType: comp.prizeType || "pool",
      status: "upcoming" as const,
      imageUrl: comp.imageUrl || undefined,
      thumbnailUrl: (comp as any).thumbnailUrl || undefined,
      thumbnailUrlMd: (comp as any).thumbnailUrlMd || undefined,
      thumbnailUrlLg: (comp as any).thumbnailUrlLg || undefined,
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

      {featuredNews.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">Pegslam News</h2>
              <Link href="/news">
                <Button variant="outline" data-testid="button-view-all-news">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {randomFeaturedNews.map((news) => {
                const getCategoryBadge = (category: string) => {
                  switch (category) {
                    case "match-report":
                      return { label: "Match Report", variant: "default" as const, icon: Trophy };
                    case "announcement":
                      return { label: "Announcement", variant: "secondary" as const, icon: Newspaper };
                    case "news":
                      return { label: "News", variant: "outline" as const, icon: Newspaper };
                    case "general":
                      return { label: "General", variant: "outline" as const, icon: Newspaper };
                    default:
                      return { label: category, variant: "outline" as const, icon: Newspaper };
                  }
                };
                
                const categoryInfo = getCategoryBadge(news.category);
                const CategoryIcon = categoryInfo.icon;
                
                return (
                  <Card key={news.id} className="flex flex-col overflow-hidden hover-elevate" data-testid={`card-news-${news.id}`}>
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant={categoryInfo.variant}>
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {categoryInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <h3 className="text-xl font-semibold line-clamp-2" data-testid={`text-news-title-${news.id}`}>
                        {news.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground line-clamp-3">{news.excerpt}</p>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-4 pt-0">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{news.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{news.readTime}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          // Update meta tags for social sharing before navigation
                          const articleUrl = `${window.location.origin}/news?article=${news.id}`;
                          updateMetaTags({
                            title: news.title,
                            description: news.excerpt,
                            image: news.image,
                            url: articleUrl,
                            type: 'article',
                          });
                          window.location.href = `/news?article=${news.id}`;
                        }}
                        data-testid={`button-read-more-${news.id}`}
                      >
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 container mx-auto px-4 lg:px-8">
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

      <section className="py-12 bg-muted/30">
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

      {youtubeVideos.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold">Latest Videos</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {youtubeVideos.slice(0, 6).map((video) => (
                <Card key={video.id} className="overflow-hidden hover-elevate active-elevate-2" data-testid={`card-youtube-${video.id}`}>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    data-testid={`link-youtube-${video.id}`}
                  >
                    <div className="relative aspect-video bg-muted">
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-4 shadow-lg transition-transform hover:scale-110">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <Badge variant="secondary" className="bg-black/50 text-white">
                          <Youtube className="h-3 w-3 mr-1" />
                          YouTube
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2" data-testid={`text-youtube-title-${video.id}`}>
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {video.description}
                        </p>
                      )}
                    </CardContent>
                  </a>
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
              <h2 className="text-2xl sm:text-3xl font-bold">Featured Gallery</h2>
              <Link href="/gallery">
                <Button variant="outline" data-testid="button-view-all-gallery">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredGallery.slice(0, 4).map((image) => (
                <Card key={image.id} className="group overflow-hidden hover-elevate active-elevate-2" data-testid={`card-gallery-${image.id}`}>
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
                    <div className="absolute top-2 right-2">
                      <Badge variant={image.category === "catch" ? "default" : "secondary"}>
                        {image.category === "catch" ? (
                          <>
                            <Fish className="h-3 w-3 mr-1" />
                            Catch
                          </>
                        ) : (
                          <>
                            <Calendar className="h-3 w-3 mr-1" />
                            Event
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1" data-testid={`text-gallery-title-${image.id}`}>
                      {image.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{image.description}</p>
                    {image.weight && (
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{formatWeight(image.weight)}</span>
                      </div>
                    )}
                    <Link href="/gallery" className="mt-3 block">
                      <Button variant="ghost" size="sm" className="w-full" data-testid={`button-view-gallery-${image.id}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
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
              <h3 className="text-xl font-bold mb-2">Anglers Directory</h3>
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

      <section className="py-12 bg-background">
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
