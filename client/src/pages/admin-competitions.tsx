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
import { Plus, Pencil, Trash2, MapPin, Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Competition } from "@shared/schema";

export default function AdminCompetitions() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPegAssignmentOpen, setIsPegAssignmentOpen] = useState(false);
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
  
  // Weigh-in state
  const [weighInEntries, setWeighInEntries] = useState<Record<string, { peg: number; weight: number; angler: string; time: string }[]>>({});
  const [weighInForm, setWeighInForm] = useState({ pegNumber: "", weight: "" });

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
    enabled: !!selectedCompetition && (isPegAssignmentOpen || isWeighInOpen),
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create competition",
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
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update competition",
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

  const submitWeightMutation = useMutation({
    mutationFn: async (data: { competitionId: string; userId: string; pegNumber: number; weight: string }) => {
      return await apiRequest("POST", "/api/admin/leaderboard", data);
    },
    onSuccess: (data, variables) => {
      if (selectedCompetition) {
        queryClient.invalidateQueries({ queryKey: [`/api/competitions/${selectedCompetition.id}/leaderboard`] });
      }
      const participant = participants.find(p => p.pegNumber === variables.pegNumber);
      const anglerName = participant?.name || `Peg ${variables.pegNumber}`;
      
      const newEntry = {
        peg: variables.pegNumber,
        weight: parseFloat(variables.weight),
        angler: anglerName,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
      };
      
      const existingEntries = weighInEntries[selectedCompetition?.id || ""] || [];
      setWeighInEntries({
        ...weighInEntries,
        [selectedCompetition?.id || ""]: [newEntry, ...existingEntries]
      });
      
      setWeighInForm({ pegNumber: "", weight: "" });
      
      toast({
        title: "Weight recorded",
        description: `${variables.weight} lbs recorded for ${anglerName} (Peg ${variables.pegNumber})`,
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

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    endTime: "",
    venue: "",
    pegsTotal: "",
    entryFee: "",
    prizePool: "",
    type: "",
    description: "",
    imageUrl: "",
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
      time: "",
      endTime: "",
      venue: "",
      pegsTotal: "",
      entryFee: "",
      prizePool: "",
      type: "",
      description: "",
      imageUrl: "",
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
    
    createMutation.mutate({
      name: formData.name,
      date: formData.date,
      time: formData.time,
      endTime: formData.endTime || null,
      venue: formData.venue,
      pegsTotal: parseInt(formData.pegsTotal),
      pegsBooked: 0,
      entryFee: formData.entryFee,
      prizePool: formData.prizePool,
      status: "upcoming",
      description: formData.description,
      type: formData.type,
      imageUrl: imageUrl || null,
    });
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
        time: formData.time,
        endTime: formData.endTime || null,
        venue: formData.venue,
        pegsTotal: parseInt(formData.pegsTotal),
        entryFee: formData.entryFee,
        prizePool: formData.prizePool,
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
      time: competition.time,
      endTime: competition.endTime || "",
      venue: competition.venue,
      pegsTotal: competition.pegsTotal.toString(),
      entryFee: competition.entryFee,
      prizePool: competition.prizePool,
      type: competition.type,
      description: competition.description,
      imageUrl: competition.imageUrl || "",
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
    if (!selectedCompetition || !weighInForm.pegNumber || !weighInForm.weight) {
      toast({
        title: "Error",
        description: "Please enter both peg number and weight.",
        variant: "destructive",
      });
      return;
    }
    
    const pegNumber = parseInt(weighInForm.pegNumber);
    const weight = parseFloat(weighInForm.weight);
    
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
    
    // Submit to database (weight must be string as per schema)
    submitWeightMutation.mutate({
      competitionId: selectedCompetition.id,
      userId: participant.userId,
      pegNumber: pegNumber,
      weight: weight.toString(),
    });
  };

  const filteredCompetitions = competitions.filter(
    (comp) => filter === "all" || getCompetitionStatus(comp) === filter
  );

  // Helper function to compute competition status based on date and time
  const getCompetitionStatus = (comp: Competition): string => {
    const now = new Date();
    const compDate = new Date(comp.date);
    const startDateTime = comp.time ? new Date(`${comp.date}T${comp.time}`) : compDate;
    
    // If no end time specified, assume competition ends at end of day (23:59:59)
    let endDateTime: Date;
    if (comp.endTime) {
      endDateTime = new Date(`${comp.date}T${comp.endTime}`);
    } else {
      // Set to end of day (23:59:59)
      endDateTime = new Date(comp.date);
      endDateTime.setHours(23, 59, 59, 999);
    }
    
    // Compute status based on start and end times
    if (now < startDateTime) {
      return "upcoming";  // Before start time
    } else if (now >= startDateTime && now <= endDateTime) {
      return "live";  // Between start and end time
    } else {
      return "completed";  // After end time
    }
  };

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
                <TableHead>Venue</TableHead>
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
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Willow Lake Fishery"
                  data-testid="input-venue"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-date"
              />
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
                <Label htmlFor="prizePool">Prize Pool (£)</Label>
                <Input
                  id="prizePool"
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) =>
                    setFormData({ ...formData, prizePool: e.target.value })
                  }
                  placeholder="1200"
                  data-testid="input-prize-pool"
                />
              </div>
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
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                data-testid="input-image-file"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-md" />
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
                <Label htmlFor="edit-venue">Venue</Label>
                <Input
                  id="edit-venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  data-testid="input-edit-venue"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                data-testid="input-edit-date"
              />
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
                <Label htmlFor="edit-prizePool">Prize Pool (£)</Label>
                <Input
                  id="edit-prizePool"
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) =>
                    setFormData({ ...formData, prizePool: e.target.value })
                  }
                  data-testid="input-edit-prize-pool"
                />
              </div>
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
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                data-testid="input-edit-image-file"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-md" />
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
              Assign anglers to pegs for this competition
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Assign Pegs</CardTitle>
                <CardDescription>
                  Automatically assign registered anglers to available pegs
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

            {selectedCompetition && participants.filter(p => p.pegNumber > 0).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                  <CardDescription>
                    {participants.filter(p => p.pegNumber > 0).length} pegs assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Peg</TableHead>
                        <TableHead>Angler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants
                        .filter(p => p.pegNumber > 0)
                        .sort((a, b) => a.pegNumber - b.pegNumber)
                        .map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {participant.pegNumber}
                              </Badge>
                            </TableCell>
                            <TableCell>{participant.name}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
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
            <div className="grid grid-cols-3 gap-4">
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
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  placeholder="12.5"
                  value={weighInForm.weight}
                  onChange={(e) => setWeighInForm({ ...weighInForm, weight: e.target.value })}
                  data-testid="input-weight"
                />
              </div>
              <div className="grid gap-2">
                <Label>&nbsp;</Label>
                <Button className="w-full" onClick={handleSubmitWeight} data-testid="button-submit-weight">
                  Submit Weight
                </Button>
              </div>
            </div>
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
                      {weighInEntries[selectedCompetition.id].map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-muted-foreground">{entry.time}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {entry.peg}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.angler}</TableCell>
                          <TableCell className="font-semibold">{entry.weight} lbs</TableCell>
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
          <DialogFooter>
            <Button onClick={() => setIsWeighInOpen(false)} data-testid="button-close-weigh-in">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
