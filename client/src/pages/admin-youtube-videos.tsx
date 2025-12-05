import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { YoutubeVideo } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Youtube, Eye, EyeOff, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminYoutubeVideos() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<YoutubeVideo | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    videoId: "",
    description: "",
    displayOrder: 0,
    active: true,
  });

  const { data: videos = [], isLoading } = useQuery<YoutubeVideo[]>({
    queryKey: ["/api/admin/youtube-videos"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/admin/youtube-videos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/youtube-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/youtube-videos"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Video added",
        description: `${formData.title} has been added successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PUT", `/api/admin/youtube-videos/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/youtube-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/youtube-videos"] });
      setIsEditOpen(false);
      setSelectedVideo(null);
      resetForm();
      toast({
        title: "Video updated",
        description: `${formData.title} has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/youtube-videos/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/youtube-videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/youtube-videos"] });
      toast({
        title: "Video deleted",
        description: "The video has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      videoId: "",
      description: "",
      displayOrder: 0,
      active: true,
    });
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleEdit = (video: YoutubeVideo) => {
    setSelectedVideo(video);
    setFormData({
      title: video.title,
      videoId: video.videoId,
      description: video.description || "",
      displayOrder: video.displayOrder,
      active: video.active,
    });
    setIsEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.videoId.trim()) {
      toast({
        title: "Validation Error",
        description: "Video ID is required",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedVideo) {
      updateMutation.mutate({ id: selectedVideo.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (video: YoutubeVideo) => {
    setVideoToDelete(video);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      deleteMutation.mutate(videoToDelete.id);
      setVideoToDelete(null);
    }
  };

  const extractVideoId = (input: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return input;
  };

  const handleVideoIdChange = (value: string) => {
    const videoId = extractVideoId(value);
    setFormData({ ...formData, videoId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading videos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">YouTube Videos</h2>
          <p className="text-muted-foreground">
            Manage YouTube videos displayed on the homepage
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-add-video">
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {videos.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Youtube className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No YouTube videos yet</p>
            <p className="text-sm mt-2">Add your first video to display on the homepage</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden" data-testid={`card-video-${video.id}`}>
              <div className="relative aspect-video bg-muted">
                <img
                  src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 rounded-full p-3">
                    <Youtube className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant={video.active ? "default" : "secondary"}>
                    {video.active ? (
                      <><Eye className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
                    )}
                  </Badge>
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80">
                    <GripVertical className="h-3 w-3 mr-1" />
                    Order: {video.displayOrder}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1">{video.title}</h3>
                {video.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {video.description}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(video)}
                    data-testid={`button-edit-video-${video.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(video)}
                    data-testid={`button-delete-video-${video.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setIsEditOpen(false);
          setSelectedVideo(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedVideo ? "Edit Video" : "Add New Video"}
            </DialogTitle>
            <DialogDescription>
              {selectedVideo 
                ? "Update the video details below"
                : "Add a YouTube video to display on the homepage"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter video title"
                  required
                  data-testid="input-video-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoId">YouTube Video ID or URL</Label>
                <Input
                  id="videoId"
                  value={formData.videoId}
                  onChange={(e) => handleVideoIdChange(e.target.value)}
                  placeholder="e.g., dQw4w9WgXcQ or full YouTube URL"
                  required
                  data-testid="input-video-id"
                />
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube URL or video ID. The ID will be extracted automatically.
                </p>
                {formData.videoId && (
                  <div className="mt-2">
                    <img
                      src={`https://img.youtube.com/vi/${formData.videoId}/mqdefault.jpg`}
                      alt="Video preview"
                      className="rounded-md w-full aspect-video object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the video"
                  rows={3}
                  data-testid="input-video-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-video-order"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="active">Show on Homepage</Label>
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  data-testid="switch-video-active"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setIsEditOpen(false);
                  setSelectedVideo(null);
                  resetForm();
                }}
                data-testid="button-cancel-video"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || !formData.title.trim() || !formData.videoId.trim()}
                data-testid="button-save-video"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : selectedVideo
                    ? "Update Video"
                    : "Add Video"
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{videoToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
