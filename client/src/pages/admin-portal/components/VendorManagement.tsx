import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Store,
  Search,
  Eye,
  CheckCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  MoreVertical,
  Plus,
  XCircle,
  FileText,
  Shield,
  ExternalLink,
  X,
  ChevronDown,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddVendorModal } from "./AddVendorModal";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Vendor {
  id: string;
  email: string;
  businessName: string;
  contactEmail: string;
  contactName: string;
  phone?: string;
  address?: string;
  businessCategory: string;
  description?: string;
  nationalIdNumber?: string;
  taxPinNumber?: string;
  nationalIdUrl?: string;
  taxCertificateUrl?: string;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface VendorManagementProps {
  onViewVendor?: (vendorId: string) => void;
}

// ─── Structured rejection reasons ────────────────────────────────────────────
const REJECTION_REASONS = [
  { value: "id_unreadable",       label: "National ID is blurry or unreadable" },
  { value: "id_mismatch",         label: "ID details don't match business registration" },
  { value: "tax_pin_invalid",     label: "Tax PIN is invalid or expired" },
  { value: "tax_cert_missing",    label: "Tax compliance certificate missing" },
  { value: "business_duplicate",  label: "Duplicate business already registered" },
  { value: "address_unverified",  label: "Business address cannot be verified" },
  { value: "incomplete_kyc",      label: "KYC documents are incomplete" },
  { value: "policy_violation",    label: "Business violates platform policy" },
  { value: "custom",              label: "Other reason (specify below)" },
];

// ─── KYC Document Previewer ───────────────────────────────────────────────────
function KycDocumentViewer({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);
  const isPdf = url?.toLowerCase().endsWith(".pdf");

  if (!url) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
        <FileText className="w-3.5 h-3.5" />
        Not uploaded
      </span>
    );
  }

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
                Review the document carefully before approving or rejecting
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
              <iframe
                src={url}
                className="w-full h-full border-0"
                title={label}
              />
            ) : (
              <img
                src={url}
                alt={label}
                className="w-full h-full object-contain p-4"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Rejection Dialog ─────────────────────────────────────────────────────────
function RejectionDialog({
  vendor,
  open,
  onClose,
  onConfirm,
  isLoading,
}: {
  vendor: Vendor;
  open: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading: boolean;
}) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customNote, setCustomNote] = useState("");

  const handleConfirm = () => {
    const reason = REJECTION_REASONS.find((r) => r.value === selectedReason);
    const notes =
      selectedReason === "custom"
        ? customNote.trim()
        : reason
        ? `${reason.label}${customNote.trim() ? ` — ${customNote.trim()}` : ""}`
        : customNote.trim() || "Rejected by admin";
    onConfirm(notes);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            Reject Vendor Application
          </DialogTitle>
          <DialogDescription>
            Rejecting <strong>{vendor.businessName}</strong>. The vendor will be notified
            with the reason provided below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {REJECTION_REASONS.map((reason) => (
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
                    name="rejection_reason"
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
            <Label htmlFor="rejection_notes" className="text-sm font-medium text-gray-700 mb-1 block">
              {selectedReason === "custom" ? "Rejection reason" : "Additional notes (optional)"}
            </Label>
            <Textarea
              id="rejection_notes"
              placeholder={
                selectedReason === "custom"
                  ? "Describe why this application is being rejected…"
                  : "Any additional context to include in the notification…"
              }
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
            {isLoading ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── KYC Expand Panel ────────────────────────────────────────────────────────
function KycPanel({ vendor }: { vendor: Vendor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <Shield className="w-3 h-3" />
        KYC Documents
        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border">
          <div className="space-y-1">
            <p className="font-medium text-gray-700">National ID</p>
            <p className="text-gray-500">No.: {vendor.nationalIdNumber || "—"}</p>
            <KycDocumentViewer url={vendor.nationalIdUrl || ""} label="National ID" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-gray-700">Tax PIN</p>
            <p className="text-gray-500">PIN: {vendor.taxPinNumber || "—"}</p>
            <KycDocumentViewer url={vendor.taxCertificateUrl || ""} label="Tax Certificate" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VendorManagement({ onViewVendor }: VendorManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState<Vendor | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["/api/admin/vendors", searchTerm],
    retry: false,
  });

  const verifyVendorMutation = useMutation({
    mutationFn: async ({
      vendorId,
      verificationStatus,
      verificationNotes,
    }: {
      vendorId: string;
      verificationStatus: string;
      verificationNotes?: string;
    }) => {
      return await apiRequest(`/api/admin/vendors/${vendorId}/verify`, "PATCH", {
        verificationStatus,
        verificationNotes,
      });
    },
    onSuccess: (_, { verificationStatus }) => {
      toast({
        title: "Done",
        description: `Vendor ${verificationStatus} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setRejectionTarget(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    },
  });

  const filteredVendors = (vendors as Vendor[]).filter(
    (v) =>
      v.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 border flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 border flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (ds: string) => new Date(ds).toLocaleDateString("en-KE");

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Vendor Management</h3>
          <p className="text-sm text-gray-500">Manage vendor accounts, KYC documents and verification</p>
        </div>
        <Button
          className="bg-buylock-primary hover:bg-buylock-primary/90"
          onClick={() => setShowAddVendorModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* ── Search ── */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by business name or email…"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <UserCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Verified</p>
              <p className="text-2xl font-bold">
                {(vendors as Vendor[]).filter((v) => v.verificationStatus === "verified").length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold">
                {(vendors as Vendor[]).filter((v) => v.verificationStatus === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <p className="text-2xl font-bold">
                {(vendors as Vendor[]).filter((v) => v.verificationStatus === "rejected").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Vendor List ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Vendor List ({filteredVendors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-40" />
                      <div className="h-3 bg-gray-200 rounded w-60" />
                    </div>
                    <div className="h-7 bg-gray-200 rounded w-20" />
                  </div>
                ))
              : filteredVendors.map((vendor: Vendor) => (
                  <div
                    key={vendor.id}
                    className="p-4 border rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: avatar + info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">{vendor.businessName}</h3>
                            {getStatusBadge(vendor.verificationStatus)}
                          </div>
                          <p className="text-sm text-gray-500 truncate">{vendor.contactEmail}</p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-1">
                            <span>{vendor.businessCategory}</span>
                            <span>·</span>
                            <span>Joined {formatDate(vendor.createdAt)}</span>
                          </div>

                          {/* KYC rejection notes */}
                          {vendor.verificationStatus === "rejected" && vendor.verificationNotes && (
                            <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{vendor.verificationNotes}</span>
                            </div>
                          )}

                          {/* KYC document viewer (expandable) */}
                          <KycPanel vendor={vendor} />
                        </div>
                      </div>

                      {/* Right: actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onViewVendor?.(vendor.id)}>
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>

                          {vendor.verificationStatus === "pending" && (
                            <>
                              <DropdownMenuItem
                                className="text-emerald-700 focus:bg-emerald-50"
                                onClick={() =>
                                  verifyVendorMutation.mutate({
                                    vendorId: vendor.id,
                                    verificationStatus: "verified",
                                    verificationNotes: "KYC documents verified and approved",
                                  })
                                }
                                disabled={verifyVendorMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50"
                                onClick={() => setRejectionTarget(vendor)}
                              >
                                <XCircle className="w-4 h-4 mr-2" /> Reject…
                              </DropdownMenuItem>
                            </>
                          )}

                          {vendor.verificationStatus === "verified" && (
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50"
                              onClick={() => setRejectionTarget(vendor)}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" /> Suspend…
                            </DropdownMenuItem>
                          )}

                          {vendor.verificationStatus === "rejected" && (
                            <DropdownMenuItem
                              className="text-emerald-700 focus:bg-emerald-50"
                              onClick={() =>
                                verifyVendorMutation.mutate({
                                  vendorId: vendor.id,
                                  verificationStatus: "verified",
                                  verificationNotes: "Re-activated by admin after review",
                                })
                              }
                              disabled={verifyVendorMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" /> Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
          </div>

          {!isLoading && filteredVendors.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No vendors found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modals ── */}
      <AddVendorModal
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
      />

      {rejectionTarget && (
        <RejectionDialog
          vendor={rejectionTarget}
          open={!!rejectionTarget}
          onClose={() => setRejectionTarget(null)}
          onConfirm={(notes) =>
            verifyVendorMutation.mutate({
              vendorId: rejectionTarget.id,
              verificationStatus: "rejected",
              verificationNotes: notes,
            })
          }
          isLoading={verifyVendorMutation.isPending}
        />
      )}
    </div>
  );
}