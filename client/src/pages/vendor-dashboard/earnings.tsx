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
  orderId?: string | null;
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
    // vendorApiRequest reads 'vendorData' key for auth headers
    const vendorData = localStorage.getItem('vendorData') || localStorage.getItem('vendor');
    if (vendorData) {
      setVendor(JSON.parse(vendorData));
    }
  }, []);

  // Fetch vendor earnings
  const { data: earnings, isLoading: earningsLoading, error: earningsError } = useQuery<VendorEarnings>({
    queryKey: ['/api/vendor', vendor?.id, 'earnings'],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendor.id}/earnings`),
    enabled: !!vendor?.id,
    refetchInterval: 30000,
    refetchIntervalInBackground: true
  });

  // Fetch payout requests
  const { data: payoutRequests, isLoading: payoutLoading } = useQuery<PayoutRequest[]>({
    queryKey: ['/api/vendor', vendor?.id, 'payout-requests'],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendor.id}/payout-requests`),
    enabled: !!vendor?.id,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 0
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
      queryClient.invalidateQueries({ queryKey: ['/api/vendor', vendor?.id, 'earnings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor', vendor?.id, 'payout-requests'] });
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

  const formatCurrency = (amount: string | number | null | undefined): string => {
    if (amount === null || amount === undefined || amount === '') return 'KES 0.00';
    const num = parseFloat(amount.toString());
    if (isNaN(num)) return 'KES 0.00';
    return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-KE', {
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

  const isPaidPayoutStatus = (status: string) => ['approved', 'completed'].includes(status);
  const paidPayoutRequests = payoutRequests?.filter((r) => isPaidPayoutStatus(r.status)) || [];
  const pendingPayoutRequests = payoutRequests?.filter((r) => !isPaidPayoutStatus(r.status)) || [];
  const pendingPayoutTotal = pendingPayoutRequests.reduce((sum, r) => sum + parseFloat(r.requestedAmount || '0'), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings & Payouts</h1>
        <p className="text-muted-foreground">
          Manage your earnings and request payouts with our integrated Paystack system
        </p>
      </div>

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
            <p className="text-xs text-muted-foreground">Cumulative earnings</p>
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
            <p className="text-xs text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Earnings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payoutLoading ? '...' : formatCurrency(pendingPayoutTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingPayoutRequests.length} pending payout{pendingPayoutRequests.length !== 1 ? 's' : ''} awaiting admin
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
            <p className="text-xs text-muted-foreground">Successfully transferred</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>Request a manual payout of your available funds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount (KES)</Label>
              <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Input value={payoutReason} onChange={(e) => setPayoutReason(e.target.value)} placeholder="e.g. Monthly Withdrawal" />
            </div>
          </div>
          <Button onClick={handlePayoutRequest} disabled={createPayoutMutation.isPending}>
            {createPayoutMutation.isPending ? 'Submitting...' : 'Request Payout'}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="earnings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="earnings">Order Earnings</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingPayoutRequests.length > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                {pendingPayoutRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Order Earnings tab — shows completed/approved payouts (already paid out) */}
        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Order Earnings</CardTitle>
              <CardDescription>Orders that have been paid out to you</CardDescription>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : paidPayoutRequests.length > 0 ? (
                <div className="space-y-3">
                  {paidPayoutRequests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{formatCurrency(req.requestedAmount)}</p>
                        {req.orderId && (
                          <p className="text-sm text-muted-foreground">Order #{req.orderId.slice(-8)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(req.completedAt || req.reviewedAt || req.createdAt)}
                        </p>
                        {req.requestReason && (
                          <p className="text-xs text-muted-foreground mt-1">{req.requestReason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Paid Out
                        </Badge>
                        {req.paystackTransferCode && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {req.paystackTransferCode}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No completed payouts yet</p>
                  <p className="text-xs mt-1">Completed payouts will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending tab — shows auto-created payout requests awaiting admin transfer */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payouts</CardTitle>
              <CardDescription>Auto-created when orders complete — admin will process these</CardDescription>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <div className="text-center py-8 text-gray-400">Loading pending payouts...</div>
              ) : pendingPayoutRequests.length > 0 ? (
                <div className="space-y-3">
                  {pendingPayoutRequests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{formatCurrency(req.requestedAmount)}</p>
                        {req.orderId && (
                          <p className="text-sm text-muted-foreground">Order #{req.orderId.slice(-8)}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Created: {formatDate(req.createdAt)}</p>
                        {req.requestReason && (
                          <p className="text-xs text-muted-foreground mt-1">{req.requestReason}</p>
                        )}
                        {req.adminNotes && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded text-xs text-blue-700">
                            <strong>Admin:</strong> {req.adminNotes}
                          </div>
                        )}
                        {req.transferFailureReason && (
                          <div className="mt-2 bg-red-50 border border-red-200 px-3 py-2 rounded text-xs text-red-700">
                            <strong>Failure:</strong> {req.transferFailureReason}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(req.status)}>
                          {getStatusIcon(req.status)}
                          <span className="ml-1 capitalize">{req.status}</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">No pending payouts</p>
                  <p className="text-xs mt-1">Payouts are auto-created when your orders are completed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}