import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowLeft,
  Loader2,
  MapPin,
  Clock,
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export default function Payment() {
  const [, setLocation] = useLocation();
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();

  // Get order details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const amount = urlParams.get('amount');

  // Fetch order details
  const { data: orderDetails, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch order details");
      return response.json();
    },
    enabled: !!orderId && !!isAuthenticated,
  });

  // Fetch Paystack config
  const { data: paymentConfig } = useQuery({
    queryKey: ["/api/payments/config"],
    queryFn: async () => {
      const response = await fetch("/api/payments/config");
      if (!response.ok) throw new Error("Failed to fetch payment config");
      return response.json();
    },
  });

  // Payment verification mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ reference, orderId }: { reference: string; orderId: string }) => {
      return apiRequest("/api/payments/verify", "POST", {
        reference,
        orderId,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Payment successful!",
        description: "Your service has been booked successfully. Redirecting to your orders...",
      });
      
      // Redirect to orders page after 2 seconds
      setTimeout(() => {
        setLocation("/my-orders");
      }, 2000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      
      toast({
        title: "Payment verification failed",
        description: error.message || "There was an issue verifying your payment. Please contact support.",
        variant: "destructive",
      });
    },
  });

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => setIsPaystackLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const handlePayment = async () => {
    if (!isPaystackLoaded || !window.PaystackPop) {
      toast({
        title: "Payment system loading",
        description: "Please wait for the payment system to load and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: "Email required",
        description: "Please ensure your profile has a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);

    if (!paymentConfig?.publicKey) {
      toast({
        title: "Payment system error",
        description: "Unable to load payment configuration. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
      return;
    }

    // Validate Paystack public key format
    if (!paymentConfig.publicKey.startsWith('pk_test_') && !paymentConfig.publicKey.startsWith('pk_live_')) {
      toast({
        title: "Payment configuration error",
        description: "Invalid Paystack public key format. Please contact support.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
      return;
    }
    
    const handler = window.PaystackPop.setup({
      key: paymentConfig.publicKey,
      email: user.email,
      amount: parseInt(amount!) * 100, // Convert to kobo (smallest currency unit)
      ref: `BL_${orderId}_${Date.now()}`,
      currency: 'KES',
      metadata: {
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId
          },
          {
            display_name: "Service Type",
            variable_name: "service_type",
            value: "service_booking"
          }
        ]
      },
      callback: function(response: any) {
        setIsProcessingPayment(false);
        // Verify payment on the backend
        if (response && response.reference) {
          verifyPaymentMutation.mutate({
            reference: response.reference,
            orderId: orderId!,
          });
        } else {
          toast({
            title: "Payment error",
            description: "Payment response is incomplete. Please contact support.",
            variant: "destructive",
          });
        }
      },
      onClose: function() {
        setIsProcessingPayment(false);
        toast({
          title: "Payment cancelled",
          description: "You can continue the payment process anytime from your orders.",
        });
      }
    });

    handler.openIframe();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-8">Please log in to access payment</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Log In
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!orderId || !amount) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Payment Link</h1>
          <p className="text-gray-600 mb-8">The payment link is invalid or expired.</p>
          <Button onClick={() => setLocation("/")}>
            Return Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading payment details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Service Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {orderDetails?.orderItems?.map((item: any) => (
                  <div key={item.id} className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{item.duration} hours</span>
                        </div>
                        {item.appointmentDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(item.appointmentDate).toLocaleDateString()} at {item.appointmentTime}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service Location */}
                    {item.serviceAddress && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Service Location</h4>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <span>{item.serviceAddress}</span>
                        </div>
                        {item.serviceLatitude && item.serviceLongitude && (
                          <p className="text-xs text-green-600 ml-6">
                            GPS: {item.serviceLatitude?.toFixed(6)}, {item.serviceLongitude?.toFixed(6)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Service Instructions */}
                    {item.serviceInstructions && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Service Instructions</h4>
                        <div className="p-3 bg-blue-50 rounded text-sm">
                          {item.serviceInstructions}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    {item.serviceNotes && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Additional Notes</h4>
                        <div className="p-3 bg-gray-50 rounded text-sm">
                          {item.serviceNotes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Separator />

                {/* Total Amount */}
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-buylock-primary">{formatPrice(amount)}</span>
                </div>

                {/* Order Status */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending Payment
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Complete Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Paying as: {user?.email}</span>
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">Amount to Pay:</span>
                    <span className="text-2xl font-bold text-green-700">
                      {formatPrice(amount)}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Secure payment processed by Paystack
                  </p>
                </div>

                {/* Security Info */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Secure Payment</p>
                    <p className="text-blue-700">
                      Your payment is secured with 256-bit SSL encryption. We accept all major cards and mobile money.
                    </p>
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  className="w-full bg-buylock-primary hover:bg-buylock-primary/90"
                  size="lg"
                  onClick={handlePayment}
                  disabled={!isPaystackLoaded || isProcessingPayment || verifyPaymentMutation.isPending}
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : verifyPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying Payment...
                    </>
                  ) : !isPaystackLoaded ? (
                    "Loading Payment System..."
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Pay {formatPrice(amount)}
                    </>
                  )}
                </Button>

                {/* Payment Methods */}
                <div className="text-center text-sm text-gray-600">
                  <p>Accepts: Cards • Mobile Money • Bank Transfer</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}