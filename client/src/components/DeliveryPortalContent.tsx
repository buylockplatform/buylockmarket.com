import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Truck,
  Package,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_COURIER_NAME,
  DELIVERY_STATUS_UPDATE_OPTIONS,
  getDeliveryStatusLabel,
} from "@shared/deliveryStatuses";

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

interface PickupOrder {
  id: string;
  trackingNumber: string;
  internalTrackingId?: string;
  deliveryAddress: string;
  totalAmount: string;
  courierName?: string;
  courierId?: string;
  estimatedDeliveryTime?: string;
  orderType?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "destructive"; className?: string }> = {
  pending: { variant: "secondary" },
  pickup_scheduled: { variant: "default", className: "bg-blue-100 text-blue-800" },
  picked_up: { variant: "default", className: "bg-indigo-100 text-indigo-800" },
  in_transit: { variant: "default", className: "bg-purple-100 text-purple-800" },
  out_for_delivery: { variant: "default", className: "bg-orange-100 text-orange-800" },
  delivered: { variant: "default", className: "bg-green-100 text-green-800" },
  failed: { variant: "destructive" },
  cancelled: { variant: "destructive" },
};

export default function DeliveryPortalContent() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: deliveries, isLoading } = useQuery<Delivery[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: pickupOrders } = useQuery<PickupOrder[]>({
    queryKey: ["/api/deliveries/pickup-orders"],
  });

  const fulfillOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string }) => {
      return await apiRequest(`/api/orders/${data.orderId}/fulfill`, "PUT");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/pickup-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Fulfilled",
        description: "Order has been marked as fulfilled.",
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

  const updateDeliveryMutation = useMutation({
    mutationFn: async (data: { deliveryId: string; status: string }) => {
      return await apiRequest(`/api/deliveries/${data.deliveryId}/status`, "PUT", {
        status: data.status,
        description: getDeliveryStatusLabel(data.status),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status Updated",
        description: `Delivery marked as "${getDeliveryStatusLabel(variables.status)}"`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_BADGE[status] || STATUS_BADGE.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {getDeliveryStatusLabel(status)}
      </Badge>
    );
  };

  const servicePickupOrders =
    pickupOrders?.filter((o) => o.courierId === "dispatch_service" || o.orderType === "service") || [];

  const activeDeliveries =
    deliveries?.filter((d) => d.status !== "delivered" && d.status !== "cancelled") || [];

  const filteredDeliveries =
    selectedStatus === "all"
      ? deliveries || []
      : deliveries?.filter((d) => d.status === selectedStatus) || [];

  const inTransitCount =
    deliveries?.filter((d) =>
      ["pickup_scheduled", "picked_up", "in_transit", "out_for_delivery"].includes(d.status)
    ).length || 0;

  const renderDeliveryCard = (delivery: Delivery) => {
    const courierLabel = delivery.courierName || DEFAULT_COURIER_NAME;
    const isInternalCourier = delivery.providerId === "buylock_delivery";

    return (
      <div key={delivery.id} className="p-4 border rounded-lg hover:bg-gray-50 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">
                Order #{delivery.orderId.slice(-8).toUpperCase()}
              </h4>
              {getStatusBadge(delivery.status)}
            </div>
            <p className="text-sm text-gray-500">{delivery.packageDescription}</p>
            {delivery.externalTrackingId && (
              <p className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
                Tracking: {delivery.externalTrackingId}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold">{formatPrice(delivery.deliveryFee)}</p>
            <p className="text-xs text-gray-500">Delivery fee</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Pickup (Vendor)
            </p>
            <p className="text-gray-600">{delivery.pickupAddress}</p>
            {delivery.vendorPhone && (
              <p className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {delivery.vendorPhone}
              </p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            <p className="font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Delivery (Customer)
            </p>
            <p className="text-gray-600">{delivery.deliveryAddress}</p>
            {delivery.customerPhone && (
              <p className="text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {delivery.customerPhone}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck className="w-4 h-4" />
            <span>
              Courier: <strong>{courierLabel}</strong>
            </span>
            {isInternalCourier && (
              <Badge variant="outline" className="text-xs">
                Internal
              </Badge>
            )}
            {delivery.courierPhone && (
              <span className="text-gray-400">({delivery.courierPhone})</span>
            )}
          </div>

          {delivery.status !== "delivered" && delivery.status !== "cancelled" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateDeliveryMutation.isPending}
                >
                  Update Status
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Set delivery status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DELIVERY_STATUS_UPDATE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    disabled={delivery.status === option.value}
                    onClick={() =>
                      updateDeliveryMutation.mutate({
                        deliveryId: delivery.id,
                        status: option.value,
                      })
                    }
                  >
                    {option.label}
                    {delivery.status === option.value && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">{activeDeliveries.length}</p>
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
                  {deliveries?.filter((d) => d.status === "delivered").length || 0}
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
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{inTransitCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {servicePickupOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Service Orders Awaiting Fulfillment ({servicePickupOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicePickupOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 border rounded-lg bg-blue-50 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">Order #{order.trackingNumber}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <User className="w-3 h-3" />
                      {order.user?.firstName} {order.user?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.deliveryAddress}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Courier: <strong>BuyLock Dispatch</strong> (internal service)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-blue-600">{formatPrice(order.totalAmount)}</p>
                    <Button
                      size="sm"
                      className="mt-2 bg-green-600 hover:bg-green-700"
                      onClick={() => fulfillOrderMutation.mutate({ orderId: order.id })}
                      disabled={fulfillOrderMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Fulfilled
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Deliveries — {DEFAULT_COURIER_NAME} ({filteredDeliveries.length})
            </CardTitle>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {DELIVERY_STATUS_UPDATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-32 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No deliveries found</p>
              <p className="text-sm text-gray-400 mt-1">
                Product orders are auto-dispatched to {DEFAULT_COURIER_NAME} when vendors mark them
                ready for pickup.
              </p>
            </div>
          ) : (
            <div className="space-y-4">{filteredDeliveries.map(renderDeliveryCard)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
