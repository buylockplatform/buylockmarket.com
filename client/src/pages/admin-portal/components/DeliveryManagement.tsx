import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Phone, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Filter
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Delivery {
  id: string;
  orderId: string;
  providerId: string;
  externalTrackingId?: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  estimatedPickupTime?: string;
  actualPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  deliveryFee: string;
  distance?: string;
  packageDescription: string;
  customerPhone?: string;
  vendorPhone?: string;
  courierName?: string;
  failureReason?: string;
  createdAt: string;
  updates?: DeliveryUpdate[];
}

interface DeliveryUpdate {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
  source: string;
}

interface DeliveryAnalytics {
  summary: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    pendingDeliveries: number;
    successRate: string;
    averageDeliveryTime: number;
  };
  courierPerformance: Record<string, {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
  }>;
}

export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [analytics, setAnalytics] = useState<DeliveryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    courier: 'all',
    search: '',
  });
  const [reassignData, setReassignData] = useState({
    newProviderId: '',
    reason: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveries();
    fetchAnalytics();
  }, [filters]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.courier !== 'all') params.append('providerId', filters.courier);
      
      const response = await fetch(`/api/deliveries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/delivery/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, icon: Clock, label: 'Pending' },
      pickup_scheduled: { variant: 'default' as const, icon: Calendar, label: 'Pickup Scheduled' },
      picked_up: { variant: 'default' as const, icon: Package, label: 'Picked Up' },
      in_transit: { variant: 'default' as const, icon: Truck, label: 'In Transit' },
      out_for_delivery: { variant: 'default' as const, icon: Truck, label: 'Out for Delivery' },
      delivered: { variant: 'default' as const, icon: CheckCircle, label: 'Delivered' },
      failed: { variant: 'destructive' as const, icon: XCircle, label: 'Failed' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, label: 'Cancelled' },
    };

    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: string | number) => {
    const amount = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReassignDelivery = async (deliveryId: string) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reassignData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Delivery reassigned successfully",
        });
        fetchDeliveries();
        setSelectedDelivery(null);
        setReassignData({ newProviderId: '', reason: '' });
      } else {
        throw new Error('Failed to reassign delivery');
      }
    } catch (error) {
      console.error('Error reassigning delivery:', error);
      toast({
        title: "Error",
        description: "Failed to reassign delivery",
        variant: "destructive",
      });
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = delivery.orderId.toLowerCase().includes(filters.search.toLowerCase()) ||
                         delivery.deliveryAddress.toLowerCase().includes(filters.search.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF4605]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.successRate}%</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.pendingDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Time</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.averageDeliveryTime}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Delivery Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by order ID or address..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="courier">Courier</Label>
              <Select value={filters.courier} onValueChange={(value) => setFilters({ ...filters, courier: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select courier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Couriers</SelectItem>
                  <SelectItem value="g4s">G4S Courier</SelectItem>
                  <SelectItem value="fargo_courier">Fargo Courier</SelectItem>
                  <SelectItem value="pickup-mtaani">Pickup Mtaani</SelectItem>
                  <SelectItem value="speed-af">Speed AF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle>All Deliveries</CardTitle>
          <CardDescription>
            Manage and track all delivery operations across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => (
              <div key={delivery.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-4">
                      <h3 className="font-semibold">Order #{delivery.orderId.slice(0, 8)}</h3>
                      {getStatusBadge(delivery.status)}
                      <Badge variant="outline">{delivery.providerId}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {delivery.deliveryAddress}
                      </div>
                      {delivery.customerPhone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          {delivery.customerPhone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(delivery.createdAt)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{delivery.packageDescription}</p>
                    {delivery.failureReason && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {delivery.failureReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{formatPrice(delivery.deliveryFee)}</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedDelivery(delivery)}
                        >
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Delivery Details</DialogTitle>
                          <DialogDescription>
                            Complete information and tracking for delivery {delivery.id.slice(0, 8)}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedDelivery && (
                          <div className="space-y-6">
                            {/* Delivery Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Order ID</Label>
                                <p className="text-sm">{selectedDelivery.orderId}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedDelivery.status)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Courier</Label>
                                <p className="text-sm">{selectedDelivery.providerId}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Delivery Fee</Label>
                                <p className="text-sm">{formatPrice(selectedDelivery.deliveryFee)}</p>
                              </div>
                            </div>

                            {/* Addresses */}
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">Pickup Address</Label>
                                <p className="text-sm text-gray-600">{selectedDelivery.pickupAddress}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Delivery Address</Label>
                                <p className="text-sm text-gray-600">{selectedDelivery.deliveryAddress}</p>
                              </div>
                            </div>

                            {/* Tracking Updates */}
                            {selectedDelivery.updates && selectedDelivery.updates.length > 0 && (
                              <div>
                                <Label className="text-sm font-medium">Tracking Updates</Label>
                                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                  {selectedDelivery.updates.map((update) => (
                                    <div key={update.id} className="text-sm border-l-2 border-gray-200 pl-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{update.status}</span>
                                        <span className="text-gray-500">{formatDate(update.timestamp)}</span>
                                      </div>
                                      <p className="text-gray-600">{update.description}</p>
                                      {update.location && (
                                        <p className="text-gray-500 text-xs">{update.location}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Reassign Option */}
                            {selectedDelivery.status !== 'delivered' && (
                              <div className="border-t pt-4">
                                <Label className="text-sm font-medium text-red-600">Reassign Delivery</Label>
                                <div className="mt-2 space-y-3">
                                  <Select
                                    value={reassignData.newProviderId}
                                    onValueChange={(value) => setReassignData({ ...reassignData, newProviderId: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select new courier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="g4s">G4S Courier</SelectItem>
                                      <SelectItem value="fargo_courier">Fargo Courier</SelectItem>
                                      <SelectItem value="pickup-mtaani">Pickup Mtaani</SelectItem>
                                      <SelectItem value="speed-af">Speed AF</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Textarea
                                    placeholder="Reason for reassignment..."
                                    value={reassignData.reason}
                                    onChange={(e) => setReassignData({ ...reassignData, reason: e.target.value })}
                                  />
                                  <Button
                                    onClick={() => handleReassignDelivery(selectedDelivery.id)}
                                    disabled={!reassignData.newProviderId}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    Reassign Delivery
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}

            {filteredDeliveries.length === 0 && (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No deliveries found matching your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}