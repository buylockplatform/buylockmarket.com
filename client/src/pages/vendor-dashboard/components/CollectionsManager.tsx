import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vendorApiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, Trash2, Edit, Package } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = { name: "", description: "", displayOrder: "0" };

export default function CollectionsManager() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: collections = [], isLoading } = useQuery<Collection[]>({
    queryKey: ["/api/vendor/collections"],
    queryFn: () => vendorApiRequest("/api/vendor/collections", "GET"),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      vendorApiRequest("/api/vendor/collections", "POST", {
        name: data.name,
        description: data.description || null,
        displayOrder: parseInt(data.displayOrder) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/collections"] });
      toast({ title: "Collection Created", description: "New collection added successfully." });
      setForm(emptyForm);
      setOpen(false);
    },
    onError: () => toast({ title: "Failed", description: "Could not create collection.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyForm }) =>
      vendorApiRequest(`/api/vendor/collections/${id}`, "PUT", {
        name: data.name,
        description: data.description || null,
        displayOrder: parseInt(data.displayOrder) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/collections"] });
      toast({ title: "Collection Updated" });
      setEditingId(null);
      setForm(emptyForm);
      setOpen(false);
    },
    onError: () => toast({ title: "Failed", description: "Could not update collection.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApiRequest(`/api/vendor/collections/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/collections"] });
      toast({ title: "Collection Deleted" });
    },
    onError: () => toast({ title: "Failed", description: "Could not delete collection.", variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return toast({ title: "Collection name required", variant: "destructive" });
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (col: Collection) => {
    setEditingId(col.id);
    setForm({ name: col.name, description: col.description || "", displayOrder: col.displayOrder.toString() });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-buylock-primary" />
            Product Collections
          </CardTitle>
          <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-buylock-primary hover:bg-buylock-primary/90">
                <Plus className="w-4 h-4 mr-1" /> New Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Collection" : "New Collection"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Collection Name *</Label>
                  <Input placeholder="e.g. Summer Sale, New Arrivals" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea placeholder="Brief description of this collection..." value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input type="number" placeholder="0" value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first.</p>
                </div>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full bg-buylock-primary hover:bg-buylock-primary/90">
                  {editingId ? "Update Collection" : "Create Collection"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-gray-500">Group your products into themed collections to help customers browse.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : collections.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No collections yet</p>
            <p className="text-sm">Create collections to group your products (e.g. "New Arrivals", "Sale Items").</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map(col => (
                <div key={col.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{col.name}</h4>
                        <Badge variant={col.isActive ? "default" : "secondary"} className="text-xs">
                          {col.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {col.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{col.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(col)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => { if (confirm(`Delete "${col.name}"?`)) deleteMutation.mutate(col.id); }}
                        disabled={deleteMutation.isPending}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Package className="w-3 h-3" />
                    <span>Order: #{col.displayOrder}</span>
                    <span className="mx-1">•</span>
                    <span>Created {new Date(col.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
