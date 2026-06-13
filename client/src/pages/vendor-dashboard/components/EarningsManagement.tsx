import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vendorApiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Download,
  Send,
  Calendar,
  PiggyBank,
  Banknote
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  confirmedOrders: number;
  pendingOrders: number;
  disputedOrders: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
}

interface OrderEarning {
  orderId: string;
  customerName?: string;
  orderDate: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'disputed' | 'paid_out';
  items: string;
  confirmationDate?: string;
}

const parseEarningsNumber = (value: string | number | null | undefined) => {
  const n = parseFloat(String(value ?? ''));
  return isNaN(n) ? 0 : n;
};

interface PayoutRequest {
  id: string;
  orderId?: string;
  requestedAmount: string;
  amount?: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected';
  requestReason?: string;
  adminNotes?: string;
  paystackTransferCode?: string;
  transferStatus?: string;
  transferFailureReason?: string;
  createdAt?: string;
  requestDate?: string;
  reviewedAt?: string;
  completedAt?: string;
  bankAccount?: string;
  processedDate?: string;
  failureReason?: string;
}

const isPaidPayoutStatus = (status: string) => ['approved', 'completed'].includes(status);

const payoutAmount = (request: PayoutRequest) =>
  parseFloat(request.requestedAmount || String(request.amount ?? '0'));

