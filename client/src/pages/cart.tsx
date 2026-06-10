import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Plus, Trash2, ShoppingBag, Truck, CreditCard, MapPin, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useGuestCart } from "@/hooks/useGuestCart";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import type { CartItem, Product, Service, CustomerAddress } from "@shared/schema";
import { DEFAULT_COURIER_ID, DEFAULT_COURIER_NAME } from "@shared/deliveryStatuses";

interface CartItemWithDetails extends CartItem {
  product?: Product;
  service?: Service;
}

interface Courier {
  id: string;
  name: string;
  logo: string;
  baseRate: string;
  perKmRate: string;
  maxWeight: string;
  estimatedTime: string;
  coverage: string;
  phone: string;
  isActive: boolean;
}

interface CourierQuote {
  courierId: string;
  courierName: string;
  baseRate: number;
  distanceRate: number;
  weightMultiplier: number;
  estimatedDistance: number;
  distanceMethod?: "osrm" | "haversine";
  totalCost: number;
  isFreeDelivery?: boolean;
  estimatedTime: string;
  location: string;
}

export default function Cart() {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliverySuburb, setDeliverySuburb] = useState("");
  const [deliveryBuilding, setDeliveryBuilding] = useState("");
  const [deliveryPostalCode, setDeliveryPostalCode] = useState("");
  const [deliveryLat, setDeliveryLat] = useState<string | null>(null);
  const [deliveryLng, setDeliveryLng] = useState<string | null>(null);
  const [courierQuote, setCourierQuote] = useState<CourierQuote | null>(null);
  const [showCourierSelection, setShowCourierSelection] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>("");
  const [paymentVerificationAttempted, setPaymentVerificationAttempted] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { guestCartItems, updateGuestCartItem, removeFromGuestCart, clearGuestCart, getGuestCartTotal } = useGuestCart();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();



  const { data: authCartItems = [], isLoading } = useQuery<CartItemWithDetails[]>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
  });

  // Use either authenticated cart or guest cart
  const cartItems = isAuthenticated ? authCartItems : guestCartItems;

  // Check if cart contains only services (hide delivery for services-only carts)
  const hasProducts = cartItems.some(item => item.product);
  const hasOnlyServices = cartItems.length > 0 && !hasProducts;

  const primaryVendorId = useMemo(() => {
    const productItem = cartItems.find((item) => item.product?.vendorId);
    return productItem?.product?.vendorId ?? null;
  }, [cartItems]);

  const { data: couriers = [] } = useQuery<Courier[]>({
    queryKey: ["/api/couriers"],
    enabled: isAuthenticated,
  });

  const { data: savedAddresses = [] } = useQuery<CustomerAddress[]>({
    queryKey: ["/api/user/addresses"],
    enabled: isAuthenticated,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiRequest(`/api/cart/${id}`, "PATCH", { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/cart/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/cart", "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    },
  });

  const initializePaymentMutation = useMutation({
    mutationFn: async () => {
      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        serviceId: item.serviceId,
        quantity: item.quantity,
        price: item.product?.price || item.service?.price || "0",
        name: item.product?.name || item.service?.name || "Unknown Item",
      }));

      const response = await apiRequest("/api/payments/initialize", "POST", {
        amount: calculateTotal(),
        email: user?.email || "customer@buylock.com",
        deliveryAddress: deliveryAddress || "Default address",
        deliveryCity: deliveryCity,
        deliverySuburb: deliverySuburb,
        deliveryBuilding: deliveryBuilding,
        deliveryPostalCode: deliveryPostalCode,
        deliveryAddressId: selectedSavedAddressId || null,
        deliveryLat: deliveryLat,
        deliveryLng: deliveryLng,
        notes,
        items: orderItems,
        courierId: DEFAULT_COURIER_ID,
        courierName: DEFAULT_COURIER_NAME,
        estimatedDeliveryTime: courierQuote?.estimatedTime,
        deliveryFee: courierQuote?.totalCost.toString(),
      });
      return response;
    },
    onSuccess: (result: any) => {
      // Paystack payment initialization succeeded, redirect to payment page
      console.log('Redirecting to Paystack:', result);
      if (result.authorization_url) {
        // Store reference for pending payment checking
        if (result.reference) {
          localStorage.setItem('pending_payment_reference', result.reference);
          localStorage.setItem('last_payment_time', Date.now().toString());
        }
        window.location.href = result.authorization_url;
      } else {
        console.error('No authorization URL received:', result);
        toast({
          title: "Payment initialization failed",
          description: "No payment URL received. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Failed to process your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const response = await apiRequest("/api/payments/verify", "POST", {
        reference,
      });
      return response;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      // Invalidate all vendor queries using predicate
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey?.[0];
          return typeof key === 'string' && key.startsWith('/api/vendor/');
        }
      });

      if (result.success) {
        // Clear pending payment reference
        localStorage.removeItem('pending_payment_reference');

        toast({
          title: "Payment Successful!",
          description: `Your order has been confirmed. Redirecting to your orders...`,
        });
        setTimeout(() => {
          navigate("/my-orders");
        }, 1500);
      } else {
        // Handle different payment statuses
        if (result.status === 'abandoned') {
          toast({
            title: "Payment Incomplete",
            description: "Your payment was not completed. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Failed",
            description: result.message || "Payment could not be verified",
            variant: "destructive",
          });
        }
        localStorage.removeItem('pending_payment_reference');
      }
    },
    onError: (error) => {
      console.error('Payment verification error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again to verify payment",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      toast({
        title: "Payment verification failed",
        description: "Please contact support if you were charged.",
        variant: "destructive",
      });
    },
  });

  // Check for payment return from Paystack (single attempt)
  useEffect(() => {
    if (paymentVerificationAttempted) return;

    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const status = urlParams.get('status');
    const paymentStatus = urlParams.get('payment');

    // Only process if we have recent payment parameters (within last 5 minutes)
    const lastPaymentTime = localStorage.getItem('last_payment_time');
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    const isRecentPayment = lastPaymentTime && parseInt(lastPaymentTime) > fiveMinutesAgo;

    if (reference && status === 'returned' && isRecentPayment) {
      // Automatically verify payment when user returns from Paystack
      console.log('Payment return detected, verifying payment...');
      if (!isAuthenticated) {
        console.log('User not authenticated on return, redirecting to login');
        localStorage.setItem('pending_payment_reference', reference);
        toast({
          title: "Session expired",
          description: "Please log in to verify payment",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
        return;
      }
      setPaymentVerificationAttempted(true);
      verifyPaymentMutation.mutate(reference);

      // Clean up URL parameters and storage
      window.history.replaceState({}, document.title, '/cart');
      localStorage.removeItem('last_payment_time');
    } else if (paymentStatus === 'failed') {
      const message = urlParams.get('message') || 'Payment failed';
      toast({
        title: "Payment Failed",
        description: message,
        variant: "destructive",
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/cart');
    } else if (reference || status) {
      // Clean up old payment parameters that shouldn't trigger verification
      console.log('Cleaning up old payment parameters');
      window.history.replaceState({}, document.title, '/cart');
      localStorage.removeItem('pending_payment_reference');
    }
  }, [verifyPaymentMutation, paymentVerificationAttempted]);

  // Auto-retry payment verification for pending payments (once only)
  useEffect(() => {
    if (paymentVerificationAttempted) return;

    const checkPendingPayments = () => {
      const pendingReference = localStorage.getItem('pending_payment_reference');
      if (pendingReference) {
        if (!isAuthenticated) {
          console.log('User not authenticated, redirecting to login');
          toast({
            title: "Session expired",
            description: "Please log in to verify payment",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
          return;
        }
        console.log('Checking pending payment status:', pendingReference);
        setPaymentVerificationAttempted(true);
        verifyPaymentMutation.mutate(pendingReference);
      }
    };

    // Only check once on mount if not already attempted
    if (!paymentVerificationAttempted) {
      checkPendingPayments();
    }
  }, [isAuthenticated, verifyPaymentMutation, paymentVerificationAttempted]);

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: string) => {
    removeItemMutation.mutate(id);
  };

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.product?.price || item.service?.price || "0");
      return total + (price * (item.quantity || 1));
    }, 0);
  }, [cartItems]);

  const calculateSubtotal = () => cartSubtotal;

  const calculateWeight = () => {
    // Estimate weight based on items (simplified)
    return cartItems.reduce((total, item) => {
      const estimatedWeight = item.product ? 2 : 0.5; // Products ~2kg, services ~0.5kg
      return total + (estimatedWeight * (item.quantity || 1));
    }, 1); // Minimum 1kg
  };

  const deliveryFee = courierQuote ? courierQuote.totalCost : (hasOnlyServices ? 0 : 0);
  const calculateTotal = () => calculateSubtotal() + (hasOnlyServices ? 0 : deliveryFee);

  const calculateCourierCostMutation = useMutation({
    mutationFn: async ({
      courierId,
      location,
      lat,
      lng,
    }: {
      courierId: string;
      location: string;
      lat: string;
      lng: string;
    }) => {
      const response = await apiRequest("/api/couriers/calculate", "POST", {
        courierId,
        vendorId: primaryVendorId,
        location,
        city: deliveryCity,
        suburb: deliverySuburb,
        building: deliveryBuilding,
        postalCode: deliveryPostalCode,
        deliveryLat: lat,
        deliveryLng: lng,
        weight: calculateWeight(),
        orderSubtotal: calculateSubtotal(),
      });
      return response;
    },
    onSuccess: (result: CourierQuote) => {
      setCourierQuote({ ...result, courierId: DEFAULT_COURIER_ID, courierName: DEFAULT_COURIER_NAME });
      const distanceLabel = result.distanceMethod === "osrm" ? "road" : "estimated";
      toast({
        title: result.isFreeDelivery ? "Free delivery applied" : "Delivery cost calculated",
        description: result.isFreeDelivery
          ? "Your order qualifies for free delivery."
          : `${DEFAULT_COURIER_NAME}: ${formatPrice(result.totalCost)} (${result.estimatedDistance.toFixed(1)}km ${distanceLabel}, ${result.estimatedTime})`,
      });
    },
    onError: (error: any) => {
      setCourierQuote(null);
      let errorMessage = "Failed to calculate delivery cost";
      let title = "Error";

      if (error.code === 'INVALID_LOCATION') {
        title = "Invalid Location";
        errorMessage = "Could not validate this delivery location. Please check the city and suburb.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title,
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const requestDeliveryQuote = (
    location: string,
    lat?: string | null,
    lng?: string | null
  ) => {
    const resolvedLat = lat ?? deliveryLat;
    const resolvedLng = lng ?? deliveryLng;

    if (!resolvedLat || !resolvedLng) {
      toast({
        title: "Select a valid address",
        description: "Choose your delivery address from the location suggestions so we can calculate road distance.",
        variant: "destructive",
      });
      return;
    }
    if (!primaryVendorId) {
      toast({
        title: "Vendor location unavailable",
        description: "Could not determine the shop location for this cart.",
        variant: "destructive",
      });
      return;
    }
    calculateCourierCostMutation.mutate({
      courierId: DEFAULT_COURIER_ID,
      location,
      lat: resolvedLat,
      lng: resolvedLng,
    });
  };

  const handleCourierSelect = (courierId: string) => {
    setSelectedCourier(DEFAULT_COURIER_ID);
    if (deliveryAddress.trim() || deliverySuburb) {
      requestDeliveryQuote(deliveryAddress);
    } else {
      toast({
        title: "Enter delivery address first",
        description: "Please enter your delivery address to calculate courier costs",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "Delivery address required",
        description: "Please enter your delivery address",
        variant: "destructive",
      });
      return;
    }
    if (!deliveryCity.trim()) {
      toast({
        title: "City required",
        description: "Please enter your delivery city",
        variant: "destructive",
      });
      return;
    }
    if (!deliverySuburb.trim()) {
      toast({
        title: "Suburb/Area required",
        description: "Please enter your suburb or area",
        variant: "destructive",
      });
      return;
    }
    if (!selectedCourier) {
      toast({
        title: "Courier selection required",
        description: "Please select a courier for delivery",
        variant: "destructive",
      });
      return;
    }
    if (!courierQuote) {
      toast({
        title: "Calculate delivery cost",
        description: "Please wait for delivery cost calculation",
        variant: "destructive",
      });
      return;
    }
    initializePaymentMutation.mutate();
  };

  const handleSavedAddressSelect = (addressId: string) => {
    setSelectedSavedAddressId(addressId);
    if (!addressId) {
      setDeliveryLat(null);
      setDeliveryLng(null);
      return;
    }
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (!addr) return;
    setDeliveryAddress(addr.addressLine);
    setDeliveryCity(addr.city || "Nairobi");
    setDeliverySuburb(addr.suburb || "");
    setDeliveryBuilding(addr.building || "");
    setDeliveryPostalCode(addr.postalCode || "");
    const lat = addr.latitude?.toString() || null;
    const lng = addr.longitude?.toString() || null;
    setDeliveryLat(lat);
    setDeliveryLng(lng);
    if (lat && lng) {
      requestDeliveryQuote(addr.addressLine, lat, lng);
    }
  };

  // Product orders always use Buylock Delivery — ignore legacy Fargo courier IDs
  useEffect(() => {
    if (hasOnlyServices) return;
    setSelectedCourier(DEFAULT_COURIER_ID);
  }, [hasOnlyServices]);

  // Recalculate when subtotal changes (e.g. free-delivery threshold) after coords are known
  useEffect(() => {
    if (
      hasOnlyServices ||
      !deliveryAddress.trim() ||
      !deliveryLat ||
      !deliveryLng ||
      !primaryVendorId
    ) {
      return;
    }
    requestDeliveryQuote(deliveryAddress, deliveryLat, deliveryLng);
  }, [cartSubtotal]);



  // Check for payment verification on page load (single attempt)
  useEffect(() => {
    if (paymentVerificationAttempted) return;

    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');

    if (reference) {
      setPaymentVerificationAttempted(true);
      verifyPaymentMutation.mutate(reference);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [verifyPaymentMutation, paymentVerificationAttempted]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Please log in to view your cart</h1>
            <p className="text-gray-600 mb-6">You need to be logged in to access your shopping cart.</p>
            <Button
              onClick={() => window.location.href = "/login"}
              className="bg-buylock-primary hover:bg-buylock-primary/90"
            >
              Log In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          {cartItems && cartItems.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Clear Cart
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <Skeleton className="w-20 h-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-6 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products or services to get started!</p>
            <div className="flex justify-center space-x-4">
              <Link href="/products">
                <Button className="bg-buylock-primary hover:bg-buylock-primary/90">
                  Shop Products
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="outline" className="border-buylock-primary text-buylock-primary hover:bg-buylock-primary hover:text-white">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems && cartItems.map((item) => {
                const itemData = item.product || item.service;
                const isProduct = !!item.product;

                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <img
                          src={itemData?.imageUrl || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
                          alt={itemData?.name || "Item"}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{itemData?.name || "Unknown Item"}</h3>
                              <Badge variant="secondary" className="mt-1">
                                {isProduct ? "Product" : "Service"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {itemData?.description || itemData?.shortDescription || "No description available"}
                          </p>

                          {/* Service Appointment Details */}
                          {!isProduct && ((item as any).appointmentDate || (item as any).appointmentTime || (item as any).serviceLocation) && (
                            <div className="bg-blue-50 p-3 rounded-lg mb-3 space-y-1">
                              <h4 className="text-sm font-semibold text-blue-900">Appointment Details:</h4>
                              {(item as any).appointmentDate && (
                                <p className="text-sm text-blue-700">
                                  📅 Date: {new Date((item as any).appointmentDate).toLocaleDateString()}
                                </p>
                              )}
                              {(item as any).appointmentTime && (
                                <p className="text-sm text-blue-700">
                                  🕒 Time: {(item as any).appointmentTime}
                                </p>
                              )}
                              {(item as any).duration && (
                                <p className="text-sm text-blue-700">
                                  ⏱️ Duration: {(item as any).duration} hour{(item as any).duration !== 1 ? 's' : ''}
                                </p>
                              )}
                              {(item as any).serviceLocation && (
                                <p className="text-sm text-blue-700">
                                  📍 Location: {(item as any).serviceLocation}
                                </p>
                              )}
                              {(item as any).notes && (
                                <p className="text-sm text-blue-700">
                                  📝 Notes: {(item as any).notes}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            {/* Quantity controls - only show for products */}
                            <div className="flex items-center space-x-3">
                              {isProduct ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.id, (item.quantity || 1) - 1)}
                                    disabled={updateQuantityMutation.isPending || (item.quantity || 1) <= 1}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="font-semibold px-3">{item.quantity || 1}</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuantityChange(item.id, (item.quantity || 1) + 1)}
                                    disabled={updateQuantityMutation.isPending}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="outline" className="text-sm">
                                  Service Booking
                                </Badge>
                              )}
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-buylock-primary text-lg">
                                {formatPrice(parseFloat(itemData?.price || "0") * (item.quantity || 1))}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatPrice(itemData?.price || "0")} each
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({cartItems.length} items)</span>
                      <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
                    </div>

                    {/* Hide delivery fee for services-only carts */}
                    {!hasOnlyServices && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-semibold">
                          {courierQuote ? (
                            <div className="text-right">
                              <div>{formatPrice(courierQuote.totalCost)}</div>
                              <div className="text-xs text-gray-500">{DEFAULT_COURIER_NAME}</div>
                            </div>
                          ) : (
                            <span className="text-amber-600">Select courier</span>
                          )}
                        </span>
                      </div>
                    )}

                    {courierQuote && (
                      <div className="text-sm text-gray-600">
                        <p>Estimated time: {courierQuote.estimatedTime}</p>
                        <p>Distance: ~{courierQuote.estimatedDistance}km</p>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-buylock-primary">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information - Hidden for service-only carts */}
              {!hasOnlyServices && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Truck className="w-5 h-5 mr-2 text-buylock-primary" />
                      Delivery Information
                    </h3>

                    <div className="space-y-4">
                      {/* 1. Delivery Address Autocomplete */}
                      <div>
                        <LocationAutocomplete
                          label="Delivery Address"
                          placeholder="Start typing your address in Kenya..."
                          defaultValue={deliveryAddress}
                          required
                          onLocationSelect={(location) => {
                            setDeliveryAddress(location.address);
                            setDeliveryCity(location.city);
                            setDeliverySuburb(location.suburb);
                            setDeliveryBuilding(location.building || '');
                            setDeliveryPostalCode(location.postalCode || '');
                            setDeliveryLat(location.latitude || null);
                            setDeliveryLng(location.longitude || null);
                            setSelectedSavedAddressId(""); // clear saved selection when typing manually

                            // Trigger courier cost calculation if courier is selected
                            if (location.latitude && location.longitude) {
                              requestDeliveryQuote(
                                location.address,
                                location.latitude,
                                location.longitude
                              );
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Select from suggestions to auto-fill city, suburb, and postal code
                        </p>
                      </div>

                      {/* 2. Saved Addresses Selector */}
                      {savedAddresses.length > 0 && (
                        <div>
                          <Label className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-buylock-primary" />
                            Use a Saved Address
                          </Label>
                          <Select
                            value={selectedSavedAddressId}
                            onValueChange={handleSavedAddressSelect}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="— Select saved address —" />
                            </SelectTrigger>
                            <SelectContent>
                              {savedAddresses.map((addr) => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  <span className="font-medium">
                                    {addr.label || addr.city || "Address"}
                                  </span>
                                  {" — "}
                                  <span className="text-gray-500 text-xs">
                                    {addr.addressLine}
                                  </span>
                                  {addr.isDefault && (
                                    <Badge variant="outline" className="ml-2 text-xs py-0">
                                      Default
                                    </Badge>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">Or choose a saved location above</p>
                        </div>
                      )}

                      {/* 3. City and Suburb (unlocked) */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            value={deliveryCity}
                            onChange={(e) => setDeliveryCity(e.target.value)}
                            placeholder="Enter city"
                            className="mt-1"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="suburb">Suburb/Area *</Label>
                          <Input
                            id="suburb"
                            value={deliverySuburb}
                            onChange={(e) => setDeliverySuburb(e.target.value)}
                            placeholder="Enter suburb"
                            className="mt-1"
                            required
                          />
                        </div>
                      </div>

                      {/* 4. Building and Postal Code */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="building">Building/House No.</Label>
                          <Input
                            id="building"
                            value={deliveryBuilding}
                            onChange={(e) => setDeliveryBuilding(e.target.value)}
                            placeholder="e.g. Mirage Towers"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={deliveryPostalCode}
                            onChange={(e) => setDeliveryPostalCode(e.target.value)}
                            placeholder="e.g. 00100"
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Courier Cost Summary */}
                      {deliveryAddress.trim() && (
                        <div>
                          {calculateCourierCostMutation.isPending ? (
                            <p className="text-xs text-blue-600 animate-pulse mt-1">Calculating delivery cost...</p>
                          ) : courierQuote ? (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800">
                                <strong>Delivery Fee ({DEFAULT_COURIER_NAME})</strong>: {formatPrice(courierQuote.totalCost)}
                              </p>
                              <p className="text-xs text-green-700">
                                Distance: ~{courierQuote.estimatedDistance}km • Est. Delivery: {courierQuote.estimatedTime}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div>
                        <Label htmlFor="notes">Order Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special instructions..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mt-1"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={
                  initializePaymentMutation.isPending ||
                  verifyPaymentMutation.isPending ||
                  (!hasOnlyServices && (!deliveryAddress.trim() || !selectedCourier || !courierQuote))
                }
                className="w-full bg-buylock-primary hover:bg-buylock-primary/90 text-white font-semibold py-3 text-lg"
                size="lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {initializePaymentMutation.isPending ? "Processing..." :
                  verifyPaymentMutation.isPending ? "Verifying Payment..." :
                    calculateCourierCostMutation.isPending ? "Calculating delivery..." :
                      "Checkout"}
              </Button>

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-500">
                <p>🔒 Your payment information is secure and encrypted</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
