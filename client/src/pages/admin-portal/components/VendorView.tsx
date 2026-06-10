import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Store,
  MapPin,
  Calendar,
  Mail,
  Phone,
  Package,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Eye,
  Star,
  ShoppingCart,
  Loader2,
  ExternalLink,
  FileText,
  XCircle,
  Wrench,
} from "lucide-react";
import { apiRequest, adminApiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VendorDocument {
  type: string;
  documentType: string;
  number?: string | null;
  url?: string | null;
  uploaded: boolean;
}

interface VendorOrder {
  id: string;
  status: string;
  totalAmount: number | string;
  paymentStatus?: string | null;
  orderType?: string | null;
  customerName: string;
  customerEmail?: string | null;
  createdAt: string;
}

interface VendorPayoutRequest {
  id: string;
  requestedAmount: string | number;
  availableBalance?: string | number | null;
  status: string;
  requestReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

interface VendorDetail {
  id: string;
  email: string;
  businessName: string;
  contactEmail: string;
  contactName: string;
  phone?: string | null;
  address?: string | null;
  businessAddress?: string | null;
  city?: string | null;
  suburb?: string | null;
  building?: string | null;
  postalCode?: string | null;
  businessCategory: string;
  description?: string | null;
  vendorType?: string | null;
  nationalIdNumber?: string | null;
  taxPinNumber?: string | null;
  nationalIdUrl?: string | null;
  taxCertificateUrl?: string | null;
  locationDescription?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  verificationStatus: string;
  verificationNotes?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    totalEarnings: number;
    availableBalance: number;
    pendingBalance: number;
    totalPaidOut: number;
  };
  recentOrders: VendorOrder[];
  payoutRequests: VendorPayoutRequest[];
  documents: VendorDocument[];
}

const SUSPEND_REASONS = [
  { value: "policy_violation", label: "Business violates platform policy" },
  { value: "fraud_suspected", label: "Suspected fraudulent activity" },
  { value: "quality_issues", label: "Repeated quality or fulfillment issues" },
  { value: "customer_complaints", label: "Multiple unresolved customer complaints" },
  { value: "custom", label: "Other reason (specify below)" },
];

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(amount: number | string | null | undefined) {
  const value = typeof amount === "number" ? amount : parseFloat(String(amount || 0));
  return `KSh ${(isNaN(value) ? 0 : value).toLocaleString()}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case "verified":
    case "approved":
    case "completed":
    case "fulfilled":
    case "success":
      return "bg-green-100 text-green-800";
    case "pending":
    case "paid":
    case "ready_for_pickup":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function VendorDocumentViewer({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);
  const isPdf = url?.toLowerCase().includes(".pdf");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
      >
        <Eye className="w-3.5 h-3.5" />
        Preview {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                Review the document before approving or rejecting the vendor
              </DialogDescription>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in tab
            </a>
          </DialogHeader>
          <div className="relative bg-gray-50" style={{ height: "520px" }}>
            {isPdf ? (
              <iframe src={url} className="w-full h-full border-0" title={label} />
            ) : (
              <img src={url} alt={label} className="w-full h-full object-contain p-4" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SuspendDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  businessName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading: boolean;
  businessName: string;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customNote, setCustomNote] = useState("");

  const handleConfirm = () => {
    const reason = SUSPEND_REASONS.find((r) => r.value === selectedReason);
    const notes =
      selectedReason === "custom"
        ? customNote.trim()
        : reason
        ? `${reason.label}${customNote.trim() ? ` — ${customNote.trim()}` : ""}`
        : customNote.trim() || "Suspended by admin";
    onConfirm(notes);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            Suspend Vendor
          </DialogTitle>
          <DialogDescription>
            Suspending <strong>{businessName}</strong> will block them from selling on the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Reason <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {SUSPEND_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedReason === reason.value
                      ? "border-red-400 bg-red-50 text-red-800"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="suspend_reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={() => setSelectedReason(reason.value)}
                    className="accent-red-500"
                  />
                  <span className="text-sm">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="suspend_notes" className="text-sm font-medium text-gray-700 mb-1 block">
              {selectedReason === "custom" ? "Suspension reason" : "Additional notes (optional)"}
            </Label>
            <Textarea
              id="suspend_notes"
              placeholder="Additional context for the vendor..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || isLoading}
          >
            {isLoading ? "Suspending…" : "Confirm Suspension"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface VendorViewProps {
  vendorId: string;
  onBack: () => void;
}

export default function VendorView({ vendorId, onBack }: VendorViewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendor, isLoading, error } = useQuery<VendorDetail>({
    queryKey: ["/api/admin/vendors", vendorId],
    enabled: !!vendorId,
    retry: false,
  });

  const verifyVendorMutation = useMutation({
    mutationFn: async ({
      verificationStatus,
      verificationNotes,
    }: {
      verificationStatus: string;
      verificationNotes?: string;
    }) => {
      return apiRequest(`/api/admin/vendors/${vendorId}/verify`, "PATCH", {
        verificationStatus,
        verificationNotes,
      });
    },
    onSuccess: (_, { verificationStatus }) => {
      toast({
        title: "Vendor updated",
        description: `Vendor status set to ${verificationStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors", vendorId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowSuspendDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    },
  });

  const approvePayoutMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return adminApiRequest(`/api/admin/payout-requests/${requestId}/approve`, "POST", {
        adminNotes: "Approved from vendor detail page",
      });
    },
    onSuccess: () => {
      toast({ title: "Payout approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to approve payout", variant: "destructive" });
    },
  });

  const rejectPayoutMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return adminApiRequest(`/api/admin/payout-requests/${requestId}/reject`, "POST", {
        adminNotes: "Rejected from vendor detail page",
      });
    },
    onSuccess: () => {
      toast({ title: "Payout rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors", vendorId] });
    },
    onError: () => {
      toast({ title: "Failed to reject payout", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-600">Vendor not found or failed to load.</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vendors
        </Button>
      </div>
    );
  }

  const addressLine = [
    vendor.businessAddress || vendor.address,
    vendor.building,
    vendor.suburb,
    vendor.city,
    vendor.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  const statusLabel =
    vendor.verificationStatus === "rejected" ? "suspended" : vendor.verificationStatus;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vendors
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 truncate">{vendor.businessName}</h2>
          <p className="text-gray-600">{vendor.contactName} · {vendor.contactEmail}</p>
        </div>
        <Badge className={getStatusColor(vendor.verificationStatus)}>{statusLabel}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(vendor.stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Products</p>
                <p className="text-2xl font-bold text-gray-900">{vendor.stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Services</p>
                <p className="text-2xl font-bold text-gray-900">{vendor.stats.totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Orders</p>
                <p className="text-2xl font-bold text-gray-900">{vendor.stats.totalOrders}</p>
                <p className="text-xs text-gray-500">{vendor.stats.completedOrders} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Orders</TabsTrigger>
          <TabsTrigger value="requests">Payout Requests</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-600">Business Name</p>
                    <p className="text-gray-900">{vendor.businessName}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Category</p>
                    <p className="text-gray-900">{vendor.businessCategory}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Vendor Type</p>
                    <p className="text-gray-900 capitalize">{vendor.vendorType?.replace("_", " ") || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">National ID</p>
                    <p className="text-gray-900">{vendor.nationalIdNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Tax PIN</p>
                    <p className="text-gray-900">{vendor.taxPinNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-600">Joined</p>
                    <p className="text-gray-900">{formatDate(vendor.createdAt)}</p>
                  </div>
                </div>
                {vendor.description && (
                  <div>
                    <p className="font-medium text-gray-600 text-sm mb-1">Description</p>
                    <p className="text-sm text-gray-700">{vendor.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact & Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{vendor.contactEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{vendor.email}</span>
                </div>
                {vendor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                {addressLine && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{addressLine}</span>
                  </div>
                )}
                {vendor.locationDescription && (
                  <p className="text-gray-500 text-xs pl-6">{vendor.locationDescription}</p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Earnings Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-lg font-bold">{formatCurrency(vendor.stats.totalEarnings)}</p>
                    <p className="text-xs text-gray-500">Total Earnings</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-lg font-bold">{formatCurrency(vendor.stats.availableBalance)}</p>
                    <p className="text-xs text-gray-500">Available Balance</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-lg font-bold">{formatCurrency(vendor.stats.pendingBalance)}</p>
                    <p className="text-xs text-gray-500">Pending Balance</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-lg font-bold">{formatCurrency(vendor.stats.totalPaidOut)}</p>
                    <p className="text-xs text-gray-500">Total Paid Out</p>
                  </div>
                </div>
                {vendor.bankName && (
                  <p className="text-sm text-gray-600 mt-4">
                    Bank: {vendor.bankName}
                    {vendor.accountNumber ? ` · ****${vendor.accountNumber.slice(-4)}` : ""}
                    {vendor.accountName ? ` · ${vendor.accountName}` : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders ({vendor.recentOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {vendor.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">
                          Order #{order.id.slice(-8)}
                          {order.orderType ? ` · ${order.orderType}` : ""}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.customerName}
                          {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                        <div className="flex gap-2 justify-end mt-1">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          {order.paymentStatus && (
                            <Badge className={getStatusColor(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Payout Requests ({vendor.payoutRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {vendor.payoutRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No payout requests</p>
              ) : (
                <div className="space-y-4">
                  {vendor.payoutRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(request.requestedAmount)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Requested {formatDate(request.createdAt)}
                          </p>
                          {request.requestReason && (
                            <p className="text-sm text-gray-600 mt-1">{request.requestReason}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      </div>
                      {request.adminNotes && (
                        <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mb-2">
                          {request.adminNotes}
                        </p>
                      )}
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approvePayoutMutation.mutate(request.id)}
                            disabled={approvePayoutMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200"
                            onClick={() => rejectPayoutMutation.mutate(request.id)}
                            disabled={rejectPayoutMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>KYC Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendor.documents.map((doc) => (
                  <div
                    key={doc.documentType}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.type}</h3>
                      {doc.number && (
                        <p className="text-sm text-gray-600">No. {doc.number}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {doc.uploaded ? "Document uploaded" : "Not uploaded"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(vendor.verificationStatus)}>
                        {vendor.verificationStatus}
                      </Badge>
                      {doc.url ? (
                        <VendorDocumentViewer url={doc.url} label={doc.type} />
                      ) : (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Not available
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.verificationStatus === "pending" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Approval Required</h3>
                  <p className="text-yellow-700 mb-4 text-sm">
                    Review KYC documents and business details before approving this vendor.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        verifyVendorMutation.mutate({
                          verificationStatus: "verified",
                          verificationNotes: "KYC documents verified and approved",
                        })
                      }
                      disabled={verifyVendorMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Vendor
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200"
                      onClick={() =>
                        verifyVendorMutation.mutate({
                          verificationStatus: "rejected",
                          verificationNotes: "Application rejected during review",
                        })
                      }
                      disabled={verifyVendorMutation.isPending}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reject Vendor
                    </Button>
                  </div>
                </div>
              )}

              {vendor.verificationStatus === "verified" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Active Vendor</h3>
                  <p className="text-green-700 mb-4 text-sm">
                    This vendor is verified and can sell on the platform.
                  </p>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200"
                    onClick={() => setShowSuspendDialog(true)}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                     Suspend Vendor
                  </Button>
                </div>
              )}

              {vendor.verificationStatus === "rejected" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Suspended / Rejected</h3>
                  {vendor.verificationNotes && (
                    <p className="text-red-700 text-sm mb-4">{vendor.verificationNotes}</p>
                  )}
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() =>
                      verifyVendorMutation.mutate({
                        verificationStatus: "verified",
                        verificationNotes: "Re-activated by admin after review",
                      })
                    }
                    disabled={verifyVendorMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate Vendor
                  </Button>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/admin-portal/dashboard/earnings")}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Open Earnings Management
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/admin-portal/dashboard/orders")}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View All Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SuspendDialog
        open={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={(notes) =>
          verifyVendorMutation.mutate({
            verificationStatus: "rejected",
            verificationNotes: notes,
          })
        }
        isLoading={verifyVendorMutation.isPending}
        businessName={vendor.businessName}
      />
    </div>
  );
}
