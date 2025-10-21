import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, MoreVertical, UserCheck, UserX, Mail, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

interface Angler {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  club?: string;
  createdAt: string;
  status: "active" | "pending" | "blocked";
}

export default function AdminAnglers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "blocked">("all");
  const [selectedAngler, setSelectedAngler] = useState<Angler | null>(null);

  const { data: anglers = [], isLoading } = useQuery<Angler[]>({
    queryKey: ["/api/admin/anglers"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "pending" | "blocked" }) => {
      const response = await apiRequest("PATCH", `/api/admin/anglers/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/anglers"] });
    },
  });

  const handleApprove = (id: string, firstName: string, lastName: string) => {
    updateStatusMutation.mutate(
      { id, status: "active" },
      {
        onSuccess: () => {
          toast({
            title: "Angler approved",
            description: `${firstName} ${lastName} has been approved and can now participate in competitions.`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to approve angler",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleBlock = (id: string, firstName: string, lastName: string) => {
    updateStatusMutation.mutate(
      { id, status: "blocked" },
      {
        onSuccess: () => {
          toast({
            title: "Angler blocked",
            description: `${firstName} ${lastName} has been blocked from the platform.`,
            variant: "destructive",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to block angler",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleUnblock = (id: string, firstName: string, lastName: string) => {
    updateStatusMutation.mutate(
      { id, status: "active" },
      {
        onSuccess: () => {
          toast({
            title: "Angler unblocked",
            description: `${firstName} ${lastName} has been unblocked and can now access the platform.`,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.message || "Failed to unblock angler",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleSendEmail = (email: string, firstName: string, lastName: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleViewProfile = (angler: Angler) => {
    setSelectedAngler(angler);
  };

  // Fetch angler stats when dialog is open
  const { data: anglerStats } = useQuery<{
    totalMatches: number;
    wins: number;
    podiumFinishes: number;
    bestCatch: string;
    avgWeight: string;
    totalWeight: string;
  }>({
    queryKey: [`/api/admin/anglers/${selectedAngler?.id}/stats`],
    enabled: !!selectedAngler,
  });

  // Fetch angler participation history
  const { data: anglerParticipations = [] } = useQuery<Array<{
    competitionId: string;
    competitionName: string;
    date: string;
    venue: string;
    pegNumber: number | string;
    position: number | string;
    weight: string;
  }>>({
    queryKey: [`/api/admin/anglers/${selectedAngler?.id}/participations`],
    enabled: !!selectedAngler,
  });

  const filteredAnglers = anglers.filter((angler) => {
    const fullName = `${angler.firstName} ${angler.lastName}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      angler.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      angler.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || angler.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "pending":
        return "secondary";
      case "blocked":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Angler Management</h2>
        <p className="text-muted-foreground">
          Manage registered anglers and their access
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-anglers"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
            data-testid="filter-all-anglers"
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            size="sm"
            data-testid="filter-active"
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            size="sm"
            data-testid="filter-pending"
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === "blocked" ? "default" : "outline"}
            onClick={() => setStatusFilter("blocked")}
            size="sm"
            data-testid="filter-blocked"
          >
            Blocked
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Angler</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Club</TableHead>
                <TableHead>Member Since</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnglers.map((angler) => (
                <TableRow key={angler.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(angler.firstName, angler.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{angler.firstName} {angler.lastName}</div>
                        <div className="text-sm text-muted-foreground">
                          @{angler.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{angler.email}</TableCell>
                  <TableCell>{angler.club || "-"}</TableCell>
                  <TableCell>
                    {new Date(angler.createdAt).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      View details
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(angler.status)}>
                      {angler.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`button-actions-${angler.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewProfile(angler)} data-testid={`action-view-profile-${angler.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendEmail(angler.email, angler.firstName, angler.lastName)} data-testid={`action-send-email-${angler.id}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {angler.status === "pending" && (
                          <DropdownMenuItem onClick={() => handleApprove(angler.id, angler.firstName, angler.lastName)} data-testid={`action-approve-${angler.id}`}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                        )}
                        {angler.status === "active" && (
                          <DropdownMenuItem onClick={() => handleBlock(angler.id, angler.firstName, angler.lastName)} data-testid={`action-block-${angler.id}`}>
                            <UserX className="h-4 w-4 mr-2" />
                            Block
                          </DropdownMenuItem>
                        )}
                        {angler.status === "blocked" && (
                          <DropdownMenuItem onClick={() => handleUnblock(angler.id, angler.firstName, angler.lastName)} data-testid={`action-unblock-${angler.id}`}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Unblock
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredAnglers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No anglers found matching your criteria
        </div>
      )}

      <Dialog open={!!selectedAngler} onOpenChange={(open) => !open && setSelectedAngler(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Angler Profile</DialogTitle>
            <DialogDescription>
              View detailed information about this angler
            </DialogDescription>
          </DialogHeader>
          
          {selectedAngler && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">
                    {getInitials(selectedAngler.firstName, selectedAngler.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold">{selectedAngler.firstName} {selectedAngler.lastName}</h3>
                  <p className="text-muted-foreground">@{selectedAngler.username}</p>
                  <Badge variant={getStatusBadgeVariant(selectedAngler.status)} className="mt-2">
                    {selectedAngler.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Email</h4>
                  <p className="text-sm">{selectedAngler.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Club</h4>
                  <p className="text-sm">{selectedAngler.club || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Member Since</h4>
                  <p className="text-sm">{new Date(selectedAngler.createdAt).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    timeZone: 'Europe/London'
                  })}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
                  <p className="text-sm capitalize">{selectedAngler.status}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Competition Statistics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{anglerStats?.totalMatches ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Total Matches</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{anglerStats?.wins ?? 0}</div>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{anglerStats?.bestCatch ?? "-"}</div>
                      <p className="text-xs text-muted-foreground">Best Catch</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Competition History</h4>
                {anglerParticipations.length > 0 ? (
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Competition</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead className="text-center">Peg</TableHead>
                            <TableHead className="text-center">Position</TableHead>
                            <TableHead className="text-right">Weight</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {anglerParticipations.map((participation, index) => (
                            <TableRow key={participation.competitionId}>
                              <TableCell className="font-medium">{participation.competitionName}</TableCell>
                              <TableCell>{participation.date}</TableCell>
                              <TableCell>{participation.venue}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-mono">
                                  {participation.pegNumber}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {participation.position !== "-" ? (
                                  <Badge variant={participation.position === 1 ? "default" : "secondary"}>
                                    {participation.position}
                                  </Badge>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {participation.weight}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-center text-muted-foreground py-4 text-sm">
                    No competition history available
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
