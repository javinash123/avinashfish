import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User as UserIcon, Trophy, Calendar, MapPin, Fish, TrendingUp, 
  Settings, Edit, Award, Target, Loader2, Upload, Trash2, Image as ImageIcon
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Competition, CompetitionParticipant, UserGalleryPhoto } from "@shared/schema";
import { EditProfileDialog } from "@/components/edit-profile-dialog";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const [, setLocation] = useLocation();
  const { user: loggedInUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const viewingUsername = params?.username;
  const isOwnProfile = !viewingUsername || viewingUsername === loggedInUser?.username;

  const { data: profileUser, isLoading: profileLoading } = useQuery<User>({
    queryKey: [`/api/users/${viewingUsername}`],
    enabled: !!viewingUsername && !isOwnProfile,
  });

  const { data: participations = [], isLoading: participationsLoading } = useQuery<Array<CompetitionParticipant & { competition: Competition }>>({
    queryKey: ["/api/user/participations"],
    enabled: isOwnProfile && isAuthenticated,
  });

  const { data: stats } = useQuery<{
    wins: number;
    podiumFinishes: number;
    bestCatch: string;
    averageWeight: string;
    totalWeight: string;
    totalCompetitions: number;
  }>({
    queryKey: ["/api/user/stats"],
    enabled: isOwnProfile && isAuthenticated,
  });

  const { data: galleryPhotos = [] } = useQuery<UserGalleryPhoto[]>({
    queryKey: ["/api/user/gallery"],
    enabled: isOwnProfile && isAuthenticated,
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

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  // Helper function to compute competition status based on UK timezone
  const getCompetitionStatus = (comp: Competition): string => {
    // Get current time in UK timezone
    const now = new Date();
    const ukNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    
    // Parse competition start date/time as UK timezone
    const startDateTime = new Date(`${comp.date}T${comp.time}`);
    const ukStartDateTime = new Date(startDateTime.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    
    // Handle end date and time
    let ukEndDateTime: Date;
    if (comp.endDate && comp.endTime) {
      // Multi-day competition with specific end date and time
      const endDateTime = new Date(`${comp.endDate}T${comp.endTime}`);
      ukEndDateTime = new Date(endDateTime.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    } else if (comp.endTime) {
      // Same day competition with end time
      const endDateTime = new Date(`${comp.date}T${comp.endTime}`);
      ukEndDateTime = new Date(endDateTime.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    } else {
      // No end time specified - use end of day
      ukEndDateTime = new Date(comp.date);
      ukEndDateTime.setHours(23, 59, 59, 999);
      ukEndDateTime = new Date(ukEndDateTime.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    }
    
    // Determine status based on UK time
    if (ukNow < ukStartDateTime) {
      return "upcoming";
    } else if (ukNow >= ukStartDateTime && ukNow <= ukEndDateTime) {
      return "live";
    } else {
      return "completed";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="h-32 w-32 mb-4" data-testid="avatar-profile">
                  <AvatarFallback className="text-3xl">
                    {displayUser.firstName[0]}{displayUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-1" data-testid="text-profile-name">
                      {displayUser.firstName} {displayUser.lastName}
                    </h1>
                    <p className="text-muted-foreground">@{displayUser.username}</p>
                  </div>
                  {isOwnProfile && (
                    <Button variant="outline" size="icon" data-testid="button-settings">
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {displayUser.bio && <p className="text-muted-foreground mb-4">{displayUser.bio}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {displayUser.club && (
                    <div className="flex items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-club">{displayUser.club}</span>
                    </div>
                  )}
                  {displayUser.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-location">{displayUser.location}</span>
                    </div>
                  )}
                  {displayUser.favouriteMethod && (
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-method">{displayUser.favouriteMethod}</span>
                    </div>
                  )}
                  {displayUser.favouriteSpecies && (
                    <div className="flex items-center gap-2 text-sm">
                      <Fish className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-species">{displayUser.favouriteSpecies}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Member since {new Date(displayUser.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' })}</span>
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
                {isOwnProfile ? participations.length : 0}
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
                {isOwnProfile && stats ? stats.wins : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {isOwnProfile && stats ? stats.podiumFinishes : 0} podium finishes
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
                {isOwnProfile && stats ? stats.bestCatch : "-"}
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
                {isOwnProfile && stats ? stats.averageWeight : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {isOwnProfile && stats ? stats.totalWeight : "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="history" className="space-y-4">
          <TabsList data-testid="tabs-profile">
            <TabsTrigger value="history" data-testid="tab-history">
              <Trophy className="h-4 w-4 mr-2" />
              Match History
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming Events
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger value="gallery" data-testid="tab-gallery">
                <ImageIcon className="h-4 w-4 mr-2" />
                Gallery
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Competition History</CardTitle>
                <CardDescription>
                  All completed matches and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No competition history yet
                  </p>
                  <Link href="/competitions">
                    <Button data-testid="button-browse-competitions">
                      Browse Competitions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="upcoming" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Competitions</CardTitle>
                  <CardDescription>
                    Competitions you've entered
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {participationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : participations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No upcoming competitions booked
                      </p>
                      <Link href="/competitions">
                        <Button data-testid="button-browse-competitions">
                          Browse Competitions
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {participations.map((participation) => (
                        <Card key={participation.id} className="hover-elevate" data-testid={`card-participation-${participation.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{participation.competition.name}</h3>
                                  <Badge variant={getCompetitionStatus(participation.competition) === "upcoming" ? "default" : "secondary"}>
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
          )}

          {isOwnProfile && (
            <TabsContent value="gallery" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>My Gallery</CardTitle>
                  <CardDescription>
                    Upload and manage your fishing photos
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

                  {galleryPhotos.length === 0 ? (
                    <div className="text-center py-12">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-4">
                        No photos in your gallery yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Add your first photo to showcase your catches!
                      </p>
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
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {isOwnProfile && loggedInUser && (
        <EditProfileDialog
          open={editProfileOpen}
          onOpenChange={setEditProfileOpen}
          user={loggedInUser}
        />
      )}
    </div>
  );
}
