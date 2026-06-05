import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package,
  Search,
  Eye,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
  DollarSign,
  User,
  MapPin,
  CreditCard,
  RefreshCw,
  FileText,
  Store,
  Loader2,
  ArrowLeft,
  Edit3,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  userId: string;
  status: string;
  totalAmount: string;
  paymentMethod?: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  deliveryAddress?: string;
  deliveryFee?: string;
  trackingNumber?: string;
  notes?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  orderItems?: OrderItem[];
}

interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  serviceId?: string;
  quantity: number;
  price: string;
  appointmentDate?: string;
  appointmentTime?: string;
  duration?: number;
  serviceLocation?: string;
  notes?: string;
  product?: { id: string; name: string; imageUrl?: string; vendorId: string };
  service?: { id: string; name: string; imageUrl?: string; providerId: string };
}

// ─── All possible order statuses ─────────────────────────────────────────────
const ORDER_STATUSES = [
  { value: "pending",           label: "Pending",            color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "confirmed",         label: "Confirmed",          color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "processing",        label: "Processing",         color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "shipped",           label: "Shipped",            color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "out_for_delivery",  label: "Out for Delivery",   color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "delivered",         label: "Delivered",          color: "bg-green-100 text-green-800 border-green-200" },
  { value: "completed",         label: "Completed",          color: "bg-green-100 text-green-800 border-green-200" },
  { value: "customer_confirmed",label: "Customer Confirmed", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "disputed",          label: "Disputed",           color: "bg-red-100 text-red-800 border-red-200" },
  { value: "cancelled",         label: "Cancelled",          color: "bg-gray-100 text-gray-700 border-gray-200" },
  { value: "refunded",          label: "Refunded",           color: "bg-gray-100 text-gray-700 border-gray-200" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusMeta = (status: string) =>
  ORDER_STATUSES.find((s) => s.value === status) ?? {
    value: status,
    label: status,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  };

const formatCurrency = (amount: string) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(
    parseFloat(amount)
  );

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":        return <Clock className="w-3.5 h-3.5" />;
    case "confirmed":
    case "processing":     return <Package className="w-3.5 h-3.5" />;
    case "shipped":
    case "out_for_delivery": return <Truck className="w-3.5 h-3.5" />;
    case "delivered":
    case "completed":      return <CheckCircle className="w-3.5 h-3.5" />;
    case "cancelled":
    case "refunded":       return <XCircle className="w-3.5 h-3.5" />;
    default:               return <Clock className="w-3.5 h-3.5" />;
  }
};

