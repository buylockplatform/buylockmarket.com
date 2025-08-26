import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { LocationPicker } from "@/components/LocationPicker";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, Building2, User, Info } from "lucide-react";

// Create conditional schema based on vendor type
const vendorRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(1, "Business name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  businessCategory: z.string().min(1, "Business category is required"),
  description: z.string().optional(),
  vendorType: z.enum(["registered", "non_registered"], {
    required_error: "Please select your vendor type",
  }),
  nationalIdNumber: z.string().regex(/^\d{8}$/, "National ID must be 8 digits"),
  taxPinNumber: z.string().optional(),
  // Location fields
  businessLatitude: z.number({
    required_error: "Please select your business location on the map",
  }),
  businessLongitude: z.number({
    required_error: "Please select your business location on the map",
  }),
  locationDescription: z.string().min(1, "Location description is required"),
}).refine(
  (data) => {
    if (data.vendorType === "registered") {
      return data.taxPinNumber && /^A\d{9}[A-Z]$/.test(data.taxPinNumber);
    }
    return true;
  },
  {
    message: "Tax PIN is required for registered vendors and must be in format A000000000X",
    path: ["taxPinNumber"],
  }
);

type VendorRegistrationForm = z.infer<typeof vendorRegistrationSchema>;

interface DocumentUploadState {
  nationalId: string | null;
  taxCertificate: string | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  description: string;
}

const businessCategories = [
  "Electronics & Technology",
  "Home & Garden Services", 
  "Food & Beverages",
  "Fashion & Clothing",
  "Health & Beauty",
  "Automotive",
  "Professional Services",
  "Construction & Maintenance",
  "Education & Training",
  "Entertainment",
  "Other"
];

