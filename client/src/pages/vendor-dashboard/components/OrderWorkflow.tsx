import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Package, Truck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { vendorApiRequest } from "@/lib/queryClient";

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

interface DeliveryProvider {
  id: string;
  name: string;
  estimatedDeliveryTime: string;
}

interface OrderWorkflowProps {
  order: Order;
  deliveryProviders: DeliveryProvider[];
}

export default function OrderWorkflow({ order }: OrderWorkflowProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateOrderStatusMutation = useMutation({
    mutationFn: async (data: { 
      orderId: string; 
      status: string; 
      notes?: string;
    }) => {
      return await vendorApiRequest(
        `/api/vendor/orders/${data.orderId}/update-status`,
        'POST',
        { 
          status: data.status,
          notes: data.notes 
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/74bf6c33-7f09-4844-903d-72bff3849c95/orders'] });
      toast({
        title: "Order Status Updated",
        description: "Order status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const currentStatus = order.status;
  
  return (
    <div className="mt-4">
      {/* Simple Accept Button for Paid Orders */}
      {currentStatus === 'paid' && (
        <Button 
          onClick={() => updateOrderStatusMutation.mutate({ 
            orderId: order.id, 
            status: 'confirmed'
          })}
          disabled={updateOrderStatusMutation.isPending}
          className="w-full bg-[#FF4605] hover:bg-[#E63E05]"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {updateOrderStatusMutation.isPending ? 'Confirming...' : 'Accept & Confirm Order'}
        </Button>
      )}

      {/* Status dropdown for confirmed orders */}
      {currentStatus === 'confirmed' && (
        <div className="space-y-4">
          <div className="text-center py-2 text-green-600">
            <CheckCircle className="w-6 h-6 mx-auto mb-1" />
            <p className="font-medium text-sm">Order Confirmed Successfully</p>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium">Update Order Status:</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                <SelectItem value="picked_up">Product Picked Up</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedStatus && (
              <Button 
                onClick={() => {
                  let newStatus = selectedStatus;
                  let statusMessage = '';
                  
                  if (selectedStatus === 'ready_for_pickup') {
                    newStatus = 'ready_for_pickup';
                    statusMessage = 'Order is ready for courier pickup';
                  } else if (selectedStatus === 'picked_up') {
                    newStatus = 'forwarded_to_delivery';
                    statusMessage = 'Product has been forwarded to delivery service';
                  }
                  
                  updateOrderStatusMutation.mutate({
                    orderId: order.id,
                    status: newStatus,
                    notes: statusMessage
                  });
                }}
                disabled={updateOrderStatusMutation.isPending}
                className="w-full bg-[#FF4605] hover:bg-[#E63E05]"
              >
                {selectedStatus === 'ready_for_pickup' && <CheckCircle className="w-4 h-4 mr-2" />}
                {selectedStatus === 'picked_up' && <Truck className="w-4 h-4 mr-2" />}
                {updateOrderStatusMutation.isPending ? 'Updating...' : `Update to ${selectedStatus.replace('_', ' ')}`}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Status messages for other states */}
      {currentStatus === 'packaging' && (
        <div className="text-center py-4 text-blue-600">
          <Package className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Order is Being Prepared</p>
        </div>
      )}

      {currentStatus === 'ready_for_pickup' && (
        <div className="text-center py-4 text-orange-600">
          <CheckCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Order Ready for Pickup</p>
          <p className="text-sm text-gray-500">Waiting for courier to collect</p>
        </div>
      )}

      {currentStatus === 'forwarded_to_delivery' && (
        <div className="text-center py-4 text-purple-600">
          <Truck className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Product Forwarded to Delivery Service</p>
          <p className="text-sm text-gray-500">Order is now with the courier</p>
        </div>
      )}
    </div>
  );
}