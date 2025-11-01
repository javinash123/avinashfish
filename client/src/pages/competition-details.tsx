import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PegMap } from "@/components/peg-map";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  MapPin,
  Users,
  Coins,
  Trophy,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Competition } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompetitionStatus } from "@/lib/uk-timezone";

export default function CompetitionDetails() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: competition, isLoading: competitionLoading } = useQuery<Competition>({
    queryKey: [`/api/competitions/${id}`],
  });

  const { data: participants = [], isLoading: participantsLoading } = useQuery<any[]>({
    queryKey: [`/api/competitions/${id}/participants`],
  });

  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<any[]>({
    queryKey: [`/api/competitions/${id}/leaderboard`],
  });

  const { data: isJoinedData } = useQuery<{ isJoined: boolean }>({
    queryKey: [`/api/competitions/${id}/is-joined`],
  });

  const { data: user } = useQuery({
    queryKey: ["/api/user/me"],
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/competitions/${id}/join`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to join competition");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/is-joined`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}`] });
      toast({
        title: "Success!",
        description: "You've successfully joined the competition",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/competitions/${id}/leave`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to leave competition");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/is-joined`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}`] });
      toast({
        title: "Success",
        description: "You've left the competition",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (competitionLoading || !competition) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <Skeleton className="h-10 w-40 mb-6" />
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isJoined = isJoinedData?.isJoined || false;
  const competitionStatus = competition ? getCompetitionStatus(competition) : "upcoming";
  
  // Generate pegs based on participants
  const pegs = Array.from({ length: Math.min(competition.pegsTotal, 40) }, (_, i) => {
    const pegNumber = i + 1;
    const participant = participants.find(p => p.pegNumber === pegNumber);
    
    return {
      number: pegNumber,
      x: 100 + (i % 10) * 60,
      y: Math.floor(i / 10) * 100 + 80,
      status: participant ? ("booked" as const) : ("available" as const),
      anglerName: participant?.name,
    };
  });

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-6">
          <Link href="/competitions">
            <Button variant="ghost" className="mb-4" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Competitions
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 to-chart-2/20 rounded-lg mb-6 overflow-hidden">
              {competition.imageUrl ? (
                <img
                  src={competition.imageUrl}
                  alt={competition.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-primary/20">
                    <MapPin className="h-24 w-24 mx-auto" />
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <Badge
                  className={
                    competitionStatus === "live"
                      ? "bg-chart-4 text-white animate-pulse"
                      : competitionStatus === "upcoming"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-500 text-white"
                  }
                  data-testid="badge-status"
                >
                  {competitionStatus === "live"
                    ? "Live Now"
                    : competitionStatus === "upcoming"
                    ? "Upcoming"
                    : "Completed"}
                </Badge>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4" data-testid="text-competition-name">
              {competition.name}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg mb-6">
              {competition.description}
            </p>

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="font-medium" data-testid="text-date">
                    {competition.date}
                    {competition.endDate && competition.endDate !== competition.date && (
                      <> - {competition.endDate}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <Clock className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="font-medium">
                    {competition.time}{competition.endTime ? ` - ${competition.endTime}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <MapPin className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Venue</div>
                  <div className="font-medium" data-testid="text-venue">{competition.venue}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-chart-4/10">
                  <Users className="h-5 w-5 text-chart-4" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pegs</div>
                  <div className="font-medium">
                    {competition.pegsBooked} / {competition.pegsTotal} booked
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Entry Fee
                    </div>
                    <div className="text-3xl font-bold" data-testid="text-entry-fee">
                      £{competition.entryFee}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-chart-3">
                    <Trophy className="h-5 w-5" />
                    <div>
                      {(competition.prizeType === "pool" || !competition.prizeType) ? (
                        <>
                          <span className="font-bold text-lg">£{competition.prizePool}</span>
                          <span className="text-sm ml-1">Prize Pool</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-lg">{competition.prizePool}</span>
                          <span className="text-sm ml-1">Prize</span>
                        </>
                      )}
                    </div>
                  </div>
                  {competitionStatus === "completed" ? (
                    <Link href="#leaderboard">
                      <Button className="w-full" size="lg" data-testid="button-view-result">
                        <Trophy className="mr-2 h-5 w-5" />
                        View Results
                      </Button>
                    </Link>
                  ) : user ? (
                    isJoined ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="lg" 
                        onClick={() => leaveMutation.mutate()}
                        disabled={leaveMutation.isPending}
                        data-testid="button-leave-competition"
                      >
                        {leaveMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Leaving...
                          </>
                        ) : (
                          "Leave Competition"
                        )}
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg" 
                        onClick={() => joinMutation.mutate()}
                        disabled={joinMutation.isPending || competition.pegsBooked >= competition.pegsTotal}
                        data-testid="button-book-peg"
                      >
                        {joinMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Coins className="mr-2 h-5 w-5" />
                            Book Your Peg
                          </>
                        )}
                      </Button>
                    )
                  ) : (
                    <Link href="/login">
                      <Button className="w-full" size="lg" data-testid="button-login-to-join">
                        <Coins className="mr-2 h-5 w-5" />
                        Login to Join
                      </Button>
                    </Link>
                  )}
                  <p className="text-xs text-center text-muted-foreground">
                    {competition.pegsTotal - competition.pegsBooked} pegs remaining
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto" data-testid="tabs-competition">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm px-2 sm:px-4">Leaderboard</TabsTrigger>
            <TabsTrigger value="participants" className="text-xs sm:text-sm px-2 sm:px-4">Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Peg Layout</h3>
                  <PegMap pegs={pegs} selectable={false} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardTable 
              entries={leaderboard} 
              isLive={true} 
            />
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {participantsLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : participants.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover-elevate"
                        data-testid={`participant-${participant.id}`}
                      >
                        <Avatar>
                          <AvatarImage src={participant.avatar} />
                          <AvatarFallback>
                            {participant.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          {participant.username ? (
                            <Link href={`/profile/${participant.username}`}>
                              <div className="font-medium truncate hover:underline cursor-pointer">
                                {participant.name}
                              </div>
                            </Link>
                          ) : (
                            <div className="font-medium truncate">
                              {participant.name}
                            </div>
                          )}
                          {participant.club && (
                            <div className="text-sm text-muted-foreground truncate">
                              {participant.club}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {participant.pegNumber}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No participants yet. Be the first to join!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
