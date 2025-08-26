import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Eye,
  AlertCircle,
  Calendar,
  DollarSign,
  ShoppingBag,
  Play,
  Wrench,
  AlertTriangle
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Order, OrderTracking, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  orderItems: OrderItem[];
}

export default function MyOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);

  // Currency formatting function for Kenyan Shillings
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: orderTracking = [], isLoading: trackingLoading } = useQuery<OrderTracking[]>({
    queryKey: ["/api/orders", selectedOrder?.id, "tracking"],
    enabled: !!selectedOrder?.id,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to cancel order");
      return response.json();
    },
    onSuccess: (cancelledOrder) => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
      });
      // Invalidate all order-related queries to ensure global update
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor"], type: 'all' }); // For vendor dashboard
      queryClient.invalidateQueries({ queryKey: ["/api/admin"], type: 'all' }); // For admin portal
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"], type: 'all' }); // For delivery tracking
      
      // Also refetch the current orders to ensure immediate update
      queryClient.refetchQueries({ queryKey: ["/api/orders"] });
      
      console.log(`Order ${cancelledOrder.id} cancelled - cache invalidated`);
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order",
        variant: "destructive",
      });
    },
  });

  const generateTrackingMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/orders/${orderId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update tracking");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tracking Updated",
        description: "New tracking information has been generated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", selectedOrder?.id, "tracking"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tracking",
        variant: "destructive",
      });
    },
  });

  const getOrderDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order details");
      const order = await response.json();
      setSelectedOrder(order);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "pending": 
      case "pending_acceptance": return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "accepted": return "bg-blue-100 text-blue-800";
      case "starting_job": return "bg-indigo-100 text-indigo-800";
      case "in_progress": return "bg-purple-100 text-purple-800";
      case "delayed": return "bg-orange-100 text-orange-800";
      case "almost_done": return "bg-teal-100 text-teal-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered":
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "pending": 
      case "pending_acceptance": return <Clock className="w-4 h-4" />;
      case "confirmed":
      case "accepted": return <CheckCircle className="w-4 h-4" />;
      case "starting_job": return <Play className="w-4 h-4" />;
      case "in_progress": return <Wrench className="w-4 h-4" />;
      case "delayed": return <AlertTriangle className="w-4 h-4" />;
      case "almost_done": return <Clock className="w-4 h-4" />;
      case "shipped": return <Truck className="w-4 h-4" />;
      case "delivered": 
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "pending": return "Pending";
      case "pending_acceptance": return "Pending Acceptance";
      case "confirmed": return "Confirmed";
      case "accepted": return "Accepted";
      case "starting_job": return "Starting Job";
      case "in_progress": return "In Progress";
      case "delayed": return "Delayed";
      case "almost_done": return "Almost Done";
      case "shipped": return "Shipped";
      case "delivered": return "Delivered";
      case "completed": return "Completed";
      case "cancelled": return "Cancelled";
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const ongoingOrders = orders.filter(order => 
    order.status && !["delivered", "cancelled"].includes(order.status.toLowerCase())
  );
  
  const pastOrders = orders.filter(order => 
    order.status && ["delivered", "cancelled"].includes(order.status.toLowerCase())
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Order #{order.id.slice(-8).toUpperCase()}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {order.createdAt && format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge className={`${getStatusColor(order.status)} border-0`}>
            <span className="flex items-center gap-1">
              {getStatusIcon(order.status)}
              {getStatusLabel(order.status)}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
          </div>
          {order.trackingNumber && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Package className="w-4 h-4" />
              <span>#{order.trackingNumber}</span>
            </div>
          )}
        </div>

        {order.deliveryAddress && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5" />
            <span>{order.deliveryAddress}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => getOrderDetails(order.id)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </Button>

          {order.status && !["delivered", "cancelled"].includes(order.status.toLowerCase()) && (
            <>
              <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order as OrderWithItems);
                      setTrackingDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    Track Order
                  </Button>
                </DialogTrigger>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => cancelOrderMutation.mutate(order.id)}
                disabled={cancelOrderMutation.isPending}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your order history</p>
        </div>

        <Tabs defaultValue="ongoing" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ongoing" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Ongoing ({ongoingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Past Orders ({pastOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ongoingOrders.length > 0 ? (
              <div className="grid gap-4">
                {ongoingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No ongoing orders</h3>
                  <p className="text-gray-600 mb-6">You don't have any orders in progress.</p>
                  <Button asChild>
                    <a href="/shop">Start Shopping</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pastOrders.length > 0 ? (
              <div className="grid gap-4">
                {pastOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No past orders</h3>
                  <p className="text-gray-600">Your order history will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder && !trackingDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium">#{selectedOrder.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={`${getStatusColor(selectedOrder.status)} border-0`}>
                        {selectedOrder.status ? selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                    {selectedOrder.trackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tracking:</span>
                        <span className="font-medium">#{selectedOrder.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <p className="mt-1">{selectedOrder.deliveryAddress || "Not provided"}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span>{selectedOrder.paymentMethod || "Card"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h5 className="font-medium">{item.name}</h5>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <span className="font-semibold">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Amount</span>
                <span className="font-bold text-xl text-buylock-primary">
                  {formatPrice(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tracking Dialog */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Tracking #{selectedOrder?.id.slice(-8).toUpperCase()}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">Tracking Progress</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedOrder && generateTrackingMutation.mutate(selectedOrder.id)}
                disabled={generateTrackingMutation.isPending}
              >
                Generate Next Update
              </Button>
            </div>

            {trackingLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : orderTracking.length > 0 ? (
              <div className="space-y-4">
                {orderTracking.map((tracking, index) => (
                  <div key={tracking.id} className="flex gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-buylock-primary text-white' : 'bg-gray-200'
                    }`}>
                      {index === 0 ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-900">{tracking.status}</h5>
                      <p className="text-sm text-gray-600 mt-1">{tracking.description}</p>
                      {tracking.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{tracking.location}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tracking.timestamp && format(new Date(tracking.timestamp), "MMM dd, h:mm a")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No tracking information available yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}