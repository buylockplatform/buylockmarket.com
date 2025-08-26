import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  UserCheck,
  CreditCard,
  Building
} from 'lucide-react';

interface PayoutRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  businessName: string;
  requestedAmount: string;
  availableBalance: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  requestReason?: string;
  adminNotes?: string;
  transferFailureReason?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  completedAt?: string;
  failedAt?: string;
  paystackTransferId?: string;
  paystackTransferCode?: string;
  transferStatus?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export default function AdminPayoutManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  // Fetch payout requests
  const { data: payoutRequests, isLoading, refetch } = useQuery<PayoutRequest[]>({
    queryKey: ['/api/admin/payout-requests', statusFilter !== 'all' ? statusFilter : undefined],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Approve payout mutation
  const approveMutation = useMutation({
    mutationFn: async (data: { requestId: string; adminNotes?: string }) => {
      const response = await apiRequest('POST', `/api/admin/payout-requests/${data.requestId}/approve`, {
        adminNotes: data.adminNotes
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve payout');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payout Approved',
        description: 'The payout has been approved and transfer initiated.',
      });
      setIsActionDialogOpen(false);
      setAdminNotes('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Reject payout mutation
  const rejectMutation = useMutation({
    mutationFn: async (data: { requestId: string; adminNotes?: string }) => {
      const response = await apiRequest('POST', `/api/admin/payout-requests/${data.requestId}/reject`, {
        adminNotes: data.adminNotes
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject payout');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payout Rejected',
        description: 'The payout request has been rejected.',
      });
      setIsActionDialogOpen(false);
      setAdminNotes('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payout-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleAction = (request: PayoutRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setIsActionDialogOpen(true);
    setAdminNotes('');
  };

  const confirmAction = () => {
    if (!selectedRequest || !actionType) return;

    const data = {
      requestId: selectedRequest.id,
      adminNotes: adminNotes.trim() || undefined
    };

    if (actionType === 'approve') {
      approveMutation.mutate(data);
    } else {
      rejectMutation.mutate(data);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return `KES ${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Check className="h-4 w-4" />;
      case 'approved': return <TrendingUp className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'rejected': case 'failed': return <X className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Filter and search requests
  const filteredRequests = payoutRequests?.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesSearch = searchQuery === '' || 
      request.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.vendorEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  // Calculate statistics
  const stats = {
    total: payoutRequests?.length || 0,
    pending: payoutRequests?.filter(r => r.status === 'pending').length || 0,
    approved: payoutRequests?.filter(r => r.status === 'approved').length || 0,
    completed: payoutRequests?.filter(r => r.status === 'completed').length || 0,
    totalAmount: payoutRequests?.reduce((sum, r) => sum + parseFloat(r.requestedAmount), 0) || 0,
    pendingAmount: payoutRequests?.filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + parseFloat(r.requestedAmount), 0) || 0
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payout Management</h1>
          <p className="text-muted-foreground">
            Review and approve vendor payout requests with Paystack integration
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All payout requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.pendingAmount)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Transfer initiated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Successfully transferred
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by business name, vendor name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>
            Review vendor payout requests and bank details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading payout requests...</div>
          ) : filteredRequests.length > 0 ? (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </div>
                        </Badge>
                        <span className="font-semibold text-lg">
                          {formatCurrency(request.requestedAmount)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Requested: {formatDate(request.createdAt)}</span>
                        {request.reviewedAt && (
                          <span>Reviewed: {formatDate(request.reviewedAt)}</span>
                        )}
                      </div>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(request, 'approve')}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(request, 'reject')}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Vendor Information */}
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold flex items-center mb-2">
                          <Building className="h-4 w-4 mr-2" />
                          Business Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Business:</strong> {request.businessName}</p>
                          <p><strong>Contact:</strong> {request.vendorName}</p>
                          <p><strong>Email:</strong> {request.vendorEmail}</p>
                          <p><strong>Available Balance:</strong> {formatCurrency(request.availableBalance)}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center mb-2">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Bank Details
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p><strong>Bank:</strong> {request.bankName || 'Not provided'}</p>
                          <p><strong>Account Number:</strong> {request.accountNumber || 'Not provided'}</p>
                          <p><strong>Account Name:</strong> {request.accountName || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  {request.requestReason && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Request Reason:</strong> {request.requestReason}
                      </p>
                    </div>
                  )}

                  {request.adminNotes && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md">
                      <p className="text-sm text-gray-700">
                        <strong>Admin Notes:</strong> {request.adminNotes}
                      </p>
                    </div>
                  )}

                  {request.transferFailureReason && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <p className="text-sm text-red-700">
                        <strong>Failure Reason:</strong> {request.transferFailureReason}
                      </p>
                    </div>
                  )}

                  {request.paystackTransferCode && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Transfer Code: {request.paystackTransferCode}
                        {request.transferStatus && (
                          <Badge variant="outline" className="ml-2">
                            {request.transferStatus}
                          </Badge>
                        )}
                      </div>
                      {request.completedAt && (
                        <span className="text-green-600">
                          Completed: {formatDate(request.completedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted-foreground">No payout requests found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Payout requests will appear here when vendors submit them'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Payout Request' : 'Reject Payout Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {actionType === 'approve' 
                    ? `Approve payout of ${formatCurrency(selectedRequest.requestedAmount)} to ${selectedRequest.businessName}?`
                    : `Reject payout request from ${selectedRequest.businessName}?`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="adminNotes">
                {actionType === 'approve' ? 'Notes (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="adminNotes"
                placeholder={
                  actionType === 'approve' 
                    ? 'Add any notes about this approval...' 
                    : 'Explain why this request is being rejected...'
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            {actionType === 'approve' && selectedRequest && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      This will initiate a Paystack transfer of {formatCurrency(selectedRequest.requestedAmount)} 
                      to the vendor's bank account.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {approveMutation.isPending || rejectMutation.isPending 
                ? 'Processing...' 
                : actionType === 'approve' 
                  ? 'Approve & Transfer' 
                  : 'Reject Request'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}