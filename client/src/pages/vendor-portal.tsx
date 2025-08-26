import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import OrderWorkflow from "@/pages/vendor-dashboard/components/OrderWorkflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, Users, TrendingUp, Settings, Plus, Eye, BarChart3 } from "lucide-react";

export default function VendorPortal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Portal</h1>
          <p className="text-gray-600">Manage your business on BuyLock marketplace</p>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mb-8 border-l-4 border-l-buylock-primary bg-gradient-to-r from-buylock-primary/5 to-white">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-buylock-primary/10 p-2 rounded-full">
                <Store className="w-6 h-6 text-buylock-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Become a Vendor?</h3>
                <p className="text-gray-600 mt-1">
                  Join BuyLock marketplace today with our enhanced registration process including document verification.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button 
                    onClick={() => window.location.href = "/vendor/registration"}
                    className="bg-buylock-primary hover:bg-buylock-primary/90"
                  >
                    Register as Vendor
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Product Management</CardTitle>
                  <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Add, edit, and manage your product catalog with rich descriptions, multiple images, and inventory tracking.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                <li>• Bulk product uploads</li>
                <li>• Inventory management</li>
                <li>• SEO optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Service Listings</CardTitle>
                  <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                List your services with flexible pricing, availability scheduling, and customer booking management.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                <li>• Service catalog</li>
                <li>• Booking calendar</li>
                <li>• Pricing tiers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Analytics Dashboard</CardTitle>
                  <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Track your sales performance, customer insights, and revenue analytics with detailed reports.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                <li>• Sales reports</li>
                <li>• Customer insights</li>
                <li>• Performance metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Order Management</CardTitle>
                  <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Process orders efficiently with automated workflows, shipping integration, and customer communication.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                <li>• Order processing</li>
                <li>• Shipping management</li>
                <li>• Customer communication</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Settings className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Store Customization</CardTitle>
                  <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Customize your store appearance, manage business settings, and configure payment methods.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                <li>• Store branding</li>
                <li>• Payment setup</li>
                <li>• Business settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Eye className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Marketing Tools</CardTitle>
                  <Badge variant="secondary" className="mt-1">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Promote your products and services with built-in marketing tools, discounts, and promotional campaigns.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-500">
                <li>• Discount campaigns</li>
                <li>• Featured listings</li>
                <li>• Social media integration</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-buylock-primary to-buylock-primary/80 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Selling?</h3>
            <p className="text-buylock-primary/20 mb-6">
              Join thousands of vendors who trust BuyLock to grow their business. 
              Access your dedicated vendor dashboard to manage your store.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-buylock-primary hover:bg-gray-100"
                onClick={() => window.location.href = '/vendor-dashboard'}
              >
                <Plus className="w-5 h-5 mr-2" />
                Access Vendor Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                onClick={() => window.location.href = '/vendor-dashboard/register'}
              >
                Register as Vendor
              </Button>
            </div>
            <div className="mt-4 text-sm text-buylock-primary/30">
              <p>Dashboard URL: <strong>/vendor-dashboard</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}