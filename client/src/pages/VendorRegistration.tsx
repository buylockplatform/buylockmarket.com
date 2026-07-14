import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileText, CheckCircle, Building2, User, Info,
  Loader2, AlertCircle, X,
} from "lucide-react";

// ---------- Zod schema ----------
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
  businessLatitude: z.number({ required_error: "Please select your business location on the map" }),
  businessLongitude: z.number({ required_error: "Please select your business location on the map" }),
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

interface LocationData {
  latitude: number;
  longitude: number;
  description: string;
}

interface UploadState {
  url: string | null;
  progress: number;   // 0-100
  uploading: boolean;
  error: string | null;
  fileName: string | null;
}

const emptyUpload = (): UploadState => ({
  url: null,
  progress: 0,
  uploading: false,
  error: null,
  fileName: null,
});

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
  "Other",
];

// ---------- Simple FileUploadBox ----------
interface FileUploadBoxProps {
  label: string;
  hint?: string;
  accept?: string;
  maxSizeMB?: number;
  state: UploadState;
  onUpload: (file: File) => void;
  onClear: () => void;
}

function FileUploadBox({
  label, hint, accept = "application/pdf", maxSizeMB = 10,
  state, onUpload, onClear,
}: FileUploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${maxSizeMB} MB.`);
      return;
    }
    onUpload(file);
    // Reset input so same file can be re-selected after clearing
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {/* Drop-zone / trigger area */}
      <div
        onClick={() => !state.uploading && !state.url && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed
          transition-all cursor-pointer
          ${state.url
            ? "border-green-400 bg-green-50 cursor-default"
            : state.error
              ? "border-red-400 bg-red-50"
              : "border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
          disabled={state.uploading || !!state.url}
        />

        {state.uploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-sm text-gray-600">Uploading… {state.progress}%</p>
            <Progress value={state.progress} className="w-full h-2" />
          </>
        ) : state.url ? (
          <>
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-sm font-medium text-green-700">Uploaded successfully</p>
            <p className="text-xs text-gray-500 truncate max-w-full">{state.fileName}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 p-1 rounded-full bg-white shadow hover:bg-red-50 text-gray-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : state.error ? (
          <>
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-red-600">{state.error}</p>
            <p className="text-xs text-gray-500">Click to try again</p>
          </>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400" />
            <p className="text-sm text-gray-600">Click to select a file</p>
            <p className="text-xs text-gray-400">Max {maxSizeMB} MB</p>
          </>
        )}
      </div>

      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

// ---------- Main Component ----------
export default function VendorRegistration() {
  const { toast } = useToast();

  const [nationalIdFrontUpload, setNationalIdFrontUpload] = useState<UploadState>(emptyUpload());
  const [nationalIdBackUpload, setNationalIdBackUpload] = useState<UploadState>(emptyUpload());
  const [taxCertUpload, setTaxCertUpload] = useState<UploadState>(emptyUpload());
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

  // ---------- Location ----------
  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setIsLocationConfirmed(true);
    form.setValue("businessLatitude", location.latitude);
    form.setValue("businessLongitude", location.longitude);
    form.setValue("locationDescription", location.description);
    toast({ title: "Location Selected", description: "Business location has been confirmed" });
  };

  // ---------- File upload helper ----------
  const uploadFile = async (
    file: File,
    setter: React.Dispatch<React.SetStateAction<UploadState>>
  ) => {
    setter({ url: null, progress: 0, uploading: true, error: null, fileName: file.name });

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate progress (XHR gives real progress; fetch doesn't)
      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setter((prev) => ({ ...prev, progress: pct }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              setter({ url: data.url, progress: 100, uploading: false, error: null, fileName: file.name });
              resolve();
            } catch {
              reject(new Error("Invalid server response"));
            }
          } else {
            let msg = "Upload failed";
            try { msg = JSON.parse(xhr.responseText).message ?? msg; } catch { }
            reject(new Error(msg));
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
        xhr.open("POST", "/api/upload/file");
        xhr.send(formData);
      });
    } catch (err: any) {
      setter((prev) => ({ ...prev, uploading: false, error: err.message ?? "Upload failed" }));
    }
  };

  // ---------- Submit ----------
  const registerMutation = useMutation({
    mutationFn: async (data: VendorRegistrationForm) => {
      return await apiRequest("/api/vendor/register", "POST", {
        ...data,
        nationalIdFrontUrl: nationalIdFrontUpload.url,
        nationalIdBackUrl: nationalIdBackUpload.url,
        taxCertificateUrl: taxCertUpload.url,
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your vendor application has been submitted and is pending admin approval.",
      });
      form.reset();
      setNationalIdFrontUpload(emptyUpload());
      setNationalIdBackUpload(emptyUpload());
      setTaxCertUpload(emptyUpload());
      setSelectedLocation(null);
      setIsLocationConfirmed(false);
      setTimeout(() => { window.location.href = "/vendor-dashboard/login"; }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: VendorRegistrationForm) => {
    if (!nationalIdFrontUpload.url) {
      toast({ title: "Missing Document", description: "Please upload your National ID front image", variant: "destructive" });
      return;
    }
    if (!nationalIdBackUpload.url) {
      toast({ title: "Missing Document", description: "Please upload your National ID back image", variant: "destructive" });
      return;
    }
    if (data.vendorType === "registered" && !taxCertUpload.url) {
      toast({ title: "Missing Document", description: "Tax certificate is required for registered vendors", variant: "destructive" });
      return;
    }
    if (!selectedLocation) {
      toast({ title: "Location Required", description: "Please select your business location on the map", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await registerMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allRequiredComplete = () => {
    const hasLocation = selectedLocation && isLocationConfirmed;
    const hasNid = nationalIdFrontUpload.url && nationalIdBackUpload.url;
    if (watchVendorType === "registered") {
      return hasNid && taxCertUpload.url && hasLocation;
    }
    return hasNid && hasLocation;
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#FFF4E6] via-[#FAFAFB] to-[#FAFAFB] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_15px_45px_rgba(15,23,42,0.06)] bg-white overflow-hidden p-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-extrabold text-center text-gray-900 tracking-tight">
              Vendor Registration
            </CardTitle>
            <CardDescription className="text-center text-gray-500 mt-1">
              Join the BuyLock marketplace and start selling your products and services
            </CardDescription>
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <a href="/vendor-dashboard/login" className="text-[#FF5A1F] hover:text-[#e64e17] font-semibold transition-colors">
                  Login here
                </a>
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* ── Vendor Type ── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Vendor Type
                  </h3>

                  <FormField
                    control={form.control}
                    name="vendorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Choose your vendor type *</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-4">
                            <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-muted/50">
                              <RadioGroupItem value="registered" id="registered" />
                              <Label htmlFor="registered" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <Building2 className="h-5 w-5 text-primary" />
                                  <div>
                                    <div className="font-medium">Registered Business</div>
                                    <div className="text-sm text-muted-foreground">National ID + Tax Certificate required</div>
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
                                    <div className="font-medium">Individual / Non-Registered</div>
                                    <div className="text-sm text-muted-foreground">National ID only – ideal for individual sellers</div>
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
                          ? "As a registered business, you'll need your Tax PIN and both National ID and Tax Certificate documents."
                          : "As an individual vendor, only your National ID number and document scan are required."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* ── Business Information ── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Business Information</h3>

                  <FormField control={form.control} name="businessName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl><Input placeholder="Enter your business name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="businessCategory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select your business category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {businessCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your business and services" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* ── Contact Information ── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>

                  <FormField control={form.control} name="contactName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name *</FormLabel>
                      <FormControl><Input placeholder="Enter contact person name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl><Input type="email" placeholder="Enter email address" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl><Input placeholder="+254 7XX XXX XXX" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address *</FormLabel>
                      <FormControl><Input placeholder="Enter business address" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <FormControl><Input type="password" placeholder="Create a password (min. 6 chars)" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* ── Identity & Tax ── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identity &amp; Tax Information</h3>

                  <FormField control={form.control} name="nationalIdNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID Number *</FormLabel>
                      <FormControl><Input placeholder="12345678 (8 digits)" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {watchVendorType === "registered" && (
                    <FormField control={form.control} name="taxPinNumber" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax PIN Number *</FormLabel>
                        <FormControl><Input placeholder="A000000000X" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>

                {/* ── Business Location ── */}
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedLocation || undefined}
                  className="w-full"
                />

                {/* ── Document Uploads ── */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Required Documents
                  </h3>

                  {/* National ID – Front & Back as separate images */}
                  <p className="text-sm font-medium text-gray-700">National ID Photos *</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadBox
                      label="National ID – Front *"
                      hint="Clear photo of the front side. Max 10 MB."
                      accept="image/*"
                      maxSizeMB={10}
                      state={nationalIdFrontUpload}
                      onUpload={(file) => uploadFile(file, setNationalIdFrontUpload)}
                      onClear={() => setNationalIdFrontUpload(emptyUpload())}
                    />
                    <FileUploadBox
                      label="National ID – Back *"
                      hint="Clear photo of the back side. Max 10 MB."
                      accept="image/*"
                      maxSizeMB={10}
                      state={nationalIdBackUpload}
                      onUpload={(file) => uploadFile(file, setNationalIdBackUpload)}
                      onClear={() => setNationalIdBackUpload(emptyUpload())}
                    />
                  </div>

                  {watchVendorType === "registered" && (
                    <FileUploadBox
                      label="Tax Certificate (KRA) *"
                      hint="Upload a photo of your KRA tax compliance certificate. Max 5 MB."
                      accept="image/*"
                      maxSizeMB={5}
                      state={taxCertUpload}
                      onUpload={(file) => uploadFile(file, setTaxCertUpload)}
                      onClear={() => setTaxCertUpload(emptyUpload())}
                    />
                  )}

                  <div className="text-sm text-blue-800 bg-blue-50/60 border border-blue-100/80 rounded-2xl p-5 shadow-sm">
                    <FileText className="w-4 h-4 inline mr-2 text-blue-600" />
                    Upload clear photos of both sides of your National ID.
                    {watchVendorType === "registered" && " Registered vendors must also upload a KRA Tax Certificate."}
                  </div>
                </div>

                {/* ── Submit ── */}
                <Button
                  type="submit"
                  className="w-full bg-[#FF5A1F] hover:bg-[#e64e17] text-white font-semibold rounded-[14px] py-6 shadow-sm hover:shadow-[0_8px_24px_rgba(255,90,31,0.3)] transition-all hover:-translate-y-0.5 flex items-center justify-center border-none mt-4"
                  disabled={isSubmitting || !allRequiredComplete()}
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering…</>
                    : "Register as Vendor"
                  }
                </Button>

                {!allRequiredComplete() && (
                  <p className="text-xs text-red-500 font-semibold text-center mt-2">
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