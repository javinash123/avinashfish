import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface AnglerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  angler?: any;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

const getInitialFormData = (angler?: any) => ({
  firstName: angler?.firstName || "",
  lastName: angler?.lastName || "",
  email: angler?.email || "",
  username: angler?.username || "",
  password: "",
  club: angler?.club || "",
  bio: angler?.bio || "",
  location: angler?.location || "",
  favouriteMethod: angler?.favouriteMethod || "",
  favouriteSpecies: angler?.favouriteSpecies || "",
  mobileNumber: angler?.mobileNumber || "",
  dateOfBirth: angler?.dateOfBirth || "",
  youtubeUrl: angler?.youtubeUrl || "",
  youtubeVideoUrl: angler?.youtubeVideoUrl || "",
  facebookUrl: angler?.facebookUrl || "",
  twitterUrl: angler?.twitterUrl || "",
  instagramUrl: angler?.instagramUrl || "",
  tiktokUrl: angler?.tiktokUrl || "",
  avatar: angler?.avatar || "",
  status: angler?.status || "active",
  isAmbassador: angler?.isAmbassador || false,
});

export function AnglerFormDialog({
  open,
  onOpenChange,
  angler,
  onSubmit,
  isSubmitting,
}: AnglerFormDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(getInitialFormData(angler));
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(angler));
    }
  }, [open, angler]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      uploadFormData.append('type', 'avatar');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      setFormData({ ...formData, avatar: uploadData.url });
      
      toast({
        title: "Avatar uploaded",
        description: "Profile picture has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = () => {
    setFormData({ ...formData, avatar: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitData: any;
    
    if (!angler) {
      // For new anglers, exclude status from initial data
      const { status, ...dataWithoutStatus } = formData;
      submitData = dataWithoutStatus;
    } else {
      // For editing existing anglers
      // Only include password if it's not empty (user wants to change it)
      const { password, ...dataWithoutPassword } = formData;
      if (formData.password && formData.password.trim() !== '') {
        submitData = formData;
      } else {
        submitData = dataWithoutPassword;
      }
    }
    
    onSubmit(submitData);
  };

  const isEdit = !!angler;

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || 'AN';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Angler" : "Create New Angler"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update angler information" : "Add a new angler to the platform"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  {formData.avatar && <AvatarImage src={formData.avatar} alt="Avatar" className="object-cover" />}
                  <AvatarFallback className="text-lg">
                    {getInitials(formData.firstName, formData.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    data-testid="button-upload-avatar"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    {formData.avatar ? "Change Photo" : "Upload Photo"}
                  </Button>
                  {formData.avatar && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      data-testid="button-remove-avatar"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Max 5MB. Recommended: 200x200px</p>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  data-testid="input-avatar-file"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  data-testid="input-username"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {isEdit ? "New Password (leave blank to keep current)" : "Password *"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!isEdit}
                placeholder={isEdit ? "Enter new password to change" : "Enter password"}
                data-testid="input-password"
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground">Leave empty to keep the current password</p>
              )}
            </div>

            <Separator />
            <h3 className="font-semibold text-sm">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="e.g., 07123456789"
                  data-testid="input-mobile-number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  data-testid="input-date-of-birth"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="club">Club</Label>
              <Input
                id="club"
                value={formData.club}
                onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                data-testid="input-club"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                data-testid="input-location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="favouriteMethod">Favourite Method</Label>
                <Input
                  id="favouriteMethod"
                  value={formData.favouriteMethod}
                  onChange={(e) => setFormData({ ...formData, favouriteMethod: e.target.value })}
                  placeholder="e.g., Feeder, Float, Method"
                  data-testid="input-favourite-method"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="favouriteSpecies">Favourite Species</Label>
                <Input
                  id="favouriteSpecies"
                  value={formData.favouriteSpecies}
                  onChange={(e) => setFormData({ ...formData, favouriteSpecies: e.target.value })}
                  placeholder="e.g., Carp, Bream, Roach"
                  data-testid="input-favourite-species"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                placeholder="Tell us about this angler..."
                data-testid="input-bio"
              />
            </div>

            <Separator />
            <h3 className="font-semibold text-sm">Social Media</h3>
            <p className="text-xs text-muted-foreground -mt-2">Add social media profiles (optional)</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="youtubeUrl">YouTube Channel URL</Label>
                <Input
                  id="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/@channel"
                  data-testid="input-youtube-url"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="youtubeVideoUrl">Featured YouTube Video</Label>
                <Input
                  id="youtubeVideoUrl"
                  value={formData.youtubeVideoUrl}
                  onChange={(e) => setFormData({ ...formData, youtubeVideoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  data-testid="input-youtube-video-url"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/username"
                  data-testid="input-facebook-url"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="twitterUrl">Twitter/X URL</Label>
                <Input
                  id="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                  placeholder="https://twitter.com/username"
                  data-testid="input-twitter-url"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/username"
                  data-testid="input-instagram-url"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tiktokUrl">TikTok URL</Label>
                <Input
                  id="tiktokUrl"
                  value={formData.tiktokUrl}
                  onChange={(e) => setFormData({ ...formData, tiktokUrl: e.target.value })}
                  placeholder="https://tiktok.com/@username"
                  data-testid="input-tiktok-url"
                />
              </div>
            </div>

            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="isAmbassador">Ambassador</Label>
                <Select
                  value={formData.isAmbassador ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, isAmbassador: value === "yes" })}
                >
                  <SelectTrigger data-testid="select-ambassador">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
            <Button type="submit" disabled={isSubmitting || isUploadingAvatar} data-testid="button-save">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEdit ? "Update Angler" : "Create Angler"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
