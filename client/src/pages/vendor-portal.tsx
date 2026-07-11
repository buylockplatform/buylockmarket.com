import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import OrderWorkflow from "@/pages/vendor-dashboard/components/OrderWorkflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Package, Users, TrendingUp, Settings, Plus, Eye, BarChart3 } from "lucide-react";

export default function VendorPortal() {
  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Portal</h1>
          <p className="text-gray-600">Manage your business on BuyLock marketplace</p>
        </div>

        {/* Coming Soon Notice */}
        <Card className="mb-8 border-l-4 border-l-[#FF5A1F] bg-white rounded-2xl border-y border-r border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-[#FF5A1F]/10 p-3 rounded-xl">
                <Store className="w-6 h-6 text-[#FF5A1F]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Become a Vendor?</h3>
                <p className="text-gray-500 mt-1">
                  Join BuyLock marketplace today with our enhanced registration process including document verification.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button 
                    onClick={() => window.location.href = "/vendor/registration"}
                    className="bg-[#FF5A1F] hover:bg-[#e64e17] text-white rounded-[14px] px-6 py-2.5 font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,90,31,0.25)] transition-all shadow-sm border-none"
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
          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Product Management</CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 border-none font-semibold text-[10px] rounded-full">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Add, edit, and manage your product catalog with rich descriptions, multiple images, and inventory tracking.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>• Bulk product uploads</li>
                <li>• Inventory management</li>
                <li>• SEO optimization</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Service Listings</CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 border-none font-semibold text-[10px] rounded-full">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                List your services with flexible pricing, availability scheduling, and customer booking management.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>• Service catalog</li>
                <li>• Booking calendar</li>
                <li>• Pricing tiers</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Analytics Dashboard</CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 border-none font-semibold text-[10px] rounded-full">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Track your sales performance, customer insights, and revenue analytics with detailed reports.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>• Sales reports</li>
                <li>• Customer insights</li>
                <li>• Performance metrics</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-orange-50 text-[#FF5A1F] p-2.5 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Order Management</CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 border-none font-semibold text-[10px] rounded-full">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Process orders efficiently with automated workflows, shipping integration, and customer communication.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>• Order processing</li>
                <li>• Shipping management</li>
                <li>• Customer communication</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Store Customization</CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 border-none font-semibold text-[10px] rounded-full">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Customize your store appearance, manage business settings, and configure payment methods.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>• Store branding</li>
                <li>• Payment setup</li>
                <li>• Business settings</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#F1F5F9] shadow-[0_8px_30px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:shadow-[0_15px_45px_rgba(15,23,42,0.08)] transition-all duration-300 bg-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Marketing Tools</CardTitle>
                  <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600 border-none font-semibold text-[10px] rounded-full">Coming Soon</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">
                Promote your products and services with built-in marketing tools, discounts, and promotional campaigns.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-400">
                <li>• Discount campaigns</li>
                <li>• Featured listings</li>
                <li>• Social media integration</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-[#FF5A1F] to-[#e64e17] text-white border-none rounded-2xl shadow-[0_15px_45px_rgba(255,90,31,0.25)] relative overflow-hidden">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Start Selling?</h3>
            <p className="text-white/80 mb-6 font-medium">
              Join thousands of vendors who trust BuyLock to grow their business. 
              Access your dedicated vendor dashboard to manage your store.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-[#FF5A1F] hover:bg-gray-50 rounded-[14px] font-semibold px-6 py-3.5 shadow-lg hover:-translate-y-0.5 transition-all border-none"
                onClick={() => window.location.href = '/vendor-dashboard'}
              >
                <Plus className="w-5 h-5 mr-2" />
                Access Vendor Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white/10 rounded-[14px] font-semibold px-6 py-3.5 hover:-translate-y-0.5 transition-all"
                onClick={() => window.location.href = '/vendor-dashboard/register'}
              >
                Register as Vendor
              </Button>
            </div>
            <div className="mt-4 text-xs text-white/50">
              <p>Dashboard URL: <strong>/vendor-dashboard</strong></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}