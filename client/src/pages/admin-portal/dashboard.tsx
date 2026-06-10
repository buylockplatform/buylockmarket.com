import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import UserManagement from "./components/UserManagement";
import VendorManagement from "./components/VendorManagement";
import VendorView from "./components/VendorView";
import VendorRequests from "./components/VendorRequests";
import ManageAppointments from "./components/ManageAppointments";
import CategoriesManagement from "./components/CategoriesManagement";
import ProductsManagement from "./components/ProductsManagement";
import ServicesManagement from "./components/ServicesManagement";
import OrdersManagement from "./components/OrdersManagement";
import ServiceCategoryManagement from "../admin/ServiceCategoryManagement";
import EarningsManagementAdmin from "./components/EarningsManagementAdmin";
import { CommissionSettings } from "../admin/components/CommissionSettings";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import AdminAnalytics from "./components/AdminAnalytics";
import DisputeResolution from "./components/DisputeResolution";
import CourierConfiguration from "./components/CourierConfiguration";
import LogisticsSettings from "./components/LogisticsSettings";
import VerticalsManagement from "./components/VerticalsManagement";
import AdminSettingsPanel from "./components/AdminSettingsPanel";
import DeliveryPortalContent from "@/components/DeliveryPortalContent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Store, 
  Package, 
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  PieChart,
  Calendar,
  FolderOpen,
  Truck,
  CreditCard,
  Wrench,
  Globe
} from "lucide-react";

