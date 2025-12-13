import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PegMap } from "@/components/peg-map";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  MapPin,
  Users,
  Coins,
  Trophy,
  Clock,
  ArrowLeft,
  Loader2,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Competition } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompetitionStatus } from "@/lib/uk-timezone";
import { useState } from "react";

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

  const { data: userTeam, refetch: refetchUserTeam } = useQuery<any>({
    queryKey: [`/api/competitions/${id}/my-team`],
    enabled: !!user && competition?.competitionMode === "team",
  });

  const { data: allTeams = [], isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: [`/api/competitions/${id}/teams`],
    enabled: competition?.competitionMode === "team",
  });

  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isManageTeamOpen, setIsManageTeamOpen] = useState(false);
  const [isJoinTeamOpen, setIsJoinTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [createdTeam, setCreatedTeam] = useState<any>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const handleBookPeg = () => {
    if (!competition) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a peg",
        variant: "destructive",
      });
      window.location.href = "/login";
      return;
    }
    
    const entryFee = parseFloat(competition.entryFee);
    
    // If entry fee is greater than 0, redirect to booking/payment page
    if (!isNaN(entryFee) && entryFee > 0) {
      window.location.href = `/booking/${id}`;
    } else {
      // Free competition
      if (competition.competitionMode === "team") {
        // For team competitions, use team booking
        if (!userTeam?.id) {
          toast({
            title: "Team Required",
            description: "You must be part of a team to book this competition",
            variant: "destructive",
          });
          return;
        }
        freeTeamBookingMutation.mutate();
      } else {
        // For individual competitions, use individual join
        joinMutation.mutate();
      }
    }
  };

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

  const freeTeamBookingMutation = useMutation({
    mutationFn: async () => {
      if (!userTeam?.id) {
        throw new Error("You must be part of a team to book this competition");
      }
      const response = await apiRequest("POST", "/api/confirm-payment-and-join", {
        paymentIntentId: "free-competition",
        competitionId: id,
        teamId: userTeam.id,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to book team peg");
      }
      return response.json();
    },
    onSuccess: () => {
      refetchUserTeam();
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/participants`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/teams`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}`] });
      toast({
        title: "Success!",
        description: "Team peg booked successfully!",
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

  const createTeamMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/competitions/${id}/teams`, {
        name: name,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create team");
      }
      return response.json();
    },
    onSuccess: async (data) => {
      setCreatedTeam(data);
      setTeamName("");
      setIsCreateTeamOpen(false);
      await refetchUserTeam();
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/my-team`] });
      toast({
        title: "Team created!",
        description: "Share the invite code with your team members",
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

  const handleCreateTeam = () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      });
      return;
    }
    createTeamMutation.mutate(teamName);
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedInvite(true);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      if (!userTeam?.id) {
        throw new Error("Team information not available");
      }
      const response = await apiRequest("DELETE", `/api/teams/${userTeam.id}/leave`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to leave team");
      }
      return response.json();
    },
    onSuccess: async () => {
      setIsManageTeamOpen(false);
      await refetchUserTeam();
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/my-team`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/teams`] });
      toast({
        title: "Left team",
        description: "You have left the team",
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

  const regenerateInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/teams/regenerate-invite`, {
        competitionId: id,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to regenerate invite code");
      }
      return response.json();
    },
    onSuccess: () => {
      refetchUserTeam();
      toast({
        title: "Code regenerated",
        description: "New invite code has been generated",
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

  const joinTeamMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiRequest("POST", `/api/teams/join`, {
        inviteCode: inviteCode.trim(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to join team");
      }
      return response.json();
    },
    onSuccess: async () => {
      setJoinInviteCode("");
      setIsJoinTeamOpen(false);
      await refetchUserTeam();
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/my-team`] });
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${id}/teams`] });
      toast({
        title: "Success!",
        description: "You've successfully joined the team",
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
            <div className="relative w-full bg-gradient-to-br from-primary/20 to-chart-2/20 rounded-lg mb-6 overflow-hidden">
              {competition.imageUrl ? (
                <img
                  src={competition.imageUrl}
                  alt={competition.name}
                  className="w-full h-full object-cover object-center"
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

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" data-testid="text-competition-name">
                {competition.name}
              </h1>
              <Badge 
                variant="outline"
                className={competition.competitionMode === "team" ? "bg-purple-50 text-purple-700 border-purple-300" : "bg-blue-50 text-blue-700 border-blue-300"}
                data-testid="badge-competition-mode"
              >
                {competition.competitionMode === "team" ? (
                  <>
                    <Users className="h-3 w-3 mr-1" />
                    Team Competition
                    {competition.maxTeamMembers && ` (Max ${competition.maxTeamMembers} members)`}
                  </>
                ) : (
                  "Individual Competition"
                )}
              </Badge>
            </div>
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
                  {competition.prizeType !== "other" && (
                    <div className="flex items-center gap-2 text-chart-3">
                      <Trophy className="h-5 w-5" />
                      <div>
                        <span className="font-bold text-lg">£{competition.prizePool}</span>
                        <span className="text-sm ml-1">Prize Pool</span>
                      </div>
                    </div>
                  )}
                  {competition.prizeType === "other" && (
                    <div className="flex items-center gap-2 text-chart-3">
                      <Trophy className="h-5 w-5" />
                      <div>
                        <span className="font-bold text-lg">{competition.prizePool}</span>
                      </div>
                    </div>
                  )}
                  {competitionStatus === "completed" ? (
                    <Link href="#leaderboard">
                      <Button className="w-full" size="lg" data-testid="button-view-result">
                        <Trophy className="mr-2 h-5 w-5" />
                        View Results
                      </Button>
                    </Link>
                  ) : user ? (
                    competition.competitionMode === "team" ? (
                      userTeam ? (
                        <div className="space-y-3">
                          <div className="bg-card rounded-md border p-4">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{userTeam.teamName}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsManageTeamOpen(true)}
                                data-testid="button-manage-team"
                              >
                                Manage
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {userTeam.members.length} / {competition.maxTeamMembers || 4} members
                            </p>
                          </div>
                          {userTeam.isCaptain ? (
                            userTeam.paymentStatus === "succeeded" ? (
                              <Button 
                                className="w-full" 
                                size="lg" 
                                disabled
                                data-testid="button-book-team-peg"
                              >
                                <Check className="mr-2 h-5 w-5" />
                                Peg Booked
                              </Button>
                            ) : competition.pegsBooked >= competition.pegsTotal ? (
                              <div className="space-y-3">
                                <Button 
                                  className="w-full" 
                                  size="lg" 
                                  variant="secondary"
                                  disabled
                                  data-testid="button-sold-out"
                                >
                                  Sold Out
                                </Button>
                                <p className="text-sm text-muted-foreground text-center">
                                  All pegs have been booked for this competition.
                                </p>
                              </div>
                            ) : (
                              <Button 
                                className="w-full" 
                                size="lg" 
                                onClick={handleBookPeg}
                                data-testid="button-book-team-peg"
                              >
                                <Coins className="mr-2 h-5 w-5" />
                                Book Team Peg
                              </Button>
                            )
                          ) : (
                            <div className="text-center text-sm text-muted-foreground p-4 bg-muted/50 rounded-md">
                              Only the team captain can book a peg for the team.
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg" 
                          onClick={() => setIsCreateTeamOpen(true)}
                          data-testid="button-create-team"
                        >
                          <UserPlus className="mr-2 h-5 w-5" />
                          Create Team
                        </Button>
                      )
                    ) : (
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
                      ) : competition.pegsBooked >= competition.pegsTotal ? (
                        <div className="space-y-3">
                          <Button 
                            className="w-full" 
                            size="lg" 
                            variant="secondary"
                            disabled
                            data-testid="button-sold-out"
                          >
                            Sold Out
                          </Button>
                          <p className="text-sm text-muted-foreground text-center">
                            All pegs have been booked for this competition.
                          </p>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          size="lg" 
                          onClick={handleBookPeg}
                          disabled={joinMutation.isPending}
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

        <Tabs defaultValue={competition.competitionMode === "team" ? "teams" : "participants"} className="w-full">
          <TabsList className={`grid w-full ${competition.competitionMode === "team" ? "grid-cols-3" : "grid-cols-2"} h-auto`} data-testid="tabs-competition">
            {competition.competitionMode === "team" && (
              <TabsTrigger value="teams" className="text-xs sm:text-sm px-2 sm:px-4">Teams</TabsTrigger>
            )}
            <TabsTrigger value="participants" className="text-xs sm:text-sm px-2 sm:px-4">
              {competition.competitionMode === "team" ? "All Participants" : "Participants"}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm px-2 sm:px-4">Leaderboard</TabsTrigger>
          </TabsList>

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

          {competition.competitionMode === "team" && (
            <TabsContent value="teams" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {user && !userTeam ? (
                    <div className="mb-6 flex gap-3 flex-wrap">
                      <Button
                        onClick={() => setIsCreateTeamOpen(true)}
                        data-testid="button-create-team"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create a Team
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsJoinTeamOpen(true)}
                        data-testid="button-join-team"
                      >
                        Join with Code
                      </Button>
                    </div>
                  ) : null}

                  {teamsLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : allTeams.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {allTeams.map((team: any) => (
                        <div
                          key={team.id}
                          className="p-4 rounded-lg border hover-elevate"
                          data-testid={`team-${team.id}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{team.name}</h3>
                              <Badge 
                                variant="outline"
                                className="mt-1 text-xs"
                              >
                                {team.memberCount || 0} / {competition.maxTeamMembers || 'N/A'} members
                              </Badge>
                            </div>
                            {team.pegNumber && (
                              <Badge variant="default" className="font-mono">
                                Peg {team.pegNumber}
                              </Badge>
                            )}
                          </div>
                          
                          {team.members && team.members.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">Team Members:</div>
                              {team.members.slice(0, 3).map((member: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={member.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {member.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">{member.name}</span>
                                  {member.role === "captain" && (
                                    <Badge variant="secondary" className="text-xs px-1 py-0">Captain</Badge>
                                  )}
                                </div>
                              ))}
                              {team.members.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{team.members.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
                          
                          {userTeam && userTeam.id === team.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                              onClick={() => setIsManageTeamOpen(true)}
                              data-testid="button-manage-team"
                            >
                              Manage Team
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No teams have been created yet. Be the first to form a team!
                      </p>
                      {user && !userTeam ? (
                        <Button
                          onClick={() => setIsCreateTeamOpen(true)}
                          data-testid="button-create-first-team"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create First Team
                        </Button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardTable 
              entries={leaderboard} 
              isLive={true} 
            />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Your Team</DialogTitle>
            <DialogDescription>
              Create a team and get an invite code to share with your teammates
            </DialogDescription>
          </DialogHeader>
          
          {!createdTeam ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="The Carpmasters"
                  data-testid="input-team-name"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTeam();
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="bg-primary/10 rounded-md p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Team Created!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Share this code with your teammates
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdTeam.inviteCode}
                    readOnly
                    className="font-mono text-lg text-center"
                    data-testid="input-invite-code"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyInviteCode(createdTeam.inviteCode)}
                    data-testid="button-copy-invite"
                  >
                    {copiedInvite ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Team members can join using this code
                </p>
              </div>
              
              <div className="bg-card rounded-md border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{createdTeam.teamName}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  1 / {competition?.maxTeamMembers || 4} members
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!createdTeam ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateTeamOpen(false);
                    setTeamName("");
                  }}
                  data-testid="button-cancel-team"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTeam}
                  disabled={createTeamMutation.isPending || !teamName.trim()}
                  data-testid="button-submit-team"
                >
                  {createTeamMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => {
                  setIsCreateTeamOpen(false);
                  setCreatedTeam(null);
                }}
                data-testid="button-done"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isJoinTeamOpen} onOpenChange={setIsJoinTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Join a Team</DialogTitle>
            <DialogDescription>
              Enter the invite code to join your teammate's team
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={joinInviteCode}
                onChange={(e) => setJoinInviteCode(e.target.value)}
                placeholder="e.g., ABC123"
                data-testid="input-join-invite-code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && joinInviteCode.trim()) {
                    joinTeamMutation.mutate(joinInviteCode);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Ask your teammate to share the invite code from their team
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsJoinTeamOpen(false)}
              data-testid="button-cancel-join"
            >
              Cancel
            </Button>
            <Button
              onClick={() => joinTeamMutation.mutate(joinInviteCode)}
              disabled={!joinInviteCode.trim() || joinTeamMutation.isPending}
              data-testid="button-submit-join"
            >
              {joinTeamMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManageTeamOpen} onOpenChange={setIsManageTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Team</DialogTitle>
            <DialogDescription>
              View and manage your team for this competition
            </DialogDescription>
          </DialogHeader>
          
          {userTeam && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <div className="font-semibold text-lg">{userTeam.teamName}</div>
              </div>
              
              <div className="space-y-2">
                <Label>Team Members ({userTeam.members.length}/{competition?.maxTeamMembers || 4})</Label>
                <div className="space-y-2">
                  {userTeam.members.map((member: any, index: number) => (
                    <div 
                      key={member.userId} 
                      className="flex items-center gap-3 p-3 rounded-md border"
                      data-testid={`team-member-${index}`}
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{member.name}</div>
                        {member.isPrimary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Invite Code</Label>
                  {userTeam.isCaptain && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regenerateInviteMutation.mutate()}
                      disabled={regenerateInviteMutation.isPending}
                      data-testid="button-regenerate-invite"
                    >
                      {regenerateInviteMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Regenerate"
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={userTeam.inviteCode}
                    readOnly
                    className="font-mono text-center"
                    data-testid="input-team-invite-code"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copyInviteCode(userTeam.inviteCode)}
                    data-testid="button-copy-team-invite"
                  >
                    {copiedInvite ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this code with teammates to invite them
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsManageTeamOpen(false)}
              data-testid="button-close-manage"
            >
              Close
            </Button>
            <Button 
              variant="destructive"
              onClick={() => leaveTeamMutation.mutate()}
              disabled={leaveTeamMutation.isPending}
              data-testid="button-leave-team"
            >
              {leaveTeamMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Team"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
