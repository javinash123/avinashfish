import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SliderImage, SiteSettings } from "@shared/schema";
import { Trash2, Upload } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function AdminSlider() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingSlider, setUploadingSlider] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const sliderFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const { data: sliderImages = [] } = useQuery<SliderImage[]>({
    queryKey: ["/api/admin/slider-images"],
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
  });

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
      setSelectedFile(null);
      if (sliderFileInputRef.current) {
        sliderFileInputRef.current.value = '';
      }
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
      setLogoFile(null);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = '';
      }
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

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.url;
  };

  const handleAddSliderImage = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingSlider(true);
      const imageUrl = await uploadFile(selectedFile, 'slider');
      createImageMutation.mutate(imageUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingSlider(false);
    }
  };

  const handleUpdateLogo = async () => {
    if (!logoFile) {
      toast({
        title: "Error",
        description: "Please select a logo file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingLogo(true);
      const logoUrl = await uploadFile(logoFile, 'logo');
      updateLogoMutation.mutate(logoUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
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
            Upload the logo displayed in the header
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-file">Upload Logo</Label>
            <div className="flex gap-2">
              <Input
                id="logo-file"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                ref={logoFileInputRef}
                data-testid="input-logo-file"
              />
              <Button
                onClick={handleUpdateLogo}
                disabled={uploadingLogo || !logoFile}
                data-testid="button-update-logo"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingLogo ? "Uploading..." : "Update Logo"}
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
            Upload and manage images for the homepage hero slider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slider-file">Upload New Slider Image</Label>
            <div className="flex gap-2">
              <Input
                id="slider-file"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                ref={sliderFileInputRef}
                data-testid="input-new-slider-image"
              />
              <Button
                onClick={handleAddSliderImage}
                disabled={uploadingSlider || !selectedFile}
                data-testid="button-add-slider-image"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingSlider ? "Uploading..." : "Add Image"}
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
