import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: Omit<User, 'password'> | User;
}

export function EditProfileDialog({ open, onOpenChange, user }: EditProfileDialogProps) {
  const { toast } = useToast();
  const [bio, setBio] = useState(user.bio || "");
  const [club, setClub] = useState(user.club || "");
  const [location, setLocation] = useState(user.location || "");
  const [favouriteMethod, setFavouriteMethod] = useState(user.favouriteMethod || "");
  const [favouriteSpecies, setFavouriteSpecies] = useState(user.favouriteSpecies || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      bio?: string;
      club?: string;
      location?: string;
      favouriteMethod?: string;
      favouriteSpecies?: string;
    }) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      bio,
      club,
      location,
      favouriteMethod,
      favouriteSpecies,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              data-testid="input-bio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="club">Club</Label>
            <Input
              id="club"
              placeholder="Your fishing club"
              value={club}
              onChange={(e) => setClub(e.target.value)}
              data-testid="input-club"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              data-testid="input-location"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="favouriteMethod">Favourite Method</Label>
            <Input
              id="favouriteMethod"
              placeholder="e.g., Feeder, Float, Method"
              value={favouriteMethod}
              onChange={(e) => setFavouriteMethod(e.target.value)}
              data-testid="input-method"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="favouriteSpecies">Favourite Species</Label>
            <Input
              id="favouriteSpecies"
              placeholder="e.g., Carp, Bream, Roach"
              value={favouriteSpecies}
              onChange={(e) => setFavouriteSpecies(e.target.value)}
              data-testid="input-species"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              data-testid="button-save"
            >
              {updateProfileMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
