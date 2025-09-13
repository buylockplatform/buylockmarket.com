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

interface PayoutRequest {
  id: string;
  amount: number;
  requestDate: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bankAccount?: string;
  processedDate?: string;
  failureReason?: string;
}

export default function EarningsManagement({ vendorId }: { vendorId: string }) {
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showPayoutForm, setShowPayoutForm] = useState(false);

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

  // Filter to show only orders with completed payout requests
  // Orders should move from Payout Requests tab to Order Earnings tab after payout completion
  const completedPayoutEarnings = orderEarnings.filter((earning: OrderEarning) => {
    // Check if there's a completed payout request for this order
    return payoutRequests.some((request: PayoutRequest) => 
      request.status === 'completed' && 
      // Using amount matching as proxy until proper order-payout linkage is implemented
      Math.abs(request.amount - earning.amount) < 0.01
    );
  });

  // Fetch delivered orders eligible for payout
  const { data: deliveredOrders = [], isLoading: deliveredOrdersLoading } = useQuery({
    queryKey: [`/api/vendor/${vendorId}/orders/delivered`],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendorId}/orders/delivered`),
    retry: false,
  });

  // Request payout mutation
  const requestPayout = useMutation({
    mutationFn: async (data: { amount: string; bankDetails: string }) => {
      return vendorApiRequest(`/api/vendor/${vendorId}/request-payout`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/payout-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/earnings`] });
      setPayoutAmount("");
      setBankDetails("");
      setShowPayoutForm(false);
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

  const earningsData: EarningsData = earnings || {
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    confirmedOrders: 0,
    pendingOrders: 0,
    disputedOrders: 0
  };

  // Use completed payout earnings for overview stats
  const confirmedEarnings = completedPayoutEarnings?.filter((e: OrderEarning) => e.status === 'confirmed') || [];
  const pendingEarnings = completedPayoutEarnings?.filter((e: OrderEarning) => e.status === 'pending') || [];
  const disputedEarnings = completedPayoutEarnings?.filter((e: OrderEarning) => e.status === 'disputed') || [];

  const handlePayoutRequest = () => {
    const amount = parseFloat(payoutAmount);
    const maxAmount = earningsData.availableBalance;
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (amount > maxAmount) {
      alert(`Amount cannot exceed available balance of ${formatPrice(maxAmount)}`);
      return;
    }
    
    if (!bankDetails.trim()) {
      alert('Please enter bank account details');
      return;
    }
    
    requestPayout.mutate({
      amount: payoutAmount,
      bankDetails: bankDetails.trim()
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
          <TabsTrigger value="payout-requests">Payout Requests</TabsTrigger>
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
                Orders with completed payout requests only
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedPayoutEarnings.length > 0 ? (
                  completedPayoutEarnings.map((earning: OrderEarning) => (
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
                        <Badge 
                          variant={earning.status === 'confirmed' ? 'default' : 
                                 earning.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {earning.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(earning.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No order earnings data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout-requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Banknote className="w-5 h-5 text-green-600" />
                <span>Delivered Orders - Request Payout</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Orders delivered by admin and eligible for payout requests
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveredOrdersLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : deliveredOrders.length > 0 ? (
                  deliveredOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-semibold text-gray-900">Order #{order.id ? order.id.slice(0, 8) : 'N/A'}</p>
                            <p className="text-sm text-gray-600">{order.userName || order.userEmail || 'Customer'}</p>
                            <p className="text-xs text-gray-500">Delivered: {new Date(order.updatedAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">Address: {order.deliveryAddress}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <Badge variant="default" className="bg-green-600">
                          Delivered
                        </Badge>
                        <div className="mt-2">
                          <Button 
                            size="sm" 
                            className="bg-buylock-primary hover:bg-buylock-primary/90"
                            data-testid={`button-request-payout-${order.id}`}
                            onClick={() => {
                              console.log("Request Payout button clicked for order:", order.id);
                              console.log("Setting payout amount to:", order.totalAmount.toString());
                              setPayoutAmount(order.totalAmount.toString());
                              setBankDetails("");
                              console.log("Setting showPayoutForm to true");
                              setShowPayoutForm(true);
                              console.log("Setting active tab to payout-requests");
                              setActiveTab("payout-requests");
                              console.log("showPayoutForm state after click should be true");
                            }}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Request Payout
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No delivered orders available for payout</p>
                    <p className="text-sm">Orders delivered by admin will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payout Request Form */}
          {showPayoutForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Submit Payout Request</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount
                  </label>
                  <Input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    data-testid="input-payout-amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Details
                  </label>
                  <Textarea
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    placeholder="Enter your bank account details (Bank name, Account number, Account name)"
                    rows={3}
                    data-testid="input-bank-details"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button 
                    onClick={handlePayoutRequest}
                    disabled={requestPayout.isPending}
                    className="bg-buylock-primary hover:bg-buylock-primary/90"
                    data-testid="button-submit-payout"
                  >
                    {requestPayout.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit Request
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPayoutForm(false)}
                    data-testid="button-cancel-payout"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payout Requests History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span>Payout Requests History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutsLoading ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : payoutRequests.length > 0 ? (
                  payoutRequests.map((request: PayoutRequest) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-semibold text-gray-900">Request #{request.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-600">
                              {request.bankAccount || 'Bank details provided'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Requested: {new Date(request.requestDate).toLocaleDateString()}
                            </p>
                            {request.processedDate && (
                              <p className="text-xs text-gray-500">
                                Processed: {new Date(request.processedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-buylock-primary">
                          {formatPrice(request.amount)}
                        </p>
                        <Badge 
                          variant={request.status === 'completed' ? 'default' : 
                                 request.status === 'pending' ? 'secondary' : 
                                 request.status === 'processing' ? 'secondary' : 'destructive'}
                        >
                          {request.status}
                        </Badge>
                        {request.failureReason && (
                          <p className="text-xs text-red-500 mt-1">
                            {request.failureReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No payout requests yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}