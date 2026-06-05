import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Plus,
  Trash2,
  Edit,
  Globe,
  Tag,
  ChevronDown,
  ChevronRight,
  X,
  Link2,
} from "lucide-react";

interface Vertical {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  verticalId?: string | null;
}

const emptyVertical = { name: "", slug: "", iconUrl: "", displayOrder: "0", isActive: true };

// ─── Category Linker ──────────────────────────────────────────────────────────
function CategoryLinker({ vertical, categories }: { vertical: Vertical; categories: Category[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string>("");

  const linked = categories.filter((c) => c.verticalId === vertical.id);
  const unlinked = categories.filter((c) => !c.verticalId || c.verticalId !== vertical.id);

  const assignMutation = useMutation({
    mutationFn: (catId: string) =>
      apiRequest(`/api/admin/categories/${catId}/vertical`, "PATCH", { verticalId: vertical.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category linked", description: `Category linked to ${vertical.name}` });
      setSelectedCatId("");
    },
    onError: () =>
      toast({ title: "Failed", description: "Could not link category", variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: (catId: string) =>
      apiRequest(`/api/admin/categories/${catId}/vertical`, "PATCH", { verticalId: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Category unlinked" });
    },
    onError: () =>
      toast({ title: "Failed", description: "Could not unlink category", variant: "destructive" }),
  });

  return (
    <div className="mt-3 border-t pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
      >
        <Tag className="w-3 h-3" />
        {linked.length} linked {linked.length === 1 ? "category" : "categories"}
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Linked categories */}
          <div className="flex flex-wrap gap-1.5">
            {linked.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full"
              >
                {c.name}
                <button
                  onClick={() => unlinkMutation.mutate(c.id)}
                  disabled={unlinkMutation.isPending}
                  className="hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {linked.length === 0 && (
              <span className="text-xs text-gray-400 italic">No categories linked yet</span>
            )}
          </div>

          {/* Add category */}
          {unlinked.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <Select value={selectedCatId} onValueChange={setSelectedCatId}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Link a category…" />
                </SelectTrigger>
                <SelectContent>
                  {unlinked.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2.5 text-indigo-600 border-indigo-300"
                disabled={!selectedCatId || assignMutation.isPending}
                onClick={() => assignMutation.mutate(selectedCatId)}
              >
                <Link2 className="w-3 h-3 mr-1" />
                Link
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VerticalsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyVertical);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: verticalsData, isLoading } = useQuery<Vertical[]>({
    queryKey: ["/api/admin/verticals"],
  });
  const verticals = verticalsData ?? [];

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/verticals", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verticals"] });
      toast({ title: "Vertical Created", description: "New vertical added successfully." });
      setForm(emptyVertical);
      setOpen(false);
    },
    onError: (err: any) =>
      toast({ title: "Failed", description: err.message || "Could not create vertical.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/verticals/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verticals"] });
      toast({ title: "Vertical Updated" });
      setEditingId(null);
      setForm(emptyVertical);
      setOpen(false);
    },
    onError: (err: any) =>
      toast({ title: "Failed", description: err.message || "Could not update vertical.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/verticals/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/verticals"] });
      toast({ title: "Vertical Deleted", description: "Vertical has been successfully removed." });
    },
    onError: () =>
      toast({
        title: "Failed",
        description: "Could not delete vertical. It might be referenced by categories.",
        variant: "destructive",
      }),
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      return toast({ title: "Validation Error", description: "Name and Slug are required.", variant: "destructive" });
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, ""),
      iconUrl: form.iconUrl.trim() || null,
      displayOrder: parseInt(form.displayOrder) || 0,
      isActive: form.isActive,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (v: Vertical) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      slug: v.slug,
      iconUrl: v.iconUrl || "",
      displayOrder: v.displayOrder.toString(),
      isActive: v.isActive,
    });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Globe className="w-6 h-6 text-indigo-600" />
              Market Verticals
            </CardTitle>
            <CardDescription className="mt-1">
              Configure top-level sectors to organise products, services, and customer discovery feeds.
              Link categories to a vertical so customers can filter the shop by market segment.
            </CardDescription>
          </div>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) {
                setEditingId(null);
                setForm(emptyVertical);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                <Plus className="w-4 h-4 mr-1" /> New Vertical
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Vertical" : "New Vertical"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Vertical Name *</Label>
                  <Input
                    placeholder="e.g. Fashion, Electronics, Home Services"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input
                    placeholder="e.g. fashion"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Icon (emoji or URL)</Label>
                  <Input
                    placeholder="e.g. 👗 or https://example.com/icon.svg"
                    value={form.iconUrl}
                    onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Single emoji recommended — it renders as the pill icon on the shop filter bar.
                  </p>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first on the customer feed.</p>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active Status</Label>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                >
                  {editingId ? "Update Vertical" : "Create Vertical"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : verticals.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Globe className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No verticals added yet</p>
            <p className="text-sm">Create top-level verticals to filter your marketplace catalog.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verticals
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((v) => (
                <div
                  key={v.id}
                  className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {v.iconUrl && (
                          <span className="text-lg leading-none">{v.iconUrl}</span>
                        )}
                        <h4 className="font-semibold text-gray-900">{v.name}</h4>
                        <Badge
                          variant={v.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {v.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>
                          Slug:{" "}
                          <code className="bg-gray-50 px-1 py-0.5 rounded">{v.slug}</code>
                        </p>
                        <p>Order: #{v.displayOrder}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(v)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete vertical "${v.name}"?`))
                            deleteMutation.mutate(v.id);
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Category Linker */}
                  <CategoryLinker vertical={v} categories={categories as Category[]} />
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
