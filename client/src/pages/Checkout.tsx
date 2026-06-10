import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CreditCard, ShoppingBag, MapPin, Truck, Phone, User as UserIcon, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { LocationPicker } from "@/components/LocationPicker";
import type { CartItem, Product, Service, Vendor } from "@shared/schema";

interface CartItemWithDetails extends CartItem {
  product?: Product;
  service?: Service;
}

interface DeliveryQuote {
  success: boolean;
  distanceKm: number;
  distanceMethod: "osrm" | "haversine";
  deliveryFee: number;
  isFreeDelivery: boolean;
  error?: string;
}

export default function Checkout() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Checkout inputs state
  const [selectedAddress, setSelectedAddress] = useState<{
    latitude: number;
    longitude: number;
    description: string;
  } | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentPending, setPaymentPending] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Load cart items
  const { data: cartItems = [], isLoading: cartLoading } = useQuery<CartItemWithDetails[]>({
    queryKey: ["/api/cart"],
  });

  // Group cart items by vendor
  const groupedCart = useMemo(() => {
    const groups: Record<string, { vendorId: string; vendorName: string; items: CartItemWithDetails[] }> = {};
    cartItems.forEach((item) => {
      const vendorId = item.product?.vendorId || item.service?.providerId || "unknown";
      const vendorName = item.vendorNameSnapshot || "Vendor Shop";
      if (!groups[vendorId]) {
        groups[vendorId] = { vendorId, vendorName, items: [] };
      }
      groups[vendorId].items.push(item);
    });
    return Object.values(groups);
  }, [cartItems]);

  const [activeVendorId, setActiveVendorId] = useState<string>("");

  useEffect(() => {
    if (groupedCart.length > 0 && !activeVendorId) {
      setActiveVendorId(groupedCart[0].vendorId);
    }
  }, [groupedCart, activeVendorId]);

  // Load active vendor details (coordinates)
  const { data: activeVendor } = useQuery<Vendor>({
    queryKey: [`/api/vendors/${activeVendorId}`],
    enabled: !!activeVendorId && activeVendorId !== "unknown",
  });

  const selectedVendorCart = useMemo(() => {
    return groupedCart.find((g) => g.vendorId === activeVendorId);
  }, [groupedCart, activeVendorId]);

  const subtotal = useMemo(() => {
    if (!selectedVendorCart) return 0;
    return selectedVendorCart.items.reduce((sum, item) => {
      const price = parseFloat(item.price || "0");
      return sum + price * (item.quantity || 1);
    }, 0);
  }, [selectedVendorCart]);

  const isServiceOnly = selectedVendorCart?.items.every((i) => !i.productId) ?? false;

  const { data: deliveryQuote, isLoading: quoteLoading, error: quoteError } = useQuery<DeliveryQuote>({
    queryKey: [
      "/api/logistics/quote",
      activeVendorId,
      selectedAddress?.latitude,
      selectedAddress?.longitude,
      subtotal,
    ],
    queryFn: async () => {
      return apiRequest("/api/logistics/quote", "POST", {
        vendorId: activeVendorId,
        customerLat: selectedAddress!.latitude,
        customerLng: selectedAddress!.longitude,
        orderSubtotal: subtotal,
      });
    },
    enabled:
      !isServiceOnly &&
      !!selectedAddress &&
      !!activeVendorId &&
      activeVendorId !== "unknown",
    retry: false,
  });

  const distanceKm = deliveryQuote?.distanceKm ?? null;
  const deliveryFee = isServiceOnly ? 0 : (deliveryQuote?.deliveryFee ?? 0);

  const total = useMemo(() => {
    return subtotal + (isServiceOnly ? 0 : deliveryFee);
  }, [subtotal, deliveryFee, isServiceOnly]);

  // Format KES Price
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Submit Order and Trigger M-Pesa STK Push
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVendorCart) throw new Error("No vendor items selected");
      if (!selectedAddress) throw new Error("Delivery address is required");

      const isGuest = !isAuthenticated;
      const checkoutPhone = isGuest ? guestPhone : (user?.phone || guestPhone);
      const checkoutEmail = isGuest ? guestEmail : (user?.email || guestEmail);
      const checkoutName = isGuest ? guestName : `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

      if (!checkoutPhone) throw new Error("Phone number is required");

      const itemsPayload = selectedVendorCart.items.map((i) => ({
        productId: i.productId,
        serviceId: i.serviceId,
        quantity: i.quantity,
        price: i.price,
        name: i.product?.name || i.service?.name || "Marketplace Item",
      }));

      // 1. Create order on backend
      const order = await apiRequest("/api/orders", "POST", {
        isGuest,
        guestName: isGuest ? checkoutName : null,
        guestPhone: isGuest ? checkoutPhone : null,
        guestEmail: isGuest ? checkoutEmail : null,
        guestAddress: selectedAddress.description,
        guestLatitude: selectedAddress.latitude,
        guestLongitude: selectedAddress.longitude,
        deliveryAddress: selectedAddress.description,
        deliveryFee: selectedVendorCart.items.every((i) => !i.productId) ? "0" : deliveryFee.toString(),
        totalAmount: total.toString(),
        paymentMethod: "mpesa",
        items: itemsPayload,
      });

      // 2. Trigger M-Pesa STK Push payment
      await apiRequest("/api/payments/stkpush", "POST", {
        orderId: order.id,
        phoneNumber: mpesaPhone || checkoutPhone,
        amount: total.toString(),
      });

      return order;
    },
    onSuccess: (order: any) => {
      setCreatedOrderId(order.id);
      setPaymentPending(true);
      toast({
        title: "STK Push Sent",
        description: "Please check your mobile phone to enter your M-Pesa PIN.",
      });
    },
    onError: (error: any) => {
      console.error(error);
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to initiate checkout process. Please check your inputs.",
        variant: "destructive",
      });
    },
  });

  // Polling M-Pesa payment status
  useEffect(() => {
    if (!paymentPending || !createdOrderId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 20) {
        clearInterval(interval);
        setPaymentPending(false);
        toast({
          title: "Payment timeout",
          description: "M-Pesa payment checking timed out. You can review your order status in My Orders.",
          variant: "destructive",
        });
        return;
      }

      try {
        const response = await fetch(`/api/payments/status/order/${createdOrderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "completed") {
            clearInterval(interval);
            setPaymentPending(false);
            queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
            toast({
              title: "Payment Received!",
              description: "Thank you! Your order has been placed and confirmed.",
            });
            setTimeout(() => {
              navigate(`/track/${createdOrderId}`);
            }, 1000);
          } else if (data.status === "failed") {
            clearInterval(interval);
            setPaymentPending(false);
            toast({
              title: "Payment Failed",
              description: data.resultDesc || "M-Pesa payment was cancelled or failed.",
              variant: "destructive",
            });
          }
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentPending, createdOrderId, navigate, queryClient]);

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Cart is Empty</h2>
          <p className="text-gray-600 mb-6">Add items from shops or services to start checking out.</p>
          <Button onClick={() => navigate("/")} className="bg-primary">Browse Marketplace</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Secure Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Group Tabs */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    Select Vendor cart to Checkout
                  </CardTitle>
                  <CardDescription>
                    Because items belong to different shops, you checkout one vendor at a time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeVendorId} onValueChange={setActiveVendorId}>
                    <TabsList className="w-full flex overflow-x-auto bg-gray-100 p-1">
                      {groupedCart.map((group) => (
                        <TabsTrigger key={group.vendorId} value={group.vendorId} className="flex-1 whitespace-nowrap">
                          {group.vendorName} ({group.items.length})
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groupedCart.map((group) => (
                      <TabsContent key={group.vendorId} value={group.vendorId} className="mt-4 space-y-3">
                        {group.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="font-medium text-sm text-gray-900">
                                {item.product?.name || item.service?.name || "Item"}
                              </p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-semibold text-sm">
                              {formatPrice(parseFloat(item.price || "0") * (item.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Delivery Coordinates picker */}
              <LocationPicker
                onLocationSelect={setSelectedAddress}
                initialLocation={selectedAddress || undefined}
                className="shadow-sm border-gray-200"
              />

              {/* User/Guest Info form */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    Contact details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isAuthenticated ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guestName">Full Name</Label>
                        <Input
                          id="guestName"
                          placeholder="Jane Doe"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestPhone">Phone number (For SMS notifications)</Label>
                        <Input
                          id="guestPhone"
                          placeholder="e.g. 0712345678"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="guestEmail">Email Address</Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          placeholder="jane.doe@example.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        <span>Name: {user?.firstName} {user?.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>Email: {user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Phone className="w-4 h-4" />
                        <span>Phone: {user?.phone || "Not set"}</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="mpesaPhone" className="text-primary font-semibold flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      M-Pesa STK Push number
                    </Label>
                    <Input
                      id="mpesaPhone"
                      placeholder="e.g. 0712345678"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The Safaricom phone number where the PIN entry pop-up will display. Defaults to your contact number.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Order Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Items Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>

                  {selectedVendorCart?.items.some((i) => i.productId) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Estimated Delivery
                      </span>
                      <span className="font-medium">
                        {quoteLoading ? (
                          <span className="text-muted-foreground">Calculating…</span>
                        ) : deliveryQuote?.success && distanceKm !== null ? (
                          <div className="text-right">
                            <p>{deliveryQuote.isFreeDelivery ? "Free" : formatPrice(deliveryFee)}</p>
                            <p className="text-[10px] text-muted-foreground">
                              ({distanceKm.toFixed(1)} km {deliveryQuote.distanceMethod === "osrm" ? "by road" : "estimated"})
                            </p>
                          </div>
                        ) : selectedAddress ? (
                          <span className="text-red-600 text-xs text-right max-w-[160px]">
                            {(quoteError as Error)?.message || deliveryQuote?.error || "Delivery unavailable"}
                          </span>
                        ) : (
                          <span className="text-amber-600">Select address</span>
                        )}
                      </span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold text-lg text-gray-900">
                    <span>Total Due</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  <Button
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-lg flex items-center justify-center gap-2"
                    onClick={() => checkoutMutation.mutate()}
                    disabled={
                      checkoutMutation.isPending ||
                      !selectedAddress ||
                      quoteLoading ||
                      (!isServiceOnly && !deliveryQuote?.success) ||
                      (!isAuthenticated && (!guestName || !guestPhone || !guestEmail))
                    }
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay with M-Pesa
                      </>
                    )}
                  </Button>

                  {!selectedAddress && (
                    <p className="text-xs text-amber-600 text-center font-medium">
                      ⚠️ Please choose your delivery address on the map to calculate delivery cost.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Payment Processing Polling dialog */}
      <Dialog open={paymentPending} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md text-center p-8">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              M-Pesa STK Push Pending
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              We have sent an STK prompt to **{mpesaPhone || guestPhone || user?.phone}**. Please unlock your phone and input your M-Pesa PIN.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-4 animate-pulse">
              <CreditCard className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Waiting for payment confirmation…</p>
            <p className="text-xs text-muted-foreground mt-1">This dialog will automatically close when payment is verified.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
