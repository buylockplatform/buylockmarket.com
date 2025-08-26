import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Search, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Mail,
  Phone,
  ExternalLink,
  Trash2,
  MapPin
} from "lucide-react";

interface VendorApplication {
  id: string;
  businessName: string;
  email: string;
  phone?: string;
  description?: string;
  vendorType?: string;
  nationalIdNumber: string;
  taxPinNumber?: string;
  businessLatitude?: string;
  businessLongitude?: string;
  locationDescription?: string;
  nationalIdUrl?: string;
  taxCertificateUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function VendorRequests() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor applications from real API
  const { data: vendorApplications = [], isLoading } = useQuery({
    queryKey: ['/api/admin/vendor-applications'],
  });

  const filteredRequests = vendorApplications.filter((request: VendorApplication) => {
    const matchesSearch = request.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.verificationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Approve vendor application
  const approveMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      await apiRequest(`/api/admin/vendor-applications/${applicationId}/approve`, 'PUT');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-applications'] });
      toast({
        title: "Success",
        description: "Vendor application approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve vendor application",
        variant: "destructive",
      });
    },
  });

  // Reject vendor application
  const rejectMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      await apiRequest(`/api/admin/vendor-applications/${applicationId}/reject`, 'PUT', { 
        reason: 'Application rejected by admin' 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-applications'] });
      toast({
        title: "Success",
        description: "Vendor application rejected",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject vendor application",
        variant: "destructive",
      });
    },
  });

  const handleApproveRequest = async (applicationId: string) => {
    approveMutation.mutate(applicationId);
  };

  const handleRejectRequest = async (applicationId: string) => {
    rejectMutation.mutate(applicationId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "verified":
        return <CheckCircle className="w-3 h-3" />;
      case "rejected":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const pendingCount = vendorApplications.filter((app: VendorApplication) => app.verificationStatus === 'pending').length;
  const verifiedCount = vendorApplications.filter((app: VendorApplication) => app.verificationStatus === 'verified').length;
  const rejectedCount = vendorApplications.filter((app: VendorApplication) => app.verificationStatus === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Applications</h1>
        <p className="text-gray-600 mt-1">Review and manage vendor registration applications</p>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by business name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vendorApplications.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Applications ({filteredRequests.length} applications)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading vendor applications...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No vendor applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((application: VendorApplication) => (
                <div key={application.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Store className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{application.businessName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span>{application.email}</span>
                          {application.phone && (
                            <>
                              <span>•</span>
                              <Phone className="w-3 h-3" />
                              <span>{application.phone}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusColor(application.verificationStatus)} flex items-center gap-1`}>
                        {getStatusIcon(application.verificationStatus)}
                        {application.verificationStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="font-medium text-gray-900">Business Description</p>
                        <p className="text-sm text-gray-600 mt-1">{application.description || 'No description provided'}</p>
                        {application.vendorType && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {application.vendorType === 'registered' ? 'Registered Business' : 'Non-Registered Business'}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Verification Details</p>
                        <div className="text-sm text-gray-600 mt-1 space-y-1">
                          <p>National ID: {application.nationalIdNumber}</p>
                          {application.taxPinNumber && <p>Tax PIN: {application.taxPinNumber}</p>}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Business Location</p>
                        <div className="text-sm text-gray-600 mt-1">
                          {application.businessLatitude && application.businessLongitude ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                                <span>Location confirmed</span>
                              </div>
                              {application.locationDescription && (
                                <p className="text-xs italic">{application.locationDescription}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Lat: {parseFloat(application.businessLatitude).toFixed(6)}, 
                                Lng: {parseFloat(application.businessLongitude).toFixed(6)}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-600">
                              <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                              <span>No location provided</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {application.nationalIdUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/api/admin/vendor-documents/${application.id}/nationalId`, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-3 h-3" />
                          National ID
                        </Button>
                      )}
                      {application.taxCertificateUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`/api/admin/vendor-documents/${application.id}/taxCertificate`, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-3 h-3" />
                          Tax Certificate
                        </Button>
                      )}
                    </div>

                    {application.verificationStatus === 'pending' && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleRejectRequest(application.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApproveRequest(application.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}