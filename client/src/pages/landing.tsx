import { HeroSection } from "@/components/hero-section";
import { CategoryGrid } from "@/components/category-grid";
import { FlashDeals } from "@/components/flash-deals";
import { WhyChoose } from "@/components/why-choose";
import { Newsletter } from "@/components/newsletter";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Heart, Star, ArrowRight, Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Product, Service } from "@shared/schema";

export default function Landing() {
  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { featured: true, limit: 5 }],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true, // Always enable this query regardless of auth state
  });

  const { data: featuredServices = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", { featured: true, limit: 3 }],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true, // Always enable this query regardless of auth state
  });

  // Format price to KES
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />
      <CategoryGrid />
      <FlashDeals />
      
      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked products just for you</p>
            </div>
            <Link href="/products">
              <Button variant="outline" className="hidden sm:flex">
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {productsLoading ? (
              [...Array(5)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={product.imageUrl || ""}
                          alt={product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Featured
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.shortDescription}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(product.originalPrice)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600">
                              {parseFloat(product.rating || "0").toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Popular Services</h2>
              <p className="text-gray-600">Professional services to meet your needs</p>
            </div>
            <Link href="/services">
              <Button variant="outline" className="hidden sm:flex">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesLoading ? (
              [...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-6 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              featuredServices.map((service) => (
                <Link key={service.id} href={`/services/${service.slug}`}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={service.imageUrl || ""}
                          alt={service.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Featured
                          </Badge>
                        </div>
                        {service.isAvailableToday && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="default" className="bg-green-500 text-white">
                              Available Today
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {service.shortDescription}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 mb-4">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{service.location}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xl font-bold text-gray-900">
                              {formatPrice(service.price)}
                            </span>
                            {service.priceType && (
                              <span className="text-sm text-gray-600">/{service.priceType}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600">
                              {parseFloat(service.rating || "0").toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <WhyChoose />
      <Newsletter />
      <Footer />
    </div>
  );
}
