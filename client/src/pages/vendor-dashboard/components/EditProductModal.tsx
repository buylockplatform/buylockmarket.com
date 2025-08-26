import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { vendorApiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import MultipleImageUploader from "./MultipleImageUploader";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  subcategoryId?: string;
  stockQuantity: number;
  imageUrl: string;
  imageUrls?: string[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
}

interface EditProductModalProps {
  vendorId: string;
  product: Product;
}

export default function EditProductModal({ vendorId, product }: EditProductModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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

  // Initialize form with product data when modal opens
  useEffect(() => {
    if (open && product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        shortDescription: product.shortDescription || "",
        price: product.price?.toString() || "",
        originalPrice: product.originalPrice?.toString() || "",
        categoryId: product.categoryId || "",
        subcategoryId: product.subcategoryId || "",
        stock: product.stockQuantity?.toString() || "",
        images: product.imageUrls || (product.imageUrl ? [product.imageUrl] : []),
        tags: product.tags?.join(', ') || "",
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== false
      });
    }
  }, [open, product]);

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

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return vendorApiRequest(`/api/vendor/products/${product.id}`, "PUT", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/products`] });
      toast({
        title: "Success",
        description: "Product updated successfully!",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

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
      description: formData.description,
      shortDescription: formData.shortDescription || formData.description.substring(0, 100),
      price: formData.price,
      originalPrice: formData.originalPrice || formData.price,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId || null,
      stockQuantity: parseInt(formData.stock) || 0,
      imageUrl: formData.images.length > 0 ? formData.images[0] : product.imageUrl,
      imageUrls: formData.images.length > 0 ? formData.images : null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
    };

    updateProductMutation.mutate(productData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originalPrice">Original Price (KES)</Label>
              <Input
                id="originalPrice"
                type="number"
                value={formData.originalPrice}
                onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
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

          {/* Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => {
                handleInputChange('categoryId', value);
                handleInputChange('subcategoryId', ''); // Reset subcategory
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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

            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select 
                value={formData.subcategoryId} 
                onValueChange={(value) => handleInputChange('subcategoryId', value)}
                disabled={!formData.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
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
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed product description..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleInputChange('shortDescription', e.target.value)}
              placeholder="Brief product summary..."
              className="min-h-[60px]"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Product Images</Label>
            <MultipleImageUploader 
              images={formData.images}
              onImagesChange={(images) => handleInputChange('images', images)}
              maxImages={5}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="electronics, smartphone, accessories"
            />
          </div>

          {/* Switches */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isFeatured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
              />
              <Label htmlFor="isFeatured">Featured Product</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}