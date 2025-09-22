import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { vendorApiRequest } from '@/lib/queryClient';
import { DollarSign, TrendingUp, CreditCard, Clock, Check, X, AlertCircle, ExternalLink } from 'lucide-react';

interface VendorEarnings {
  totalEarnings: string;
  availableBalance: string;
  pendingBalance: string;
  totalPaidOut: string;
  recentEarnings: any[];
}

interface PayoutRequest {
  id: string;
  requestedAmount: string;
  availableBalance: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  requestReason?: string;
  adminNotes?: string;
  transferFailureReason?: string;
  createdAt: string;
  reviewedAt?: string;
  completedAt?: string;
  failedAt?: string;
  paystackTransferId?: string;
  paystackTransferCode?: string;
  transferStatus?: string;
}

export default function VendorEarnings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get vendor from localStorage
  const [vendor, setVendor] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutReason, setPayoutReason] = useState('');
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);

  useEffect(() => {
    const vendorData = localStorage.getItem('vendor');
    if (vendorData) {
      setVendor(JSON.parse(vendorData));
    }
  }, []);

  // Fetch vendor earnings
  const { data: earnings, isLoading: earningsLoading, error: earningsError } = useQuery<VendorEarnings>({
    queryKey: ['/api/vendor/:vendorId/earnings', vendor?.id],
    enabled: !!vendor?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
    refetchIntervalInBackground: true // Continue polling when tab is not focused
  });

  // Fetch payout requests
  const { data: payoutRequests, isLoading: payoutLoading } = useQuery<PayoutRequest[]>({
    queryKey: ['/api/vendor/:vendorId/payout-requests', vendor?.id],
    enabled: !!vendor?.id,
    refetchInterval: 15000, // Refresh every 15 seconds (more frequent since admin can approve)
    refetchIntervalInBackground: true, // Continue polling when tab is not focused
    staleTime: 0, // Always treat data as stale - force fresh fetch
    gcTime: 0 // Don't cache data at all (React Query v5 uses gcTime instead of cacheTime)
  });

  // Create payout request mutation
  const createPayoutMutation = useMutation({
    mutationFn: async (data: { amount: number; reason?: string }) => {
      return vendorApiRequest(`/api/vendor/${vendor.id}/payout-request`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Payout Request Submitted',
        description: 'Your payout request has been submitted for admin review.',
      });
      setIsPayoutDialogOpen(false);
      setPayoutAmount('');
      setPayoutReason('');
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/:vendorId/earnings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/:vendorId/payout-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handlePayoutRequest = () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }

    const availableBalance = parseFloat(earnings?.availableBalance || '0');
    if (amount > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `Amount exceeds available balance of KES ${availableBalance.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    createPayoutMutation.mutate({ amount, reason: payoutReason });
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

  if (!vendor) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Please log in to view your earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (earningsError) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600">Failed to load earnings data</p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings & Payouts</h1>
        <p className="text-muted-foreground">
          Manage your earnings and request payouts with our integrated Paystack system
        </p>
      </div>

      {/* Earnings Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earningsLoading ? '...' : formatCurrency(earnings?.totalEarnings || '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              Cumulative earnings from all sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {earningsLoading ? '...' : formatCurrency(earnings?.availableBalance || '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for payout
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {earningsLoading ? '...' : formatCurrency(earnings?.pendingBalance || '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              In payout processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earningsLoading ? '...' : formatCurrency(earnings?.totalPaidOut || '0')}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully transferred
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Request payouts and manage your bank details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="flex-1"
                  disabled={!earnings || parseFloat(earnings.availableBalance) <= 0}
                >
                  Request Payout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request Payout</DialogTitle>
                  <DialogDescription>
                    Available Balance: {earnings ? formatCurrency(earnings.availableBalance) : 'KES 0.00'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      min="1"
                      max={earnings?.availableBalance || '0'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Brief reason for this payout"
                      value={payoutReason}
                      onChange={(e) => setPayoutReason(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  
                  {/* Bank Details Warning */}
                  {(!vendor.bankName || !vendor.accountNumber) && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Complete bank details required for payouts.
                            <Button variant="link" className="p-0 h-auto text-yellow-700" asChild>
                              <a href="/vendor-dashboard/profile">Update Profile</a>
                            </Button>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handlePayoutRequest}
                    disabled={createPayoutMutation.isPending || !vendor.bankName || !vendor.accountNumber}
                  >
                    {createPayoutMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="flex-1" asChild>
              <a href="/vendor-dashboard/profile">
                Update Bank Details
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Payout Requests</TabsTrigger>
          <TabsTrigger value="earnings">Recent Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Payout Request History</CardTitle>
              <CardDescription>
                Track your payout requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <div className="text-center py-8">Loading payout history...</div>
              ) : payoutRequests && payoutRequests.length > 0 ? (
                <div className="space-y-4">
                  {payoutRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(request.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(request.status)}
                              <span className="capitalize">{request.status}</span>
                            </div>
                          </Badge>
                          <span className="font-semibold">
                            {formatCurrency(request.requestedAmount)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      {request.requestReason && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Reason:</strong> {request.requestReason}
                        </p>
                      )}

                      {request.adminNotes && (
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-2">
                          <p className="text-sm text-blue-700">
                            <strong>Admin Notes:</strong> {request.adminNotes}
                          </p>
                        </div>
                      )}

                      {request.transferFailureReason && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-md mb-2">
                          <p className="text-sm text-red-700">
                            <strong>Failure Reason:</strong> {request.transferFailureReason}
                          </p>
                        </div>
                      )}

                      {request.paystackTransferCode && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Transfer Code: {request.paystackTransferCode}
                          {request.transferStatus && (
                            <Badge variant="outline" className="ml-2">
                              {request.transferStatus}
                            </Badge>
                          )}
                        </div>
                      )}

                      {request.completedAt && (
                        <p className="text-sm text-green-600 mt-2">
                          Completed: {formatDate(request.completedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No payout requests yet</p>
                  <p className="text-sm text-muted-foreground">
                    Request your first payout when you have available earnings
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>
                Your latest earnings from order completions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {earnings?.recentEarnings && earnings.recentEarnings.length > 0 ? (
                <div className="space-y-4">
                  {earnings.recentEarnings.map((earning: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Order #{earning.orderId}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(earning.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +{formatCurrency(earning.vendorEarnings)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          From {formatCurrency(earning.totalAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent earnings</p>
                  <p className="text-sm text-muted-foreground">
                    Start selling to see your earnings here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}