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
import { Plus, DollarSign, Wrench, Tag, MapPin, Clock } from "lucide-react";
import MultipleImageUploader from "./MultipleImageUploader";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AddServiceModalProps {
  vendorId: string;
}

export default function AddServiceModal({ vendorId }: AddServiceModalProps) {
  const [open, setOpen] = useState(false);
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories (services use different categories)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    retry: false,
  });

  // Filter service categories (you may want to create separate service categories)
  const serviceCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes('service') || 
    ['Home Services', 'Professional Services', 'Business Services'].includes(cat.name)
  );

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (serviceData: any) => {
      return vendorApiRequest("/api/vendor/services", "POST", serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/services`] });
      toast({
        title: "Success",
        description: "Service created successfully!",
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
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
      priceType: "hourly",
      categoryId: "",
      location: "",
      images: [],
      tags: "",
      isFeatured: false,
      isActive: true,
      isAvailableToday: true
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

    const serviceData = {
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + Date.now(),
      description: formData.description,
      shortDescription: formData.shortDescription || formData.description.substring(0, 100),
      price: formData.price,
      priceType: formData.priceType,
      categoryId: formData.categoryId,
      location: formData.location || "Nairobi & Surrounding Areas",
      imageUrl: formData.images.length > 0 ? formData.images[0] : "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500",
      imageUrls: formData.images.length > 0 ? formData.images : null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      isAvailableToday: formData.isAvailableToday,
      providerId: vendorId,
      rating: "0.00",
      reviewCount: 0,
      adminApproved: true // Default to approved for vendor services
    };

    createServiceMutation.mutate(serviceData);
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
        <Button className="bg-buylock-primary hover:bg-buylock-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wrench className="w-5 h-5 mr-2" />
            Add New Service
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Service Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Home Cleaning Service, Plumbing Repair"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief service description (for listings)"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed service description, what's included, your expertise..."
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Pricing & Type */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing & Service Type
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (KES) *</Label>
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
                <Label htmlFor="priceType">Pricing Type *</Label>
                <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pricing type" />
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
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Pricing Guidelines</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Per Hour:</strong> Great for flexible services like cleaning, tutoring</li>
                <li>• <strong>Per Service:</strong> For one-time jobs with fixed scope</li>
                <li>• <strong>Per Day:</strong> For full-day commitments</li>
                <li>• <strong>Fixed Price:</strong> For specific deliverables or packages</li>
              </ul>
            </div>
          </div>

          {/* Category & Location */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Category & Location
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="category">Service Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service category" />
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
                <Label htmlFor="location">Service Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Nairobi & Surrounding Areas"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Specify the areas where you provide this service
                </p>
              </div>
              
              <div>
                <Label htmlFor="tags">Service Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="cleaning, home, residential, professional"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Service Images</h4>
            <MultipleImageUploader
              images={formData.images}
              onImagesChange={(images) => handleInputChange('images', images)}
              maxImages={5}
              label="Service Images"
              description="Upload high-quality images of your service. First image will be the main service image."
            />
          </div>

          {/* Service Availability */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Service Status & Availability
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="featured">Featured Service</Label>
                  <p className="text-sm text-gray-500">Display this service prominently on the homepage</p>
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
                  <p className="text-sm text-gray-500">Make this service available for booking</p>
                </div>
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="availableToday">Available Today</Label>
                  <p className="text-sm text-gray-500">Can customers book this service today?</p>
                </div>
                <Switch
                  id="availableToday"
                  checked={formData.isAvailableToday}
                  onCheckedChange={(checked) => handleInputChange('isAvailableToday', checked)}
                />
              </div>
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
              disabled={createServiceMutation.isPending}
              className="bg-buylock-primary hover:bg-buylock-primary/90"
            >
              {createServiceMutation.isPending ? "Creating..." : "Create Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}