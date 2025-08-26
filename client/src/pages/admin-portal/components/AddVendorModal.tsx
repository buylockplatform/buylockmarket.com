import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VendorFormData {
  email: string;
  password: string;
  businessName: string;
  contactName: string;
  contactPhone: string;
  businessAddress: string;
  businessDescription: string;
  registrationType: "registered" | "non-registered";
  nationalIdNumber?: string;
  taxPinNumber?: string;
}

export function AddVendorModal({ isOpen, onClose }: AddVendorModalProps) {
  const [formData, setFormData] = useState<VendorFormData>({
    email: "",
    password: "",
    businessName: "",
    contactName: "",
    contactPhone: "",
    businessAddress: "",
    businessDescription: "",
    registrationType: "non-registered",
    nationalIdNumber: "",
    taxPinNumber: "",
  });
  const [errors, setErrors] = useState<Partial<VendorFormData>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createVendorMutation = useMutation({
    mutationFn: async (vendorData: VendorFormData) => {
      const response = await apiRequest("POST", "/api/admin/vendors", vendorData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create vendor");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vendor created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      businessName: "",
      contactName: "",
      contactPhone: "",
      businessAddress: "",
      businessDescription: "",
      registrationType: "non-registered",
      nationalIdNumber: "",
      taxPinNumber: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Partial<VendorFormData> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    
    if (!formData.contactName.trim()) {
      newErrors.contactName = "Contact name is required";
    }
    
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    }
    
    if (!formData.businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    }
    
    if (!formData.businessDescription.trim()) {
      newErrors.businessDescription = "Business description is required";
    }
    
    if (!formData.nationalIdNumber?.trim()) {
      newErrors.nationalIdNumber = "National ID number is required";
    }
    
    if (formData.registrationType === "registered" && !formData.taxPinNumber?.trim()) {
      newErrors.taxPinNumber = "Tax PIN number is required for registered businesses";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      createVendorMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof VendorFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
              className={errors.businessName ? "border-red-500" : ""}
            />
            {errors.businessName && (
              <p className="text-sm text-red-500">{errors.businessName}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input
                id="contactName"
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange("contactName", e.target.value)}
                className={errors.contactName ? "border-red-500" : ""}
              />
              {errors.contactName && (
                <p className="text-sm text-red-500">{errors.contactName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                className={errors.contactPhone ? "border-red-500" : ""}
              />
              {errors.contactPhone && (
                <p className="text-sm text-red-500">{errors.contactPhone}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address *</Label>
            <Input
              id="businessAddress"
              type="text"
              value={formData.businessAddress}
              onChange={(e) => handleInputChange("businessAddress", e.target.value)}
              className={errors.businessAddress ? "border-red-500" : ""}
            />
            {errors.businessAddress && (
              <p className="text-sm text-red-500">{errors.businessAddress}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description *</Label>
            <Textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => handleInputChange("businessDescription", e.target.value)}
              className={errors.businessDescription ? "border-red-500" : ""}
              rows={3}
            />
            {errors.businessDescription && (
              <p className="text-sm text-red-500">{errors.businessDescription}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="registrationType">Registration Type *</Label>
            <Select
              value={formData.registrationType}
              onValueChange={(value: "registered" | "non-registered") => handleInputChange("registrationType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select registration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non-registered">Non-Registered Business</SelectItem>
                <SelectItem value="registered">Registered Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="nationalIdNumber">National ID Number *</Label>
            <Input
              id="nationalIdNumber"
              type="text"
              value={formData.nationalIdNumber}
              onChange={(e) => handleInputChange("nationalIdNumber", e.target.value)}
              className={errors.nationalIdNumber ? "border-red-500" : ""}
            />
            {errors.nationalIdNumber && (
              <p className="text-sm text-red-500">{errors.nationalIdNumber}</p>
            )}
          </div>
          
          {formData.registrationType === "registered" && (
            <div className="space-y-2">
              <Label htmlFor="taxPinNumber">Tax PIN Number *</Label>
              <Input
                id="taxPinNumber"
                type="text"
                value={formData.taxPinNumber}
                onChange={(e) => handleInputChange("taxPinNumber", e.target.value)}
                className={errors.taxPinNumber ? "border-red-500" : ""}
              />
              {errors.taxPinNumber && (
                <p className="text-sm text-red-500">{errors.taxPinNumber}</p>
              )}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createVendorMutation.isPending}
            >
              {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}