export default function VendorRegistration() {
  const { toast } = useToast();
  const [documentUrls, setDocumentUrls] = useState<DocumentUploadState>({
    nationalId: null,
    taxCertificate: null,
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorRegistrationForm>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      email: "",
      password: "",
      businessName: "",
      contactName: "",
      phone: "",
      address: "",
      businessCategory: "",
      description: "",
      vendorType: "registered",
      nationalIdNumber: "",
      taxPinNumber: "",
      businessLatitude: 0,
      businessLongitude: 0,
      locationDescription: "",
    },
  });

  const watchVendorType = form.watch("vendorType");

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setIsLocationConfirmed(true);
    form.setValue("businessLatitude", location.latitude);
    form.setValue("businessLongitude", location.longitude);
    form.setValue("locationDescription", location.description);
    toast({
      title: "Location Selected",
      description: "Business location has been confirmed",
    });
  };

  const registerMutation = useMutation({
    mutationFn: async (data: VendorRegistrationForm & DocumentUploadState) => {
      return await apiRequest("/api/vendor/register", "POST", {
        ...data,
        nationalIdUrl: data.nationalId,
        taxCertificateUrl: data.taxCertificate,
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your vendor application has been submitted and is pending admin approval.",
      });
      // Reset form and state
      form.reset();
      setDocumentUrls({
        nationalId: null,
        taxCertificate: null,
      });
      setSelectedLocation(null);
      setIsLocationConfirmed(false);
      
      // Redirect to vendor login page after 2 seconds
      setTimeout(() => {
        window.location.href = '/vendor-dashboard/login';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const getUploadParameters = async () => {
    const response = await apiRequest("/api/objects/upload", "POST");
    return {
      method: "PUT" as const,
      url: response.uploadURL,
    };
  };

  const handleDocumentUpload = (documentType: keyof DocumentUploadState) => (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setDocumentUrls(prev => ({
        ...prev,
        [documentType]: uploadedFile.uploadURL,
      }));
      toast({
        title: "Document Uploaded",
        description: `${documentType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} uploaded successfully`,
      });
    }
  };

  const onSubmit = async (data: VendorRegistrationForm) => {
    // Validate required documents based on vendor type
    if (!documentUrls.nationalId) {
      toast({
        title: "Missing Document",
        description: "Please upload your National ID document",
        variant: "destructive",
      });
      return;
    }

    if (data.vendorType === "registered" && !documentUrls.taxCertificate) {
      toast({
        title: "Missing Document",
        description: "Tax certificate is required for registered vendors",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLocation) {
      toast({
        title: "Location Required",
        description: "Please select your business location on the map",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await registerMutation.mutateAsync({
        ...data,
        ...documentUrls,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allRequiredDocumentsUploaded = () => {
    const hasLocation = selectedLocation && isLocationConfirmed;
    if (watchVendorType === "registered") {
      return documentUrls.nationalId && documentUrls.taxCertificate && hasLocation;
    }
    return documentUrls.nationalId && hasLocation;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Vendor Registration</CardTitle>
            <CardDescription className="text-center">
              Join the BuyLock marketplace and start selling your products and services
            </CardDescription>
            <div className="text-center pt-2">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a 
                  href="/vendor-dashboard/login" 
                  className="text-[#FF4605] hover:text-[#E63D00] font-medium hover:underline"
                >
                  Login here
                </a>
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Vendor Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Vendor Type Selection
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="vendorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose your vendor type *</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                              <RadioGroupItem value="registered" id="registered" />
                              <Label htmlFor="registered" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-5 w-5 text-primary" />
                                  <div>
                                    <div className="font-medium">Registered Business</div>
                                    <div className="text-sm text-muted-foreground">
                                      Provide all business details including National ID and Tax Certificate
                                    </div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                              <RadioGroupItem value="non_registered" id="non_registered" />
                              <Label htmlFor="non_registered" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <User className="h-5 w-5 text-primary" />
                                  <div>
                                    <div className="font-medium">Individual/Non-Registered</div>
                                    <div className="text-sm text-muted-foreground">
                                      Only National ID required - ideal for individual sellers
                                    </div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchVendorType && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        {watchVendorType === "registered" 
                          ? "As a registered business, you'll need to provide your Tax PIN and upload both National ID and Tax Certificate documents."
                          : "As an individual vendor, you only need to provide your National ID number and upload the National ID document."
                        }
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your business category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {businessCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business and services" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Identity and Tax Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identity & Tax Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="nationalIdNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>National ID Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678 (8 digits)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchVendorType === "registered" && (
                    <FormField
                      control={form.control}
                      name="taxPinNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax PIN Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="A000000000X" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Business Location */}
                <LocationPicker 
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedLocation || undefined}
                  className="w-full"
                />

                {/* Document Uploads */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Required Documents (PDF Only)</h3>
                  
                  <div className={`grid grid-cols-1 gap-4 ${watchVendorType === "registered" ? "md:grid-cols-2" : ""}`}>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">National ID (Front & Back Combined) *</label>
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={10485760} // 10MB
                        allowedFileTypes={['application/pdf']}
                        onGetUploadParameters={getUploadParameters}
                        onComplete={handleDocumentUpload('nationalId')}
                        buttonClassName={`w-full ${documentUrls.nationalId ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {documentUrls.nationalId ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Uploaded</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload PDF</span>
                            </>
                          )}
                        </div>
                      </ObjectUploader>
                      <p className="text-xs text-gray-500">
                        Please combine both front and back pages into a single PDF document.
                      </p>
                    </div>

                    {watchVendorType === "registered" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tax Certificate *</label>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          allowedFileTypes={['application/pdf']}
                          onGetUploadParameters={getUploadParameters}
                          onComplete={handleDocumentUpload('taxCertificate')}
                          buttonClassName={`w-full ${documentUrls.taxCertificate ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            {documentUrls.taxCertificate ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Uploaded</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>Upload PDF</span>
                              </>
                            )}
                          </div>
                        </ObjectUploader>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <FileText className="w-4 h-4 inline mr-2" />
                    {watchVendorType === "registered" 
                      ? "Please combine both sides of your national ID into a single PDF file, and upload your tax certificate as a separate PDF. Maximum file size: 10MB for National ID, 5MB for tax certificate."
                      : "Please combine both sides of your national ID into a single PDF file. Maximum file size: 10MB."
                    }
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-[#FF4605] hover:bg-[#E63D00]" 
                  disabled={isSubmitting || !allRequiredDocumentsUploaded()}
                >
                  {isSubmitting ? "Registering..." : "Register as Vendor"}
                </Button>

                {!allRequiredDocumentsUploaded() && (
                  <p className="text-sm text-red-600 text-center">
                    Please upload all required documents and confirm your business location before submitting
                  </p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}