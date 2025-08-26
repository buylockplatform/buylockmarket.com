import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle, 
  XCircle, 
  Package, 
  AlertTriangle,
  Star,
  Calendar,
  MapPin,
  User
} from "lucide-react";

interface OrderDetails {
  id: string;
  status: string;
  orderType: string;
  totalAmount: number;
  vendorName?: string;
  deliveryAddress?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    appointmentDate?: string;
    appointmentTime?: string;
    serviceLocation?: string;
  }>;
  createdAt: string;
}

export default function DeliveryConfirmation() {
  const { token } = useParams<{ token: string }>();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split('?')[1]);
  const action = urlParams.get('action'); // 'confirm' or 'dispute'
  
  const [disputeReason, setDisputeReason] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionType, setSubmissionType] = useState<'confirmed' | 'disputed' | null>(null);

  // Fetch order details using the token
  const { data: orderDetails, isLoading, error } = useQuery({
    queryKey: ['/api/orders/confirm', token],
    enabled: !!token,
    retry: false,
  });

  // Confirmation mutation
  const confirmMutation = useMutation({
    mutationFn: async (data: { action: 'confirm' | 'dispute'; reason?: string }) => {
      return await apiRequest(`/api/orders/confirm/${token}`, 'POST', data);
    },
    onSuccess: (_, variables) => {
      setIsSubmitted(true);
      setSubmissionType(variables.action === 'confirm' ? 'confirmed' : 'disputed');
    },
  });

  // Auto-submit if action is provided in URL
  useEffect(() => {
    if (action && orderDetails && !isSubmitted && !confirmMutation.isPending) {
      if (action === 'confirm') {
        confirmMutation.mutate({ action: 'confirm' });
      }
      // For dispute, we'll show the form first
    }
  }, [action, orderDetails, isSubmitted]);

  const handleConfirm = () => {
    confirmMutation.mutate({ action: 'confirm' });
  };

  const handleDispute = () => {
    if (!disputeReason.trim()) {
      return;
    }
    confirmMutation.mutate({ 
      action: 'dispute', 
      reason: disputeReason 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600">
              This confirmation link is invalid or has expired. Please contact support if you need assistance.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/'}>
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            {submissionType === 'confirmed' ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {orderDetails.orderType === 'service' ? 'Service' : 'Delivery'} Confirmed!
                </h2>
                <p className="text-gray-600 mb-4">
                  Thank you for confirming your {orderDetails.orderType === 'service' ? 'service completion' : 'delivery'}. 
                  The vendor will be notified and payment will be processed.
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Issue Reported</h2>
                <p className="text-gray-600 mb-4">
                  We've received your dispute report. Our support team will review the issue 
                  and contact you within 24 hours to resolve it.
                </p>
              </>
            )}
            <Button onClick={() => window.location.href = '/orders'} className="w-full">
              View My Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const order = orderDetails as OrderDetails;
  const isService = order.orderType === 'service';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Confirm Your {isService ? 'Service' : 'Delivery'}
          </h1>
          <p className="text-gray-600">
            Please review your order and confirm that everything was completed satisfactorily
          </p>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order #{order.id.slice(0, 8).toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant="secondary">{order.status}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-semibold">KES {order.totalAmount.toLocaleString()}</p>
              </div>
              {order.vendorName && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{isService ? 'Service Provider' : 'Vendor'}</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {order.vendorName}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Order Date</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Delivery/Service Address */}
            {(order.deliveryAddress || order.items[0]?.serviceLocation) && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  {isService ? 'Service Location' : 'Delivery Address'}
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                  {order.deliveryAddress || order.items[0]?.serviceLocation}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Items</p>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.appointmentDate && (
                        <p className="text-sm text-gray-500">
                          {new Date(item.appointmentDate).toLocaleDateString()} at {item.appointmentTime}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.quantity}x KES {item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action prompted by dispute URL parameter */}
        {action === 'dispute' && !isSubmitted && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Report an Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Please describe the issue you experienced with your {isService ? 'service' : 'delivery'}:
              </p>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleDispute}
                disabled={!disputeReason.trim() || confirmMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {confirmMutation.isPending ? 'Submitting...' : 'Submit Issue Report'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmation Actions - only show if no URL action */}
        {!action && !isSubmitted && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  How was your {isService ? 'service experience' : 'delivery'}?
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleConfirm}
                    disabled={confirmMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    size="lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {confirmMutation.isPending ? 'Confirming...' : 
                     `Confirm ${isService ? 'Service' : 'Delivery'}`}
                  </Button>
                  
                  <Button
                    onClick={() => setSubmissionType('disputed')}
                    variant="destructive"
                    className="flex items-center gap-2"
                    size="lg"
                  >
                    <XCircle className="w-5 h-5" />
                    Report Issue
                  </Button>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    By confirming, you acknowledge that your {isService ? 'service was completed' : 'order was delivered'} 
                    satisfactorily. Payment will be processed to the {isService ? 'service provider' : 'vendor'}.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dispute Form - shown when "Report Issue" is clicked */}
        {submissionType === 'disputed' && !action && !isSubmitted && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="w-5 h-5" />
                Report an Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We're sorry to hear there was an issue. Please provide details so we can help resolve it:
              </p>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleDispute}
                  disabled={!disputeReason.trim() || confirmMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {confirmMutation.isPending ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button
                  onClick={() => setSubmissionType(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}