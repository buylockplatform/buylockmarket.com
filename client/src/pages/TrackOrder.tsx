import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRoute, Link } from "wouter";
import { Loader2, Package, CheckCircle2, Circle, AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import LiveTracking from "@/components/LiveTracking";
import type { Order, OrderItem } from "@shared/schema";

interface OrderWithItems extends Order {
  orderItems: OrderItem[];
}

export default function TrackOrder() {
  const [, params] = useRoute("/track/:id");
  const orderId = params?.id;
  const { toast } = useToast();

  // Fetch Order details with items
  const { data: order, isLoading, error, refetch } = useQuery<OrderWithItems>({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
    refetchInterval: 15_000, // Poll order details every 15s
  });

  const isService = order?.orderType === "service";

  // Milestones for Service/Laundry vertical
  const serviceMilestones = [
    { label: "Order Placed", status: "pending", desc: "Awaiting shop confirmation" },
    { label: "Rider Picked Up", status: "pickup", desc: "Courier transporting garments to shop" },
    { label: "Laundry Processing", status: "processing", desc: "Items are being washed & folded" },
    { label: "Ready for Delivery", status: "ready", desc: "Garments clean and awaiting courier" },
    { label: "Out for Delivery", status: "delivering", desc: "Rider is returning items to your home" },
    { label: "Delivered", status: "delivered", desc: "Order completed" },
  ];

  // Milestones for Standard Product vertical
  const productMilestones = [
    { label: "Order Placed", status: "pending", desc: "Awaiting merchant acceptance" },
    { label: "Order Accepted", status: "confirmed", desc: "Shop is packaging your products" },
    { label: "Dispatched", status: "processing", desc: "Courier has picked up package" },
    { label: "Out for Delivery", status: "delivering", desc: "Rider is on the way to you" },
    { label: "Delivered", status: "delivered", desc: "Order delivered" },
  ];

  const milestones = isService ? serviceMilestones : productMilestones;

  // Resolve current active index in milestones
  const activeMilestoneIndex = useMemo(() => {
    if (!order) return 0;
    const status = order.status?.toLowerCase() || "pending";

    // Map order status fields to milestone index
    if (status === "pending" || status === "placed") return 0;
    if (status === "confirmed" || status === "accepted") return 1;
    if (status === "processing" || status === "packed") return 2;
    if (status === "ready" || status === "ready_for_pickup") return 3;
    if (status === "shipping" || status === "out_for_delivery" || status === "shipped") {
      return isService ? 4 : 3;
    }
    if (status === "delivered" || status === "completed" || status === "fulfilled") {
      return isService ? 5 : 4;
    }
    return 0;
  }, [order, isService]);

  // Total items cost helper
  const formatPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(num);
  };

  if (isLoading) {
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't load tracking details for this order ID.</p>
          <Link href="/my-orders">
            <Button className="bg-primary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> View My Orders
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Action bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link href="/my-orders" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1.5 mb-2">
                <ArrowLeft className="w-4 h-4" />
                Back to My Orders
              </Link>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Track Order #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500">
                Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Unknown date"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={order.paymentStatus === "completed" ? "secondary" : "outline"} className="text-xs px-3 py-1">
                Payment: {order.paymentStatus?.toUpperCase() || "PENDING"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Live Tracking map & Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map panel */}
              {orderId && (
                <LiveTracking
                  orderId={orderId}
                  className="shadow-sm border-gray-200"
                />
              )}

              {/* Milestones status tracker */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Timeline</CardTitle>
                </CardHeader>
                <CardContent className="relative pl-8 space-y-6">
                  {/* Vertical line connecting milestones */}
                  <div className="absolute left-4 top-2 bottom-6 w-0.5 bg-gray-200" />

                  {milestones.map((step, index) => {
                    const isCompleted = index < activeMilestoneIndex;
                    const isActive = index === activeMilestoneIndex;

                    return (
                      <div key={step.label} className="relative flex gap-4 items-start">
                        {/* Status Icon */}
                        <div className="absolute -left-[22px] bg-white rounded-full p-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-50" />
                          ) : isActive ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300" />
                          )}
                        </div>

                        <div>
                          <p className={`font-semibold text-sm ${isActive ? "text-primary" : "text-gray-900"}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Checklist and summary */}
            <div className="space-y-6">
              {/* Items checklist with quantity verification */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Item Verification Checklist
                  </CardTitle>
                  <CardDescription>
                    {isService
                      ? "Check quantities physically received and checked-in by laundry shop."
                      : "Items included in this delivery."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.orderItems?.map((item) => {
                    const qty = item.quantity || 1;
                    const confirmedQty = item.vendorConfirmedQuantity;
                    const hasDiscrepancy = confirmedQty !== null && confirmedQty !== qty;

                    return (
                      <div key={item.id} className="py-2 border-b last:border-0 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">{item.name}</span>
                          <span className="font-semibold text-gray-600">Qty: {qty}</span>
                        </div>

                        {/* Discrepancy details */}
                        {confirmedQty !== null && (
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Shop Checked-in:</span>
                            {hasDiscrepancy ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                {confirmedQty} Confirmed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-50 text-green-700">
                                Verified ({confirmedQty})
                              </Badge>
                            )}
                          </div>
                        )}

                        {item.vendorNotes && (
                          <p className="text-xs italic text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-100">
                            Note: {item.vendorNotes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Order breakdown card */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.subtotal || order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery Fee</span>
                    <span className="font-medium">{formatPrice(order.deliveryFee || "0")}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
