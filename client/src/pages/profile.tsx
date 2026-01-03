import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User as UserIcon, Trophy, Calendar, MapPin, Fish, TrendingUp, 
  Settings, Edit, Award, Target, Loader2, Upload, Trash2, Image as ImageIcon, Camera, Share2, Play
} from "lucide-react";
import { SiFacebook, SiX, SiInstagram, SiYoutube, SiTiktok } from "react-icons/si";
import { FaWhatsapp } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Competition, CompetitionParticipant, UserGalleryPhoto } from "@shared/schema";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompetitionStatus } from "@/lib/uk-timezone";
import { formatWeight } from "@shared/weight-utils";

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const [, setLocation] = useLocation();
  const { user: loggedInUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [usernameForm, setUsernameForm] = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const viewingUsername = params?.username;
  const isOwnProfile = !viewingUsername || viewingUsername === loggedInUser?.username;

  const { data: profileUser, isLoading: profileLoading } = useQuery<User>({
    queryKey: [`/api/users/${viewingUsername}`],
    enabled: !!viewingUsername && !isOwnProfile,
  });

  const { data: participations = [], isLoading: participationsLoading } = useQuery<Array<CompetitionParticipant & { competition: Competition }>>({
    queryKey: isOwnProfile ? ["/api/user/participations"] : [`/api/users/${viewingUsername}/participations`],
    enabled: isOwnProfile ? isAuthenticated : !!viewingUsername,
  });

  const competitionHistory = participations.map(p => ({
    id: p.competition.id,
    name: p.competition.name,
    date: p.competition.date,
    venue: p.competition.venue,
    pegNumber: p.pegNumber,
    weight: p.totalWeight,
    position: p.position,
    status: getCompetitionStatus(p.competition)
  }));

  const { data: stats } = useQuery<{
    wins: number;
    podiumFinishes: number;
    bestCatch: string;
    averageWeight: string;
    totalWeight: string;
    totalCompetitions: number;
  }>({
    queryKey: isOwnProfile ? ["/api/user/stats"] : [`/api/users/${viewingUsername}/stats`],
    enabled: isOwnProfile ? isAuthenticated : !!viewingUsername,
  });

  const { data: galleryPhotos = [] } = useQuery<UserGalleryPhoto[]>({
    queryKey: isOwnProfile ? ["/api/user/gallery"] : [`/api/users/${viewingUsername}/gallery`],
    enabled: isOwnProfile ? isAuthenticated : !!viewingUsername,
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (data: { url: string; caption?: string }) => {
      const response = await apiRequest("POST", "/api/user/gallery", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gallery"] });
      toast({
        title: "Photo added",
        description: "Your photo has been added to your gallery.",
      });
      setSelectedFile(null);
      setCaption("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add photo",
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest("DELETE", `/api/user/gallery/${photoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/gallery"] });
      toast({
        title: "Photo deleted",
        description: "Your photo has been removed from your gallery.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete photo",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      const response = await apiRequest("PUT", "/api/user/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSettingsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (data: { username: string }) => {
      const response = await apiRequest("PUT", "/api/user/username", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Username updated",
        description: "Your username has been changed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setUsernameForm("");
      setSettingsOpen(false);
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
    onSuccess: () => {
      toast({
        title: "Email updated",
        description: "Your email has been changed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setEmailForm("");
      setSettingsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    },
  });

  // Initialize form fields when dialog opens
  useEffect(() => {
    if (settingsOpen && loggedInUser) {
      setUsernameForm(loggedInUser.username);
      setEmailForm(loggedInUser.email);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
  }, [settingsOpen, loggedInUser]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameForm.trim() === loggedInUser?.username) {
      toast({
        title: "No changes",
        description: "Username is the same as current one.",
        variant: "destructive",
      });
      return;
    }
    updateUsernameMutation.mutate({ username: usernameForm });
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailForm.trim() === loggedInUser?.email) {
      toast({
        title: "No changes",
        description: "Email is the same as current one.",
        variant: "destructive",
      });
      return;
    }
    updateEmailMutation.mutate({ email: emailForm });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    updatePasswordMutation.mutate(passwordForm);
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOwnProfile) {
      toast({
        title: "Error",
        description: "You can only upload photos to your own gallery",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a photo to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Upload the file first
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('type', 'gallery');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      
      // Now add the photo to gallery with the uploaded URL
      addPhotoMutation.mutate({ 
        url: uploadData.url, 
        caption: caption || undefined 
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      
      // Upload the file first
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'avatar');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      
      // Update user profile with new avatar
      const updateResponse = await apiRequest("PUT", "/api/user/profile", { 
        avatar: uploadData.url 
      });

      if (updateResponse.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been changed successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      // Clear the input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated && isOwnProfile) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, isOwnProfile, setLocation]);

  if (authLoading || (profileLoading && !isOwnProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!loggedInUser && isOwnProfile) {
    return null;
  }

  const displayUser = isOwnProfile ? loggedInUser : profileUser;

  if (!displayUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getPositionBadge = (position: number) => {
    if (position === 1) return { variant: "default" as const, color: "text-yellow-500", label: "1st" };
    if (position === 2) return { variant: "secondary" as const, color: "text-slate-400", label: "2nd" };
    if (position === 3) return { variant: "secondary" as const, color: "text-amber-600", label: "3rd" };
    return { variant: "outline" as const, color: "", label: `${position}th` };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <div className="relative mb-4">
                  <Avatar className="h-48 w-48" data-testid="avatar-profile">
                    {displayUser.avatar && <AvatarImage src={displayUser.avatar} alt={`${displayUser.firstName} ${displayUser.lastName}`} className="object-cover" />}
                    <AvatarFallback className="text-5xl">
                      {displayUser.firstName[0]}{displayUser.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <Button
                      size="icon"
                      variant="default"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      data-testid="button-upload-avatar"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    data-testid="input-avatar"
                  />
                </div>
                {isOwnProfile && (
                  <Button 
                    variant="outline" 
                    className="w-full md:w-auto" 
                    onClick={() => setEditProfileOpen(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
                  <div>
                    <h1 className="text-3xl font-bold mb-1" data-testid="text-profile-name">
                      {displayUser.firstName} {displayUser.lastName}
                    </h1>
                    <p className="text-muted-foreground">@{displayUser.username}</p>
                  </div>
                  {isOwnProfile && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setSettingsOpen(true)}
                      data-testid="button-settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {(displayUser.youtubeUrl || displayUser.facebookUrl || displayUser.twitterUrl || displayUser.instagramUrl || displayUser.tiktokUrl) && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex gap-2">
                      {displayUser.youtubeUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => displayUser.youtubeUrl && window.open(displayUser.youtubeUrl, '_blank')}
                          data-testid="button-youtube"
                        >
                          <SiYoutube className="h-4 w-4" />
                        </Button>
                      )}
                      {displayUser.facebookUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => displayUser.facebookUrl && window.open(displayUser.facebookUrl, '_blank')}
                          data-testid="button-facebook"
                        >
                          <SiFacebook className="h-4 w-4" />
                        </Button>
                      )}
                      {displayUser.twitterUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => displayUser.twitterUrl && window.open(displayUser.twitterUrl, '_blank')}
                          data-testid="button-twitter"
                        >
                          <SiX className="h-4 w-4" />
                        </Button>
                      )}
                      {displayUser.instagramUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => displayUser.instagramUrl && window.open(displayUser.instagramUrl, '_blank')}
                          data-testid="button-instagram"
                          className="text-primary border-primary/20 hover:border-primary"
                        >
                          <SiInstagram className="h-4 w-4" />
                        </Button>
                      )}
                      {displayUser.tiktokUrl && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => displayUser.tiktokUrl && window.open(displayUser.tiktokUrl, '_blank')}
                          data-testid="button-tiktok"
                        >
                          <SiTiktok className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {displayUser.bio && <p className="text-muted-foreground mb-4">{displayUser.bio}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {displayUser.club && (
                    <div className="flex items-start gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Club</p>
                        <span data-testid="text-club">{displayUser.club}</span>
                      </div>
                    </div>
                  )}
                  {displayUser.location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Location</p>
                        <span data-testid="text-location">{displayUser.location}</span>
                      </div>
                    </div>
                  )}
                  {displayUser.favouriteMethod && (
                    <div className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Fishing Method</p>
                        <span data-testid="text-method">{displayUser.favouriteMethod}</span>
                      </div>
                    </div>
                  )}
                  {displayUser.favouriteSpecies && (
                    <div className="flex items-start gap-2 text-sm">
                      <Fish className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Favorite Species</p>
                        <span data-testid="text-species">{displayUser.favouriteSpecies}</span>
                      </div>
                    </div>
                  )}
                  {isOwnProfile && displayUser.mobileNumber && (
                    <div className="flex items-start gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Mobile Number</p>
                        <span data-testid="text-mobile">{displayUser.mobileNumber}</span>
                      </div>
                    </div>
                  )}
                  {isOwnProfile && displayUser.dateOfBirth && (
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">Date of Birth</p>
                        <span data-testid="text-dob">{new Date(displayUser.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {new Date(displayUser.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' })}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground mr-2">Share Profile:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.location.origin + `/profile/${displayUser.username}`;
                        const text = `Check out ${displayUser.firstName} ${displayUser.lastName}'s fishing profile`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' - ' + url)}`, '_blank');
                      }}
                      data-testid="button-share-whatsapp"
                    >
                      <FaWhatsapp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.location.origin + `/profile/${displayUser.username}`;
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                      }}
                      data-testid="button-share-facebook"
                    >
                      <SiFacebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.location.origin + `/profile/${displayUser.username}`;
                        const text = `Check out ${displayUser.firstName} ${displayUser.lastName}'s fishing profile`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                      }}
                      data-testid="button-share-x"
                    >
                      <SiX className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.location.origin + `/profile/${displayUser.username}`;
                        navigator.clipboard.writeText(url);
                        toast({
                          title: "Link copied!",
                          description: "Profile link copied to clipboard",
                        });
                      }}
                      data-testid="button-share-copy"
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-total-matches">
                {participations.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wins</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-wins">
                {stats ? stats.wins : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats ? stats.podiumFinishes : 0} podium finishes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Catch</CardTitle>
              <Fish className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-best-catch">
                {stats ? formatWeight(stats.bestCatch) : "-"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Weight</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-stat-average">
                {stats ? formatWeight(stats.averageWeight) : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {stats ? formatWeight(stats.totalWeight) : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {displayUser.youtubeVideoUrl && extractYouTubeVideoId(displayUser.youtubeVideoUrl) && (
          <Card className="mb-8" data-testid="card-youtube-video">
            <CardHeader>
              <div className="flex items-center gap-2">
                <SiYoutube className="h-5 w-5 text-red-600" />
                <CardTitle>Featured Video</CardTitle>
              </div>
              <CardDescription>
                {isOwnProfile ? "Your featured YouTube video" : `${displayUser.firstName}'s featured video`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${extractYouTubeVideoId(displayUser.youtubeVideoUrl)}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  data-testid="iframe-youtube"
                />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(displayUser.youtubeVideoUrl!, '_blank')}
                  data-testid="button-watch-youtube"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Watch on YouTube
                </Button>
                {isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditProfileOpen(true)}
                    data-testid="button-change-video"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Change Video
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="gallery" className="space-y-4">
          <TabsList data-testid="tabs-profile">
            <TabsTrigger value="gallery" data-testid="tab-gallery">
              <ImageIcon className="h-4 w-4 mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Trophy className="h-4 w-4 mr-2" />
              Competition History
            </TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Competition History
                </CardTitle>
                <CardDescription>
                  Past and upcoming competitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participationsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : participations.length > 0 ? (
                  <div className="space-y-4">
                    {participations.map((p) => (
                      <Link key={p.id} href={`/competition/${p.competitionId}`}>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {p.competition.name[0]}
                            </div>
                            <div>
                              <h4 className="font-semibold">{p.competition.name}</h4>
                              <p className="text-sm text-muted-foreground">{p.competition.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">Peg {p.pegNumber}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getCompetitionStatus(p.competition)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No competitions joined yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Competitions</CardTitle>
                <CardDescription>
                  Upcoming and live competitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : participations.filter(p => ["upcoming", "live"].includes(getCompetitionStatus(p.competition))).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No upcoming competitions
                    </p>
                    {isOwnProfile && (
                      <Link href="/competitions">
                        <Button data-testid="button-browse-competitions">
                          Browse Competitions
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {participations.filter(p => ["upcoming", "live"].includes(getCompetitionStatus(p.competition))).map((participation) => (
                      <Card key={participation.id} className="hover-elevate" data-testid={`card-participation-${participation.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{participation.competition.name}</h3>
                                <Badge variant={getCompetitionStatus(participation.competition) === "live" ? "default" : "secondary"}>
                                  {getCompetitionStatus(participation.competition)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(participation.competition.date).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    timeZone: 'Europe/London'
                                  })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{participation.competition.venue}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  <span>Peg {participation.pegNumber}</span>
                                </div>
                              </div>
                            </div>
                            <Link href={`/competition/${participation.competition.id}`}>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isOwnProfile ? "My Gallery" : `${displayUser.firstName}'s Gallery`}</CardTitle>
                <CardDescription>
                  {isOwnProfile ? "Upload and manage your fishing photos" : "Fishing photos"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isOwnProfile && (
                  <form onSubmit={handleAddPhoto} className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="photoFile">Choose Photo</Label>
                      <Input
                        id="photoFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        data-testid="input-photo-file"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption (optional)</Label>
                      <Input
                        id="caption"
                        placeholder="Add a caption..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        data-testid="input-caption"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isUploading || addPhotoMutation.isPending}
                      data-testid="button-add-photo"
                    >
                      {(isUploading || addPhotoMutation.isPending) ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      {isUploading ? 'Uploading...' : 'Add Photo'}
                    </Button>
                  </form>
                )}

                {galleryPhotos.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile ? "No photos in your gallery yet" : "No photos in gallery yet"}
                    </p>
                    {isOwnProfile && (
                      <p className="text-sm text-muted-foreground">
                        Add your first photo to showcase your catches!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryPhotos.map((photo) => (
                      <Card key={photo.id} className="overflow-hidden" data-testid={`card-photo-${photo.id}`}>
                        <div className="aspect-square relative bg-muted">
                          <img
                            src={photo.url}
                            alt={photo.caption || "Gallery photo"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {photo.caption && (
                          <CardContent className="pt-3">
                            <p className="text-sm">{photo.caption}</p>
                          </CardContent>
                        )}
                        {isOwnProfile && (
                          <CardContent className="pt-2 pb-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full"
                              onClick={() => deletePhotoMutation.mutate(photo.id)}
                              disabled={deletePhotoMutation.isPending}
                              data-testid={`button-delete-${photo.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isOwnProfile && loggedInUser && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          user={loggedInUser}
        />
      )}

      {isOwnProfile && (
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-h-screen overflow-y-auto" data-testid="dialog-settings">
            <DialogHeader>
              <DialogTitle>Account Settings</DialogTitle>
              <DialogDescription>
                Update your username, email, and password
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Update Username */}
              <form onSubmit={handleUpdateUsername} className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-sm">Change Username</h3>
                <div className="space-y-2">
                  <Label htmlFor="username">New Username</Label>
                  <Input
                    id="username"
                    value={usernameForm}
                    onChange={(e) => setUsernameForm(e.target.value)}
                    placeholder="Enter new username"
                    data-testid="input-username"
                  />
                  <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only. 3-20 characters.</p>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateUsernameMutation.isPending || usernameForm === loggedInUser?.username}
                  data-testid="button-update-username"
                >
                  {updateUsernameMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Username"
                  )}
                </Button>
              </form>

              {/* Update Email */}
              <form onSubmit={handleUpdateEmail} className="space-y-4 border-b pb-4">
                <h3 className="font-semibold text-sm">Change Email</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">New Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailForm}
                    onChange={(e) => setEmailForm(e.target.value)}
                    placeholder="Enter new email"
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateEmailMutation.isPending || emailForm === loggedInUser?.email}
                  data-testid="button-update-email"
                >
                  {updateEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Email"
                  )}
                </Button>
              </form>

              {/* Update Password */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <h3 className="font-semibold text-sm">Change Password</h3>
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    data-testid="input-current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updatePasswordMutation.isPending}
                  data-testid="button-update-password"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSettingsOpen(false)}
                data-testid="button-close-settings"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
