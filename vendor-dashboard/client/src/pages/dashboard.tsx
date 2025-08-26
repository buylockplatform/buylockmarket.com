import { useQuery } from "@tanstack/react-query";
import VendorLayout from "@/components/vendor-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, TrendingUp, DollarSign, Plus, Eye } from "lucide-react";
import { useLocation } from "wouter";
import type { Product, Service, Vendor } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: vendor } = useQuery<Vendor>({
    queryKey: ["/api/auth/vendor"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const stats = [
    {
      title: "Total Products",
      value: products.length,
      icon: Package,
      action: () => setLocation("/products"),
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Services",
      value: services.length,
      icon: Users,
      action: () => setLocation("/services"),
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Listings",
      value: products.filter(p => p.active).length + services.filter(s => s.active).length,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Revenue (Demo)",
      value: "KES 2.5M",
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  const recentProducts = products.slice(0, 5);
  const recentServices = services.slice(0, 5);

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {vendor?.contactName}! Here's your business overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setLocation("/products")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
            <Button variant="outline" onClick={() => setLocation("/services")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  stat.action ? "hover:scale-105" : ""
                }`}
                onClick={stat.action}
              >
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Business Info */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Business Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {vendor?.businessName}</p>
                  <p><span className="font-medium">Contact:</span> {vendor?.contactName}</p>
                  <p><span className="font-medium">Email:</span> {vendor?.email}</p>
                  <p><span className="font-medium">Phone:</span> {vendor?.phone || "Not provided"}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Verification:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      vendor?.verified 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {vendor?.verified ? "Verified" : "Pending"}
                    </span>
                  </p>
                  <p><span className="font-medium">Address:</span> {vendor?.address || "Not provided"}</p>
                  <p><span className="font-medium">Description:</span> {vendor?.description || "No description"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Products</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/products")}>
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {recentProducts.length > 0 ? (
                <div className="space-y-3">
                  {recentProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-sm text-gray-600">KES {Number(product.price).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Stock: {product.stockCount}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {product.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No products yet</p>
                  <Button className="mt-3" onClick={() => setLocation("/products")}>
                    Add your first product
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Services */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Services</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/services")}>
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {recentServices.length > 0 ? (
                <div className="space-y-3">
                  {recentServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{service.name}</p>
                        <p className="text-sm text-gray-600">KES {Number(service.price).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{service.duration}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          service.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {service.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No services yet</p>
                  <Button className="mt-3" onClick={() => setLocation("/services")}>
                    Add your first service
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </VendorLayout>
  );
}