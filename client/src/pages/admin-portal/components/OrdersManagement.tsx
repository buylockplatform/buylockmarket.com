import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Store
} from "lucide-react";

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
  product?: {
    id: string;
    name: string;
    imageUrl?: string;
    description?: string;
    vendorId: string;
  };
  service?: {
    id: string;
    name: string;
    imageUrl?: string;
    description?: string;
    providerId: string;
  };
}

export default function OrdersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all orders from API
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/orders'],
    retry: false,
  });

  // Filter orders based on status
  const pendingOrders = (orders as Order[]).filter(order => 
    ['pending', 'confirmed', 'processing'].includes(order.status)
  );
  const shippedOrders = (orders as Order[]).filter(order => 
    ['shipped', 'out_for_delivery'].includes(order.status)
  );
  const completedOrders = (orders as Order[]).filter(order => 
    ['delivered', 'completed'].includes(order.status)
  );
  const cancelledOrders = (orders as Order[]).filter(order => 
    ['cancelled', 'refunded'].includes(order.status)
  );
  const disputedOrders = (orders as Order[]).filter(order => 
    order.status === 'disputed'
  );

  const currentOrders = activeTab === "all" ? orders as Order[] :
                       activeTab === "pending" ? pendingOrders :
                       activeTab === "shipped" ? shippedOrders :
                       activeTab === "completed" ? completedOrders :
                       activeTab === "disputed" ? disputedOrders : cancelledOrders;

  const filteredOrders = currentOrders.filter(order => {
    const customerName = order.user ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() : '';
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.user?.email && order.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': case 'completed': return 'bg-green-100 text-green-800';
      case 'customer_confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': case 'out_for_delivery': return <Truck className="w-4 h-4" />;
      case 'delivered': case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': case 'refunded': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStats = () => {
    const total = currentOrders.length;
    const pending = currentOrders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
    const shipped = currentOrders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length;
    const completed = currentOrders.filter(o => ['delivered', 'completed'].includes(o.status)).length;
    const cancelled = currentOrders.filter(o => ['cancelled', 'refunded'].includes(o.status)).length;
    const totalRevenue = currentOrders
      .filter(o => ['delivered', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const pendingRevenue = currentOrders
      .filter(o => ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    
    return { total, pending, shipped, completed, cancelled, totalRevenue, pendingRevenue };
  };

  const stats = getOrderStats();

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  if (showDetails && selectedOrder) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => setShowDetails(false)}>
            ← Back to Orders
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-gray-600">Order #{selectedOrder.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(selectedOrder.status)}>
              {getStatusIcon(selectedOrder.status)}
              <span className="ml-1">{selectedOrder.status}</span>
            </Badge>
            <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
              <CreditCard className="w-3 h-3 mr-1" />
              {selectedOrder.paymentStatus}
            </Badge>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Customer ID</label>
                <p className="text-gray-900">{selectedOrder.userId}</p>
              </div>
              {selectedOrder.user && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">
                      {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedOrder.user.email}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Amount</label>
                <p className="text-gray-900 font-semibold text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              {selectedOrder.deliveryFee && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Fee</label>
                  <p className="text-gray-900">{formatCurrency(selectedOrder.deliveryFee)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Method</label>
                <p className="text-gray-900">{selectedOrder.paymentMethod || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Payment Status</label>
                <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                  {selectedOrder.paymentStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Order Date</label>
                <p className="text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900">{formatDate(selectedOrder.updatedAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current Status</label>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{selectedOrder.status}</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {selectedOrder.deliveryAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Address</label>
                  <p className="text-gray-900">{selectedOrder.deliveryAddress}</p>
                </div>
                {selectedOrder.trackingNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                    <p className="text-gray-900 font-mono">{selectedOrder.trackingNumber}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Items */}
        {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Items ({selectedOrder.orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedOrder.orderItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {(item.product?.imageUrl || item.service?.imageUrl) ? (
                          <img 
                            src={item.product?.imageUrl || item.service?.imageUrl} 
                            alt={item.product?.name || item.service?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.product?.name || item.service?.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.product ? 'Product' : 'Service'} • Quantity: {item.quantity}
                        </p>
                        {item.appointmentDate && (
                          <p className="text-sm text-gray-500">
                            Appointment: {formatDate(item.appointmentDate)} 
                            {item.appointmentTime && ` at ${item.appointmentTime}`}
                          </p>
                        )}
                        {item.duration && (
                          <p className="text-sm text-gray-500">
                            Duration: {item.duration} hour(s)
                          </p>
                        )}
                        {item.serviceLocation && (
                          <p className="text-sm text-gray-500">
                            Location: {item.serviceLocation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: {formatCurrency((parseFloat(item.price) * item.quantity).toString())}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedOrder.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{selectedOrder.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
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
        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-gray-900">{stats.shipped}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRevenue.toString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Revenue</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.pendingRevenue.toString())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by order ID, customer name, or email..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Orders ({(orders as Order[]).length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({shippedOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
          <TabsTrigger value="disputed">Disputed ({disputedOrders.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" ? "All Orders" : 
                 activeTab === "pending" ? "Pending Orders" :
                 activeTab === "shipped" ? "Shipped Orders" :
                 activeTab === "completed" ? "Completed Orders" :
                 activeTab === "disputed" ? "Disputed Orders" : "Cancelled Orders"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders found matching your criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">
                              {order.user ? `${order.user.firstName} ${order.user.lastName}` : `User ${order.userId}`} • 
                              {order.user?.email}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>{formatDate(order.createdAt)}</span>
                              <span>•</span>
                              <span>{formatCurrency(order.totalAmount)}</span>
                              <span>•</span>
                              <span>{order.orderItems?.length || 0} items</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{order.status}</span>
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                              {order.paymentStatus}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                      
                      {/* Order Items Preview */}
                      {order.orderItems && order.orderItems.length > 0 && (
                        <div className="px-4 pb-4 border-t bg-gray-50">
                          <p className="text-sm font-medium text-gray-700 mb-2">Items Purchased:</p>
                          <div className="flex flex-wrap gap-2">
                            {order.orderItems.slice(0, 3).map((item, index) => (
                              <div key={item.id} className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border text-sm">
                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                                  {(item.product?.imageUrl || item.service?.imageUrl) ? (
                                    <img 
                                      src={item.product?.imageUrl || item.service?.imageUrl} 
                                      alt={item.product?.name || item.service?.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-gray-700">
                                  {item.product?.name || item.service?.name || 'Unknown Item'}
                                </span>
                                {item.quantity > 1 && (
                                  <span className="text-gray-500">×{item.quantity}</span>
                                )}
                              </div>
                            ))}
                            {order.orderItems.length > 3 && (
                              <div className="bg-white px-3 py-1 rounded-full border text-sm text-gray-500">
                                +{order.orderItems.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}