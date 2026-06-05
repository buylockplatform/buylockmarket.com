import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { vendorApiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Layers, Plus, Trash2, Edit, Save, PlusCircle, X } from "lucide-react";

interface Variant {
  id: string;
  productId: string;
  sku: string | null;
  attributes: Record<string, string>;
  priceModifier: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

interface ProductVariantsManagerProps {
  productId: string;
}

const emptyVariant = {
  sku: "",
  priceModifier: "0",
  stock: "0",
  attributes: [] as { key: string; value: string }[]
};

export default function ProductVariantsManager({ productId }: ProductVariantsManagerProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyVariant);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Attribute temp input
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const { data: variants = [], isLoading } = useQuery<Variant[]>({
    queryKey: [`/api/vendor/products/${productId}/variants`],
    queryFn: () => vendorApiRequest(`/api/vendor/products/${productId}/variants`, "GET"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      vendorApiRequest(`/api/vendor/products/${productId}/variants`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/products/${productId}/variants`] });
      toast({ title: "Variant Created", description: "Product variant added successfully." });
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message || "Could not create variant.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      vendorApiRequest(`/api/vendor/products/${productId}/variants/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/products/${productId}/variants`] });
      toast({ title: "Variant Updated" });
      setEditingId(null);
      resetForm();
      setOpen(false);
    },
    onError: (err: any) => toast({ title: "Failed", description: err.message || "Could not update variant.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      vendorApiRequest(`/api/vendor/products/${productId}/variants/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/products/${productId}/variants`] });
      toast({ title: "Variant Deleted" });
    },
    onError: () => toast({ title: "Failed", description: "Could not delete variant.", variant: "destructive" }),
  });

  const resetForm = () => {
    setForm(emptyVariant);
    setEditingId(null);
    setNewKey("");
    setNewValue("");
  };

  const handleAddAttribute = () => {
    if (!newKey.trim() || !newValue.trim()) {
      return toast({ title: "Validation Error", description: "Key and Value are required.", variant: "destructive" });
    }
    // Prevent duplicate keys
    if (form.attributes.some(attr => attr.key.toLowerCase() === newKey.trim().toLowerCase())) {
      return toast({ title: "Duplicate Attribute", description: "This attribute key already exists.", variant: "destructive" });
    }
    setForm(prev => ({
      ...prev,
      attributes: [...prev.attributes, { key: newKey.trim(), value: newValue.trim() }]
    }));
    setNewKey("");
    setNewValue("");
  };

  const handleRemoveAttribute = (index: number) => {
    setForm(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (form.attributes.length === 0) {
      return toast({ title: "Validation Error", description: "Please define at least one attribute (e.g. Size: M).", variant: "destructive" });
    }

    // Convert attributes array back to key-value object
    const attributesObj = form.attributes.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const payload = {
      sku: form.sku.trim() || null,
      priceModifier: form.priceModifier || "0",
      stock: parseInt(form.stock) || 0,
      attributes: attributesObj
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (v: Variant) => {
    setEditingId(v.id);
    const mappedAttrs = Object.entries(v.attributes).map(([key, value]) => ({ key, value }));
    setForm({
      sku: v.sku || "",
      priceModifier: v.priceModifier,
      stock: v.stock.toString(),
      attributes: mappedAttrs
    });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5 text-buylock-primary" />
            Manage Product Variants
          </CardTitle>
          <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-buylock-primary hover:bg-buylock-primary/90">
                <Plus className="w-4 h-4 mr-1" /> Add Variant
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Product Variant" : "New Product Variant"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* SKU */}
                <div>
                  <Label>SKU (Stock Keeping Unit)</Label>
                  <Input placeholder="e.g. TSHIRT-M-BLUE" value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
                </div>

                {/* Attributes definition */}
                <div className="border p-3 rounded-lg space-y-3">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attributes</Label>
                  
                  {/* List defined */}
                  {form.attributes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.attributes.map((attr, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1.5 py-1 px-2.5">
                          <span className="font-semibold text-gray-700">{attr.key}:</span>
                          <span>{attr.value}</span>
                          <button type="button" onClick={() => handleRemoveAttribute(idx)} className="text-gray-400 hover:text-gray-600 ml-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add Attribute Row */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input placeholder="Key (e.g. Size)" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="flex-1">
                      <Input placeholder="Value (e.g. Medium)" value={newValue} onChange={e => setNewValue(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <Button type="button" size="sm" onClick={handleAddAttribute} className="h-8 px-2 bg-gray-100 text-gray-700 hover:bg-gray-200">
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Price Modifier & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price Modifier (KES)</Label>
                    <Input type="number" placeholder="e.g. +150 or -50" value={form.priceModifier}
                      onChange={e => setForm(f => ({ ...f, priceModifier: e.target.value }))} />
                    <p className="text-[10px] text-gray-500 mt-1">Offset added to the base price.</p>
                  </div>
                  <div>
                    <Label>Stock Quantity</Label>
                    <Input type="number" placeholder="0" value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                  </div>
                </div>

                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full bg-buylock-primary hover:bg-buylock-primary/90 mt-2">
                  {editingId ? "Update Variant" : "Add Variant"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs text-gray-500">Configure multiple options like sizes, colors, or materials, each with customized stock and price adjustments.</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : variants.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Layers className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No variants configured</p>
            <p className="text-sm">Click "Add Variant" to set up item variations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {variants.map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {Object.entries(v.attributes).map(([key, val]) => (
                      <Badge key={key} variant="secondary" className="text-xs font-normal">
                        <span className="font-semibold text-gray-600">{key}:</span> {val}
                      </Badge>
                    ))}
                    {v.sku && <Badge variant="outline" className="text-xs font-mono">{v.sku}</Badge>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>Stock: <strong className="text-gray-700">{v.stock}</strong></span>
                    <span>Price Offset: <strong className={parseFloat(v.priceModifier) >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {parseFloat(v.priceModifier) >= 0 ? `+ KES ${v.priceModifier}` : `- KES ${Math.abs(parseFloat(v.priceModifier))}`}
                    </strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(v.id)}
                    disabled={deleteMutation.isPending} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
