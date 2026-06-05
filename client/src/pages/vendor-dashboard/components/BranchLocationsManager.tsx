import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BranchLocation {
  id: string;
  vendorId: string;
  branchName: string;
  branchCode?: string;
  address: string;
  city?: string;
  latitude?: string;
  longitude?: string;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  isActive: boolean;
  createdAt: string;
}

interface BranchFormData {
  branchName: string;
  address: string;
  city: string;
  latitude: string;
  longitude: string;
  supportsDelivery: boolean;
  supportsPickup: boolean;
  isActive: boolean;
}

const EMPTY_FORM: BranchFormData = {
  branchName: "",
  address: "",
  city: "",
  latitude: "",
  longitude: "",
  supportsDelivery: true,
  supportsPickup: true,
  isActive: true,
};

// ── Branch Form Dialog ─────────────────────────────────────────────────────────
function BranchDialog({
  trigger,
  initialData,
  locationId,
  onSuccess,
}: {
  trigger: React.ReactNode;
  initialData?: BranchFormData;
  locationId?: string;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BranchFormData>(initialData ?? EMPTY_FORM);
  const isEditing = !!locationId;

  const mutation = useMutation({
    mutationFn: (data: BranchFormData) => {
      if (isEditing) {
        return apiRequest(`/api/vendor/locations/${locationId}`, "PUT", data);
      }
      return apiRequest("/api/vendor/locations", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Branch updated" : "Branch created",
        description: isEditing
          ? "Branch location has been updated successfully."
          : "New branch location has been added.",
      });
      setOpen(false);
      if (!isEditing) setForm(EMPTY_FORM);
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Failed to save branch",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchName.trim() || !form.address.trim()) {
      toast({
        title: "Validation error",
        description: "Branch name and address are required.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v && !isEditing) setForm(EMPTY_FORM); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-buylock-primary" />
            {isEditing ? "Edit Branch Location" : "Add Branch Location"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Branch Name */}
          <div className="space-y-1.5">
            <Label htmlFor="branchName">Branch Name *</Label>
            <Input
              id="branchName"
              placeholder="e.g. Westlands Branch"
              value={form.branchName}
              onChange={(e) => setForm({ ...form, branchName: e.target.value })}
              required
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              placeholder="e.g. Woodvale Grove, Westlands"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. Nairobi"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-1.2345"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="36.8765"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              />
            </div>
          </div>

          {/* Capabilities & Status */}
          <div className="space-y-3 rounded-lg border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">Branch Capabilities</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                <Label htmlFor="supportsDelivery" className="cursor-pointer text-sm">
                  Supports Delivery
                </Label>
              </div>
              <Switch
                id="supportsDelivery"
                checked={form.supportsDelivery}
                onCheckedChange={(v) => setForm({ ...form, supportsDelivery: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-orange-500" />
                <Label htmlFor="supportsPickup" className="cursor-pointer text-sm">
                  Supports Pickup
                </Label>
              </div>
              <Switch
                id="supportsPickup"
                checked={form.supportsPickup}
                onCheckedChange={(v) => setForm({ ...form, supportsPickup: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <Label htmlFor="isActive" className="cursor-pointer text-sm">
                  Active
                </Label>
              </div>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-buylock-primary hover:bg-buylock-primary/90 text-white"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Branch Card ────────────────────────────────────────────────────────────────
function BranchCard({
  location,
  onDeleted,
  onUpdated,
}: {
  location: BranchLocation;
  onDeleted: () => void;
  onUpdated: () => void;
}) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest(`/api/vendor/locations/${location.id}`, "DELETE"),
    onSuccess: () => {
      toast({ title: "Branch deleted", description: "The branch location has been removed." });
      onDeleted();
    },
    onError: () => {
      toast({ title: "Delete failed", description: "Could not delete this branch.", variant: "destructive" });
    },
  });

  const editFormData: BranchFormData = {
    branchName: location.branchName,
    address: location.address,
    city: location.city ?? "",
    latitude: location.latitude ?? "",
    longitude: location.longitude ?? "",
    supportsDelivery: location.supportsDelivery,
    supportsPickup: location.supportsPickup,
    isActive: location.isActive,
  };

  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${location.isActive ? "bg-green-100" : "bg-gray-100"}`}>
          <Building2 className={`w-5 h-5 ${location.isActive ? "text-green-600" : "text-gray-400"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{location.branchName}</p>
            {!location.isActive && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {location.address}{location.city ? `, ${location.city}` : ""}
          </p>
          {(location.latitude && location.longitude) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {parseFloat(location.latitude).toFixed(5)}, {parseFloat(location.longitude).toFixed(5)}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {location.supportsDelivery ? (
              <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200 border">
                <Truck className="w-3 h-3 mr-1" /> Delivery
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-gray-400">
                <XCircle className="w-3 h-3 mr-1" /> No Delivery
              </Badge>
            )}
            {location.supportsPickup ? (
              <Badge className="text-xs bg-orange-50 text-orange-700 border-orange-200 border">
                <Package className="w-3 h-3 mr-1" /> Pickup
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-gray-400">
                <XCircle className="w-3 h-3 mr-1" /> No Pickup
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-3 shrink-0">
        <BranchDialog
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="w-4 h-4" />
            </Button>
          }
          initialData={editFormData}
          locationId={location.id}
          onSuccess={onUpdated}
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Branch?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{location.branchName}</strong>? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function BranchLocationsManager() {
  const queryClient = useQueryClient();

  const { data: locationsRaw, isLoading, isError } = useQuery<BranchLocation[] | null>({
    queryKey: ["/api/vendor/locations"],
    retry: 2,
  });
  const locations: BranchLocation[] = locationsRaw ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/vendor/locations"] });

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="w-5 h-5 text-buylock-primary" />
              Branch Locations
            </CardTitle>
            <CardDescription className="mt-1">
              Manage multiple physical locations for your business. Each branch can have its own
              delivery and pickup capabilities.
            </CardDescription>
          </div>

          <BranchDialog
            trigger={
              <Button size="sm" className="bg-buylock-primary hover:bg-buylock-primary/90 text-white shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Branch
              </Button>
            }
            onSuccess={invalidate}
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading branches…
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            Failed to load branch locations. Please refresh the page.
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
            <Building2 className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-500">No branches yet</p>
            <p className="text-xs mt-1 max-w-xs">
              Add your first branch location to let customers know where they can pick up or receive
              deliveries from your business.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <BranchCard
                key={loc.id}
                location={loc}
                onDeleted={invalidate}
                onUpdated={invalidate}
              />
            ))}
            <p className="text-xs text-gray-400 text-right pt-1">
              {locations.length} branch{locations.length !== 1 ? "es" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
