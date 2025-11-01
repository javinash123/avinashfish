import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { GalleryImage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Fish, Calendar, Image as ImageIcon, Trophy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminGallery() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "event" | "catch">("all");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    urls: [] as string[],
    title: "",
    description: "",
    category: "",
    competition: "",
    date: "",
    angler: "",
    weight: "",
    featured: false,
  });

  const { data: images = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/gallery", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Image uploaded",
        description: `${formData.title} has been added to the gallery.`,
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
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/admin/gallery/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
      setIsEditOpen(false);
      setSelectedImage(null);
      resetForm();
      toast({
        title: "Image updated",
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
      const response = await apiRequest("DELETE", `/api/admin/gallery/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'gallery');

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

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    setImageFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeImageFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async () => {
    try {
      const imageUrls: string[] = [...formData.urls];
      
      if (imageFiles.length > 0) {
        setUploadingImage(true);
        for (const file of imageFiles) {
          const url = await uploadFile(file);
          imageUrls.push(url);
        }
      }

      if (imageUrls.length === 0) {
        toast({
          title: "Error",
          description: "Please upload at least one image",
          variant: "destructive",
        });
        return;
      }

      const imageData = {
        urls: imageUrls,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        competition: formData.competition || undefined,
        date: formData.date,
        angler: formData.angler || undefined,
        weight: formData.weight || undefined,
        featured: formData.featured,
      };

      createMutation.mutate(imageData);
      setImageFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedImage) return;

    try {
      const imageUrls: string[] = [...formData.urls];
      
      if (imageFiles.length > 0) {
        setUploadingImage(true);
        for (const file of imageFiles) {
          const url = await uploadFile(file);
          imageUrls.push(url);
        }
      }

      if (imageUrls.length === 0) {
        toast({
          title: "Error",
          description: "Please keep at least one image",
          variant: "destructive",
        });
        return;
      }

      const imageData = {
        urls: imageUrls,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        competition: formData.competition || undefined,
        date: formData.date,
        angler: formData.angler || undefined,
        weight: formData.weight || undefined,
        featured: formData.featured,
      };

      updateMutation.mutate({ id: selectedImage.id, data: imageData });
      setImageFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    deleteMutation.mutate(id);
    toast({
      title: "Image deleted",
      description: `${title} has been removed from the gallery.`,
    });
  };

  const openEditDialog = (image: GalleryImage) => {
    setSelectedImage(image);
    setFormData({
      urls: image.urls,
      title: image.title,
      description: image.description,
      category: image.category,
      competition: image.competition || "",
      date: image.date,
      angler: image.angler || "",
      weight: image.weight || "",
      featured: image.featured || false,
    });
    setImageFiles([]);
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      urls: [],
      title: "",
      description: "",
      category: "",
      competition: "",
      date: "",
      angler: "",
      weight: "",
      featured: false,
    });
    setImageFiles([]);
  };

  const filteredImages = images.filter((image) => {
    if (categoryFilter === "all") return true;
    return image.category === categoryFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading gallery images...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gallery Management</h2>
          <p className="text-muted-foreground">
            Manage event photos and catch images
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-upload-image">
          <Plus className="h-4 w-4 mr-2" />
          Upload Image
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          onClick={() => setCategoryFilter("all")}
          size="sm"
          data-testid="filter-all-images"
        >
          All
        </Button>
        <Button
          variant={categoryFilter === "event" ? "default" : "outline"}
          onClick={() => setCategoryFilter("event")}
          size="sm"
          data-testid="filter-events"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Events
        </Button>
        <Button
          variant={categoryFilter === "catch" ? "default" : "outline"}
          onClick={() => setCategoryFilter("catch")}
          size="sm"
          data-testid="filter-catches"
        >
          <Fish className="h-4 w-4 mr-1" />
          Catches
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredImages.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={image.urls[0]}
                alt={image.title}
                className="w-full h-full object-contain"
              />
              {image.urls.length > 1 && (
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="bg-black/70 text-white">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {image.urls.length} images
                  </Badge>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge variant={image.category === "catch" ? "default" : "secondary"}>
                  {image.category === "catch" ? (
                    <>
                      <Fish className="h-3 w-3 mr-1" />
                      Catch
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3 w-3 mr-1" />
                      Event
                    </>
                  )}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold line-clamp-1">{image.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {image.description}
                </p>
              </div>
              {image.weight && (
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{image.weight}</span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(image)}
                  className="flex-1"
                  data-testid={`button-edit-image-${image.id}`}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(image.id, image.title)}
                  data-testid={`button-delete-image-${image.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No images found in this category
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Add a new image to the gallery
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Upload Images</Label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop images here, or click to select
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  ref={fileInputRef}
                  className="hidden"
                  data-testid="input-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Images
                </Button>
              </div>
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImageFile(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Spring Qualifier Winner"
                data-testid="input-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the image..."
                rows={2}
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="catch">Catch</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="competition">Competition (optional)</Label>
              <Input
                id="competition"
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                placeholder="Spring Carp Qualifier"
                data-testid="input-competition"
              />
            </div>
            {formData.category === "catch" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="angler">Angler Name</Label>
                  <Input
                    id="angler"
                    value={formData.angler}
                    onChange={(e) => setFormData({ ...formData, angler: e.target.value })}
                    placeholder="James Mitchell"
                    data-testid="input-angler"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="100.0 lbs"
                    data-testid="input-weight"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                data-testid="checkbox-featured"
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Feature this image on homepage
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || uploadingImage} data-testid="button-upload">
              {uploadingImage ? "Uploading..." : createMutation.isPending ? "Saving..." : "Upload Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Update image details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Existing Images</Label>
              {formData.urls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.urls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeUploadedUrl(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Add More Images</Label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                }`}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs text-muted-foreground mb-2">
                  Drag and drop images here, or click to select
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  ref={fileInputRef}
                  className="hidden"
                  data-testid="input-edit-url"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Images
                </Button>
              </div>
              {imageFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imageFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImageFile(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <p className="text-xs text-center mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="input-edit-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="catch">Catch</SelectItem>
                  </SelectContent>
                </Select>
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-competition">Competition (optional)</Label>
              <Input
                id="edit-competition"
                value={formData.competition}
                onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
                data-testid="input-edit-competition"
              />
            </div>
            {formData.category === "catch" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-angler">Angler Name</Label>
                  <Input
                    id="edit-angler"
                    value={formData.angler}
                    onChange={(e) => setFormData({ ...formData, angler: e.target.value })}
                    data-testid="input-edit-angler"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-weight">Weight (lbs)</Label>
                  <Input
                    id="edit-weight"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    data-testid="input-edit-weight"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked as boolean })}
                data-testid="checkbox-edit-featured"
              />
              <Label htmlFor="edit-featured" className="cursor-pointer">
                Feature this image on homepage
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending || uploadingImage} data-testid="button-save-edit">
              {uploadingImage ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
