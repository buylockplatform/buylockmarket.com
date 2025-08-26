import { useState, useEffect } from "react";
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
import { Truck, Package, Clock, MapPin, Phone, CheckCircle, AlertCircle } from "lucide-react";
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
  deliveryAddress: string;
  totalAmount: string;
  courierName?: string;
  courierId?: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function DeliveryPortal() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [pickupInstructions, setPickupInstructions] = useState<string>("");
  const [showInstructionsDialog, setShowInstructionsDialog] = useState<string | null>(null);
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

  const createDeliveryMutation = useMutation({
    mutationFn: async (data: { 
      orderId: string; 
      providerId: string;
      pickupInstructions?: string;
    }) => {
      return await apiRequest('/api/deliveries/create', 'POST', {
        orderId: data.orderId,
        providerId: data.providerId,
        pickupInstructions: data.pickupInstructions,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries/pickup-orders'] });
      
      const courier = providers?.find(p => p.id === variables.providerId);
      const courierName = courier?.name || 'Selected courier';
      const estimatedTime = courier?.estimatedDeliveryTime || '2-4 hours';
      
      toast({
        title: "Pickup Requested Successfully! 🚚",
        description: `${courierName} has been notified. Expected pickup within ${estimatedTime}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign order to courier",
        variant: "destructive",
      });
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async (data: { 
      deliveryId: string; 
      status: string; 
      description?: string; 
      trackingId?: string;
    }) => {
      return await apiRequest(`/api/deliveries/${data.deliveryId}/status`, 'PUT', {
        status: data.status,
        description: data.description,
        trackingId: data.trackingId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deliveries'] });
      toast({
        title: "Success",
        description: "Delivery status updated successfully",
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

  const filteredDeliveries = deliveries?.filter(delivery => 
    selectedStatus === "all" || delivery.status === selectedStatus
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'pickup_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'picked_up':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">Loading delivery portal...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="w-8 h-8 text-buylock-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Portal</h1>
              <p className="text-gray-600">Manage deliveries and dispatch operations</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {filteredDeliveries.length} Deliveries
          </Badge>
        </div>

        {/* Orders Ready for Pickup */}
        {pickupOrders && pickupOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-orange-600" />
                <span>Orders Ready for Pickup ({pickupOrders.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pickupOrders.map((order) => (
                  <div key={order.id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Order #{order.trackingNumber}</h4>
                      <Badge className="bg-orange-100 text-orange-800">Ready</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>KES {parseFloat(order.totalAmount).toLocaleString()}</span>
                      </div>
                      {order.user && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{order.user.firstName} {order.user.lastName}</span>
                        </div>
                      )}
                      {(() => {
                        // Use assigned courier or default to Fargo courier
                        const courierId = order.courierId || 'fargo-courier';
                        const courier = providers?.find(p => p.id === courierId);
                        const courierName = order.courierName || courier?.name || 'Fargo Courier Services';
                        
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-4 h-4" />
                              <span className="font-medium">Courier: {courierName}</span>
                            </div>
                            {courier && (
                              <div className="ml-6 space-y-1 text-xs text-gray-500">
                                <div>📞 {courier.contactPhone || 'Contact via platform'}</div>
                                <div>📧 {courier.contactEmail || 'orders@buylock.co.ke'}</div>
                                <div>⏱️ ETA: {courier.estimatedDeliveryTime || '2-4 hours'}</div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <Button 
                      onClick={() => {
                        setShowInstructionsDialog(order.id);
                        setPickupInstructions("");
                      }}
                      disabled={createDeliveryMutation.isPending}
                      className="w-full bg-[#FF4605] hover:bg-[#E63E05] text-white"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {createDeliveryMutation.isPending ? 'Requesting...' : 
                        `Request ${order.courierName || providers?.find(p => p.id === (order.courierId || 'fargo-courier'))?.name || 'Fargo Courier Services'} Pickup`}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deliveries</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Deliveries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order {delivery.orderId.slice(-8)}</CardTitle>
                  <Badge className={getStatusColor(delivery.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(delivery.status)}
                      <span className="capitalize">{delivery.status.replace('_', ' ')}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span>{delivery.packageDescription}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{delivery.deliveryAddress}</span>
                  </div>
                  {delivery.customerPhone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{delivery.customerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Delivery Fee</p>
                    <p className="font-medium">KES {Number(delivery.deliveryFee).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tracking ID</p>
                    <p className="font-medium text-xs">
                      {delivery.externalTrackingId || 'Not assigned'}
                    </p>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      Manage Delivery
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Delivery Status</DialogTitle>
                    </DialogHeader>
                    <DeliveryUpdateForm 
                      delivery={delivery}
                      onUpdate={(status, description, trackingId) => {
                        updateDeliveryMutation.mutate({
                          deliveryId: delivery.id,
                          status,
                          description,
                          trackingId,
                        });
                      }}
                      isLoading={updateDeliveryMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDeliveries.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
              <p className="text-gray-500">
                {selectedStatus === "all" 
                  ? "No deliveries available in the system" 
                  : `No deliveries with status: ${selectedStatus.replace('_', ' ')}`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dispatch Service Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="w-5 h-5" />
              <span>Dispatch Service</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Internal dispatch operations for BuyLock delivery service. Orders assigned to our internal 
              dispatch service will appear here for processing.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredDeliveries.filter(d => d.providerId === 'dispatch_service').length}
                </div>
                <div className="text-sm text-blue-800">Dispatch Orders</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {filteredDeliveries.filter(d => d.providerId === 'dispatch_service' && d.status === 'delivered').length}
                </div>
                <div className="text-sm text-green-800">Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {filteredDeliveries.filter(d => d.providerId === 'dispatch_service' && ['pending', 'picked_up', 'in_transit'].includes(d.status)).length}
                </div>
                <div className="text-sm text-orange-800">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Instructions Dialog */}
        <Dialog open={showInstructionsDialog !== null} onOpenChange={(open) => !open && setShowInstructionsDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pickup Instructions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pickup-instructions">
                  Special Instructions for Courier (Optional)
                </Label>
                <Textarea
                  id="pickup-instructions"
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  placeholder="e.g., Call vendor first, use back entrance, package is fragile, pickup after 2 PM..."
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  These instructions will be included in the email sent to the courier.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInstructionsDialog(null)}
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showInstructionsDialog) {
                      const order = pickupOrders?.find(o => o.id === showInstructionsDialog);
                      if (order) {
                        const courierId = order.courierId || 'fargo-courier';
                        
                        createDeliveryMutation.mutate({
                          orderId: order.id,
                          providerId: courierId,
                          pickupInstructions: pickupInstructions.trim() || undefined
                        });
                      }
                      setShowInstructionsDialog(null);
                      setPickupInstructions("");
                    }
                  }}
                  disabled={createDeliveryMutation.isPending}
                  className="w-full bg-[#FF4605] hover:bg-[#E63E05] text-white"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  {createDeliveryMutation.isPending ? 'Requesting...' : 'Request Pickup'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface DeliveryUpdateFormProps {
  delivery: Delivery;
  onUpdate: (status: string, description?: string, trackingId?: string) => void;
  isLoading: boolean;
}

function DeliveryUpdateForm({ delivery, onUpdate, isLoading }: DeliveryUpdateFormProps) {
  const [status, setStatus] = useState(delivery.status);
  const [description, setDescription] = useState('');
  const [trackingId, setTrackingId] = useState(delivery.externalTrackingId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(status, description, trackingId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Delivery Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
            <SelectItem value="picked_up">Picked Up</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="trackingId">Tracking ID</Label>
        <Input
          id="trackingId"
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="Enter tracking ID from courier"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Update Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the status update..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Updating...' : 'Update Delivery Status'}
      </Button>
    </form>
  );
}