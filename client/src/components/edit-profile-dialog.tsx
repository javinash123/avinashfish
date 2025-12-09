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
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [bio, setBio] = useState(user.bio || "");
  const [club, setClub] = useState(user.club || "");
  const [location, setLocation] = useState(user.location || "");
  const [favouriteMethod, setFavouriteMethod] = useState(user.favouriteMethod || "");
  const [favouriteSpecies, setFavouriteSpecies] = useState(user.favouriteSpecies || "");
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || "");
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || "");
  const [youtubeUrl, setYoutubeUrl] = useState(user.youtubeUrl || "");
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(user.youtubeVideoUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(user.facebookUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(user.twitterUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(user.instagramUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(user.tiktokUrl || "");

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      bio?: string;
      club?: string;
      location?: string;
      favouriteMethod?: string;
      favouriteSpecies?: string;
      mobileNumber?: string;
      dateOfBirth?: string;
      youtubeUrl?: string;
      youtubeVideoUrl?: string;
      facebookUrl?: string;
      twitterUrl?: string;
      instagramUrl?: string;
      tiktokUrl?: string;
    }) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      const response = await apiRequest("PUT", "/api/user/username", data);
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update username",
        variant: "destructive",
      });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiRequest("PUT", "/api/user/email", data);
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update username if changed
      if (username !== user.username) {
        await updateUsernameMutation.mutateAsync({ username });
      }

      // Update email if changed
      if (email !== user.email) {
        await updateEmailMutation.mutateAsync({ email });
      }

      // Update other profile fields
      updateProfileMutation.mutate({
        bio,
        club,
        location,
        favouriteMethod,
        favouriteSpecies,
        mobileNumber,
        dateOfBirth,
        youtubeUrl,
        youtubeVideoUrl,
        facebookUrl,
        twitterUrl,
        instagramUrl,
        tiktokUrl,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error: any) {
      // Error already shown by mutation error handler
    }
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
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="input-username"
            />
            <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only. 3-20 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="tel"
              placeholder="e.g., 07123456789"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              data-testid="input-mobile"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              data-testid="input-dob"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Social Media</Label>
            <p className="text-sm text-muted-foreground">Add your social media profiles (optional)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeUrl">YouTube Channel URL</Label>
            <Input
              id="youtubeUrl"
              placeholder="https://youtube.com/@yourchannel"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              data-testid="input-youtube"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtubeVideoUrl">Featured YouTube Video</Label>
            <Input
              id="youtubeVideoUrl"
              placeholder="https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
              value={youtubeVideoUrl}
              onChange={(e) => setYoutubeVideoUrl(e.target.value)}
              data-testid="input-youtube-video"
            />
            <p className="text-xs text-muted-foreground">Paste a YouTube video link to showcase on your profile</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              id="facebookUrl"
              placeholder="https://facebook.com/username"
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              data-testid="input-facebook"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="twitterUrl">Twitter/X URL</Label>
            <Input
              id="twitterUrl"
              placeholder="https://twitter.com/username"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              data-testid="input-twitter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              placeholder="https://instagram.com/username"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              data-testid="input-instagram"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">TikTok URL</Label>
            <Input
              id="tiktokUrl"
              placeholder="https://tiktok.com/@username"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              data-testid="input-tiktok"
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
              disabled={updateProfileMutation.isPending || updateUsernameMutation.isPending || updateEmailMutation.isPending}
              data-testid="button-save"
            >
              {(updateProfileMutation.isPending || updateUsernameMutation.isPending || updateEmailMutation.isPending) && (
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
