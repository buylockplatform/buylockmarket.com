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
import VerifyRiders from "./verify-riders";
import RiderEarnings from "./rider-earnings";
import DeliveryPersonnel from "./delivery-personnel";
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

    { id: "orders", label: "Orders", icon: TrendingUp },
    { id: "earnings", label: "Earnings Management", icon: DollarSign },
    { id: "commission", label: "Commission Settings", icon: Settings },
    { id: "deliveries", label: "Delivery", icon: Truck },
    { id: "rider-fleet", label: "Rider Fleet", icon: Truck },
    { id: "verify-riders", label: "Verify Riders", icon: CheckCircle },
    { id: "rider-earnings", label: "Rider Earnings", icon: DollarSign },
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
    <div className="min-h-screen bg-[#FAFAFB] flex admin-portal-dashboard">
      {/* Sidebar */}
      <div className="w-64 flex flex-col dashboard-sidebar">
        {/* Header */}
        <div className="p-6 border-b border-[#F1F5F9]">
          <Link href="/admin-portal" className="flex items-center space-x-3 hover:bg-[#FAFAFB] p-2 rounded-xl transition-all duration-200">
            <div className="dashboard-sidebar-header-icon p-2.5">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">BuyLock Admin</h1>
              <p className="text-sm text-gray-500">{adminData.name}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3.5 flex-1 space-y-1 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors dashboard-sidebar-btn ${
                      activeSection === item.id
                        ? "dashboard-sidebar-btn-active"
                        : "dashboard-sidebar-btn-inactive"
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
        <div className="p-4 border-t border-[#F1F5F9]">
          <Button
            variant="outline"
            className="w-full justify-start border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl transition-colors font-medium py-5"
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
        <div className="bg-white border-b border-[#F1F5F9] px-8 py-5">
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
                {activeSection === "rider-fleet" && "View and manage all delivery riders in your fleet"}
                {activeSection === "verify-riders" && "Review and approve or reject rider applications"}
                {activeSection === "rider-earnings" && "Manage rider earnings, approvals, and M-Pesa payouts"}
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
                <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-blue-50 text-blue-600 p-3.5 rounded-2xl">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalUsers.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-2xl">
                        <Store className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-500">Total Vendors</p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalVendors}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-500">Total Products</p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">{(stats.totalProducts + stats.totalServices).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-purple-50 text-purple-600 p-3.5 rounded-2xl">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-[#FF5A1F] mt-0.5">KES {Number(stats.totalRevenue).toLocaleString('en-KE')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alert Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-orange-100 bg-orange-50/40 rounded-2xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-orange-100 text-orange-600 p-3.5 rounded-2xl">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-orange-800">Pending Vendors</p>
                        <p className="text-2xl font-bold text-orange-900 mt-0.5">{stats.pendingVendors}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-100 bg-red-50/40 rounded-2xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-red-100 text-red-600 p-3.5 rounded-2xl">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-red-800">Flagged Orders</p>
                        <p className="text-2xl font-bold text-red-900 mt-0.5">0</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-100 bg-green-50/40 rounded-2xl shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="bg-green-100 text-green-600 p-3.5 rounded-2xl">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-green-800">Active Users</p>
                        <p className="text-2xl font-bold text-green-900 mt-0.5">{stats.totalUsers.toLocaleString()}</p>
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
          {activeSection === "rider-fleet" && <DeliveryPersonnel />}
          {activeSection === "verify-riders" && <VerifyRiders />}
          {activeSection === "rider-earnings" && <RiderEarnings />}
          
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