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
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [activeTab, setActiveTab] = useState("overview");

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



  if (platformLoading || vendorLoading) {
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
        <TabsList className="grid w-full grid-cols-2" data-testid="tabs-earnings-management">
          <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-financial-overview">
            <TrendingUp className="w-4 h-4" />
            Financial Overview
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
                {platformEarnings?.topEarningVendors && platformEarnings.topEarningVendors.length > 0 ? (
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
                        <p className="font-bold text-buylock-primary text-lg">{formatPrice(vendor.totalEarnings || '0')}</p>
                        <p className="text-sm text-green-600">Available: {formatPrice(vendor.availableBalance || '0')}</p>
                        {vendor.pendingBalance && parseFloat(vendor.pendingBalance) > 0 && (
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

    </div>
  );
}