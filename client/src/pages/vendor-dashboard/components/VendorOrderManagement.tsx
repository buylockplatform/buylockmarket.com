import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getVendorQueryFn, vendorApiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Package, Clock, CheckCircle, Truck, MapPin, DollarSign, User, Calendar, MessageCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import OrderWorkflow from "./OrderWorkflow";

interface Order {
  id: string;
  userId: string;
  vendorId: string;
  status: string;
  totalAmount: number;
  deliveryAddress: string;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  vendorNotes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  vendorAcceptedAt?: string;
  deliveryPickupAt?: string;
  orderType: 'product' | 'service';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  orderItems?: any[];
}

interface VendorOrderManagementProps {
  vendorId: string;
}

export default function VendorOrderManagement({ vendorId }: VendorOrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [vendorNotes, setVendorNotes] = useState('');
  const [activeTab, setActiveTab] = useState('paid');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use React Query for automatic cache management and real-time updates
  const { data: orders = [], isLoading: loading } = useQuery<Order[]>({
    queryKey: [`/api/vendor/${vendorId}/orders`],
    queryFn: getVendorQueryFn({ on401: "returnNull" }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchOnWindowFocus: true, // Refresh when user returns to tab
  });

  // Simplified order filtering for new workflow
  const paidOrders = orders.filter(order => order.status === 'paid');
  const readyOrders = orders.filter(order => order.status === 'ready_for_pickup');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');
  const completedOrders = orders.filter(order => order.status === 'completed');

  // Simplified vendor actions for new workflow
  const cancelOrder = async (orderId: string) => {
    try {
      await vendorApiRequest(`/api/vendor/orders/${orderId}/cancel`, 'POST', {});
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/orders`] });
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markReadyForPickup = async (orderId: string) => {
    try {
      await vendorApiRequest(`/api/vendor/orders/${orderId}/ready`, 'POST', {});
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/orders`] });
      toast({
        title: "Order Ready",
        description: "Order marked as ready for pickup. Courier has been notified.",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to mark order ready. Please try again.",
        variant: "destructive",
      });
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      await vendorApiRequest(`/api/vendor/orders/${orderId}/accept`, 'POST', { vendorNotes });
      
      // Invalidate and refetch orders cache
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/orders`] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/pickup-orders'] });
      toast({
        title: "Success",
        description: "Order accepted successfully",
      });
      setVendorNotes('');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: "Error",
        description: "Failed to accept order",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      await vendorApiRequest(`/api/vendor/orders/${orderId}/update-status`, 'POST', { status: newStatus, notes });
      // If marking as ready_for_pickup, automatically trigger delivery creation
      if (newStatus === 'ready_for_pickup') {
        try {
          await vendorApiRequest('/api/deliveries/create', 'POST', { orderId });
          toast({
            title: "Success",
            description: "Order marked as ready for pickup and delivery scheduled with courier",
          });
        } catch (deliveryError) {
          console.error('Error creating delivery:', deliveryError);
          toast({
            title: "Partial Success",
            description: "Order updated but courier scheduling failed. Please contact admin.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        });
      }
      
      // Invalidate and refetch orders cache
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorId}/orders`] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/pickup-orders'] });
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'vendor_accepted':
        return 'default';
      case 'packing':
        return 'default';
      case 'ready_for_pickup':
        return 'default';
      case 'passed_to_delivery':
        return 'default';
      case 'delivered':
        return 'default';
      case 'doing':
        return 'default';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'vendor_accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'packing':
        return <Package className="h-4 w-4" />;
      case 'ready_for_pickup':
        return <Truck className="h-4 w-4" />;
      case 'passed_to_delivery':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'doing':
        return <Package className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              {formatStatusLabel(order.status)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {order.orderType}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-[#FF4605]">
              KES {order.totalAmount?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium">
                {order.user?.firstName} {order.user?.lastName} 
              </p>
              <p className="text-sm text-gray-500">{order.user?.email}</p>
            </div>
          </div>
          
          {order.deliveryAddress && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="text-sm">{order.deliveryAddress}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Payment</p>
              <p className="capitalize">{order.paymentMethod}</p>
              <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'} className="text-xs">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
          
          {order.trackingNumber && (
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Tracking</p>
                <p className="font-mono text-sm">{order.trackingNumber}</p>
              </div>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="mb-4">
            <Label className="text-sm font-medium">Customer Notes</Label>
            <p className="text-sm text-gray-600 mt-1">{order.notes}</p>
          </div>
        )}

        {order.vendorNotes && (
          <div className="mb-4">
            <Label className="text-sm font-medium">Vendor Notes</Label>
            <p className="text-sm text-gray-600 mt-1">{order.vendorNotes}</p>
          </div>
        )}

        {/* Simplified action buttons for new workflow */}
        <div className="flex gap-2 mt-4">
          {order.status === 'paid' && (
            <>
              <Button 
                onClick={() => cancelOrder(order.id)}
                variant="destructive"
                size="sm"
                data-testid={`button-cancel-${order.id}`}
              >
                Cancel Order
              </Button>
              <Button 
                onClick={() => markReadyForPickup(order.id)}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
                data-testid={`button-ready-${order.id}`}
              >
                Mark Ready for Pickup
              </Button>
            </>
          )}
          {order.status === 'ready_for_pickup' && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Ready for courier pickup
            </Badge>
          )}
          {order.status === 'cancelled' && (
            <Badge variant="destructive">
              Cancelled
            </Badge>
          )}
          {order.status === 'completed' && (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              Completed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FF4605]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
        <p className="text-gray-600">Manage your orders and fulfillment workflow</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            New ({paidOrders.length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Ready ({readyOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Cancelled ({cancelledOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paid" className="space-y-4">
          <div className="grid gap-4">
            {paidOrders.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No new orders</p>
                </CardContent>
              </Card>
            ) : (
              paidOrders.map(renderOrderCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
          <div className="grid gap-4">
            {readyOrders.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No orders ready for pickup</p>
                </CardContent>
              </Card>
            ) : (
              readyOrders.map(renderOrderCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <div className="grid gap-4">
            {cancelledOrders.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No cancelled orders</p>
                </CardContent>
              </Card>
            ) : (
              cancelledOrders.map(renderOrderCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {completedOrders.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-gray-500">No completed orders</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map(renderOrderCard)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}