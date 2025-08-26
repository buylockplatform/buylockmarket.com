import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Store, 
  Search, 
  Eye, 
  Edit, 
  CheckCircle, 
  Clock, 
  UserCheck,
  AlertTriangle,
  MoreVertical,
  Package,
  Plus
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AddVendorModal } from "./AddVendorModal";

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
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface VendorManagementProps {
  onViewVendor?: (vendorId: string) => void;
}

export default function VendorManagement({ onViewVendor }: VendorManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch real vendors from API
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['/api/admin/vendors', searchTerm],
    retry: false,
  });

  // Vendor verification mutation
  const verifyVendorMutation = useMutation({
    mutationFn: async ({ vendorId, verificationStatus, verificationNotes }: { 
      vendorId: string; 
      verificationStatus: string; 
      verificationNotes?: string; 
    }) => {
      return await apiRequest(`/api/admin/vendors/${vendorId}/verify`, 'PATCH', { verificationStatus, verificationNotes });
    },
    onSuccess: (_, { verificationStatus }) => {
      toast({
        title: "Success",
        description: `Vendor ${verificationStatus} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update vendor status",
        variant: "destructive",
      });
    },
  });


  const filteredVendors = (vendors as Vendor[]).filter((vendor: Vendor) => {
    const matchesSearch = vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE');
  };

  const handleApproveVendor = (vendorId: string) => {
    verifyVendorMutation.mutate({
      vendorId,
      verificationStatus: 'verified',
      verificationNotes: 'Approved by admin'
    });
  };

  const handleRejectVendor = (vendorId: string) => {
    verifyVendorMutation.mutate({
      vendorId,
      verificationStatus: 'rejected',
      verificationNotes: 'Rejected by admin'
    });
  };

  const handleSuspendVendor = (vendorId: string) => {
    verifyVendorMutation.mutate({
      vendorId,
      verificationStatus: 'rejected',
      verificationNotes: 'Suspended by admin'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'rejected': return <AlertTriangle className="w-3 h-3" />;
      case 'suspended': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Vendor Management</h3>
          <p className="text-gray-600">Manage vendor accounts and verification</p>
        </div>
        <Button 
          className="bg-buylock-primary hover:bg-buylock-primary/90"
          onClick={() => setShowAddVendorModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search vendors by business name or email..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Vendor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{(vendors as Vendor[]).filter(v => v.verificationStatus === 'verified').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{(vendors as Vendor[]).filter(v => v.verificationStatus === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendors List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor List ({filteredVendors.length} vendors)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-48"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              ))
            ) : (
              filteredVendors.map((vendor: Vendor) => (
                <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{vendor.businessName}</h3>
                      <p className="text-sm text-gray-600">{vendor.contactEmail}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{vendor.businessCategory}</span>
                        {vendor.nationalIdNumber && (
                          <>
                            <span>•</span>
                            <span>ID: {vendor.nationalIdNumber}</span>
                            <span>•</span>
                            <span>Tax PIN: {vendor.taxPinNumber}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Joined: {formatDate(vendor.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(vendor.verificationStatus)}>
                      {vendor.verificationStatus}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewVendor?.(vendor.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Vendor
                        </DropdownMenuItem>
                        {vendor.verificationStatus === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              className="text-green-600"
                              onClick={() => handleApproveVendor(vendor.id)}
                              disabled={verifyVendorMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Vendor
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleRejectVendor(vendor.id)}
                              disabled={verifyVendorMutation.isPending}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Reject Vendor
                            </DropdownMenuItem>
                          </>
                        )}
                        {vendor.verificationStatus === 'verified' && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleSuspendVendor(vendor.id)}
                            disabled={verifyVendorMutation.isPending}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Suspend Vendor
                          </DropdownMenuItem>
                        )}
                        {vendor.verificationStatus === 'rejected' && (
                          <DropdownMenuItem 
                            className="text-green-600"
                            onClick={() => handleApproveVendor(vendor.id)}
                            disabled={verifyVendorMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Reactivate Vendor
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {filteredVendors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Store className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No vendors found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AddVendorModal 
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
      />
    </div>
  );
}