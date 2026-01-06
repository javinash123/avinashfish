import { useState, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Users, 
  Trash2, 
  MoreVertical, 
  UserPlus, 
  UserMinus, 
  Copy, 
  Check,
  Loader2,
  Search,
  Crown,
  Pencil,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Competition } from "@shared/schema";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string | null;
  club: string;
  role: string;
  status: string;
  isCaptain: boolean;
}

interface Team {
  id: string;
  name: string;
  image: string | null;
  competitionId: string;
  inviteCode: string;
  createdBy: string;
  paymentStatus: string;
  pegNumber: number | null;
  createdAt: string;
  memberCount: number;
  members: TeamMember[];
}

interface Angler {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  club?: string;
}

export default function AdminTeams() {
  const { toast } = useToast();
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("");
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ team: Team; member: TeamMember } | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string>("");
  const [selectedAnglerForAdd, setSelectedAnglerForAdd] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [anglerSearch, setAnglerSearch] = useState("");
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamImage, setEditTeamImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: competitions = [], isLoading: isLoadingCompetitions } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const teamCompetitions = competitions.filter(c => c.competitionMode === "team");

  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"],
    enabled: !!selectedCompetitionId,
  });

  const { data: allAnglers = [] } = useQuery<Angler[]>({
    queryKey: ["/api/admin/anglers"],
    enabled: isCreateTeamOpen || isAddMemberOpen,
  });

  const selectedCompetition = teamCompetitions.find(c => c.id === selectedCompetitionId);

  const createTeamMutation = useMutation({
    mutationFn: async (data: { competitionId: string; name: string; captainUserId?: string; image?: string }) => {
      const response = await apiRequest("POST", "/api/admin/teams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"] });
      setIsCreateTeamOpen(false);
      setNewTeamName("");
      setSelectedCaptainId("");
      setEditTeamImage(null);
      toast({
        title: "Team created",
        description: "The team has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/teams/${teamId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"] });
      setTeamToDelete(null);
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const response = await apiRequest("POST", `/api/admin/teams/${teamId}/members`, { userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"] });
      setIsAddMemberOpen(false);
      setSelectedTeam(null);
      setSelectedAnglerForAdd("");
      setAnglerSearch("");
      toast({
        title: "Member added",
        description: "The angler has been added to the team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      const response = await apiRequest("DELETE", `/api/admin/teams/${teamId}/members/${memberId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"] });
      setMemberToRemove(null);
      toast({
        title: "Member removed",
        description: "The angler has been removed from the team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log('Updating team:', id, data);
      const response = await apiRequest("PATCH", `/api/admin/teams/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"] });
      setIsEditTeamOpen(false);
      setSelectedTeam(null);
      setEditTeamName("");
      setEditTeamImage(null);
      toast({
        title: "Team updated",
        description: "The team has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ teamId, memberId, data }: { teamId: string; memberId: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/teams/${teamId}/members/${memberId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions", selectedCompetitionId, "teams"] });
      toast({
        title: "Member updated",
        description: "The member's role has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member",
        variant: "destructive",
      });
    },
  });

  const handleMakeCaptain = (teamId: string, memberId: string) => {
    updateMemberMutation.mutate({
      teamId,
      memberId,
      data: { role: "captain" },
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'gallery');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !editTeamName.trim()) return;

    try {
      setUploadingImage(true);
      let imageUrl = selectedTeam.image;

      if (editTeamImage) {
        imageUrl = await uploadFile(editTeamImage);
      }

      updateTeamMutation.mutate({
        id: selectedTeam.id,
        data: {
          name: editTeamName.trim(),
          image: imageUrl || null,
        },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !selectedCompetitionId) return;
    
    try {
      setUploadingImage(true);
      let imageUrl = null;
      
      if (editTeamImage) {
        imageUrl = await uploadFile(editTeamImage);
      }

      createTeamMutation.mutate({
        competitionId: selectedCompetitionId,
        name: newTeamName.trim(),
        captainUserId: selectedCaptainId || undefined,
        image: imageUrl || undefined,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Invite code copied",
      description: "The invite code has been copied to your clipboard.",
    });
  };

  const handleAddMember = () => {
    if (!selectedTeam || !selectedAnglerForAdd) return;
    
    addMemberMutation.mutate({
      teamId: selectedTeam.id,
      userId: selectedAnglerForAdd,
    });
  };

  const getExistingMemberIds = () => {
    if (!selectedCompetitionId) return new Set<string>();
    const memberIds = new Set<string>();
    teams.forEach(team => {
      team.members.forEach(member => {
        memberIds.add(member.userId);
      });
    });
    return memberIds;
  };

  const filteredAnglers = allAnglers.filter(angler => {
    const searchLower = anglerSearch.toLowerCase();
    const matchesSearch = 
      `${angler.firstName} ${angler.lastName}`.toLowerCase().includes(searchLower) ||
      angler.username.toLowerCase().includes(searchLower) ||
      angler.email.toLowerCase().includes(searchLower);
    
    const existingMemberIds = getExistingMemberIds();
    const notInAnyTeam = !existingMemberIds.has(angler.id);
    
    return matchesSearch && notInAnyTeam;
  });

  const currentTeamMemberIds = selectedTeam?.members.map(m => m.userId) || [];
  const availableAnglersForTeam = filteredAnglers.filter(a => !currentTeamMemberIds.includes(a.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Team Management</h1>
          <p className="text-muted-foreground">
            Create and manage teams for team competitions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Competition
          </CardTitle>
          <CardDescription>
            Choose a team competition to manage its teams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCompetitionId}
            onValueChange={setSelectedCompetitionId}
            data-testid="select-competition"
          >
            <SelectTrigger className="w-full max-w-md" data-testid="select-competition-trigger">
              <SelectValue placeholder="Select a team competition..." />
            </SelectTrigger>
            <SelectContent>
              {isLoadingCompetitions ? (
                <SelectItem value="loading" disabled>Loading competitions...</SelectItem>
              ) : teamCompetitions.length === 0 ? (
                <SelectItem value="none" disabled>No team competitions found</SelectItem>
              ) : (
                teamCompetitions.map((competition) => (
                  <SelectItem key={competition.id} value={competition.id}>
                    {competition.name} - {new Date(competition.date).toLocaleDateString("en-GB")}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCompetitionId && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Teams for {selectedCompetition?.name}</CardTitle>
                <CardDescription>
                  {selectedCompetition?.maxTeamMembers 
                    ? `Max ${selectedCompetition.maxTeamMembers} members per team`
                    : "No member limit set"}
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateTeamOpen(true)} data-testid="button-create-team">
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTeams ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-teams">
                No teams created yet. Click "Create Team" to add a new team.
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team) => (
                  <Card key={team.id} data-testid={`card-team-${team.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage 
                              src={team.image || undefined} 
                              alt={team.name} 
                              className="object-cover"
                            />
                            <AvatarFallback>
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg" data-testid={`text-team-name-${team.id}`}>
                              {team.name}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                              {team.pegNumber && (
                                <Badge variant="outline">Peg {team.pegNumber}</Badge>
                              )}
                              <Badge 
                                variant={team.paymentStatus === "succeeded" ? "default" : "secondary"}
                              >
                                {team.paymentStatus === "succeeded" ? "Paid" : "Unpaid"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInviteCode(team.inviteCode)}
                            data-testid={`button-copy-code-${team.id}`}
                          >
                            {copiedCode === team.inviteCode ? (
                              <Check className="mr-2 h-4 w-4" />
                            ) : (
                              <Copy className="mr-2 h-4 w-4" />
                            )}
                            {team.inviteCode}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTeam(team);
                              setIsAddMemberOpen(true);
                            }}
                            data-testid={`button-add-member-${team.id}`}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Member
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-team-menu-${team.id}`}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setEditTeamName(team.name);
                                  setIsEditTeamOpen(true);
                                }}
                                data-testid={`menu-edit-team-${team.id}`}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Team
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTeam(team);
                                  setIsAddMemberOpen(true);
                                }}
                                data-testid={`menu-add-member-${team.id}`}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Member
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTeamToDelete(team)}
                                className="text-destructive"
                                data-testid={`menu-delete-team-${team.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {team.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No members yet</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Member</TableHead>
                              <TableHead>Club</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {team.members.map((member) => (
                              <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.avatar || undefined} className="object-cover" />
                                      <AvatarFallback>
                                        {member.name.split(" ").map(n => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2 font-medium">
                                        {member.name}
                                        {member.isCaptain && (
                                          <Crown className="h-4 w-4 text-yellow-500" />
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        @{member.username}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{member.club || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {member.isCaptain ? "Captain" : member.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setMemberToRemove({ team, member })}
                                      data-testid={`button-remove-member-${member.id}`}
                                      title="Remove Member"
                                    >
                                      <UserMinus className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {!member.isCaptain && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleMakeCaptain(team.id, member.id)}
                                        data-testid={`button-make-captain-${member.id}`}
                                        title="Make Captain"
                                      >
                                        <Crown className="h-4 w-4 text-yellow-500" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team for {selectedCompetition?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={editTeamImage ? URL.createObjectURL(editTeamImage) : undefined} />
                <AvatarFallback>
                  <Users className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingImage ? "Uploading..." : "Upload Team Photo"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setEditTeamImage(file);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                data-testid="input-team-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="captain">Team Captain (Optional)</Label>
              <Select value={selectedCaptainId} onValueChange={setSelectedCaptainId}>
                <SelectTrigger data-testid="select-captain-trigger">
                  <SelectValue placeholder="Select a captain..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Captain (Manager only)</SelectItem>
                  {allAnglers.map((angler) => (
                    <SelectItem key={angler.id} value={angler.id}>
                      {angler.firstName} {angler.lastName} (@{angler.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateTeamOpen(false);
                setNewTeamName("");
                setSelectedCaptainId("");
                setEditTeamImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim() || createTeamMutation.isPending || uploadingImage}
              data-testid="button-confirm-create-team"
            >
              {(createTeamMutation.isPending || uploadingImage) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team name and profile image
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={editTeamImage ? URL.createObjectURL(editTeamImage) : (selectedTeam?.image || undefined)} 
                  className="object-cover"
                />
                <AvatarFallback>
                  <Users className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingImage ? "Uploading..." : "Change Team Photo"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setEditTeamImage(file);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTeamName">Team Name</Label>
              <Input
                id="editTeamName"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="Enter team name"
                data-testid="input-edit-team-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditTeamOpen(false);
                setSelectedTeam(null);
                setEditTeamName("");
                setEditTeamImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTeam}
              disabled={!editTeamName.trim() || updateTeamMutation.isPending || uploadingImage}
              data-testid="button-confirm-edit-team"
            >
              {(updateTeamMutation.isPending || uploadingImage) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Search and add an angler to this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Search Anglers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username..."
                  value={anglerSearch}
                  onChange={(e) => setAnglerSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-member-search"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Select Angler</Label>
              <Select value={selectedAnglerForAdd} onValueChange={setSelectedAnglerForAdd}>
                <SelectTrigger data-testid="select-angler-trigger">
                  <SelectValue placeholder="Select an angler..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAnglersForTeam.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available anglers found
                    </SelectItem>
                  ) : (
                    availableAnglersForTeam.slice(0, 20).map((angler) => (
                      <SelectItem key={angler.id} value={angler.id}>
                        {angler.firstName} {angler.lastName} (@{angler.username})
                        {angler.club && ` - ${angler.club}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Only anglers not already in a team for this competition are shown
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddMemberOpen(false);
                setSelectedTeam(null);
                setSelectedAnglerForAdd("");
                setAnglerSearch("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedAnglerForAdd || addMemberMutation.isPending}
              data-testid="button-confirm-add-member"
            >
              {addMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add to Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!teamToDelete} onOpenChange={() => setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{teamToDelete?.name}"? This will remove all members 
              from the team and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => teamToDelete && deleteTeamMutation.mutate(teamToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-team"
            >
              {deleteTeamMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Team
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.member.name} from {memberToRemove?.team.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && removeMemberMutation.mutate({
                teamId: memberToRemove.team.id,
                memberId: memberToRemove.member.id,
              })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-remove-member"
            >
              {removeMemberMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove Member
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
