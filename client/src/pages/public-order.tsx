import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Truck, Package, Clock, MapPin, Phone, CreditCard } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

type PublicOrder = {
  id: string;
  status: string;
  totalAmount: number;
  deliveryFee: number;
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
  courierName?: string;
  trackingNumber?: string;
  createdAt: string;
  estimatedDelivery?: string;
  vendorAcceptedAt?: string;
  orderType?: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    price: number;
    productName?: string;
    serviceName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    duration?: number;
  }>;
};

const statusConfig = {
  pending: { label: "Order Placed", color: "bg-yellow-500", icon: Package },
  confirmed: { label: "Confirmed", color: "bg-blue-500", icon: Package },
  processing: { label: "Being Prepared", color: "bg-orange-500", icon: Package },
  ready_for_pickup: { label: "Ready for Pickup", color: "bg-purple-500", icon: Package },
  picked_up: { label: "Out for Delivery", color: "bg-indigo-500", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500", icon: Package },
  cancelled: { label: "Cancelled", color: "bg-red-500", icon: Package },
};

export default function PublicOrder() {
  const { token } = useParams<{ token: string }>();
  const { formatPrice } = useCurrency();

  const { data: order, isLoading, error } = useQuery<PublicOrder>({
    queryKey: ["/api/public/orders", token],
    enabled: !!token,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading order details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">
              The order link may have expired or is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || {
    label: order.status,
    color: "bg-gray-500",
    icon: Package,
  };

  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Order Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your order status and details
          </p>
        </div>

        {/* Order Status Card */}
        <Card className="mb-6" data-testid="card-order-status">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                Order #{order.id.slice(-8)}
              </CardTitle>
              <Badge className={`${statusInfo.color} text-white`} data-testid="badge-status">
                {statusInfo.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Ordered: {new Date(order.createdAt).toLocaleDateString('en-KE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {order.estimatedDelivery && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {order.trackingNumber && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Tracking: {order.trackingNumber}
                  </span>
                </div>
              )}
              
              {order.courierName && (
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Courier: {order.courierName}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card className="mb-6" data-testid="card-delivery-info">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium">Delivery Address:</p>
              <p className="text-gray-600 dark:text-gray-400" data-testid="text-delivery-address">
                {order.deliveryAddress}
              </p>
              
              {order.estimatedDeliveryTime && (
                <>
                  <p className="text-sm font-medium mt-3">Estimated Delivery Time:</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {order.estimatedDeliveryTime}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6" data-testid="card-order-items">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item, index) => (
                <div key={item.id} data-testid={`item-order-${index}`}>
                  {index > 0 && <Separator />}
                  <div className="flex justify-between items-start py-3">
                    <div className="flex-1">
                      <h4 className="font-medium" data-testid={`text-item-name-${index}`}>
                        {item.productName || item.serviceName}
                      </h4>
                      
                      {item.appointmentDate && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(item.appointmentDate).toLocaleDateString('en-KE')}
                          {item.appointmentTime && ` at ${item.appointmentTime}`}
                          {item.duration && ` (${item.duration}h)`}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium" data-testid={`text-item-price-${index}`}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-sm text-gray-500">
                          {formatPrice(item.price)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card data-testid="card-order-summary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span data-testid="text-subtotal">
                  {formatPrice(order.totalAmount - (order.deliveryFee || 0))}
                </span>
              </div>
              
              {order.deliveryFee && order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span data-testid="text-delivery-fee">
                    {formatPrice(order.deliveryFee)}
                  </span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span data-testid="text-total-amount">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This page updates automatically every 30 seconds</p>
          <p className="mt-1">Keep this link to track your order anytime</p>
        </div>
      </div>
    </div>
  );
}