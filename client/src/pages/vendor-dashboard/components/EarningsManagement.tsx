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

  // Fetch vendor earnings data
  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: [`/api/vendor/${vendorId}/earnings`],
    queryFn: () => vendorApiRequest(`/api/vendor/${vendorId}/earnings`),
    retry: false,
  });

  // Fetch order earnings breakdown
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

  const confirmedEarnings = orderEarnings?.filter((e: OrderEarning) => e.status === 'confirmed') || [];
  const pendingEarnings = orderEarnings?.filter((e: OrderEarning) => e.status === 'pending') || [];
  const disputedEarnings = orderEarnings?.filter((e: OrderEarning) => e.status === 'disputed') || [];

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="earnings">Order Earnings</TabsTrigger>
          <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
          <TabsTrigger value="request">Request Payout</TabsTrigger>
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderEarnings.length > 0 ? (
                  orderEarnings.map((earning: OrderEarning) => (
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

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout Request History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutRequests.length > 0 ? (
                  payoutRequests.map((payout: PayoutRequest) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-full bg-blue-100">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Payout Request</p>
                            <p className="text-sm text-gray-600">{payout.bankAccount}</p>
                            <p className="text-xs text-gray-500">
                              Requested: {new Date(payout.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-buylock-primary text-lg">
                          {formatPrice(payout.amount)}
                        </p>
                        <Badge 
                          variant={payout.status === 'completed' ? 'default' : 
                                 payout.status === 'processing' ? 'secondary' : 
                                 payout.status === 'pending' ? 'outline' : 'destructive'}
                        >
                          {payout.status}
                        </Badge>
                        {payout.processedDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Processed: {new Date(payout.processedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Banknote className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No payout requests found</p>
                    <p className="text-sm">Your payout requests will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    max={earningsData.availableBalance}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatPrice(earningsData.availableBalance)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Details
                  </label>
                  <Textarea
                    placeholder="Enter your bank account details..."
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handlePayoutRequest}
                  disabled={requestPayout.isPending || !payoutAmount || !bankDetails}
                  className="bg-buylock-primary hover:bg-buylock-primary/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {requestPayout.isPending ? 'Requesting...' : 'Request Payout'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}