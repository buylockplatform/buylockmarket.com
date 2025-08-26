import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Shield, Users, BarChart3, Settings, TrendingUp, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PriceDisplay } from "@/components/PriceDisplay";

// Platform Overview Component
function PlatformOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-buylock-primary mb-2 animate-pulse bg-gray-200 h-8 rounded"></div>
              <div className="text-gray-600 animate-pulse bg-gray-200 h-4 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
      <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Platform Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-buylock-primary mb-2">
            {stats?.totalUsers?.toLocaleString() || '0'}
          </div>
          <div className="text-gray-600">Active Users</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-buylock-primary mb-2">
            {stats?.totalVendors?.toLocaleString() || '0'}
          </div>
          <div className="text-gray-600">Registered Vendors</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-buylock-primary mb-2">
            {((stats?.totalProducts || 0) + (stats?.totalServices || 0)).toLocaleString()}
          </div>
          <div className="text-gray-600">Products & Services</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-buylock-primary mb-2">
            <PriceDisplay amount={stats?.totalRevenue || 0} />
          </div>
          <div className="text-gray-600">Total Revenue</div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-buylock-primary text-white p-2 rounded-lg">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BuyLock Admin Portal</h1>
                <p className="text-gray-600">Platform Administration & Management</p>
              </div>
            </div>
            <Button 
              onClick={handleAdminLogin}
              className="bg-buylock-primary hover:bg-buylock-primary/90"
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
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Comprehensive Platform Management
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Access powerful administrative tools to manage users, vendors, products, and platform operations. 
            Monitor performance metrics, handle approvals, and configure system settings all from one central dashboard.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">User Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor customer accounts, track user activity, manage registrations, 
                and handle user support requests efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Vendor Oversight</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Review vendor applications, manage verifications, track performance metrics, 
                and oversee vendor compliance with platform policies.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Analytics & Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access detailed platform analytics, revenue reports, user engagement metrics, 
                and comprehensive business intelligence dashboards.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Performance Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor platform performance, track key metrics, identify growth opportunities, 
                and optimize system efficiency in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Settings className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">System Configuration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure platform settings, manage payment parameters, update policies, 
                and control system-wide features and functionality.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Security & Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
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
          <Card className="bg-buylock-primary text-white">
            <CardContent className="py-12">
              <h3 className="text-3xl font-bold mb-4">Ready to Manage Your Platform?</h3>
              <p className="text-xl mb-8 opacity-90">
                Access your administrative dashboard and take control of your marketplace operations.
              </p>
              <Button 
                onClick={handleAdminLogin}
                variant="secondary"
                size="lg"
                className="bg-white text-buylock-primary hover:bg-gray-100 font-semibold px-8 py-3"
              >
                Access Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 BuyLock Marketplace. All rights reserved.</p>
            <p className="mt-2 text-sm">Secure administrative access for authorized personnel only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}