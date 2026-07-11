import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Users, BarChart3, Settings, TrendingUp, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PriceDisplay } from "@/components/PriceDisplay";

// Platform Overview Component
function PlatformOverview() {
  const { data: stats, isLoading } = useQuery<{
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalServices: number;
    totalRevenue: number;
  }>({
    queryKey: ['/api/admin/stats'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-[#FF5A1F] mb-2 animate-pulse bg-gray-100 h-8 rounded"></div>
              <div className="text-gray-500 animate-pulse bg-gray-100 h-4 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.05)] p-8 mb-12">
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-[#FF5A1F] mb-2">
            {stats?.totalUsers?.toLocaleString() || '0'}
          </div>
          <div className="text-gray-500">Active Users</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#FF5A1F] mb-2">
            {stats?.totalVendors?.toLocaleString() || '0'}
          </div>
          <div className="text-gray-500">Registered Vendors</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#FF5A1F] mb-2">
            {((stats?.totalProducts || 0) + (stats?.totalServices || 0)).toLocaleString()}
          </div>
          <div className="text-gray-500">Products & Services</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-[#FF5A1F] mb-2">
            <PriceDisplay price={stats?.totalRevenue || 0} />
          </div>
          <div className="text-gray-500">Total Revenue</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const [, setLocation] = useLocation();

  const handleAdminLogin = () => {
    setLocation("/admin-portal/login");
  };

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F1F5F9] py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-3">
              <div className="bg-[#FF5A1F]/10 text-[#FF5A1F] p-2 rounded-xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BuyLock Admin Portal</h1>
                <p className="text-gray-600">Platform Administration & Management</p>
              </div>
            </div>
            <Button 
              onClick={handleAdminLogin}
              className="bg-[#FF5A1F] hover:bg-[#e64e17] text-white rounded-[14px] px-6 py-2.5 font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,90,31,0.25)] transition-all shadow-sm border-none"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
            Comprehensive Platform Management
          </h2>
          <p className="text-lg text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Access powerful administrative tools to manage users, vendors, products, and platform operations. 
            Monitor performance metrics, handle approvals, and configure system settings all from one central dashboard.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">User Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Monitor customer accounts, track user activity, manage registrations, 
                and handle user support requests efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <Database className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Vendor Oversight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Review vendor applications, manage verifications, track performance metrics, 
                and oversee vendor compliance with platform policies.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15, 23, 42, 0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15, 23, 42, 0.08)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Analytics & Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Access detailed platform analytics, revenue reports, user engagement metrics, 
                and comprehensive business intelligence dashboards.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15, 23, 42, 0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15, 23, 42, 0.08)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Performance Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Monitor platform performance, track key metrics, identify growth opportunities, 
                and optimize system efficiency in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15, 23, 42, 0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15, 23, 42, 0.08)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-red-50 text-red-600 p-3 rounded-xl">
                  <Settings className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">System Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Configure platform settings, manage payment parameters, update policies, 
                and control system-wide features and functionality.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15, 23, 42, 0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15, 23, 42, 0.08)] transition-all duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl">Security & Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Ensure platform security, manage admin permissions, monitor compliance, 
                and handle security incidents and policy enforcement.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <PlatformOverview />

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-[#FF5A1F] to-[#e64e17] text-white border-none rounded-2xl shadow-[0_15px_45px_rgba(255,90,31,0.25)] relative overflow-hidden">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Manage Your Platform?</h3>
              <p className="text-xl mb-8 opacity-90">
                Access your administrative dashboard and take control of your marketplace operations.
              </p>
              <Button 
                onClick={handleAdminLogin}
                variant="secondary"
                size="lg"
                className="bg-white text-[#FF5A1F] hover:bg-gray-50 font-semibold px-8 py-3.5 shadow-lg hover:-translate-y-0.5 transition-all rounded-[14px] border-none"
              >
                Access Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#F1F5F9] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2026 BuyLock Marketplace. All rights reserved.</p>
            <p className="mt-2 text-sm text-gray-400">Secure administrative access for authorized personnel only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}