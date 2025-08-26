import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { vendorApiRequest } from "@/lib/queryClient";
import { Plus, DollarSign, Package, Tag } from "lucide-react";
import MultipleImageUploader from "./MultipleImageUploader";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface AddProductModalProps {
  vendorId: string;
}

export default function AddProductModal({ vendorId }: AddProductModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    originalPrice: "",
    categoryId: "",
    subcategoryId: "",
    stock: "",
    images: [] as string[],
    tags: "",
    isFeatured: false,
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Fetch all subcategories and filter by category
  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ['/api/subcategories'],
    retry: false,
  });

  // Filter subcategories by selected category
  const subcategories = allSubcategories.filter(sub => sub.categoryId === formData.categoryId);

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return vendorApiRequest("/api/vendor/products", "POST", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/products`] });
      toast({
        title: "Success",
        description: "Product created successfully!",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      shortDescription: "",
      price: "",
      originalPrice: "",
      categoryId: "",
      subcategoryId: "",
      stock: "",
      images: [],
      tags: "",
      isFeatured: false,
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now(),
      description: formData.description,
      shortDescription: formData.shortDescription || formData.description.substring(0, 100),
      price: formData.price,
      originalPrice: formData.originalPrice || formData.price,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId || null,
      stock: parseInt(formData.stock) || 0,
      imageUrl: formData.images.length > 0 ? formData.images[0] : "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500",
      imageUrls: formData.images.length > 0 ? formData.images : null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      vendorId: vendorId,
      adminApproved: true // Default to approved for vendor products
    };

    createProductMutation.mutate(productData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset subcategory when category changes
    if (field === 'categoryId') {
      setFormData(prev => ({
        ...prev,
        subcategoryId: ""
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-buylock-primary hover:bg-buylock-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Add New Product
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief product description (for listings)"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description"
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing & Stock
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Selling Price (KES) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="originalPrice">Original Price (KES)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Category & Classification */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Category & Classification
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {subcategories.length > 0 && (
                <div>
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Select value={formData.subcategoryId} onValueChange={(value) => handleInputChange('subcategoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="electronics, smartphone, android"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Product Images</h4>
            <MultipleImageUploader
              images={formData.images}
              onImagesChange={(images) => handleInputChange('images', images)}
              maxImages={5}
              label="Product Images"
              description="Upload high-quality images of your product. First image will be the main product image."
            />
          </div>

          {/* Product Status */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Product Status</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="featured">Featured Product</Label>
                <p className="text-sm text-gray-500">Display this product prominently on the homepage</p>
              </div>
              <Switch
                id="featured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="active">Active Status</Label>
                <p className="text-sm text-gray-500">Make this product available for purchase</p>
              </div>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="bg-buylock-primary hover:bg-buylock-primary/90"
            >
              {createProductMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}