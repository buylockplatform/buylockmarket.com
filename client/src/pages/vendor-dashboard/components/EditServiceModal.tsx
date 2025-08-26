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

interface Service {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  priceType: string;
  categoryId: string;
  location: string;
  imageUrl: string;
  imageUrls?: string[];
  tags: string[];
  isFeatured: boolean;
  isActive: boolean;
  isAvailableToday: boolean;
}

interface EditServiceModalProps {
  vendorId: string;
  service: Service;
}

export default function EditServiceModal({ vendorId, service }: EditServiceModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    priceType: "hourly",
    categoryId: "",
    location: "",
    images: [] as string[],
    tags: "",
    isFeatured: false,
    isActive: true,
    isAvailableToday: true
  });

  // Initialize form with service data when modal opens
  useEffect(() => {
    if (open && service) {
      setFormData({
        name: service.name || "",
        description: service.description || "",
        shortDescription: service.shortDescription || "",
        price: service.price?.toString() || "",
        priceType: service.priceType || "hourly",
        categoryId: service.categoryId || "",
        location: service.location || "",
        images: service.imageUrls || (service.imageUrl ? [service.imageUrl] : []),
        tags: service.tags?.join(', ') || "",
        isFeatured: service.isFeatured || false,
        isActive: service.isActive !== false,
        isAvailableToday: service.isAvailableToday !== false
      });
    }
  }, [open, service]);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      return vendorApiRequest(`/api/vendor/services/${service.id}`, "PUT", serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/services`] });
      toast({
        title: "Success",
        description: "Service updated successfully!",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
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

    const serviceData = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription || formData.description.substring(0, 100),
      price: formData.price,
      priceType: formData.priceType,
      categoryId: formData.categoryId,
      location: formData.location || "Nairobi & Surrounding Areas",
      imageUrl: formData.images.length > 0 ? formData.images[0] : service.imageUrl,
      imageUrls: formData.images.length > 0 ? formData.images : null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      isAvailableToday: formData.isAvailableToday,
    };

    updateServiceMutation.mutate(serviceData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const priceTypeOptions = [
    { value: "hourly", label: "Per Hour" },
    { value: "per_service", label: "Per Service" },
    { value: "daily", label: "Per Day" },
    { value: "fixed", label: "Fixed Price" }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter service name"
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
              <Label htmlFor="priceType">Price Type</Label>
              <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price type" />
                </SelectTrigger>
                <SelectContent>
                  {priceTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
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
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Service Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., Nairobi & Surrounding Areas"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed service description..."
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
              placeholder="Brief service summary..."
              className="min-h-[60px]"
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Service Images</Label>
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
              placeholder="plumbing, repair, maintenance"
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
              <Label htmlFor="isFeatured">Featured Service</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailableToday"
                checked={formData.isAvailableToday}
                onCheckedChange={(checked) => handleInputChange('isAvailableToday', checked)}
              />
              <Label htmlFor="isAvailableToday">Available Today</Label>
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
              disabled={updateServiceMutation.isPending}
            >
              {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}