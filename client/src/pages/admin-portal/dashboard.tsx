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
  Globe,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  Bike,
  FileCheck,
  Tag,
  Layers
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    people: true,
    requests: true,
    catalogue: true,
    categories: true,
    ordersAppointments: true,
    earnings: true,
    delivery: true,
    analytics: true,
    disputes: true,
    settings: true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

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

  const sidebarGroups = [
    {
      id: "overview",
      label: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      id: "people",
      label: "People",
      items: [
        { id: "users", label: "Users", icon: Users },
        { id: "vendors", label: "Vendors", icon: Store },
        { id: "rider-fleet", label: "Riders", icon: Bike },
      ],
    },
    {
      id: "requests",
      label: "Requests",
      items: [
        { id: "vendor-requests", label: "Vendor Requests", icon: FileCheck },
        { id: "verify-riders", label: "Rider Verification", icon: CheckCircle },
      ],
    },
    {
      id: "catalogue",
      label: "Catalogue",
      items: [
        { id: "products", label: "Products", icon: Package },
        { id: "services", label: "Services", icon: Wrench },
      ],
    },
    {
      id: "categories",
      label: "Categories",
      items: [
        { id: "categories", label: "Product Categories", icon: FolderOpen },
        { id: "service-categories", label: "Service Categories", icon: Tag },
      ],
    },
    {
      id: "ordersAppointments",
      label: "Orders & Appointments",
      items: [
        { id: "orders", label: "Orders", icon: ClipboardList },
        { id: "appointments", label: "Appointments", icon: Calendar },
        { id: "disputes", label: "Disputes", icon: AlertTriangle },
      ],
    },
    {
      id: "earnings",
      label: "Earnings",
      items: [
        { id: "earnings", label: "Platform Earnings", icon: DollarSign },
        { id: "commission", label: "Commission Settings", icon: CreditCard },
        { id: "rider-earnings", label: "Rider Earnings", icon: Bike },
      ],
    },
    {
      id: "delivery",
      label: "Delivery & Logistics",
      items: [
        { id: "deliveries", label: "Delivery Tracking", icon: Truck },
        { id: "courier-config", label: "Courier Config", icon: Settings },
        { id: "logistics-settings", label: "Logistics Settings", icon: Layers },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      items: [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "admin-analytics", label: "Advanced Analytics", icon: PieChart },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      items: [
        { id: "settings", label: "General Settings", icon: Settings },
      ],
    },
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
    <div className="min-h-screen bg-[#FAFAFB] lg:flex lg:h-screen admin-portal-dashboard">
      {/* Sidebar — fixed, independent scroll */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:h-screen lg:fixed lg:left-0 lg:top-0 dashboard-sidebar">
        {/* Header */}
        <div className="p-6 border-b border-[#F1F5F9] flex-shrink-0">
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

        {/* Navigation — scrollable independently */}
        <nav className="flex-1 overflow-y-auto min-h-0 py-2">
          {sidebarGroups.map((group) => {
            const isOpen = openGroups[group.id] !== false;
            const hasActive = group.items.some(item => item.id === activeSection);
            return (
              <div key={group.id} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left transition-all duration-150 ${
                    hasActive ? "text-[#FF5A1F]" : "text-gray-400"
                  } hover:text-gray-600`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">{group.label}</span>
                  {isOpen
                    ? <ChevronDown className="w-3 h-3" />
                    : <ChevronRight className="w-3 h-3" />
                  }
                </button>

                {/* Group Items */}
                {isOpen && (
                  <ul className="px-2 space-y-0.5 mb-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={`${group.id}-${item.id}`}>
                          <button
                            onClick={() => navigateTo(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-2.5 text-left transition-colors dashboard-sidebar-btn ${
                              activeSection === item.id
                                ? "dashboard-sidebar-btn-active"
                                : "dashboard-sidebar-btn-inactive"
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="font-medium text-sm">{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#F1F5F9] flex-shrink-0">
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
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#F1F5F9] px-8 py-5 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {isVendorDetail ? "Vendor Detail" : ({
                  "dashboard": "Dashboard",
                  "users": "Users",
                  "vendors": "Vendors",
                  "rider-fleet": "Riders",
                  "vendor-requests": "Vendor Requests",
                  "verify-riders": "Rider Verification",
                  "products": "Products",
                  "services": "Services",
                  "categories": "Product Categories",
                  "service-categories": "Service Categories",
                  "orders": "Orders",
                  "appointments": "Appointments",
                  "disputes": "Disputes",
                  "earnings": "Platform Earnings",
                  "commission": "Commission Settings",
                  "rider-earnings": "Rider Earnings",
                  "deliveries": "Delivery Tracking",
                  "courier-config": "Courier Configuration",
                  "logistics-settings": "Logistics Settings",
                  "analytics": "Analytics",
                  "admin-analytics": "Advanced Analytics",
                  "settings": "General Settings",
                } as Record<string, string>)[activeSection] || activeSection}
              </h2>
              <p className="text-gray-600">
                {activeSection === "dashboard" && "Overview of platform performance and metrics"}
                {activeSection === "users" && "Manage customer accounts and user activity"}
                {activeSection === "vendors" && !isVendorDetail && "Manage vendor accounts and verification"}
                {activeSection === "vendors" && isVendorDetail && "View vendor profile, orders, documents, and account controls"}
                {activeSection === "vendor-requests" && "Review vendor applications and approval requests"}
                {activeSection === "verify-riders" && "Review and approve or reject rider verification applications"}
                {activeSection === "appointments" && "Monitor service bookings and appointment status"}
                {activeSection === "products" && "Monitor and manage all products in the marketplace"}
                {activeSection === "services" && "Monitor and manage all services offered by providers"}
                {activeSection === "categories" && "Manage product categories, subcategories, brands, and filtering attributes"}
                {activeSection === "service-categories" && "Manage service categories and subcategories"}
                {activeSection === "orders" && "Monitor and manage customer orders, cart items, and fulfillment"}
                {activeSection === "disputes" && "Review and resolve customer disputes and refund requests"}
                {activeSection === "earnings" && "Platform-wide earnings overview and vendor payout management"}
                {activeSection === "commission" && "Configure platform and vendor commission percentages"}
                {activeSection === "rider-earnings" && "Manage rider earnings, approvals, and M-Pesa payouts"}
                {activeSection === "deliveries" && "Comprehensive delivery tracking and management"}
                {activeSection === "rider-fleet" && "View and manage all delivery riders in your fleet"}
                {activeSection === "courier-config" && "Configure delivery providers and courier settings"}
                {activeSection === "logistics-settings" && "Delivery fee formula, surge pricing and fulfillment rules"}
                {activeSection === "analytics" && "Detailed platform analytics and insights"}
                {activeSection === "admin-analytics" && "Advanced metrics dashboard with real-time KPIs"}
                {activeSection === "settings" && "System configuration and admin settings"}
              </p>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              Super Admin
            </Badge>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
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
    </div>
  );
}