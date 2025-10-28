import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Sponsor } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Plus, Pencil, Trash2, ExternalLink, Image as ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSponsors() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    tier: "",
    logo: "",
    website: "",
    shortDescription: "",
    description: "",
    facebook: "",
    twitter: "",
    instagram: "",
  });

  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/sponsors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Sponsor added",
        description: `${formData.name} has been added as a ${formData.tier} sponsor.`,
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
      const response = await apiRequest("PUT", `/api/admin/sponsors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setIsEditOpen(false);
      setSelectedSponsor(null);
      resetForm();
      toast({
        title: "Sponsor updated",
        description: `${formData.name} has been updated successfully.`,
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
      const response = await apiRequest("DELETE", `/api/admin/sponsors/${id}`);
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
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
    formData.append('type', 'sponsors');

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

  const handleCreate = async () => {
    try {
      let logoUrl = formData.logo;
      
      if (logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadFile(logoFile);
      }

      const sponsorData = {
        name: formData.name,
        tier: formData.tier,
        logo: logoUrl,
        website: formData.website || undefined,
        shortDescription: formData.shortDescription,
        description: formData.description,
        social: {
          facebook: formData.facebook || undefined,
          twitter: formData.twitter || undefined,
          instagram: formData.instagram || undefined,
        },
      };

      createMutation.mutate(sponsorData);
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleEdit = async () => {
    if (!selectedSponsor) return;

    try {
      let logoUrl = formData.logo;
      
      if (logoFile) {
        setUploadingLogo(true);
        logoUrl = await uploadFile(logoFile);
      }

      const sponsorData = {
        name: formData.name,
        tier: formData.tier,
        logo: logoUrl,
        website: formData.website || undefined,
        shortDescription: formData.shortDescription,
        description: formData.description,
        social: {
          facebook: formData.facebook || undefined,
          twitter: formData.twitter || undefined,
          instagram: formData.instagram || undefined,
        },
      };

      updateMutation.mutate({ id: selectedSponsor.id, data: sponsorData });
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleDelete = (id: string, name: string) => {
    deleteMutation.mutate(id);
    toast({
      title: "Sponsor removed",
      description: `${name} has been removed from sponsors.`,
    });
  };

  const openEditDialog = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      tier: sponsor.tier,
      logo: sponsor.logo,
      website: sponsor.website || "",
      shortDescription: sponsor.shortDescription || "",
      description: sponsor.description,
      facebook: sponsor.social?.facebook || "",
      twitter: sponsor.social?.twitter || "",
      instagram: sponsor.social?.instagram || "",
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      tier: "",
      logo: "",
      website: "",
      shortDescription: "",
      description: "",
      facebook: "",
      twitter: "",
      instagram: "",
    });
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "default";
      case "gold":
        return "secondary";
      case "silver":
        return "outline";
      case "bronze":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum":
        return "bg-slate-400";
      case "gold":
        return "bg-yellow-500";
      case "silver":
        return "bg-slate-300";
      case "bronze":
        return "bg-orange-600";
      default:
        return "bg-slate-400";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading sponsors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sponsor Management</h2>
          <p className="text-muted-foreground">
            Manage platform sponsors and partnerships
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} data-testid="button-add-sponsor">
          <Plus className="h-4 w-4 mr-2" />
          Add Sponsor
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {sponsor.logo ? (
                      <img
                        src={sponsor.logo}
                        alt={sponsor.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{sponsor.name}</CardTitle>
                    <Badge variant={getTierBadgeVariant(sponsor.tier)} className="mt-1">
                      <div className={`w-2 h-2 rounded-full ${getTierColor(sponsor.tier)} mr-1`} />
                      {sponsor.tier}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-2">
                {sponsor.description}
              </CardDescription>
              {sponsor.website && (
                <a
                  href={sponsor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visit Website
                </a>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(sponsor)}
                  className="flex-1"
                  data-testid={`button-edit-sponsor-${sponsor.id}`}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(sponsor.id, sponsor.name)}
                  data-testid={`button-delete-sponsor-${sponsor.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sponsors.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No sponsors added yet
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Sponsor</DialogTitle>
            <DialogDescription>
              Add a new sponsor to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Sponsor Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Daiwa Sports Ltd"
                data-testid="input-sponsor-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger data-testid="select-tier">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="input-website"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="logo">Upload Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                data-testid="input-logo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                placeholder="Brief description shown on sponsor cards..."
                rows={2}
                data-testid="input-short-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Detailed description shown in popup dialog..."
                rows={4}
                data-testid="input-description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Social Media (optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  data-testid="input-facebook"
                />
                <Input
                  placeholder="Twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  data-testid="input-twitter"
                />
                <Input
                  placeholder="Instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  data-testid="input-instagram"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || uploadingLogo} data-testid="button-submit-sponsor">
              {uploadingLogo ? "Uploading..." : createMutation.isPending ? "Adding..." : "Add Sponsor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
            <DialogDescription>
              Update sponsor information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Sponsor Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-edit-sponsor-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-tier">Tier</Label>
                <Select
                  value={formData.tier}
                  onValueChange={(value) => setFormData({ ...formData, tier: value })}
                >
                  <SelectTrigger data-testid="select-edit-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  data-testid="input-edit-website"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-logo">Upload New Logo (optional)</Label>
              <Input
                id="edit-logo"
                type="file"
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                data-testid="input-edit-logo"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-shortDescription">Short Description</Label>
              <Textarea
                id="edit-shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData({ ...formData, shortDescription: e.target.value })
                }
                rows={2}
                data-testid="input-edit-short-description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Full Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid gap-2">
              <Label>Social Media (optional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Facebook"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                  data-testid="input-edit-facebook"
                />
                <Input
                  placeholder="Twitter"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  data-testid="input-edit-twitter"
                />
                <Input
                  placeholder="Instagram"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  data-testid="input-edit-instagram"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending || uploadingLogo} data-testid="button-save-sponsor">
              {uploadingLogo ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
