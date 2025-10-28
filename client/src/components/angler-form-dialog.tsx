import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

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
  status: angler?.status || "active",
});

export function AnglerFormDialog({
  open,
  onOpenChange,
  angler,
  onSubmit,
  isSubmitting,
}: AnglerFormDialogProps) {
  const [formData, setFormData] = useState(getInitialFormData(angler));

  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(angler));
    }
  }, [open, angler]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let submitData: any;
    
    if (!angler) {
      const { status, ...dataWithoutStatus } = formData;
      submitData = dataWithoutStatus;
    } else {
      const { password, ...dataWithoutPassword } = formData;
      submitData = formData.password ? formData : dataWithoutPassword;
    }
    
    onSubmit(submitData);
  };

  const isEdit = !!angler;

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
                  disabled={isEdit}
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
                  disabled={isEdit}
                  data-testid="input-username"
                />
              </div>
            </div>
            {!isEdit && (
              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!isEdit}
                  data-testid="input-password"
                />
              </div>
            )}
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
                  data-testid="input-favourite-method"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="favouriteSpecies">Favourite Species</Label>
                <Input
                  id="favouriteSpecies"
                  value={formData.favouriteSpecies}
                  onChange={(e) => setFormData({ ...formData, favouriteSpecies: e.target.value })}
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
                data-testid="input-bio"
              />
            </div>
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
            <Button type="submit" disabled={isSubmitting} data-testid="button-save">
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
