import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApiRequest, queryClient, getAdminQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Filter,
  Search,
  ArrowUpDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VendorEarnings {
  vendorId: string;
  businessName: string;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  confirmedOrders: number;
  pendingOrders: number;
  disputedOrders: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
}

interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount: string;
  processedDate?: string;
  failureReason?: string;
}

interface PlatformEarnings {
  totalPlatformEarnings: number;
  totalVendorEarnings: number;
  platformFeePercentage: number;
  totalOrders: number;
  avgOrderValue: number;
  topEarningVendors: Array<{
    vendorId: string;
    businessName: string;
    earnings: number;
  }>;
}

export default function EarningsManagementAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Fetch platform earnings overview
  const { data: platformEarnings, isLoading: platformLoading } = useQuery({
    queryKey: ['/api/admin/platform-earnings', { period: selectedPeriod }],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
  });

  // Fetch vendor earnings data
  const { data: vendorEarnings = [], isLoading: vendorLoading } = useQuery({
    queryKey: ['/api/admin/vendor-earnings'],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
  });

  // Fetch payout requests
  const { data: payoutRequests = [], isLoading: payoutLoading } = useQuery({
    queryKey: ['/api/admin/payout-requests', { status: statusFilter !== 'all' ? statusFilter : '' }],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
  });

  // Process payout request mutation
  const processPayoutMutation = useMutation({
    mutationFn: async ({ requestId, action, reason }: { requestId: string; action: 'approve' | 'reject'; reason?: string }) => {
      return adminApiRequest('/api/admin/process-payout', 'POST', { requestId, action, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] });
      toast({
        title: "Success",
        description: "Payout request processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payout request",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleProcessPayout = (requestId: string, action: 'approve' | 'reject', reason?: string) => {
    processPayoutMutation.mutate({ requestId, action, reason });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending': return 'outline';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  // Filter payout requests - with safe property access
  const filteredPayouts = payoutRequests.filter((request: any) => {
    const vendorName = request.vendorName || request.vendor?.businessName || request.businessName || '';
    const requestId = request.id || '';
    
    const matchesSearch = searchTerm === '' || 
                         vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         requestId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (platformLoading || vendorLoading || payoutLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Earnings Management</h2>
          <p className="text-gray-600">Monitor platform earnings and manage vendor payouts</p>
        </div>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(platformEarnings?.totalPlatformEarnings || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {platformEarnings?.platformFeePercentage || 20}% platform fee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vendor Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(platformEarnings?.totalVendorEarnings || 0)}
                </p>
                <p className="text-sm text-gray-500">
                  {platformEarnings?.totalOrders || 0} orders
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{vendorEarnings.length}</p>
                <p className="text-sm text-gray-500">Earning vendors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(platformEarnings?.avgOrderValue || 0)}
                </p>
                <p className="text-sm text-gray-500">Per transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Earning Vendors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformEarnings?.topEarningVendors?.length > 0 ? (
              platformEarnings.topEarningVendors.map((vendor: any, index: number) => (
                <div key={vendor.vendorId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-buylock-primary text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{vendor.businessName}</h3>
                      <p className="text-sm text-gray-600">Vendor ID: {vendor.vendorId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-buylock-primary text-lg">{formatPrice(vendor.earnings)}</p>
                    <Badge variant="outline">Top {index + 1}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No vendor earnings data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search vendors or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayouts.length > 0 ? (
              filteredPayouts.map((request: PayoutRequest) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full bg-blue-100">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.vendorName}</h3>
                      <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                      <p className="text-sm text-gray-500">
                        Requested: {formatDate(request.requestDate)}
                      </p>
                      <p className="text-xs text-gray-500">{request.bankAccount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-bold text-buylock-primary text-lg">
                        {formatPrice(request.amount)}
                      </p>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      {request.processedDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Processed: {formatDate(request.processedDate)}
                        </p>
                      )}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleProcessPayout(request.id, 'approve')}
                          disabled={processPayoutMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcessPayout(request.id, 'reject', 'Administrative review required')}
                          disabled={processPayoutMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No payout requests found</p>
                <p className="text-sm">Payout requests will appear here when vendors request payouts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}