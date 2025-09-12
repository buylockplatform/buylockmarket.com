import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import VendorLayout from "@/components/vendor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  FileText,
  CreditCard
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  parseMoneyToNumber, 
  formatMoney, 
  formatMoneyNumber, 
  isMoneyGreater, 
  isValidMoneyInput 
} from "@/lib/money";
import type { Vendor, VendorEarning, PayoutRequest, Order } from "@shared/schema";


interface EarningsData {
  totalEarnings: string;
  availableBalance: string;
  pendingBalance: string;
  totalPaidOut: string;
  recentEarnings: VendorEarning[];
}

export default function Earnings() {
  const [activeTab, setActiveTab] = useState<"overview" | "fulfilled-orders" | "paid-orders">("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendor } = useQuery<Vendor>({
    queryKey: ["/api/auth/vendor"],
  });

  const { data: earnings } = useQuery<EarningsData>({
    queryKey: [`/api/vendor/${vendor?.id}/earnings`],
    enabled: !!vendor?.id,
  });

  const { data: fulfilledOrders = [] } = useQuery<Order[]>({
    queryKey: [`/api/vendor/${vendor?.id}/orders/fulfilled`],
    enabled: !!vendor?.id && activeTab === "fulfilled-orders",
  });


  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "fulfilled-orders", label: "Fulfilled Orders", icon: CreditCard },
    { id: "paid-orders", label: "Paid Out Orders", icon: CheckCircle },
  ];

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      failed: "bg-red-100 text-red-800",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600 mt-1">
            Manage your earnings and payout requests
          </p>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMoney(earnings?.totalEarnings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMoney(earnings?.availableBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatMoney(earnings?.pendingBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Account Info */}
        {vendor && (vendor as any).bankName && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 rounded bg-blue-100">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">Bank Account</p>
                  <p className="text-sm text-blue-700">
                    {(vendor as any).bankName} - {(vendor as any).accountNumber} ({(vendor as any).accountName})
                  </p>
                </div>
                {(vendor as any).paystackSubaccountCode && (
                  <div className="ml-auto">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Paystack Ready
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings?.recentEarnings && earnings.recentEarnings.length > 0 ? (
                  <div className="space-y-4">
                    {earnings.recentEarnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Order #{earning.orderId.slice(-8)}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(earning.earningDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatMoney(earning.netEarnings)}</p>
                          <p className="text-sm text-gray-600">
                            Platform fee: {formatMoney(earning.platformFee)}
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(earning.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No earnings yet</p>
                    <p className="text-sm">Complete orders to start earning</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "fulfilled-orders" && (
          <div className="space-y-6">
            {/* Fulfilled Orders Ready for Payout */}
            <Card>
              <CardHeader>
                <CardTitle>Fulfilled Orders Ready for Payout</CardTitle>
                <p className="text-sm text-gray-600">
                  Orders that have been fulfilled and are ready for earning payouts
                </p>
              </CardHeader>
              <CardContent>
                {fulfilledOrders.length > 0 ? (
                  <div className="space-y-4">
                    {fulfilledOrders.map((order) => {
                      const platformFeePercentage = 20;
                      const totalOrderValue = parseMoneyToNumber(order.totalAmount.toString());
                      const vendorEarnings = totalOrderValue * (1 - platformFeePercentage / 100);
                      const platformFee = totalOrderValue * (platformFeePercentage / 100);
                      
                      return (
                        <div key={order.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">
                              Fulfilled: {new Date(order.updatedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Total: {formatMoneyNumber(totalOrderValue)} | Platform Fee: {formatMoneyNumber(platformFee)}
                            </p>
                          </div>
                          <div className="text-right mr-4">
                            <p className="font-medium text-green-600 text-lg">{formatMoneyNumber(vendorEarnings)}</p>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Your Earnings
                            </span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                              Ready for Payout
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No fulfilled orders</p>
                    <p className="text-sm">Orders will appear here when they're delivered and fulfilled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "paid-orders" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Available for Payout</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Contact admin for payout processing</p>
                  <p className="text-sm">Direct payout processing has been simplified</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}