import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Truck,
  Package,
  ArrowRight,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

interface Order {
  id: string;
  status: string;
  totalAmount: string;
  deliveryAddress: string;
  deliveryFee: string;
  courierId?: string;
  courierName?: string;
  trackingNumber?: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    productName?: string;
    serviceName?: string;
    quantity: number;
    price: string;
  }>;
}

interface DeliveryProvider {
  id: string;
  name: string;
  type: string;
  estimatedDeliveryTime: string;
}

export default function TestDeliveryWorkflow() {
  const [testOrderId, setTestOrderId] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get delivery providers
  const { data: providers = [] } = useQuery<DeliveryProvider[]>({
    queryKey: ['/api/delivery/providers'],
  });

  // Get test orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchInterval: 2000, // Auto refresh every 2 seconds
  });

  // Create test order mutation
  const createTestOrderMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/orders/test', {
        method: 'POST',
        body: {
          vendorId: '74bf6c33-7f09-4844-903d-72bff3849c95',
          customerId: '37410516',
          totalAmount: Math.floor(Math.random() * 5000 + 500).toString() + '.00',
          deliveryFee: '150.00',
          deliveryAddress: 'Nairobi CBD, Kenya - Test Address',
          status: 'paid',
          orderItems: [
            {
              productId: '82c07c4e-70f2-4c1d-b688-57df2b234567',
              quantity: 1,
              price: Math.floor(Math.random() * 3000 + 300).toString() + '.00'
            }
          ]
        },
      });
    },
    onSuccess: (newOrder) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setTestOrderId(newOrder.id);
      toast({
        title: "Test Order Created",
        description: `Order ${newOrder.id.slice(-8)} created successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test order",
        variant: "destructive",
      });
    },
  });

  // Confirm order mutation
  const confirmOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest(`/api/orders/${orderId}/confirm`, {
        method: 'POST',
        body: { vendorNotes: 'Test order confirmed via delivery workflow demo' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "Order Confirmed",
        description: "Order has been confirmed and is ready for dispatch",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm order",
        variant: "destructive",
      });
    },
  });

  // Dispatch order mutation
  const dispatchOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string; providerId: string; trackingId?: string }) => {
      return await apiRequest(`/api/orders/${data.orderId}/dispatch`, {
        method: 'POST',
        body: {
          providerId: data.providerId,
          trackingId: data.trackingId || undefined
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "Order Dispatched",
        description: "Order has been assigned to courier for delivery",
      });
      setSelectedProvider('');
      setTrackingId('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to dispatch order",
        variant: "destructive",
      });
    },
  });

  // Update delivery status mutation
  const updateDeliveryStatusMutation = useMutation({
    mutationFn: async (data: { orderId: string; status: string }) => {
      return await apiRequest(`/api/orders/${data.orderId}/delivery-status`, {
        method: 'POST',
        body: { status: data.status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "Status Updated",
        description: "Order delivery status updated successfully",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'awaiting_dispatch':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'awaiting_dispatch':
        return <Package className="w-4 h-4" />;
      case 'in_delivery':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'paid':
        return 'confirmed';
      case 'confirmed':
        return 'awaiting_dispatch';
      case 'awaiting_dispatch':
        return 'in_delivery';
      case 'in_delivery':
        return 'delivered';
      default:
        return null;
    }
  };

  const getActionLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'paid':
        return 'Confirm Order';
      case 'confirmed':
        return 'Dispatch Order';
      case 'awaiting_dispatch':
        return 'Mark In Delivery';
      case 'in_delivery':
        return 'Mark Delivered';
      default:
        return 'Complete';
    }
  };

  const testOrders = orders.slice(0, 3); // Show only recent test orders

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delivery Workflow Testing
          </h1>
          <p className="text-gray-600">
            Demonstrate the sophisticated delivery workflow: Paid → Confirmed → Awaiting Dispatch → In Delivery → Delivered
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Workflow Control Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Button
                onClick={() => createTestOrderMutation.mutate()}
                disabled={createTestOrderMutation.isPending}
                className="flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>
                  {createTestOrderMutation.isPending ? 'Creating...' : 'Create Test Order'}
                </span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
                }}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Refresh Orders</span>
              </Button>
            </div>

            {testOrders.length > 0 && (
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">Active Test Orders</h4>
                <div className="space-y-2">
                  {testOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">
                        Order #{order.id.slice(-8)} - KES {Number(order.totalAmount).toLocaleString()}
                      </span>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{order.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Demonstration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testOrders.map((order) => (
            <Card key={order.id} className="">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(-8)}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status.replace('_', ' ')}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Amount</span>
                    <p className="font-medium">KES {Number(order.totalAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Fee</span>
                    <p className="font-medium">KES {Number(order.deliveryFee).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address</span>
                    <p className="font-medium text-xs">{order.deliveryAddress}</p>
                  </div>
                </div>

                {/* Workflow Progress */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Workflow Progress</h4>
                  <div className="space-y-2">
                    {['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].map((status, index) => (
                      <div key={status} className={`flex items-center space-x-3 p-2 rounded-lg ${
                        order.status === status ? 'bg-buylock-primary/10 border border-buylock-primary' :
                        ['confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].includes(order.status) && 
                        ['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery'].includes(status) &&
                        ['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].indexOf(status) < 
                        ['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].indexOf(order.status)
                        ? 'bg-green-50 border border-green-200' :
                        'bg-gray-50 border border-gray-200'
                      }`}>
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          ['confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].includes(order.status) && 
                          ['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery'].includes(status) &&
                          ['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].indexOf(status) < 
                          ['paid', 'confirmed', 'awaiting_dispatch', 'in_delivery', 'delivered'].indexOf(order.status)
                          ? 'bg-green-500 text-white' :
                          order.status === status ? 'bg-buylock-primary text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-xs capitalize">
                            {status.replace('_', ' ')}
                          </div>
                        </div>
                        {order.status === status && (
                          <ArrowRight className="w-4 h-4 text-buylock-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {order.status !== 'delivered' && (
                  <div className="space-y-3">
                    {order.status === 'paid' && (
                      <Button 
                        onClick={() => confirmOrderMutation.mutate(order.id)}
                        disabled={confirmOrderMutation.isPending}
                        className="w-full"
                      >
                        {confirmOrderMutation.isPending ? 'Confirming...' : 'Confirm Order'}
                      </Button>
                    )}

                    {order.status === 'confirmed' && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`provider-${order.id}`} className="text-xs">Courier</Label>
                            <Select 
                              value={selectedProvider} 
                              onValueChange={setSelectedProvider}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select courier" />
                              </SelectTrigger>
                              <SelectContent>
                                {providers.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`tracking-${order.id}`} className="text-xs">Tracking</Label>
                            <Input
                              id={`tracking-${order.id}`}
                              value={trackingId}
                              onChange={(e) => setTrackingId(e.target.value)}
                              placeholder="Optional"
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => dispatchOrderMutation.mutate({ 
                            orderId: order.id, 
                            providerId: selectedProvider,
                            trackingId: trackingId || undefined
                          })}
                          disabled={dispatchOrderMutation.isPending || !selectedProvider}
                          className="w-full"
                        >
                          {dispatchOrderMutation.isPending ? 'Dispatching...' : 'Dispatch Order'}
                        </Button>
                      </div>
                    )}

                    {(order.status === 'awaiting_dispatch' || order.status === 'in_delivery') && (
                      <Button 
                        onClick={() => updateDeliveryStatusMutation.mutate({ 
                          orderId: order.id, 
                          status: getNextStatus(order.status)! 
                        })}
                        disabled={updateDeliveryStatusMutation.isPending}
                        className="w-full"
                      >
                        {updateDeliveryStatusMutation.isPending ? 'Updating...' : getActionLabel(order.status)}
                      </Button>
                    )}
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-green-800 font-medium text-sm">Order Completed!</p>
                    <p className="text-green-600 text-xs">Workflow demonstration successful</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Courier Status */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Active Delivery Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {providers.map((provider) => (
                <div key={provider.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{provider.name}</span>
                    <Badge variant={provider.type === 'dispatch' ? 'default' : 'secondary'}>
                      {provider.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{provider.estimatedDeliveryTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}