// ─── Inline status-update dropdown ───────────────────────────────────────────
function StatusUpdater({
  order,
  onUpdated,
}: {
  order: Order;
  onUpdated?: (updated: Order) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [value, setValue] = useState(order.status);

  const mutation = useMutation({
    mutationFn: (newStatus: string) =>
      adminApiRequest(`/api/admin/orders/${order.id}`, "PATCH", { status: newStatus }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Status updated",
        description: `Order #${order.id.slice(0, 8)} → ${statusMeta(updated.status ?? value).label}`,
      });
      onUpdated?.(updated);
    },
    onError: () => {
      setValue(order.status); // revert optimistic
      toast({
        title: "Update failed",
        description: "Could not update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (newStatus: string) => {
    setValue(newStatus);
    mutation.mutate(newStatus);
  };

  const meta = statusMeta(value);

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <Select value={value} onValueChange={handleChange} disabled={mutation.isPending}>
        <SelectTrigger
          className={`h-8 text-xs font-medium border rounded-full px-3 w-44 ${meta.color}`}
          aria-label="Update order status"
        >
          <div className="flex items-center gap-1.5">
            {mutation.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              getStatusIcon(value)
            )}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>
                {getStatusIcon(s.value)}
                {s.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Order Detail View ────────────────────────────────────────────────────────
function OrderDetailView({
  order: initialOrder,
  onBack,
}: {
  order: Order;
  onBack: () => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const meta = statusMeta(order.status);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":    return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default:        return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(0, 8)}</h2>
            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
            <CreditCard className="w-3 h-3 mr-1" />
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* ── Update Status Card ── */}
      <Card className="border-indigo-200 bg-indigo-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-indigo-900">
            <Edit3 className="w-4 h-4" />
            Update Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Current status</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${meta.color}`}>
                {getStatusIcon(order.status)}
                {meta.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">→</span>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Change to</p>
                <StatusUpdater order={order} onUpdated={(updated) => setOrder((o) => ({ ...o, ...updated }))} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <User className="w-4 h-4 mr-2" /> Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Customer ID</p>
              <p className="font-mono text-gray-800 text-xs">{order.userId}</p>
            </div>
            {order.user && (
              <>
                <div>
                  <p className="text-gray-500 text-xs">Name</p>
                  <p className="text-gray-900">{order.user.firstName} {order.user.lastName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Email</p>
                  <p className="text-gray-900">{order.user.email}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 mr-2" /> Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Total Amount</p>
              <p className="text-gray-900 font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
            </div>
            {order.deliveryFee && (
              <div>
                <p className="text-gray-500 text-xs">Delivery Fee</p>
                <p className="text-gray-900">{formatCurrency(order.deliveryFee)}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500 text-xs">Payment Method</p>
              <p className="text-gray-900">{order.paymentMethod || "Not specified"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Order Date</p>
              <p className="text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Last Updated</p>
              <p className="text-gray-900">{formatDate(order.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        {order.deliveryAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-2" /> Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Address</p>
                <p className="text-gray-900">{order.deliveryAddress}</p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-gray-500 text-xs">Tracking Number</p>
                  <p className="text-gray-900 font-mono">{order.trackingNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Items */}
      {order.orderItems && order.orderItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Package className="w-4 h-4 mr-2" /> Order Items ({order.orderItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {item.product?.imageUrl || item.service?.imageUrl ? (
                        <img
                          src={item.product?.imageUrl || item.service?.imageUrl}
                          alt={item.product?.name || item.service?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product?.name || item.service?.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {item.product ? "Product" : "Service"} • Qty: {item.quantity}
                      </p>
                      {item.appointmentDate && (
                        <p className="text-gray-400 text-xs">
                          Appt: {formatDate(item.appointmentDate)}
                          {item.appointmentTime && ` at ${item.appointmentTime}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.price)}</p>
                    <p className="text-gray-500 text-xs">
                      Total: {formatCurrency((parseFloat(item.price) * item.quantity).toString())}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <FileText className="w-4 h-4 mr-2" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-800">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrdersManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    retry: false,
  });

  // Tab slices
  const pendingOrders   = orders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status));
  const shippedOrders   = orders.filter((o) => ["shipped", "out_for_delivery"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "completed"].includes(o.status));
  const cancelledOrders = orders.filter((o) => ["cancelled", "refunded"].includes(o.status));
  const disputedOrders  = orders.filter((o) => o.status === "disputed");

  const currentOrders =
    activeTab === "all"       ? orders :
    activeTab === "pending"   ? pendingOrders :
    activeTab === "shipped"   ? shippedOrders :
    activeTab === "completed" ? completedOrders :
    activeTab === "disputed"  ? disputedOrders : cancelledOrders;

  const filteredOrders = currentOrders.filter((order) => {
    const customerName = order.user
      ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
      : "";
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus  = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":    return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default:        return "bg-red-100 text-red-800";
    }
  };

  const stats = {
    total:          currentOrders.length,
    pending:        pendingOrders.length,
    shipped:        shippedOrders.length,
    completed:      completedOrders.length,
    cancelled:      cancelledOrders.length,
    totalRevenue:   completedOrders.reduce((s, o) => s + parseFloat(o.totalAmount), 0),
    pendingRevenue: [...pendingOrders, ...shippedOrders].reduce((s, o) => s + parseFloat(o.totalAmount), 0),
  };

  if (selectedOrder) {
    return (
      <OrderDetailView
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Orders Management</h3>
          <p className="text-gray-600">Monitor and manage all customer orders across the platform</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Orders",    value: stats.total,          icon: ShoppingCart, bg: "bg-blue-100",   ic: "text-blue-600" },
          { label: "Pending",         value: stats.pending,         icon: Clock,        bg: "bg-yellow-100", ic: "text-yellow-600" },
          { label: "Shipped",         value: stats.shipped,         icon: Truck,        bg: "bg-purple-100", ic: "text-purple-600" },
          { label: "Completed",       value: stats.completed,       icon: CheckCircle,  bg: "bg-green-100",  ic: "text-green-600" },
          { label: "Total Revenue",   value: formatCurrency(stats.totalRevenue.toString()),   icon: DollarSign, bg: "bg-green-100", ic: "text-green-600", small: true },
          { label: "Pending Revenue", value: formatCurrency(stats.pendingRevenue.toString()), icon: Store,      bg: "bg-blue-100",  ic: "text-blue-600",  small: true },
        ].map(({ label, value, icon: Icon, bg, ic, small }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${bg} p-2 rounded-full shrink-0`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
                  <p className={`font-bold text-gray-900 ${small ? "text-sm" : "text-xl"}`}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by order ID, customer name, or email…"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending Payment</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs + Order List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({shippedOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="disputed">Disputed ({disputedOrders.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold capitalize">
                {activeTab === "all" ? "All Orders" : `${activeTab} Orders`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-40" />
                          <div className="h-2 bg-gray-200 rounded w-28" />
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-36" />
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No orders found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const meta = statusMeta(order.status);
                    return (
                      <div
                        key={order.id}
                        className="border rounded-xl hover:shadow-sm transition-all bg-white"
                      >
                        {/* Row top */}
                        <div className="flex items-center justify-between p-4 gap-3 flex-wrap">
                          {/* Left: avatar + info */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                Order <span className="font-mono">#{order.id.slice(0, 8)}</span>
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {order.user
                                  ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim() || order.user.email
                                  : `User ${order.userId.slice(0, 6)}`}{" "}
                                • {order.user?.email}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                <span>{formatDate(order.createdAt)}</span>
                                <span>•</span>
                                <span className="font-medium text-gray-700">{formatCurrency(order.totalAmount)}</span>
                                <span>•</span>
                                <span>{order.orderItems?.length ?? 0} item{(order.orderItems?.length ?? 0) !== 1 ? "s" : ""}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right: status dropdown + payment badge + view btn */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            {/* ── Inline status updater ── */}
                            <StatusUpdater
                              order={order}
                              onUpdated={(updated) => {
                                // optimistically refresh the list item in UI
                                queryClient.setQueryData<Order[]>(
                                  ["/api/admin/orders"],
                                  (prev) =>
                                    prev?.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)) ?? prev
                                );
                              }}
                            />

                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>

                        {/* Items preview strip */}
                        {order.orderItems && order.orderItems.length > 0 && (
                          <div className="px-4 pb-3 border-t bg-gray-50 rounded-b-xl">
                            <p className="text-xs font-medium text-gray-500 mt-2 mb-1.5">Items:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {order.orderItems.slice(0, 3).map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-1.5 bg-white border px-2 py-0.5 rounded-full text-xs text-gray-700"
                                >
                                  <div className="w-4 h-4 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                    {item.product?.imageUrl || item.service?.imageUrl ? (
                                      <img
                                        src={item.product?.imageUrl || item.service?.imageUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-2.5 h-2.5 text-gray-400" />
                                    )}
                                  </div>
                                  {item.product?.name || item.service?.name || "Unknown"}
                                  {item.quantity > 1 && (
                                    <span className="text-gray-400">×{item.quantity}</span>
                                  )}
                                </div>
                              ))}
                              {order.orderItems.length > 3 && (
                                <span className="text-xs text-gray-400 px-2 py-0.5 bg-white border rounded-full">
                                  +{order.orderItems.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}