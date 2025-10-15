import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SliderImage, SiteSettings } from "@shared/schema";
import { Trash2, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminSlider() {
  const { toast } = useToast();
  const [newImageUrl, setNewImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const { data: sliderImages = [] } = useQuery<SliderImage[]>({
    queryKey: ["/api/admin/slider-images"],
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

  useEffect(() => {
    if (siteSettings?.logoUrl) {
      setLogoUrl(siteSettings.logoUrl);
    }
  }, [siteSettings]);

  const createImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const maxOrder = sliderImages.length > 0 
        ? Math.max(...sliderImages.map(img => img.order))
        : -1;
      
      return await apiRequest("POST", "/api/admin/slider-images", {
        imageUrl,
        order: maxOrder + 1,
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slider-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slider-images"] });
      setNewImageUrl("");
      toast({
        title: "Success",
        description: "Slider image added successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to add slider image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/slider-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slider-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slider-images"] });
      toast({
        title: "Success",
        description: "Slider image deleted successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete slider image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const toggleImageMutation = useMutation({
    mutationFn: async (params: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/admin/slider-images/${params.id}`, { isActive: params.isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/slider-images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/slider-images"] });
      toast({
        title: "Success",
        description: "Slider image status updated",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to update slider image";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateLogoMutation = useMutation({
    mutationFn: async (logoUrl: string) => {
      return await apiRequest("PUT", "/api/admin/site-settings", { logoUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({
        title: "Success",
        description: "Logo updated successfully",
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to update logo";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }
    createImageMutation.mutate(newImageUrl);
  };

  const handleUpdateLogo = () => {
    if (!logoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a logo URL",
        variant: "destructive",
      });
      return;
    }
    updateLogoMutation.mutate(logoUrl);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Slider & Logo Management</h1>
        <p className="text-muted-foreground">
          Manage your hero slider images and site logo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Site Logo</CardTitle>
          <CardDescription>
            Update the logo displayed in the header
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo-url"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                data-testid="input-logo-url"
              />
              <Button
                onClick={handleUpdateLogo}
                disabled={updateLogoMutation.isPending}
                data-testid="button-update-logo"
              >
                {updateLogoMutation.isPending ? "Updating..." : "Update Logo"}
              </Button>
            </div>
          </div>
          {siteSettings?.logoUrl && (
            <div className="border rounded-md p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">Current Logo:</p>
              <img 
                src={siteSettings.logoUrl} 
                alt="Current logo" 
                className="h-16 w-auto object-contain"
                data-testid="img-current-logo"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hero Slider Images</CardTitle>
          <CardDescription>
            Add and manage images for the homepage hero slider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-image-url">New Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="new-image-url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                data-testid="input-new-slider-image"
              />
              <Button
                onClick={handleAddImage}
                disabled={createImageMutation.isPending}
                data-testid="button-add-slider-image"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createImageMutation.isPending ? "Adding..." : "Add Image"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current Slider Images</h3>
            {sliderImages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slider images yet</p>
            ) : (
              <div className="space-y-2">
                {sliderImages.map((image) => (
                  <Card key={image.id} className="overflow-hidden" data-testid={`card-slider-${image.id}`}>
                    <div className="flex items-center gap-4 p-4">
                      <img
                        src={image.imageUrl}
                        alt="Slider"
                        className="h-20 w-32 object-cover rounded"
                        data-testid={`img-slider-${image.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{image.imageUrl}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={image.isActive}
                            onCheckedChange={(checked) =>
                              toggleImageMutation.mutate({ id: image.id, isActive: checked })
                            }
                            data-testid={`switch-active-${image.id}`}
                          />
                          <span className="text-sm">{image.isActive ? "Active" : "Inactive"}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteImageMutation.mutate(image.id)}
                          disabled={deleteImageMutation.isPending}
                          data-testid={`button-delete-${image.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
