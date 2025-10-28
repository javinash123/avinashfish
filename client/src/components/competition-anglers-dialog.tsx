import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Trash2, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CompetitionAnglersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competition: any;
}

export function CompetitionAnglersDialog({
  open,
  onOpenChange,
  competition,
}: CompetitionAnglersDialogProps) {
  const { toast } = useToast();
  const [selectedAnglerId, setSelectedAnglerId] = useState("");

  const { data: participants = [], isLoading: participantsLoading } = useQuery<Array<{
    id: string;
    userId: string;
    pegNumber: number;
    name: string;
    club: string;
    avatar: string;
    joinedAt: string;
  }>>({
    queryKey: [`/api/competitions/${competition?.id}/participants`],
    enabled: !!competition && open,
  });

  const { data: allAnglers = [], isLoading: anglersLoading } = useQuery<Array<{
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    club?: string;
    avatar?: string;
    status: string;
  }>>({
    queryKey: ["/api/admin/anglers"],
    enabled: open,
  });

  const addAnglerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/competitions/${competition.id}/join`, { userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${competition.id}/participants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      setSelectedAnglerId("");
      toast({
        title: "Angler added",
        description: "The angler has been added to the competition.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add angler",
        variant: "destructive",
      });
    },
  });

  const removeAnglerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/competitions/${competition.id}/leave`, { userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/competitions/${competition.id}/participants`] });
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      toast({
        title: "Angler removed",
        description: "The angler has been removed from the competition.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove angler",
        variant: "destructive",
      });
    },
  });

  const handleAddAngler = () => {
    if (selectedAnglerId) {
      addAnglerMutation.mutate(selectedAnglerId);
    }
  };

  const handleRemoveAngler = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from this competition?`)) {
      removeAnglerMutation.mutate(userId);
    }
  };

  const availableAnglers = allAnglers.filter(
    (angler) => angler.status === "active" && !participants.some((p) => p.userId === angler.id)
  );

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'A';
  };

  if (!competition) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Anglers - {competition.name}
            </div>
          </DialogTitle>
          <DialogDescription>
            Add or remove anglers from this competition
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedAnglerId} onValueChange={setSelectedAnglerId}>
                <SelectTrigger data-testid="select-angler">
                  <SelectValue placeholder="Select an angler to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableAnglers.map((angler) => (
                    <SelectItem key={angler.id} value={angler.id}>
                      {angler.firstName} {angler.lastName} (@{angler.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddAngler}
              disabled={!selectedAnglerId || addAnglerMutation.isPending}
              data-testid="button-add-angler"
            >
              {addAnglerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Angler
                </>
              )}
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">
                Current Participants ({participants.length} / {competition.pegsTotal})
              </h3>
              <Badge variant={participants.length >= competition.pegsTotal ? "destructive" : "secondary"}>
                {participants.length >= competition.pegsTotal ? "Full" : `${competition.pegsTotal - participants.length} spaces available`}
              </Badge>
            </div>

            {participantsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : participants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Angler</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead className="text-center">Peg</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {participant.avatar && <AvatarImage src={participant.avatar} />}
                            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{participant.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{participant.club || "-"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          {participant.pegNumber || "Not assigned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(participant.joinedAt).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric',
                          timeZone: 'Europe/London'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAngler(participant.userId, participant.name)}
                          disabled={removeAnglerMutation.isPending}
                          data-testid={`button-remove-${participant.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No anglers have joined this competition yet
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