export default function EarningsManagement({ vendorId }: { vendorId: string }) {
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Safe date formatter — never shows "Invalid Date"
  const safeDate = (val: string | null | undefined) => {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Safe currency formatter — handles string amounts from API
  const safeMoney = (val: string | number | null | undefined) => {
    const n = parseFloat(String(val ?? ''));
    return formatPrice(isNaN(n) ? 0 : n);
  };

  // Fetch vendor earnings data
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: [`/api/vendor/${vendorId}/earnings`],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendorId}/earnings`),
    retry: false,
  });

  // Fetch order earnings breakdown (only orders with completed payout requests)
  const { data: orderEarnings = [], isLoading: ordersLoading } = useQuery({
    queryKey: [`/api/vendor/${vendorId}/order-earnings`],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendorId}/order-earnings`),
    retry: false,
  });

  // Fetch payout requests history
  const { data: payoutRequests = [], isLoading: payoutsLoading } = useQuery({
    queryKey: [`/api/vendor/${vendorId}/payout-requests`],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendorId}/payout-requests`),
    retry: false,
  });

  // Filter payout requests by status
  const paidPayoutRequests = payoutRequests.filter((request: PayoutRequest) =>
    isPaidPayoutStatus(request.status)
  );

  const pendingPayoutRequests = payoutRequests.filter((request: PayoutRequest) =>
    !isPaidPayoutStatus(request.status)
  );

  // Map each completed/approved payout request to its order details for the "Order Earnings" tab
  const completedPayoutEarningsList = paidPayoutRequests.map((request: PayoutRequest) => {
    const matchingOrder = orderEarnings.find((o: OrderEarning) => o.orderId === request.orderId);
    return {
      orderId: request.orderId || request.id,
      customerName: matchingOrder?.customerName || 'Customer',
      items: matchingOrder?.items || 'Product/Service payout',
      amount: parseFloat(request.requestedAmount),
      status: 'paid_out' as const,
      orderDate: matchingOrder?.orderDate || request.createdAt || '',
    };
  });

  // Fetch delivered orders eligible for payout
  const { data: deliveredOrders = [], isLoading: deliveredOrdersLoading } = useQuery({
    queryKey: [`/api/vendor/${vendorId}/orders/delivered`],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendorId}/orders/delivered`),
    retry: false,
  });

  // Request payout mutation
  const requestPayout = useMutation({
    mutationFn: async (data: { orderId: string; amount: string }) => {
      return vendorApiRequest(`/api/vendor/${vendorId}/payout-request`, 'POST', { 
        orderId: data.orderId,
        amount: data.amount 
      });
    },
    onSuccess: () => {
      toast({
        title: "Payout Request Submitted!",
        description: "Your payout request is being processed. You'll be notified once it's approved by admin.",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/payout-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/earnings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/orders/delivered`] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to submit payout request";
      toast({
        title: "Payout Request Failed",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  if (earningsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const earningsData: EarningsData = earnings ? {
    totalEarnings: parseEarningsNumber(earnings.totalEarnings),
    availableBalance: parseEarningsNumber(earnings.availableBalance),
    pendingBalance: parseEarningsNumber(earnings.pendingBalance),
    confirmedOrders: parseEarningsNumber((earnings as any).confirmedOrders),
    pendingOrders: parseEarningsNumber((earnings as any).pendingOrders),
    disputedOrders: parseEarningsNumber((earnings as any).disputedOrders),
    lastPayoutDate: (earnings as any).lastPayoutDate,
    lastPayoutAmount: parseEarningsNumber((earnings as any).lastPayoutAmount),
  } : {
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    disputedOrders: 0
  };

  // Use all order earnings for overview stats
  const confirmedEarnings = orderEarnings?.filter((e: OrderEarning) => e.status === 'confirmed' || e.status === 'paid_out') || [];
  const pendingEarnings = orderEarnings?.filter((e: OrderEarning) => e.status === 'pending') || [];
  const disputedEarnings = orderEarnings?.filter((e: OrderEarning) => e.status === 'disputed') || [];

  const handlePayoutRequest = (orderId: string, amount: number) => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please provide a valid amount for payout request",
        variant: "destructive"
      });
      return;
    }
    
    if (!orderId) {
      toast({
        title: "Missing Order ID", 
        description: "Order ID is required for payout request",
        variant: "destructive"
      });
      return;
    }
    
    requestPayout.mutate({
      orderId: orderId,
      amount: amount.toString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Earnings Management</h3>
          <p className="text-gray-600">Track your revenue and manage payouts</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(earningsData.totalEarnings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <PiggyBank className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(earningsData.availableBalance)}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Pending Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(earningsData.pendingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Confirmed Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {earningsData.confirmedOrders}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Order Earnings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Confirmed Earnings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(confirmedEarnings.reduce((sum: number, e: OrderEarning) => sum + e.amount, 0))}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {confirmedEarnings.length} confirmed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span>Pending Earnings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatPrice(pendingEarnings.reduce((sum: number, e: OrderEarning) => sum + e.amount, 0))}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {pendingEarnings.length} pending orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span>Disputed Earnings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatPrice(disputedEarnings.reduce((sum: number, e: OrderEarning) => sum + e.amount, 0))}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {disputedEarnings.length} disputed orders
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Earnings Breakdown</CardTitle>
              <p className="text-sm text-gray-600">
                Orders with completed payouts
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedPayoutEarningsList.length > 0 ? (
                  completedPayoutEarningsList.map((earning: any) => (
                    <div key={earning.orderId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-semibold text-gray-900">Order #{earning.orderId ? earning.orderId.slice(0, 8) : 'N/A'}</p>
                            <p className="text-sm text-gray-600">{earning.customerName || 'Customer'}</p>
                            <p className="text-xs text-gray-500">{earning.items}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-buylock-primary">
                          {formatPrice(earning.amount)}
                        </p>
                        <Badge variant="default">
                          paid out
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {safeDate(earning.orderDate)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No completed order payouts available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {/* Pending Payouts & Orders */}
          <div className="grid grid-cols-1 gap-6">
            {/* Section 1: Awaiting Completion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Awaiting Order Completion</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Orders currently in transit or processing. Earnings will automatically process for payout once complete.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingEarnings.length > 0 ? (
                    pendingEarnings.map((earning: any) => (
                      <div key={earning.orderId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Order #{earning.orderId ? earning.orderId.slice(0, 8) : 'N/A'}</p>
                          <p className="text-sm text-gray-600">{earning.customerName || 'Customer'}</p>
                          <p className="text-xs text-gray-500">{earning.items}</p>
                          <p className="text-xs text-amber-600 font-medium mt-1">Pending delivery (will auto-pay on completion)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatPrice(earning.amount)}
                          </p>
                          <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                            pending
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {safeDate(earning.orderDate)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No orders awaiting completion</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Awaiting Payout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Awaiting Admin Payout</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Payout requests created for completed orders, awaiting admin transfer.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutsLoading ? (
                    <div className="flex justify-center py-4">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : pendingPayoutRequests.length > 0 ? (
                    pendingPayoutRequests.map((request: PayoutRequest) => {
                      const matchingOrder = orderEarnings.find((o: any) => o.orderId === request.orderId);
                      return (
                        <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {matchingOrder ? `Order #${matchingOrder.orderId.slice(0, 8)}` : `Request #${request.id.slice(0, 8)}`}
                            </p>
                            <p className="text-sm text-gray-600">{matchingOrder?.customerName || 'Customer'}</p>
                            <p className="text-xs text-gray-500">{matchingOrder?.items || 'Bank payout requested'}</p>
                            <p className="text-xs text-blue-600 font-medium mt-1">Awaiting admin transfer</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-buylock-primary">
                              {safeMoney(request.amount || (request as any).requestedAmount)}
                            </p>
                            <Badge 
                              variant={request.status === 'pending' ? 'secondary' : 
                                     request.status === 'processing' ? 'secondary' : 'destructive'}
                            >
                              {request.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {safeDate(request.requestDate || (request as any).createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No payout requests currently processing</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}