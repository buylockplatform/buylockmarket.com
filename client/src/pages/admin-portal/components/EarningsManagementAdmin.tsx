import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApiRequest, queryClient, getAdminQueryFn } from "@/lib/queryClient";
import type { PayoutRequest as BasePayoutRequest, Vendor, VendorEarning } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  ArrowUpDown,
  AlertCircle,
  CreditCard,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Type combining vendor data with aggregated earnings information
type VendorEarnings = Pick<Vendor, 'id' | 'businessName' | 'totalEarnings' | 'availableBalance' | 'pendingBalance'> & {
  vendorId: string;
  confirmedOrders: number;
  pendingOrders: number;
  disputedOrders: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: string;
};

// Type extending base payout request with vendor information
type PayoutRequest = BasePayoutRequest & {
  vendorName?: string;
  businessName?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

interface PlatformEarnings {
  totalPlatformEarnings: string;
  totalVendorEarnings: string;
  platformFeePercentage: number;
  totalOrders: number;
  avgOrderValue: string;
  topEarningVendors: Array<{
    vendorId: string;
    businessName: string;
    earnings: string;
  }>;
}

export default function EarningsManagementAdmin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPayoutRequest, setSelectedPayoutRequest] = useState<PayoutRequest | null>(null);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [payoutAction, setPayoutAction] = useState<'approve' | 'reject'>('approve');
  const [paymentReference, setPaymentReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch platform earnings overview
  const { data: platformEarnings, isLoading: platformLoading } = useQuery<PlatformEarnings>({
    queryKey: ['/api/admin/platform-earnings', { period: selectedPeriod }],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
  });

  // Fetch vendor earnings data
  const { data: vendorEarnings = [], isLoading: vendorLoading } = useQuery<VendorEarnings[]>({
    queryKey: ['/api/admin/vendor-earnings'],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
  });

  // Fetch payout requests
  const { data: payoutRequests = [], isLoading: payoutLoading } = useQuery<PayoutRequest[]>({
    queryKey: ['/api/admin/payout-requests', statusFilter !== 'all' ? statusFilter : undefined],
    queryFn: getAdminQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Process payout request mutation
  const processPayoutMutation = useMutation({
    mutationFn: async ({ requestId, action, paymentReference, adminNotes }: { 
      requestId: string; 
      action: 'approve' | 'reject'; 
      paymentReference?: string;
      adminNotes?: string;
    }) => {
      return adminApiRequest(`/api/admin/payout-requests/${requestId}/${action}`, 'POST', { 
        paymentReference,
        adminNotes 
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate all related queries to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendor-earnings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-earnings'] });
      toast({
        title: "Success",
        description: `Payout request ${variables.action}d successfully`,
      });
      setIsPayoutDialogOpen(false);
      setSelectedPayoutRequest(null);
      setPaymentReference('');
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to ${payoutAction} payout request: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const formatPrice = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleProcessPayout = (request: PayoutRequest, action: 'approve' | 'reject') => {
    setSelectedPayoutRequest(request);
    setPayoutAction(action);
    setIsPayoutDialogOpen(true);
  };

  const handleSubmitPayout = () => {
    if (!selectedPayoutRequest) return;
    
    if (payoutAction === 'approve' && !paymentReference.trim()) {
      toast({
        title: "Payment Reference Required",
        description: "Please provide a payment reference for approval.",
        variant: "destructive"
      });
      return;
    }

    processPayoutMutation.mutate({
      requestId: selectedPayoutRequest.id,
      action: payoutAction,
      paymentReference: paymentReference.trim() || undefined,
      adminNotes: adminNotes.trim() || undefined
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'approved': return 'secondary';
      case 'pending': return 'outline';
      case 'rejected':
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'approved': return TrendingUp;
      case 'pending': return Clock;
      case 'rejected':
      case 'failed': return XCircle;
      default: return AlertCircle;
    }
  };

  // Filter payout requests
  const filteredPayouts = payoutRequests.filter((request) => {
    const vendorName = request.vendorName || request.businessName || '';
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="text-earnings-title">Earnings Management</h1>
        <Badge variant="outline" className="text-sm" data-testid="badge-page-description">
          Financial Overview & Payment Processing
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-earnings-management">
          <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-financial-overview">
            <TrendingUp className="w-4 h-4" />
            Financial Overview
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2" data-testid="tab-payout-management">
            <CreditCard className="w-4 h-4" />
            Payout Management
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2" data-testid="tab-vendor-earnings">
            <Users className="w-4 h-4" />
            Vendor Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Platform Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Platform Earnings</p>
                    <p className="text-2xl font-bold text-buylock-primary" data-testid="text-platform-earnings">
                      {formatPrice(platformEarnings?.totalPlatformEarnings || '0')}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-buylock-primary" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {platformEarnings?.platformFeePercentage || 20}% commission from sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vendor Earnings</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-vendor-earnings">
                      {formatPrice(platformEarnings?.totalVendorEarnings || '0')}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total earned by vendors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-blue-600" data-testid="text-total-orders">
                      {platformEarnings?.totalOrders?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Completed transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-600" data-testid="text-avg-order-value">
                      {formatPrice(platformEarnings?.avgOrderValue || '0')}
                    </p>
                  </div>
                  <ArrowUpDown className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Average transaction size
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Earning Vendors */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-top-vendors-title">Top Earning Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformEarnings?.topEarningVendors?.length > 0 ? (
                  platformEarnings.topEarningVendors.map((vendor, index) => (
                    <div key={vendor.vendorId} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-top-vendor-${vendor.vendorId}`}>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-buylock-primary text-white rounded-full text-sm font-bold" data-testid={`badge-vendor-rank-${index + 1}`}>
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900" data-testid={`text-vendor-business-name-${vendor.vendorId}`}>{vendor.businessName}</h3>
                          <p className="text-sm text-gray-600" data-testid={`text-vendor-id-${vendor.vendorId}`}>Vendor ID: {vendor.vendorId.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-buylock-primary text-lg" data-testid={`text-vendor-earnings-${vendor.vendorId}`}>{formatPrice(vendor.earnings)}</p>
                        <Badge variant="outline" data-testid={`badge-vendor-top-${index + 1}`}>Top {index + 1}</Badge>
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
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payout Request Management
              </CardTitle>
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
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] })}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPayouts.length > 0 ? (
                  filteredPayouts.map((request) => {
                    const StatusIcon = getStatusIcon(request.status);
                    return (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-full bg-blue-100">
                            <StatusIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{request.vendorName || request.businessName}</h3>
                            <p className="text-sm text-gray-600">Request ID: {request.id.slice(0, 8)}...</p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatDate(request.createdAt)}
                            </p>
                            {request.bankName && (
                              <p className="text-xs text-gray-500">{request.bankName} - {request.accountNumber}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-buylock-primary text-lg">
                              {formatPrice(request.requestedAmount)}
                            </p>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            {request.reviewedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Processed: {formatDate(request.reviewedAt)}
                              </p>
                            )}
                          </div>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleProcessPayout(request, 'approve')}
                                disabled={processPayoutMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`button-approve-${request.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessPayout(request, 'reject')}
                                disabled={processPayoutMutation.isPending}
                                data-testid={`button-reject-${request.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          <Button variant="outline" size="sm" data-testid={`button-view-${request.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
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
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Earnings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendorEarnings.length > 0 ? (
                  vendorEarnings.map((vendor) => (
                    <div key={vendor.vendorId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full bg-green-100">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{vendor.businessName}</h3>
                          <p className="text-sm text-gray-600">ID: {vendor.vendorId.slice(0, 8)}</p>
                          <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                            <span>Orders: {vendor.confirmedOrders}</span>
                            <span>Pending: {vendor.pendingOrders}</span>
                            {vendor.disputedOrders > 0 && <span>Disputes: {vendor.disputedOrders}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-buylock-primary text-lg">{formatPrice(vendor.totalEarnings)}</p>
                        <p className="text-sm text-green-600">Available: {formatPrice(vendor.availableBalance)}</p>
                        {parseFloat(vendor.pendingBalance) > 0 && (
                          <p className="text-sm text-orange-600">Pending: {formatPrice(vendor.pendingBalance)}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No vendor earnings data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Processing Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {payoutAction === 'approve' ? 'Approve' : 'Reject'} Payout Request
            </DialogTitle>
            <DialogDescription>
              {selectedPayoutRequest && (
                <>
                  Processing payout request for <strong>{selectedPayoutRequest.vendorName || selectedPayoutRequest.businessName}</strong> 
                  in the amount of <strong>{formatPrice(selectedPayoutRequest.requestedAmount)}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {payoutAction === 'approve' && (
              <div className="space-y-2">
                <Label htmlFor="payment-reference">Payment Reference *</Label>
                <Input
                  id="payment-reference"
                  placeholder="Enter payment transaction reference"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  data-testid="input-payment-reference"
                />
                <p className="text-sm text-gray-500">
                  Provide the bank transfer or payment reference number
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add notes about this decision (optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                data-testid="input-admin-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPayoutDialogOpen(false)}
              disabled={processPayoutMutation.isPending}
              data-testid="button-cancel-payout"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPayout}
              disabled={processPayoutMutation.isPending}
              className={payoutAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              data-testid="button-submit-payout"
            >
              {processPayoutMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {payoutAction === 'approve' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {payoutAction === 'approve' ? 'Approve Payout' : 'Reject Payout'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}