interface AdminData {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLogin: string;
}

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const params = useParams<{ section?: string; vendorId?: string }>();
  const isVendorDetail = Boolean(params.vendorId);
  const activeSection = isVendorDetail ? "vendors" : (params.section || "dashboard");

  // Keep a setter that also updates the URL
  const navigateTo = (section: string) => {
    setLocation(`/admin-portal/dashboard/${section}`);
  };
  const [adminData, setAdminData] = useState<AdminData | null>(null);

  // Fetch real admin statistics
  const { data: realStats } = useQuery<{
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    pendingVendors: number;
    totalRevenue: number;
  }>({
    queryKey: ['/api/admin/stats'],
    enabled: !!adminData,
  });

  useEffect(() => {
    // Check if admin is logged in
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      setAdminData(JSON.parse(storedAdminData));
    } else {
      // Redirect to login if no admin data
      setLocation("/admin-portal/login");
    }
  }, [setLocation]);

  if (!adminData) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminData');
    setLocation("/admin-portal");
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "vendors", label: "Vendors", icon: Store },
    { id: "vendor-requests", label: "Vendor Requests", icon: CheckCircle },
    { id: "appointments", label: "Manage Appointments", icon: Calendar },
    { id: "products", label: "Products", icon: Package },
    { id: "services", label: "Services", icon: Wrench },
    { id: "service-categories", label: "Service Categories", icon: FolderOpen },
    { id: "categories", label: "Categories", icon: FolderOpen },
    { id: "verticals", label: "Market Verticals", icon: Globe },
    { id: "orders", label: "Orders", icon: TrendingUp },
    { id: "earnings", label: "Earnings Management", icon: DollarSign },
    { id: "commission", label: "Commission Settings", icon: Settings },
    { id: "deliveries", label: "Delivery", icon: Truck },
    { id: "courier-config", label: "Courier Configuration", icon: Settings },
    { id: "logistics-settings", label: "Logistics Settings", icon: Truck },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "admin-analytics", label: "Advanced Analytics", icon: BarChart3 },
    { id: "disputes", label: "Dispute Resolution", icon: AlertTriangle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Use real stats from API, with fallback to prevent crashes
  const stats = {
    totalUsers: realStats?.totalUsers || 0,
    totalVendors: realStats?.totalVendors || 0,
    totalProducts: realStats?.totalProducts || 0,
    totalServices: realStats?.totalServices || 0,
    totalOrders: realStats?.totalOrders || 0,
    pendingVendors: realStats?.pendingVendors || 0,
    totalRevenue: realStats?.totalRevenue || 0
  };



  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <Link href="/admin-portal" className="flex items-center space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
            <div className="bg-buylock-primary text-white p-2 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">BuyLock Admin</h1>
              <p className="text-sm text-gray-600">{adminData.name}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigateTo(item.id)}
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
                {isVendorDetail ? "Vendor Detail" : activeSection}
              </h2>
              <p className="text-gray-600">
                {activeSection === "dashboard" && "Overview of platform performance and metrics"}
                {activeSection === "users" && "Manage customer accounts and user activity"}
                {activeSection === "vendors" && !isVendorDetail && "Manage vendor accounts and verification"}
                {activeSection === "vendors" && isVendorDetail && "View vendor profile, orders, documents, and account controls"}
                {activeSection === "vendor-requests" && "Review vendor applications and requests"}
                {activeSection === "appointments" && "Monitor service bookings and appointment status"}
                {activeSection === "products" && "Monitor and manage all products in the marketplace"}
                {activeSection === "services" && "Monitor and manage all services offered by providers"}
                {activeSection === "categories" && "Manage product categories, subcategories, brands, and filtering attributes"}
                {activeSection === "orders" && "Monitor and manage customer orders, cart items, and fulfillment"}
                {activeSection === "payouts" && "Manage vendor disbursements and payout requests"}
                {activeSection === "commission" && "Configure platform and vendor commission percentages"}
                {activeSection === "deliveries" && "Comprehensive delivery tracking and management"}
                {activeSection === "courier-config" && "Configure delivery providers and courier settings"}
                {activeSection === "logistics-settings" && "Delivery fee formula, surge pricing and fulfillment rules"}
                {activeSection === "verticals" && "Manage top-level market verticals to organise products, services, and discovery feeds"}
                {activeSection === "analytics" && "Detailed platform analytics and insights"}
                {activeSection === "admin-analytics" && "Advanced metrics dashboard with real-time KPIs"}
                {activeSection === "disputes" && "Review and resolve customer disputes and refund requests"}
                {activeSection === "settings" && "System configuration and admin settings"}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Super Admin
            </Badge>
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
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-full">
                        <Store className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalVendors}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Package className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900">{(stats.totalProducts + stats.totalServices).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">KES {Number(stats.totalRevenue).toLocaleString('en-KE')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-orange-100 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-800">Pending Vendors</p>
                        <p className="text-2xl font-bold text-orange-900">{stats.pendingVendors}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-red-100 p-3 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-800">Flagged Orders</p>
                        <p className="text-2xl font-bold text-red-900">0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-800">Active Users</p>
                        <p className="text-2xl font-bold text-green-900">{stats.totalUsers.toLocaleString()}</p>
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
                      Platform Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Growth chart placeholder</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="w-5 h-5 mr-2" />
                      Revenue by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                          <span className="text-gray-600">Electronics (35%)</span>
                        </div>
                        <span className="font-semibold">KSh 2,087,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                          <span className="text-gray-600">Fashion (28%)</span>
                        </div>
                        <span className="font-semibold">KSh 1,670,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                          <span className="text-gray-600">Services (22%)</span>
                        </div>
                        <span className="font-semibold">KSh 1,312,000</span>
                      </div>
                      <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center mt-4">
                        <p className="text-gray-500">Revenue chart placeholder</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === "users" && <UserManagement />}

          {activeSection === "vendors" && !isVendorDetail && <VendorManagement />}

          {activeSection === "vendors" && isVendorDetail && params.vendorId && (
            <VendorView
              vendorId={params.vendorId}
              onBack={() => setLocation("/admin-portal/dashboard/vendors")}
            />
          )}

          {activeSection === "vendor-requests" && <VendorRequests />}

          {activeSection === "appointments" && <ManageAppointments />}

          {activeSection === "products" && <ProductsManagement />}

          {activeSection === "services" && <ServicesManagement />}

          {activeSection === "service-categories" && <ServiceCategoryManagement />}

          {activeSection === "categories" && <CategoriesManagement />}

          {activeSection === "orders" && <OrdersManagement />}

          {activeSection === "earnings" && <EarningsManagementAdmin />}
          {activeSection === "commission" && <CommissionSettings />}

          {activeSection === "deliveries" && <DeliveryPortalContent />}
          
          {activeSection === "courier-config" && <CourierConfiguration />}

          {activeSection === "logistics-settings" && <LogisticsSettings />}

          {activeSection === "verticals" && <VerticalsManagement />}

          {activeSection === "analytics" && <AnalyticsDashboard />}

          {activeSection === "admin-analytics" && <AdminAnalytics />}
          {activeSection === "disputes" && <DisputeResolution />}

          {activeSection === "settings" && <AdminSettingsPanel />}
        </div>
      </div>
    </div>
  );
}