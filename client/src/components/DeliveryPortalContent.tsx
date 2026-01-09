import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Truck, Package, Clock, MapPin, Phone, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
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
  packageDescription: string;
  customerPhone?: string;
  vendorPhone?: string;
  courierName?: string;
  courierPhone?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryProvider {
  id: string;
  name: string;
  type: string;
  contactPhone?: string;
  contactEmail?: string;
  estimatedDeliveryTime?: string;
}

interface PickupOrder {
  id: string;
  trackingNumber: string;
  internalTrackingId?: string;
  deliveryAddress: string;
  totalAmount: string;
  courierName?: string;
  courierId?: string;
  estimatedDeliveryTime?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function DeliveryPortalContent() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries, isLoading } = useQuery<Delivery[]>({
    queryKey: ['/api/deliveries'],
  });

  const { data: pickupOrders, isLoading: isLoadingPickups } = useQuery<PickupOrder[]>({
    queryKey: ['/api/deliveries/pickup-orders'],
  });

  const { data: providers } = useQuery<DeliveryProvider[]>({
    queryKey: ['/api/delivery/providers'],
  });

  const fulfillOrderMutation = useMutation({
    mutationFn: async (data: {
      orderId: string;
    }) => {
      return await apiRequest(`/api/orders/${data.orderId}/fulfill`, 'PUT');
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/pickup-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

      toast({
        title: "Order Fulfilled Successfully! ✅",
        description: "Order has been marked as fulfilled and moved to completed orders. Vendor earnings have been calculated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to fulfill order",
        variant: "destructive",
      });
    },
  });

  const notifyCourierMutation = useMutation({
    mutationFn: async (data: {
      orderId: string;
      providerId: string;
    }) => {
      // Calls the backend to create a delivery (triggering Fargo/Courier API)
      return await apiRequest(`/api/deliveries/create`, 'POST', data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/pickup-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });

      toast({
        title: "Courier Notified Successfully! 🚛",
        description: `Pickup request sent. Tracking ID: ${data.externalTrackingId}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Notification Failed",
        description: error.message || "Failed to notify courier",
        variant: "destructive",
      });
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async (data: {
      deliveryId: string;
      status: string;
      courierName?: string;
      courierPhone?: string;
      estimatedDeliveryTime?: string;
    }) => {
      return await apiRequest(`/api/deliveries/${data.deliveryId}/status`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      toast({
        title: "Status Updated",
        description: "Delivery status has been updated successfully",
      });
      setSelectedDelivery(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  const refreshDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      // We set selected strictly for loading state tracking in the specific button
      setSelectedDelivery({ id: deliveryId } as Delivery);
      return await apiRequest(`/api/deliveries/${deliveryId}/refresh`, 'POST');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });

      if (data.updated) {
        toast({
          title: "Status Refreshed 🔄",
          description: `Updated to: ${data.status.replace('_', ' ').toUpperCase()}`,
        });
      } else {
        toast({
          title: "Status Verified",
          description: "Status is already up to date.",
          variant: 'default', // plain/info
        });
      }
      setSelectedDelivery(null);
    },
    onError: () => {
      toast({
        title: "Sync Failed",
        description: "Could not fetch latest status from courier.",
        variant: "destructive",
      });
      setSelectedDelivery(null);
    }
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock },
      in_transit: { variant: "default" as const, icon: Truck },
      delivered: { variant: "default" as const, icon: CheckCircle, className: "bg-green-100 text-green-800" },
      failed: { variant: "destructive" as const, icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredDeliveries = deliveries?.filter(delivery =>
    selectedStatus === "all" || delivery.status === selectedStatus
  ) || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold">{deliveries?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending Pickups</p>
                <p className="text-2xl font-bold">{pickupOrders?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {deliveries?.filter(d => d.status === 'delivered').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold">
                  {deliveries?.filter(d => d.status === 'in_transit').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Pickup Orders */}
      {pickupOrders && pickupOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Orders Ready for Pickup ({pickupOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pickupOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Order #{order.trackingNumber}</h4>
                      <p className="text-sm text-gray-600">
                        Customer: {order.user?.firstName} {order.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.deliveryAddress}
                      </p>
                      <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-100 rounded">
                        <div className="flex items-center gap-1 mb-1">
                          <Truck className="w-3 h-3" />
                          <span className="font-medium">Pre-Selected: {order.courierName || 'BuyLock Dispatch'}</span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>🆔 ID: {order.courierId || 'dispatch_service'}</div>
                          <div>⏱️ ETA: {order.estimatedDeliveryTime || '2-4 hours'}</div>
                          {order.internalTrackingId && (
                            <div>📋 Internal: {order.internalTrackingId}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatPrice(order.totalAmount)}</p>
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Courier Pre-Selected
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className={order.courierId && order.courierId !== 'dispatch_service'
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "bg-green-600 hover:bg-green-700"}
                        >
                          {order.courierId && order.courierId !== 'dispatch_service' ? (
                            <>
                              <Truck className="w-4 h-4 mr-1" />
                              Notify Courier
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Order Fulfilled
                            </>
                          )}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark Order as Fulfilled - Order #{order.trackingNumber}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-2">Order Fulfillment Confirmation</h4>
                            <div className="space-y-2">
                              <p className="text-green-800">
                                Marking this order as <strong>fulfilled</strong> will:
                              </p>
                              <div className="text-sm text-green-700 space-y-1">
                                <p>• Move order to completed orders section</p>
                                <p>• Calculate vendor earnings (80% of order value)</p>
                                <p>• Make earnings available for payout request</p>
                                <p>• Update order status to "Fulfilled"</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-1">Order Summary</h5>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><strong>Order ID:</strong> {order.trackingNumber}</p>
                              <p><strong>Order Total:</strong> {formatPrice(order.totalAmount)}</p>
                              <p><strong>Customer:</strong> {order.user?.firstName} {order.user?.lastName}</p>
                              <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
                              {order.courierId && order.courierId !== 'dispatch_service' && (
                                <p className="text-blue-600 font-medium mt-2">
                                  <Truck className="w-3 h-3 inline mr-1" />
                                  Courier: {order.courierName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-4">
                            {order.courierId && order.courierId !== 'dispatch_service' ? (
                              <Button
                                onClick={() => {
                                  notifyCourierMutation.mutate({
                                    orderId: order.id,
                                    providerId: order.courierId!, // Safe assert as we checked condition
                                  });
                                }}
                                disabled={notifyCourierMutation.isPending}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                {notifyCourierMutation.isPending ? 'Notifying Courier...' : 'Notify Courier to Pickup'}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  fulfillOrderMutation.mutate({
                                    orderId: order.id,
                                  });
                                }}
                                disabled={fulfillOrderMutation.isPending}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {fulfillOrderMutation.isPending ? 'Fulfilling Order...' : 'Confirm Order Fulfilled'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Active Deliveries ({filteredDeliveries.length})
            </CardTitle>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deliveries found</p>
              <p className="text-sm text-gray-400">
                {selectedStatus === "all"
                  ? "No deliveries have been created yet"
                  : `No deliveries with status "${selectedStatus.replace('_', ' ')}"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <Truck className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Delivery #{delivery.id.slice(-8).toUpperCase()}</h4>
                      <p className="text-sm text-gray-600">Order: {delivery.orderId.slice(-8).toUpperCase()}</p>
                      {delivery.externalTrackingId && (
                        <p className="text-sm text-blue-800 font-medium bg-blue-50 px-2 py-0.5 rounded-md inline-block my-1">
                          Waybill: {delivery.externalTrackingId}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {delivery.deliveryAddress}
                      </p>
                      {delivery.courierName && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {delivery.courierName}
                          {delivery.courierPhone && ` (${delivery.courierPhone})`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(delivery.deliveryFee)}</p>
                      {getStatusBadge(delivery.status)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          refreshDeliveryMutation.mutate(delivery.id);
                        }}
                        disabled={refreshDeliveryMutation.isPending && selectedDelivery?.id === delivery.id}
                      >
                        <RefreshCw className={`w-3 h-3 mr-1 ${refreshDeliveryMutation.isPending && selectedDelivery?.id === delivery.id ? 'animate-spin' : ''}`} />
                        Sync
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDelivery(delivery)}
                          >
                            Update Status
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Delivery Status</DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label>Delivery Status</Label>
                              <Select
                                defaultValue={delivery.status}
                                onValueChange={(status) => {
                                  updateDeliveryMutation.mutate({
                                    deliveryId: delivery.id,
                                    status: status,
                                  });
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_transit">In Transit</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Courier Name</Label>
                                <Input
                                  defaultValue={delivery.courierName || ''}
                                  placeholder="Enter courier name"
                                />
                              </div>
                              <div>
                                <Label>Courier Phone</Label>
                                <Input
                                  defaultValue={delivery.courierPhone || ''}
                                  placeholder="Enter phone number"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Estimated Delivery Time</Label>
                              <Input
                                defaultValue={delivery.estimatedDeliveryTime || ''}
                                placeholder="e.g., 2-4 hours"
                              />
                            </div>

                            <div>
                              <Label>Special Instructions</Label>
                              <Textarea
                                defaultValue={delivery.specialInstructions || ''}
                                placeholder="Any special delivery instructions..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}