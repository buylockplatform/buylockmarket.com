import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getVendorQueryFn, apiRequest, queryClient, vendorApiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import AppointmentManagement from "./components/AppointmentManagement";
import VendorOrderManagement from "./components/VendorOrderManagement";
import EarningsManagement from "./components/EarningsManagement";
import AddProductModal from "./components/AddProductModal";
import AddServiceModal from "./components/AddServiceModal";
import EditProductModal from "./components/EditProductModal";
import EditServiceModal from "./components/EditServiceModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  Package, 
  Users, 
  TrendingUp, 
  Settings, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  LogOut,
  BarChart3,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  PieChart,
  LineChart,
  Filter,
  ClipboardList,
  Shield
} from "lucide-react";

interface VendorData {
  id: string;
  email: string;
  businessName: string;
  contactName: string;
  verified: boolean;
}

export default function VendorDashboard() {
  const [, setLocation] = useLocation();
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [filterPeriod, setFilterPeriod] = useState("month");
  const { toast } = useToast();

  // Business details form state
  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    address: ""
  });

  // Bank details form state
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: ""
  });

  // Password update form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Mutations for updating vendor details
  const updateBusinessDetailsMutation = useMutation({
    mutationFn: async (details: typeof businessDetails) => {
      if (!vendorData?.id) throw new Error("No vendor ID");
      return vendorApiRequest(`/api/vendor/${vendorData.id}/business-details`, "PUT", details);
    },
    onSuccess: () => {
      toast({
        title: "Business Details Updated",
        description: "Your business information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update business details",
        variant: "destructive",
      });
    }
  });

  const updateBankDetailsMutation = useMutation({
    mutationFn: async (details: typeof bankDetails) => {
      if (!vendorData?.id) throw new Error("No vendor ID");
      return vendorApiRequest(`/api/vendor/${vendorData.id}/bank-details`, "PUT", details);
    },
    onSuccess: () => {
      toast({
        title: "Bank Details Updated",
        description: "Your bank information has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update bank details",
        variant: "destructive",
      });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData: typeof passwordForm) => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New passwords do not match");
      }
      return apiRequest("PUT", "/api/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Password Update Failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  });

  // Handle form submissions
  const handleBusinessDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessDetailsMutation.mutate(businessDetails);
  };

  const handleBankDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBankDetailsMutation.mutate(bankDetails);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePasswordMutation.mutate(passwordForm);
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return vendorApiRequest(`/api/vendor/products/${productId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorData?.id}/products`] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return vendorApiRequest(`/api/vendor/services/${serviceId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Service Deleted",
        description: "Service has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vendor/${vendorData?.id}/services`] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
    }
  });

  // Handler functions
  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleDeleteService = (serviceId: string, serviceName: string) => {
    if (window.confirm(`Are you sure you want to delete "${serviceName}"? This action cannot be undone.`)) {
      deleteServiceMutation.mutate(serviceId);
    }
  };

  // Bank name to code mapping for Kenyan banks
  const getBankCode = (bankName: string) => {
    const bankCodes: Record<string, string> = {
      "kcb": "01",
      "equity-bank": "68",
      "ncba-bank": "07", 
      "cooperative-bank": "11",
      "standard-chartered": "02",
      "im-bank": "57",
      "absa-bank": "03",
      "dtb-bank": "49",
      "family-bank": "70",
      "gulf-african-bank": "72",
      "housing-finance": "61",
      "national-bank": "12",
      "nic-bank": "41", 
      "paramount-bank": "50",
      "prime-bank": "10",
      "sidian-bank": "76",
      "m-pesa": "MPESA",
      "airtel-money": "AIRTEL"
    };
    return bankCodes[bankName] || "";
  };

  // Bank name display mapping for Kenyan banks
  const getBankDisplayName = (bankName: string) => {
    const bankNames: Record<string, string> = {
      "kcb": "Kenya Commercial Bank (KCB)",
      "equity-bank": "Equity Bank",
      "ncba-bank": "NCBA Bank",
      "cooperative-bank": "Co-operative Bank",
      "standard-chartered": "Standard Chartered Bank",
      "im-bank": "I&M Bank",
      "absa-bank": "ABSA Bank Kenya",
      "dtb-bank": "Diamond Trust Bank",
      "family-bank": "Family Bank",
      "gulf-african-bank": "Gulf African Bank",
      "housing-finance": "Housing Finance Company",
      "national-bank": "National Bank of Kenya",
      "nic-bank": "NIC Bank", 
      "paramount-bank": "Paramount Bank",
      "prime-bank": "Prime Bank",
      "sidian-bank": "Sidian Bank",
      "m-pesa": "M-Pesa (Safaricom)",
      "airtel-money": "Airtel Money"
    };
    return bankNames[bankName] || bankName;
  };

  // Fetch current vendor data to ensure bank details are up-to-date
  const { data: currentVendorData } = useQuery<any>({
    queryKey: [`/api/vendor/current`],
    queryFn: getVendorQueryFn({ on401: "returnNull" }),
    enabled: !!vendorData?.id,
  });

  useEffect(() => {
    // Check if vendor is logged in
    const storedVendorData = localStorage.getItem('vendorData');
    if (storedVendorData) {
      const vendor = JSON.parse(storedVendorData);
      setVendorData(vendor);
      
      // Initialize form state with vendor data
      setBusinessDetails({
        businessName: vendor.businessName || "",
        contactName: vendor.contactName || "",
        phone: vendor.phone || "",
        address: vendor.address || ""
      });
      
      setBankDetails({
        bankName: vendor.bankName || "",
        bankCode: vendor.bankCode || "",
        accountNumber: vendor.accountNumber || "",
        accountName: vendor.accountName || ""
      });
    } else {
      // Redirect to login if no vendor data
      setLocation("/vendor-dashboard/login");
    }
  }, [setLocation]);

  // Update bank details when fresh vendor data is fetched
  useEffect(() => {
    if (currentVendorData) {
      setBankDetails({
        bankName: currentVendorData.bankName || "",
        bankCode: currentVendorData.bankCode || "",
        accountNumber: currentVendorData.accountNumber || "",
        accountName: currentVendorData.accountName || ""
      });
      
      // Also update business details to keep them fresh
      setBusinessDetails({
        businessName: currentVendorData.businessName || "",
        contactName: currentVendorData.contactName || "",
        phone: currentVendorData.phone || "",
        address: currentVendorData.address || ""
      });
    }
  }, [currentVendorData]);

  // Fetch vendor's real products, services, and orders using vendor authentication
  const { data: vendorProducts = [] } = useQuery<any[]>({
    queryKey: [`/api/vendor/${vendorData?.id}/products`],
    queryFn: getVendorQueryFn({ on401: "returnNull" }),
    enabled: !!vendorData?.id,
  });

  const { data: vendorServices = [] } = useQuery<any[]>({
    queryKey: [`/api/vendor/${vendorData?.id}/services`],
    queryFn: getVendorQueryFn({ on401: "returnNull" }),
    enabled: !!vendorData?.id,
  });

  const { data: vendorOrders = [] } = useQuery<any[]>({
    queryKey: [`/api/vendor/${vendorData?.id}/orders`],
    queryFn: getVendorQueryFn({ on401: "returnNull" }),
    enabled: !!vendorData?.id,
  });

  if (!vendorData) {
    return <div>Loading...</div>;
  }

  // Currency formatting function
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleLogout = () => {
    localStorage.removeItem('vendorData');
    setLocation("/vendor-dashboard/login");
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "orders", label: "Order Management", icon: ClipboardList },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "products", label: "Products", icon: Package },
    { id: "services", label: "Services", icon: Users },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Calculate real stats from actual data
  const totalRevenue = vendorOrders?.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0) || 0;
  const completedOrders = vendorOrders?.filter(order => order.status === 'delivered' || order.status === 'completed') || [];
  const serviceRevenue = vendorOrders?.filter(order => order.orderType === 'service').reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0) || 0;
  const completionRate = vendorOrders?.length > 0 ? Math.round((completedOrders.length / vendorOrders.length) * 100) : 0;
  
  const realStats = {
    totalSales: completedOrders.length,
    totalRevenue: formatPrice(totalRevenue),
    totalOrders: vendorOrders?.length || 0,
    productsSold: vendorProducts?.length || 0,
    servicesProvided: vendorServices?.length || 0,
    serviceRevenue: formatPrice(serviceRevenue),
    completionRate: completionRate
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-buylock-primary text-white p-2 rounded-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">BuyLock Vendor</h1>
              <p className="text-sm text-gray-600">{vendorData.businessName}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === item.id
                        ? "bg-buylock-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeSection}
              </h2>
              <p className="text-gray-600">
                {activeSection === "dashboard" && "Overview of your business performance"}
                {activeSection === "orders" && "Manage customer orders and fulfillment workflow"}
                {activeSection === "appointments" && "Manage your service appointments and bookings"}
                {activeSection === "products" && "Manage your product catalog and orders"}
                {activeSection === "services" && "Manage your services and bookings"}
                {activeSection === "earnings" && "Track your earnings and revenue"}
                {activeSection === "profile" && "Update your business information"}
                {activeSection === "settings" && "Configure your account settings"}
              </p>
            </div>

          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">{realStats.totalSales}</p>
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
                        <p className="text-2xl font-bold text-gray-900">{realStats.totalRevenue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <ShoppingCart className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900">{realStats.totalOrders}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Package className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Products Sold</p>
                        <p className="text-2xl font-bold text-gray-900">{realStats.productsSold}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Sales Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Sales chart placeholder</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Goods vs Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Products Sold</span>
                        <span className="font-semibold">{realStats.productsSold}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Services Provided</span>
                        <span className="font-semibold">{realStats.servicesProvided}</span>
                      </div>
                      <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Pie chart placeholder</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendorOrders?.length > 0 ? vendorOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 rounded-full bg-blue-100">
                            <Package className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.customerName || 'Order'}</h3>
                            <p className="text-gray-600">Order ID: {order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-buylock-primary">{formatPrice(order.totalAmount)}</p>
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent orders</p>
                        <p className="text-sm">Orders will appear here when customers make purchases</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "orders" && <VendorOrderManagement vendorId={vendorData.id} />}

          {activeSection === "appointments" && vendorData?.id && <AppointmentManagement vendorId={vendorData.id} />}

          {activeSection === "products" && (
            <div className="space-y-6">
              {/* Products Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Product Management</h3>
                  <p className="text-gray-600">Manage your product catalog and orders</p>
                </div>
                <AddProductModal vendorId={vendorData.id} />
              </div>

              {/* Products List */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {vendorProducts?.length > 0 ? vendorProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={product.imageUrl || "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=100"} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            <p className="text-gray-600">{product.categoryName || "General"}</p>
                            <p className="text-lg font-bold text-buylock-primary">{formatPrice(product.price)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Stock: {product.stockQuantity || 0}</p>
                            <Badge variant="outline">{product.isActive ? "Active" : "Inactive"}</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(`/products/${product.slug}`, '_blank')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <EditProductModal vendorId={vendorData.id} product={product} />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              disabled={deleteProductMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No products added yet</p>
                        <p className="text-sm">Click "Add Product" to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Product Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendorOrders?.filter(order => order.orderType === 'product').length > 0 ? 
                      vendorOrders.filter(order => order.orderType === 'product').slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-full bg-blue-100">
                              <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{order.customerName || 'Product Order'}</h3>
                              <p className="text-gray-600">Order ID: {order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold text-buylock-primary">{formatPrice(order.totalAmount)}</p>
                              <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No product orders yet</p>
                          <p className="text-sm">Product orders will appear here when customers purchase your products</p>
                        </div>
                      )
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "services" && (
            <div className="space-y-6">
              {/* Services Header */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Service Management</h3>
                  <p className="text-gray-600">Manage your services and bookings</p>
                </div>
                <AddServiceModal vendorId={vendorData.id} />
              </div>

              {/* Service Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Services</p>
                        <p className="text-2xl font-bold text-gray-900">{vendorServices.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{realStats.completionRate}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Service Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">{realStats.serviceRevenue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services List */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {vendorServices?.length > 0 ? vendorServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-gray-600">{service.categoryName || "Professional Services"}</p>
                          <p className="text-lg font-bold text-buylock-primary">{formatPrice(service.price)}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Duration: {service.estimatedDuration || "Varies"}</p>
                            <Badge variant="outline">{service.isActive ? "Active" : "Inactive"}</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(`/services/${service.slug}`, '_blank')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <EditServiceModal vendorId={vendorData.id} service={service} />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteService(service.id, service.name)}
                              disabled={deleteServiceMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No services added yet</p>
                        <p className="text-sm">Click "Add Service" to get started</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Service Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Service Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendorOrders?.filter(order => order.orderType === 'service').length > 0 ? 
                      vendorOrders.filter(order => order.orderType === 'service').slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 rounded-full bg-green-100">
                              <Users className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{order.customerName || 'Service Booking'}</h3>
                              <p className="text-gray-600">Order ID: {order.id.slice(0, 8)}</p>
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-bold text-buylock-primary">{formatPrice(order.totalAmount)}</p>
                              <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No service bookings yet</p>
                          <p className="text-sm">Service appointments will appear here when customers book your services</p>
                        </div>
                      )
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "earnings" && vendorData?.id && (
            <EarningsManagement vendorId={vendorData.id} />
          )}

          {activeSection === "profile" && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Business Profile</h3>
                <p className="text-gray-600">Update your business information and settings</p>
              </div>

              {/* Profile Tabs */}
              <Tabs defaultValue="business" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="business">Business Details</TabsTrigger>
                  <TabsTrigger value="bank">Bank Details</TabsTrigger>
                </TabsList>

                {/* Business Details Tab */}
                <TabsContent value="business" className="space-y-6">
                  <form onSubmit={handleBusinessDetailsSubmit}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Business Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="businessName">Business Name</Label>
                            <Input 
                              id="businessName" 
                              value={businessDetails.businessName}
                              onChange={(e) => setBusinessDetails(prev => ({ ...prev, businessName: e.target.value }))}
                              className="mt-1" 
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="contactName">Contact Name</Label>
                            <Input 
                              id="contactName" 
                              value={businessDetails.contactName}
                              onChange={(e) => setBusinessDetails(prev => ({ ...prev, contactName: e.target.value }))}
                              className="mt-1" 
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={vendorData?.email || ""} 
                              disabled
                              className="mt-1 bg-gray-50" 
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input 
                              id="phone" 
                              type="tel" 
                              placeholder="+254 xxx xxx xxxx"
                              value={businessDetails.phone}
                              onChange={(e) => setBusinessDetails(prev => ({ ...prev, phone: e.target.value }))}
                              className="mt-1" 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="address">Business Address</Label>
                            <Input 
                              id="address" 
                              placeholder="Enter your business address"
                              value={businessDetails.address}
                              onChange={(e) => setBusinessDetails(prev => ({ ...prev, address: e.target.value }))}
                              className="mt-1" 
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        className="bg-buylock-primary hover:bg-buylock-primary/90"
                        disabled={updateBusinessDetailsMutation.isPending}
                      >
                        {updateBusinessDetailsMutation.isPending ? "Saving..." : "Save Business Details"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                {/* Bank Details Tab */}
                <TabsContent value="bank" className="space-y-6">
                  {/* Current Bank Details Display */}
                  {bankDetails.bankName && bankDetails.accountNumber && (
                    <Card className="bg-green-50 border-green-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Current Bank Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-green-700">Bank</Label>
                            <p className="text-green-800 font-semibold">{getBankDisplayName(bankDetails.bankName)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-green-700">Account Number</Label>
                            <p className="text-green-800 font-semibold">{bankDetails.accountNumber}</p>
                          </div>
                          {bankDetails.accountName && (
                            <div className="md:col-span-2">
                              <Label className="text-sm font-medium text-green-700">Account Holder</Label>
                              <p className="text-green-800 font-semibold">{bankDetails.accountName}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <form onSubmit={handleBankDetailsSubmit}>
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {bankDetails.bankName ? "Update Bank Account Information" : "Bank Account Information"}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {bankDetails.bankName ? "Update your existing" : "Add your"} bank details for receiving payouts. Kenyan banks and mobile money services are supported.
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Select 
                              value={bankDetails.bankName}
                              onValueChange={(value) => setBankDetails(prev => ({ 
                                ...prev, 
                                bankName: value,
                                bankCode: getBankCode(value)
                              }))}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select your bank" />
                              </SelectTrigger>
                              <SelectContent>
                                {/* Major Kenyan Banks */}
                                <SelectItem value="kcb">Kenya Commercial Bank (KCB)</SelectItem>
                                <SelectItem value="equity-bank">Equity Bank</SelectItem>
                                <SelectItem value="ncba-bank">NCBA Bank</SelectItem>
                                <SelectItem value="cooperative-bank">Co-operative Bank</SelectItem>
                                <SelectItem value="standard-chartered">Standard Chartered Bank</SelectItem>
                                <SelectItem value="im-bank">I&M Bank</SelectItem>
                                <SelectItem value="absa-bank">ABSA Bank Kenya</SelectItem>
                                <SelectItem value="dtb-bank">Diamond Trust Bank</SelectItem>
                                <SelectItem value="family-bank">Family Bank</SelectItem>
                                <SelectItem value="gulf-african-bank">Gulf African Bank</SelectItem>
                                <SelectItem value="housing-finance">Housing Finance Company</SelectItem>
                                <SelectItem value="national-bank">National Bank of Kenya</SelectItem>
                                <SelectItem value="nic-bank">NIC Bank</SelectItem>
                                <SelectItem value="paramount-bank">Paramount Bank</SelectItem>
                                <SelectItem value="prime-bank">Prime Bank</SelectItem>
                                <SelectItem value="sidian-bank">Sidian Bank</SelectItem>
                                {/* Mobile Money Services */}
                                <SelectItem value="m-pesa">M-Pesa (Safaricom)</SelectItem>
                                <SelectItem value="airtel-money">Airtel Money</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="accountNumber">Account Number</Label>
                            <Input 
                              id="accountNumber" 
                              placeholder="Enter account number or mobile number for M-Pesa" 
                              value={bankDetails.accountNumber}
                              onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                              className="mt-1" 
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="accountName">Account Holder Name</Label>
                            <Input 
                              id="accountName" 
                              placeholder="Enter the full name on the bank account"
                              value={bankDetails.accountName}
                              onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                              className="mt-1" 
                              required
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">i</span>
                              </div>
                            </div>
                            <div className="text-sm text-blue-800">
                              <p className="font-medium">Important Information:</p>
                              <ul className="mt-1 space-y-1 list-disc list-inside">
                                <li>Ensure the account name matches exactly with your bank records</li>
                                <li>For M-Pesa, use your registered mobile number (254XXXXXXXXX)</li>
                                <li>Kenyan bank accounts and mobile money services are supported</li>
                                <li>Account verification may take 1-2 business days</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        className="bg-buylock-primary hover:bg-buylock-primary/90"
                        disabled={updateBankDetailsMutation.isPending}
                      >
                        {updateBankDetailsMutation.isPending ? "Saving..." : "Save Bank Details"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>


              </Tabs>
            </div>
          )}

          {activeSection === "settings" && (
            <div className="space-y-6">
              {/* Settings Header */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
                <p className="text-gray-600">Configure your account settings</p>
              </div>

              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <p className="text-sm text-gray-600">Configure your account preferences and security</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Account Status */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Verification Status</h4>
                        <p className="text-sm text-gray-600">Your account verification status with BuyLock</p>
                      </div>
                      <Badge 
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        ✓ Verified
                      </Badge>
                    </div>
                    
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        </div>
                        <div className="text-sm text-green-800">
                          <p className="font-medium">Account Verified</p>
                          <p className="mt-1">Your vendor account has been successfully verified. You can now sell products and services on BuyLock.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-700">Account ID</Label>
                        <p className="text-gray-900 font-mono text-xs">{currentVendorData?.id?.slice(0, 16)}...</p>
                      </div>
                      <div>
                        <Label className="text-gray-700">Member Since</Label>
                        <p className="text-gray-900">
                          {currentVendorData?.createdAt ? new Date(currentVendorData.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-700">Email Address</Label>
                        <p className="text-gray-900">{currentVendorData?.email}</p>
                      </div>
                      <div>
                        <Label className="text-gray-700">Account Type</Label>
                        <p className="text-gray-900">Vendor Account</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <p className="text-sm text-gray-600">Manage your account security and authentication</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Authentication Provider */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">Authentication Provider</h4>
                        <p className="text-sm text-gray-600">Your account uses email and password authentication</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Email & Password
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      <p>Your account is secured using your email address and password. You can update your password below.</p>
                    </div>
                  </div>

                  {/* Password Update Form */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Change Password</h4>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          required
                          placeholder="Enter your current password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          required
                          placeholder="Enter your new password"
                          minLength={8}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          placeholder="Confirm your new password"
                          minLength={8}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={updatePasswordMutation.isPending}
                        className="w-full"
                      >
                        {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </div>

                  {/* Account Actions */}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Account Actions</h4>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        onClick={handleLogout}
                        className="w-full md:w-auto"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}