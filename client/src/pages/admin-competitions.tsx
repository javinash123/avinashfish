import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Users, Trophy, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Competition } from "@shared/schema";
import { getCompetitionStatus } from "@/lib/uk-timezone";
import { convertToOunces, formatWeight, convertFromOunces } from "@shared/weight-utils";

export default function AdminCompetitions() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPegAssignmentOpen, setIsPegAssignmentOpen] = useState(false);
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [isAnglersOpen, setIsAnglersOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Weigh-in state
  const [weighInEntries, setWeighInEntries] = useState<Record<string, { peg: number; weight: number; angler: string; time: string }[]>>({});
  const [weighInForm, setWeighInForm] = useState({ pegNumber: "", pounds: "", ounces: "" });
  const [selectedPegForView, setSelectedPegForView] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editPounds, setEditPounds] = useState("");
  const [editOunces, setEditOunces] = useState("");
  const [editingPegParticipantId, setEditingPegParticipantId] = useState<string | null>(null);
  const [editPegNumber, setEditPegNumber] = useState("");

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  // Fetch participants for the selected competition
  const { data: participants = [] } = useQuery<Array<{
    id: string;
    userId: string;
    pegNumber: number;
    name: string;
    club: string;
    avatar: string;
    joinedAt: string;
  }>>({
    queryKey: [`/api/competitions/${selectedCompetition?.id}/participants`],
    enabled: !!selectedCompetition && (isPegAssignmentOpen || isWeighInOpen || isAnglersOpen),
  });

  // Fetch teams for team competitions
  const { data: teams = [] } = useQuery<Array<{
    id: string;
    teamName: string;
    pegNumber: number;
    memberCount: number;
    members: Array<{
      userId: string;
      name: string;
      avatar: string;
      isPrimary: boolean;
    }>;
  }>>({
    queryKey: [`/api/competitions/${selectedCompetition?.id}/teams`],
    enabled: !!selectedCompetition && selectedCompetition.competitionMode === "team" && (isPegAssignmentOpen || isWeighInOpen),
  });

  // Fetch all users for adding to competition
  const { data: allUsers = [] } = useQuery<Array<{
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    club?: string;
  }>>({
    queryKey: ["/api/admin/anglers"],
    enabled: isAnglersOpen,
  });

  // Get userId from selected peg (for individual competitions)
  const selectedParticipant = selectedPegForView 
    ? participants.find(p => p.pegNumber === selectedPegForView)
    : null;

  // Get team from selected peg (for team competitions)
  const selectedTeam = selectedPegForView && selectedCompetition?.competitionMode === "team"
    ? teams.find(t => t.pegNumber === selectedPegForView)
    : null;

  // Fetch weight entries for selected participant (individual competitions)
  const { data: participantEntries } = useQuery<{
    entries: Array<{
      id: string;
      weight: string;
      createdAt: string;
    }>;
    totalWeight: string;
  }>({
    queryKey: [`/api/admin/competitions/${selectedCompetition?.id}/participants/${selectedParticipant?.userId}/entries`],
    enabled: !!selectedCompetition && !!selectedParticipant && selectedCompetition.competitionMode !== "team",
  });

  // Fetch weight entries for selected team (team competitions)
  const { data: teamEntries } = useQuery<{
    entries: Array<{
      id: string;
      weight: string;
      createdAt: string;
    }>;
    totalWeight: string;
  }>({
    queryKey: [`/api/admin/competitions/${selectedCompetition?.id}/teams/${selectedTeam?.id}/entries`],
    enabled: !!selectedCompetition && !!selectedTeam && selectedCompetition.competitionMode === "team",
  });

  // Fetch payments for selected competition
  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    currency: string;
    status: string;
    stripePaymentIntentId: string;
    createdAt: Date;
  }>>({
    queryKey: [`/api/admin/competitions/${selectedCompetition?.id}/payments`],
    enabled: !!selectedCompetition && isPaymentsOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/competitions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Competition created",
        description: "Competition has been created successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Competition creation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create competition",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/admin/competitions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Competition updated",
        description: "Competition has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error("Competition update error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update competition",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/competitions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Competition deleted",
        description: "The competition has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete competition",
        variant: "destructive",
      });
    },
  });

  const assignPegsMutation = useMutation({
    mutationFn: async ({ competitionId, assignments }: { competitionId: string; assignments: Array<{ participantId: string; pegNumber: number }> }) => {
      return await apiRequest("POST", `/api/admin/competitions/${competitionId}/assign-pegs`, { assignments });
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/participants`] });
      }
      toast({
        title: "Pegs assigned",
        description: "Peg assignments have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign pegs",
        variant: "destructive",
      });
    },
  });

  const updateTeamPegMutation = useMutation({
    mutationFn: async ({ teamId, pegNumber }: { teamId: string; pegNumber: number }) => {
      return await apiRequest("PUT", `/api/admin/teams/${teamId}/peg`, { pegNumber });
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/teams`] });
      }
      toast({
        title: "Peg assigned",
        description: "Team peg has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign peg to team",
        variant: "destructive",
      });
    },
  });

  const submitWeightMutation = useMutation({
    mutationFn: async (data: { competitionId: string; userId?: string; teamId?: string; pegNumber: number; weight: string }) => {
      return await apiRequest("POST", "/api/admin/leaderboard", data);
    },
    onSuccess: (data, variables) => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/leaderboard`] });
        // Invalidate participant entries if they are viewing the same participant
        if (selectedParticipant && variables.userId && selectedParticipant.userId === variables.userId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/competitions/${selectedCompetition.id}/participants/${variables.userId}/entries`] 
          });
        }
        // Invalidate team entries if they are viewing the same team
        if (selectedTeam && variables.teamId && selectedTeam.id === variables.teamId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/competitions/${selectedCompetition.id}/teams/${variables.teamId}/entries`] 
          });
        }
      }
      
      // Get display name based on competition mode
      let displayName = `Peg ${variables.pegNumber}`;
      if (selectedCompetition?.competitionMode === "team" && variables.teamId) {
        const team = teams.find(t => t.id === variables.teamId);
        displayName = team?.teamName || displayName;
      } else if (variables.userId) {
        const participant = participants.find(p => p.userId === variables.userId);
        displayName = participant?.name || displayName;
      }
      
      const newEntry = {
        peg: variables.pegNumber,
        weight: parseFloat(variables.weight),
        angler: displayName,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
      };
      
      const existingEntries = weighInEntries[selectedCompetition?.id || ""] || [];
      setWeighInEntries({
        ...weighInEntries,
        [selectedCompetition?.id || ""]: [newEntry, ...existingEntries]
      });
      
      setWeighInForm({ pegNumber: "", pounds: "", ounces: "" });
      
      toast({
        title: "Weight recorded",
        description: `${formatWeight(variables.weight)} recorded for ${displayName} (Peg ${variables.pegNumber})`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record weight",
        variant: "destructive",
      });
    },
  });

  const updateWeightMutation = useMutation({
    mutationFn: async ({ entryId, weight }: { entryId: string; weight: string }) => {
      return await apiRequest("PUT", `/api/admin/leaderboard/${entryId}`, { weight });
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/leaderboard`] });
        if (selectedParticipant) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/competitions/${selectedCompetition.id}/participants/${selectedParticipant.userId}/entries`] 
          });
        }
        if (selectedTeam) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/competitions/${selectedCompetition.id}/teams/${selectedTeam.id}/entries`] 
          });
        }
      }
      setEditingEntryId(null);
      setEditPounds("");
      setEditOunces("");
      toast({
        title: "Weight updated",
        description: "The weight entry has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update weight",
        variant: "destructive",
      });
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: async (entryId: string) => {
      return await apiRequest("DELETE", `/api/admin/leaderboard/${entryId}`);
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/leaderboard`] });
        if (selectedParticipant) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/competitions/${selectedCompetition.id}/participants/${selectedParticipant.userId}/entries`] 
          });
        }
        if (selectedTeam) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/admin/competitions/${selectedCompetition.id}/teams/${selectedTeam.id}/entries`] 
          });
        }
      }
      toast({
        title: "Weight deleted",
        description: "The weight entry has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete weight",
        variant: "destructive",
      });
    },
  });

  const updatePegMutation = useMutation({
    mutationFn: async ({ participantId, pegNumber }: { participantId: string; pegNumber: number }) => {
      return await apiRequest("PUT", `/api/admin/participants/${participantId}/peg`, { pegNumber });
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/participants`] });
      }
      toast({
        title: "Peg updated",
        description: "The peg number has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update peg",
        variant: "destructive",
      });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async ({ competitionId, userId }: { competitionId: string; userId: string }) => {
      return await apiRequest("POST", `/api/admin/competitions/${competitionId}/participants`, { userId });
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/participants`] });
        queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      }
      setSelectedUserId("");
      toast({
        title: "Participant added",
        description: "The angler has been added to the competition successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add participant",
        variant: "destructive",
      });
    },
  });

  const removeParticipantMutation = useMutation({
    mutationFn: async (participantId: string) => {
      return await apiRequest("DELETE", `/api/admin/participants/${participantId}`);
    },
    onSuccess: () => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/participants`] });
        queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      }
      toast({
        title: "Participant removed",
        description: "The angler has been removed from the competition.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    endDate: "",
    time: "",
    endTime: "",
    venue: "",
    pegsTotal: "",
    entryFee: "",
    prizePool: "",
    prizeType: "pool",
    type: "",
    description: "",
    imageUrl: "",
    competitionMode: "individual",
    maxTeamMembers: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'competitions');
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Image upload failed');
    }
    
    const data = await response.json();
    return data.url;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      endDate: "",
      time: "",
      endTime: "",
      venue: "",
      pegsTotal: "",
      entryFee: "",
      prizePool: "",
      prizeType: "pool",
      type: "",
      description: "",
      imageUrl: "",
      competitionMode: "individual",
      maxTeamMembers: "",
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleCreate = async () => {
    let imageUrl = formData.imageUrl;
    
    // Upload image if a file was selected
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        return;
      }
    }
    
    const competitionData: any = {
      name: formData.name,
      date: formData.date,
      endDate: formData.endDate || null,
      time: formData.time,
      endTime: formData.endTime || null,
      venue: formData.venue,
      pegsTotal: parseInt(formData.pegsTotal),
      entryFee: formData.entryFee,
      prizePool: formData.prizePool,
      description: formData.description,
      competitionMode: formData.competitionMode,
      type: formData.type,
      imageUrl: imageUrl || null,
    };
    
    if (formData.competitionMode === "team" && formData.maxTeamMembers) {
      competitionData.maxTeamMembers = parseInt(formData.maxTeamMembers);
    }
    
    console.log('[COMPETITION DEBUG] Creating competition with data:', competitionData);
    
    createMutation.mutate(competitionData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedCompetition) return;

    let imageUrl = formData.imageUrl;
    
    // Upload image if a new file was selected
    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive",
        });
        return;
      }
    }

    updateMutation.mutate({
      id: selectedCompetition.id,
      data: {
        name: formData.name,
        date: formData.date,
        endDate: formData.endDate || null,
        time: formData.time,
        endTime: formData.endTime || null,
        venue: formData.venue,
        pegsTotal: parseInt(formData.pegsTotal),
        entryFee: formData.entryFee,
        prizePool: formData.prizePool,
        competitionMode: formData.competitionMode,
        maxTeamMembers: formData.competitionMode === "team" && formData.maxTeamMembers 
          ? parseInt(formData.maxTeamMembers) 
          : null,
        prizeType: formData.prizeType,
        type: formData.type,
        description: formData.description,
        imageUrl: imageUrl || null,
      },
    });
    setIsEditOpen(false);
    setSelectedCompetition(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const openEditDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    setFormData({
      name: competition.name,
      date: competition.date,
      endDate: competition.endDate || "",
      time: competition.time,
      endTime: competition.endTime || "",
      venue: competition.venue,
      pegsTotal: competition.pegsTotal.toString(),
      entryFee: competition.entryFee,
      prizePool: competition.prizePool,
      prizeType: competition.prizeType || "pool",
      type: competition.type,
      description: competition.description,
      imageUrl: competition.imageUrl || "",
      competitionMode: competition.competitionMode || "individual",
      maxTeamMembers: competition.maxTeamMembers?.toString() || "",
    });
    setImagePreview(competition.imageUrl || "");
    setIsEditOpen(true);
  };

  const openPegAssignment = (competition: Competition) => {
    setSelectedCompetition(competition);
    setIsPegAssignmentOpen(true);
  };

  const openWeighIn = (competition: Competition) => {
    setSelectedCompetition(competition);
    setIsWeighInOpen(true);
  };

  const openAnglersDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    setIsAnglersOpen(true);
  };

  const openPaymentsDialog = (competition: Competition) => {
    setSelectedCompetition(competition);
    setIsPaymentsOpen(true);
  };

  const handleAddParticipant = () => {
    if (!selectedCompetition || !selectedUserId) {
      toast({
        title: "Error",
        description: "Please select an angler to add",
        variant: "destructive",
      });
      return;
    }

    addParticipantMutation.mutate({
      competitionId: selectedCompetition.id,
      userId: selectedUserId,
    });
  };

  const handleRemoveParticipant = (participantId: string, participantName: string) => {
    if (window.confirm(`Are you sure you want to remove ${participantName} from this competition?`)) {
      removeParticipantMutation.mutate(participantId);
    }
  };

  const handleAutoAssignPegs = () => {
    if (!selectedCompetition) return;
    
    if (participants.length === 0) {
      toast({
        title: "No participants",
        description: "No anglers have registered for this competition yet.",
        variant: "destructive",
      });
      return;
    }
    
    const totalPegs = selectedCompetition.pegsTotal;
    const anglersToAssign = Math.min(participants.length, totalPegs);
    
    // Create assignments with participantId for API
    const assignments = participants.slice(0, anglersToAssign).map((participant, index) => ({
      participantId: participant.id,
      pegNumber: index + 1,
    }));
    
    // Call mutation to persist to database
    assignPegsMutation.mutate({
      competitionId: selectedCompetition.id,
      assignments,
    });
  };

  const handleRandomDraw = () => {
    if (!selectedCompetition) return;
    
    if (participants.length === 0) {
      toast({
        title: "No participants",
        description: "No anglers have registered for this competition yet.",
        variant: "destructive",
      });
      return;
    }
    
    const totalPegs = selectedCompetition.pegsTotal;
    const anglersToAssign = Math.min(participants.length, totalPegs);
    
    // Create array of peg numbers
    const availablePegs = Array.from({ length: totalPegs }, (_, i) => i + 1);
    
    // Fisher-Yates shuffle
    for (let i = availablePegs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availablePegs[i], availablePegs[j]] = [availablePegs[j], availablePegs[i]];
    }
    
    // Create assignments with participantId for API
    const assignments = participants.slice(0, anglersToAssign).map((participant, index) => ({
      participantId: participant.id,
      pegNumber: availablePegs[index],
    }));
    
    // Call mutation to persist to database
    assignPegsMutation.mutate({
      competitionId: selectedCompetition.id,
      assignments,
    });
  };

  const handleSubmitWeight = () => {
    if (!selectedCompetition || !weighInForm.pegNumber || !weighInForm.pounds || !weighInForm.ounces) {
      toast({
        title: "Error",
        description: "Please enter peg number, pounds, and ounces.",
        variant: "destructive",
      });
      return;
    }
    
    const pegNumber = parseInt(weighInForm.pegNumber);
    const pounds = parseInt(weighInForm.pounds);
    const ounces = parseInt(weighInForm.ounces);
    
    // Validate numeric values
    if (!Number.isFinite(pounds) || !Number.isFinite(ounces) || pounds < 0 || ounces < 0) {
      toast({
        title: "Invalid weight",
        description: "Please select valid pounds and ounces.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if at least some weight is entered
    if (pounds === 0 && ounces === 0) {
      toast({
        title: "Invalid weight",
        description: "Weight must be greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    // Convert to total ounces for storage
    const totalOunces = convertToOunces(pounds, ounces);
    
    // Handle team competitions
    if (selectedCompetition.competitionMode === "team") {
      // Find team assigned to this peg
      const team = teams.find(t => t.pegNumber === pegNumber);
      
      if (!team) {
        toast({
          title: "Error",
          description: `No team assigned to peg ${pegNumber}`,
          variant: "destructive",
        });
        return;
      }
      
      // Submit to database with teamId instead of userId
      submitWeightMutation.mutate({
        competitionId: selectedCompetition.id,
        teamId: team.id,
        pegNumber: pegNumber,
        weight: totalOunces.toString(),
      });
    } else {
      // Find angler assigned to this peg from participants
      const participant = participants.find(p => p.pegNumber === pegNumber);
      
      if (!participant) {
        toast({
          title: "Error",
          description: `No angler assigned to peg ${pegNumber}`,
          variant: "destructive",
        });
        return;
      }
      
      // Submit to database (weight stored as total ounces in string format)
      submitWeightMutation.mutate({
        competitionId: selectedCompetition.id,
        userId: participant.userId,
        pegNumber: pegNumber,
        weight: totalOunces.toString(),
      });
    }
  };

  const filteredCompetitions = competitions.filter(
    (comp) => filter === "all" || getCompetitionStatus(comp) === filter
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "live":
        return "default";
      case "upcoming":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Competition Management</h2>
          <p className="text-muted-foreground">
            Create and manage fishing competitions
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-competition">
          <Plus className="h-4 w-4 mr-2" />
          Create Competition
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
          data-testid="filter-all"
        >
          All
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
          size="sm"
          data-testid="filter-upcoming"
        >
          Upcoming
        </Button>
        <Button
          variant={filter === "live" ? "default" : "outline"}
          onClick={() => setFilter("live")}
          size="sm"
          data-testid="filter-live"
        >
          Live
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          size="sm"
          data-testid="filter-completed"
        >
          Completed
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competition</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Lake</TableHead>
                <TableHead>Pegs</TableHead>
                <TableHead>Entry Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading competitions...
                  </TableCell>
                </TableRow>
              ) : filteredCompetitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No competitions found. Click "Add Competition" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompetitions.map((competition) => (
                  <TableRow key={competition.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{competition.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                        {competition.type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(competition.date).toLocaleDateString('en-GB', { timeZone: 'Europe/London' })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {competition.time}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {competition.venue}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {competition.pegsBooked}/{competition.pegsTotal}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>£{competition.entryFee}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(getCompetitionStatus(competition))}>
                      {getCompetitionStatus(competition)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {getCompetitionStatus(competition) === "upcoming" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPegAssignment(competition)}
                          data-testid={`button-assign-pegs-${competition.id}`}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Pegs
                        </Button>
                      )}
                      {getCompetitionStatus(competition) === "live" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openWeighIn(competition)}
                          data-testid={`button-weigh-in-${competition.id}`}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          Weigh-in
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAnglersDialog(competition)}
                        data-testid={`button-anglers-${competition.id}`}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Anglers
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentsDialog(competition)}
                        data-testid={`button-payments-${competition.id}`}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Payments
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(competition)}
                        data-testid={`button-edit-${competition.id}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(competition.id)}
                        data-testid={`button-delete-${competition.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Competition</DialogTitle>
            <DialogDescription>
              Add a new fishing competition to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Competition Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Spring Carp Qualifier"
                data-testid="input-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualifier">Qualifier</SelectItem>
                    <SelectItem value="semi-final">Semi-Final</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="venue">Lake Name</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Willow Lake Fishery"
                  data-testid="input-venue"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="competitionMode">Competition Mode</Label>
                <Select
                  value={formData.competitionMode}
                  onValueChange={(value) => setFormData({ ...formData, competitionMode: value })}
                >
                  <SelectTrigger data-testid="select-competition-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.competitionMode === "team" && (
                <div className="grid gap-2">
                  <Label htmlFor="maxTeamMembers">Max Team Members</Label>
                  <Input
                    id="maxTeamMembers"
                    type="number"
                    min="2"
                    value={formData.maxTeamMembers}
                    onChange={(e) => setFormData({ ...formData, maxTeamMembers: e.target.value })}
                    placeholder="4"
                    data-testid="input-max-team-members"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Start Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="time">Start Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  data-testid="input-time"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pegsTotal">Total Pegs</Label>
                <Input
                  id="pegsTotal"
                  type="number"
                  value={formData.pegsTotal}
                  onChange={(e) =>
                    setFormData({ ...formData, pegsTotal: e.target.value })
                  }
                  placeholder="40"
                  data-testid="input-pegs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entryFee">Entry Fee (£)</Label>
                <Input
                  id="entryFee"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) =>
                    setFormData({ ...formData, entryFee: e.target.value })
                  }
                  placeholder="45"
                  data-testid="input-entry-fee"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prizeType">Prize Type</Label>
                <Select
                  value={formData.prizeType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, prizeType: value })
                  }
                >
                  <SelectTrigger id="prizeType" data-testid="select-prize-type">
                    <SelectValue placeholder="Select prize type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pool">Pool Prize (£)</SelectItem>
                    <SelectItem value="other">Other Prize</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prizePool">
                {formData.prizeType === "pool" ? "Prize Pool (£)" : "Prize Description"}
              </Label>
              <Input
                id="prizePool"
                type={formData.prizeType === "pool" ? "number" : "text"}
                value={formData.prizePool}
                onChange={(e) =>
                  setFormData({ ...formData, prizePool: e.target.value })
                }
                placeholder={formData.prizeType === "pool" ? "1200" : "e.g., Fishing rod and tackle set"}
                data-testid="input-prize-pool"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Competition details and rules..."
                data-testid="input-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Competition Image</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Recommended: 800x600px or 4:3 aspect ratio for optimal display (Max 8MB)
              </p>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                data-testid="input-image-file"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-full object-contain rounded-md" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleCreate} data-testid="button-submit">Create Competition</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
            <DialogDescription>
              Update competition details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Competition Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qualifier">Qualifier</SelectItem>
                    <SelectItem value="semi-final">Semi-Final</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-venue">Lake Name</Label>
                <Input
                  id="edit-venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  data-testid="input-edit-venue"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-competitionMode">Competition Mode</Label>
                <Select
                  value={formData.competitionMode}
                  onValueChange={(value) => setFormData({ ...formData, competitionMode: value })}
                >
                  <SelectTrigger data-testid="select-edit-competition-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.competitionMode === "team" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-maxTeamMembers">Max Team Members</Label>
                  <Input
                    id="edit-maxTeamMembers"
                    type="number"
                    min="2"
                    value={formData.maxTeamMembers}
                    onChange={(e) => setFormData({ ...formData, maxTeamMembers: e.target.value })}
                    placeholder="4"
                    data-testid="input-edit-max-team-members"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Start Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="input-edit-date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  data-testid="input-edit-end-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-time">Start Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  data-testid="input-edit-time"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endTime">End Time</Label>
                <Input
                  id="edit-endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  data-testid="input-edit-end-time"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-pegsTotal">Total Pegs</Label>
                <Input
                  id="edit-pegsTotal"
                  type="number"
                  value={formData.pegsTotal}
                  onChange={(e) =>
                    setFormData({ ...formData, pegsTotal: e.target.value })
                  }
                  data-testid="input-edit-pegs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-entryFee">Entry Fee (£)</Label>
                <Input
                  id="edit-entryFee"
                  type="number"
                  value={formData.entryFee}
                  onChange={(e) =>
                    setFormData({ ...formData, entryFee: e.target.value })
                  }
                  data-testid="input-edit-entry-fee"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-prizeType">Prize Type</Label>
                <Select
                  value={formData.prizeType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, prizeType: value })
                  }
                >
                  <SelectTrigger id="edit-prizeType" data-testid="select-edit-prize-type">
                    <SelectValue placeholder="Select prize type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pool">Pool Prize (£)</SelectItem>
                    <SelectItem value="other">Other Prize</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-prizePool">
                {formData.prizeType === "pool" ? "Prize Pool (£)" : "Prize Description"}
              </Label>
              <Input
                id="edit-prizePool"
                type={formData.prizeType === "pool" ? "number" : "text"}
                value={formData.prizePool}
                onChange={(e) =>
                  setFormData({ ...formData, prizePool: e.target.value })
                }
                placeholder={formData.prizeType === "pool" ? "1200" : "e.g., Fishing rod and tackle set"}
                data-testid="input-edit-prize-pool"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Competition Image</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Recommended dimensions: 1200 x 400 pixels (3:1 aspect ratio) for optimal display on competition listings
              </p>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                data-testid="input-edit-image-file"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-full object-contain rounded-md" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEdit} data-testid="button-save-edit">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPegAssignmentOpen} onOpenChange={setIsPegAssignmentOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Peg Assignment - {selectedCompetition?.name}</DialogTitle>
            <DialogDescription>
              {selectedCompetition?.competitionMode === "team" 
                ? "Assign teams to pegs for this competition"
                : "Assign anglers to pegs for this competition"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Assign Pegs</CardTitle>
                <CardDescription>
                  {selectedCompetition?.competitionMode === "team"
                    ? "Automatically assign registered teams to available pegs"
                    : "Automatically assign registered anglers to available pegs"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={handleAutoAssignPegs} data-testid="button-auto-assign">
                    <Users className="h-4 w-4 mr-2" />
                    Auto-Assign All Pegs
                  </Button>
                  <Button variant="outline" onClick={handleRandomDraw} data-testid="button-random-draw">
                    Random Draw
                  </Button>
                </div>
              </CardContent>
            </Card>

            {selectedCompetition?.competitionMode === "team" && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Team Assignments</CardTitle>
                  <CardDescription>
                    {teams.filter(t => t.pegNumber > 0).length} / {teams.length} teams assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teams.filter(t => t.pegNumber > 0).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No teams assigned yet. Use Auto-Assign or Random Draw above to get started.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peg</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Members</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teams
                          .filter(t => t.pegNumber > 0)
                          .sort((a, b) => a.pegNumber - b.pegNumber)
                          .map((team) => (
                            <TableRow key={team.id}>
                            <TableCell>
                              {editingPegParticipantId === team.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={editPegNumber}
                                    onChange={(e) => setEditPegNumber(e.target.value)}
                                    className="w-20 h-8"
                                    data-testid={`input-edit-team-peg-${team.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const pegNum = parseInt(editPegNumber);
                                      const maxPegs = selectedCompetition?.pegsTotal || 0;
                                      
                                      if (isNaN(pegNum) || pegNum < 1 || pegNum > maxPegs) {
                                        toast({
                                          title: "Invalid peg number",
                                          description: `Please enter a number between 1 and ${maxPegs}`,
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      updateTeamPegMutation.mutate({ 
                                        teamId: team.id, 
                                        pegNumber: pegNum 
                                      });
                                      setEditingPegParticipantId(null);
                                      setEditPegNumber("");
                                    }}
                                    disabled={!editPegNumber || updateTeamPegMutation.isPending}
                                    data-testid={`button-save-team-peg-${team.id}`}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingPegParticipantId(null);
                                      setEditPegNumber("");
                                    }}
                                    data-testid={`button-cancel-team-peg-${team.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className="font-mono">
                                  {team.pegNumber}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">{team.teamName}</TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {editingPegParticipantId !== team.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingPegParticipantId(team.id);
                                    setEditPegNumber(team.pegNumber.toString());
                                  }}
                                  data-testid={`button-edit-team-peg-${team.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedCompetition?.competitionMode === "individual" && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                  <CardDescription>
                    {participants.filter(p => p.pegNumber > 0).length} / {participants.length} pegs assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {participants.filter(p => p.pegNumber > 0).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No anglers assigned yet. Use Auto-Assign or Random Draw above to get started.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Peg</TableHead>
                          <TableHead>Angler</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants
                        .filter(p => p.pegNumber > 0)
                        .sort((a, b) => a.pegNumber - b.pegNumber)
                        .map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell>
                              {editingPegParticipantId === participant.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={editPegNumber}
                                    onChange={(e) => setEditPegNumber(e.target.value)}
                                    className="w-20 h-8"
                                    data-testid={`input-edit-peg-${participant.id}`}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const pegNum = parseInt(editPegNumber);
                                      const maxPegs = selectedCompetition?.pegsTotal || 0;
                                      
                                      if (isNaN(pegNum) || pegNum < 1 || pegNum > maxPegs) {
                                        toast({
                                          title: "Invalid peg number",
                                          description: `Please enter a number between 1 and ${maxPegs}`,
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      updatePegMutation.mutate({ 
                                        participantId: participant.id, 
                                        pegNumber: pegNum 
                                      });
                                      setEditingPegParticipantId(null);
                                      setEditPegNumber("");
                                    }}
                                    disabled={!editPegNumber || updatePegMutation.isPending}
                                    data-testid={`button-save-peg-${participant.id}`}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingPegParticipantId(null);
                                      setEditPegNumber("");
                                    }}
                                    data-testid={`button-cancel-peg-${participant.id}`}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className="font-mono">
                                  {participant.pegNumber}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{participant.name}</TableCell>
                            <TableCell className="text-right">
                              {editingPegParticipantId !== participant.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingPegParticipantId(participant.id);
                                    setEditPegNumber(participant.pegNumber.toString());
                                  }}
                                  data-testid={`button-edit-peg-${participant.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPegAssignmentOpen(false)} data-testid="button-close-peg">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWeighInOpen} onOpenChange={setIsWeighInOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Weigh-in Entry - {selectedCompetition?.name}</DialogTitle>
            <DialogDescription>
              Enter catch weights for live leaderboard updates
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="peg-number">Peg Number</Label>
                <Input
                  id="peg-number"
                  type="number"
                  placeholder="23"
                  value={weighInForm.pegNumber}
                  onChange={(e) => setWeighInForm({ ...weighInForm, pegNumber: e.target.value })}
                  data-testid="input-peg-number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pounds">Pounds</Label>
                <Select
                  value={weighInForm.pounds}
                  onValueChange={(value) => setWeighInForm({ ...weighInForm, pounds: value })}
                >
                  <SelectTrigger id="pounds" data-testid="select-pounds">
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {Array.from({ length: 101 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} lb
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ounces">Ounces</Label>
                <Select
                  value={weighInForm.ounces}
                  onValueChange={(value) => setWeighInForm({ ...weighInForm, ounces: value })}
                >
                  <SelectTrigger id="ounces" data-testid="select-ounces">
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} oz
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>&nbsp;</Label>
                <Button className="w-full" onClick={handleSubmitWeight} data-testid="button-submit-weight">
                  Submit Weight
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedCompetition?.competitionMode === "team" ? "View Team Entries" : "View Participant Entries"}
                  </CardTitle>
                  <DialogDescription>
                    {selectedCompetition?.competitionMode === "team" 
                      ? "Select a peg to view all weight entries for that team"
                      : "Select a peg to view all weight entries for that participant"}
                  </DialogDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="view-peg">Select Peg</Label>
                      <select
                        id="view-peg"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:bg-background [&>option]:text-foreground"
                        value={selectedPegForView || ""}
                        onChange={(e) => setSelectedPegForView(e.target.value ? parseInt(e.target.value) : null)}
                        data-testid="select-view-peg"
                      >
                        <option value="">-- Select Peg --</option>
                        {selectedCompetition?.competitionMode === "team" ? (
                          teams
                            .filter(t => t.pegNumber !== null && t.pegNumber > 0)
                            .sort((a, b) => (a.pegNumber || 0) - (b.pegNumber || 0))
                            .map((t) => (
                              <option key={t.id} value={t.pegNumber}>
                                Peg {t.pegNumber} - {t.name}
                              </option>
                            ))
                        ) : (
                          participants
                            .filter(p => p.pegNumber > 0)
                            .sort((a, b) => a.pegNumber - b.pegNumber)
                            .map((p) => (
                              <option key={p.id} value={p.pegNumber}>
                                Peg {p.pegNumber} - {p.name}
                              </option>
                            ))
                        )}
                      </select>
                    </div>

                    {selectedPegForView && (selectedParticipant || selectedTeam) && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div>
                            <p className="font-semibold">
                              {selectedTeam ? selectedTeam.teamName : selectedParticipant?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">Peg {selectedPegForView}</p>
                          </div>
                          {(participantEntries || teamEntries) && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Total Weight</p>
                              <p className="text-2xl font-bold">
                                {formatWeight((teamEntries?.totalWeight || participantEntries?.totalWeight) || "0")}
                              </p>
                            </div>
                          )}
                        </div>

                        {((teamEntries && teamEntries.entries.length > 0) || (participantEntries && participantEntries.entries.length > 0)) ? (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">
                              Individual Entries ({(teamEntries?.entries.length || participantEntries?.entries.length) || 0})
                            </p>
                            <div className="space-y-1">
                              {(teamEntries?.entries || participantEntries?.entries || []).map((entry, index) => (
                                <div key={entry.id} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                                  <span className="text-sm text-muted-foreground">
                                    Entry #{((teamEntries?.entries || participantEntries?.entries)?.length || 0) - index}
                                  </span>
                                  {editingEntryId === entry.id ? (
                                    <div className="flex items-center gap-2">
                                      <Select
                                        value={editPounds}
                                        onValueChange={setEditPounds}
                                      >
                                        <SelectTrigger className="w-20 h-8" data-testid={`select-edit-pounds-${entry.id}`}>
                                          <SelectValue placeholder="lb" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px]">
                                          {Array.from({ length: 101 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                              {i} lb
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={editOunces}
                                        onValueChange={setEditOunces}
                                      >
                                        <SelectTrigger className="w-20 h-8" data-testid={`select-edit-ounces-${entry.id}`}>
                                          <SelectValue placeholder="oz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 16 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                              {i} oz
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const totalOunces = convertToOunces(parseInt(editPounds), parseInt(editOunces));
                                          updateWeightMutation.mutate({ entryId: entry.id, weight: totalOunces.toString() });
                                        }}
                                        disabled={!editPounds || !editOunces || updateWeightMutation.isPending}
                                        data-testid={`button-save-weight-${entry.id}`}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingEntryId(null);
                                          setEditPounds("");
                                          setEditOunces("");
                                        }}
                                        data-testid={`button-cancel-edit-${entry.id}`}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{formatWeight(entry.weight)}</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setEditingEntryId(entry.id);
                                          const { pounds, ounces } = convertFromOunces(parseFloat(entry.weight));
                                          setEditPounds(pounds.toString());
                                          setEditOunces(ounces.toString());
                                        }}
                                        data-testid={`button-edit-weight-${entry.id}`}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          if (confirm('Are you sure you want to delete this weight entry?')) {
                                            deleteWeightMutation.mutate(entry.id);
                                          }
                                        }}
                                        disabled={deleteWeightMutation.isPending}
                                        data-testid={`button-delete-weight-${entry.id}`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground p-3 text-center border rounded-md">
                            No weights entered for this participant yet
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCompetition && weighInEntries[selectedCompetition.id]?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Peg</TableHead>
                          <TableHead>Angler</TableHead>
                          <TableHead>Weight</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {weighInEntries[selectedCompetition.id].slice(0, 10).map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-muted-foreground">{entry.time}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {entry.peg}
                              </Badge>
                            </TableCell>
                            <TableCell>{entry.angler}</TableCell>
                            <TableCell className="font-semibold">{formatWeight(entry.weight)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No weights entered yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsWeighInOpen(false)} data-testid="button-close-weigh-in">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAnglersOpen} onOpenChange={setIsAnglersOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Competition Anglers</DialogTitle>
            <DialogDescription>
              {selectedCompetition?.name} - Add or remove anglers from this competition
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Angler</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1" data-testid="select-angler">
                      <SelectValue placeholder="Select an angler to add..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950 text-black dark:text-white">
                      {allUsers
                        .filter(user => !participants.some(p => p.userId === user.id))
                        .map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName} {user.lastName} (@{user.username}) {user.club && `- ${user.club}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddParticipant}
                    disabled={!selectedUserId || addParticipantMutation.isPending}
                    data-testid="button-add-participant"
                  >
                    {addParticipantMutation.isPending ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Participants ({participants.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Angler</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Peg</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map(participant => (
                        <TableRow key={participant.id}>
                          <TableCell>
                            <div className="font-medium">{participant.name}</div>
                          </TableCell>
                          <TableCell>{participant.club || "-"}</TableCell>
                          <TableCell>
                            {participant.pegNumber ? (
                              <Badge variant="outline" className="font-mono">
                                {participant.pegNumber}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(participant.joinedAt).toLocaleDateString('en-GB', { 
                              timeZone: 'Europe/London' 
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveParticipant(participant.id, participant.name)}
                              disabled={removeParticipantMutation.isPending}
                              data-testid={`button-remove-participant-${participant.id}`}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No participants yet. Add anglers using the form above.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsAnglersOpen(false)} data-testid="button-close-anglers">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentsOpen} onOpenChange={setIsPaymentsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payments - {selectedCompetition?.name}</DialogTitle>
            <DialogDescription>
              View all payments for this competition
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {paymentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="mt-3 text-muted-foreground">Loading payments...</p>
              </div>
            ) : payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Angler</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Intent ID</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                      <TableCell>
                        <div className="font-medium">{payment.userName}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.userEmail}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          £{(payment.amount / 100).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.status === "succeeded" ? "default" : "secondary"}
                          data-testid={`badge-payment-status-${payment.id}`}
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {payment.stripePaymentIntentId}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payment.createdAt).toLocaleDateString('en-GB', { 
                          timeZone: 'Europe/London',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payments recorded for this competition yet.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPaymentsOpen(false)} data-testid="button-close-payments">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
