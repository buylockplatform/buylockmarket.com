import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HeroSection } from "@/components/hero-section";
import { CategoryGrid } from "@/components/category-grid";
import { FlashDeals } from "@/components/flash-deals";
import { ProductCard } from "@/components/ProductCard";
import { ServiceCard } from "@/components/service-card";
import { WhyChoose } from "@/components/why-choose";
import { Newsletter } from "@/components/newsletter";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Product, Service } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: featuredProducts = [], isLoading: productsLoading, error: productsError } = useQuery<Product[]>({
    queryKey: ["/api/products", { featured: true, limit: 5 }],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true, // Always enable this query regardless of auth state
  });

  const { data: featuredServices = [], isLoading: servicesLoading, error: servicesError } = useQuery<Service[]>({
    queryKey: ["/api/services", { featured: true, limit: 3 }],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true, // Always enable this query regardless of auth state
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      await apiRequest("/api/cart", "POST", {
        productId,
        quantity: 1,
      });
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      const product = featuredProducts.find(p => p.id === productId);
      toast({
        title: "Added to cart",
        description: `${product?.name || 'Product'} has been added to your cart`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Login required",
          description: "Please log in to add items to cart",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to add items to cart",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return;
    }

    addToCartMutation.mutate({ productId: product.id });
  };

  // Debug logging
  console.log("Featured Products Query:", { 
    data: featuredProducts, 
    loading: productsLoading, 
    error: productsError,
    dataLength: featuredProducts?.length || 0 
  });
  console.log("Featured Services Query:", { 
    data: featuredServices, 
    loading: servicesLoading, 
    error: servicesError,
    dataLength: featuredServices?.length || 0 
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />
      <CategoryGrid />
      <FlashDeals />
      
      {/* Featured Products */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <Link href="/products">
            <Button variant="ghost" className="text-buylock-primary font-semibold hover:underline">
              View All
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {productsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border">
                <Skeleton className="w-full h-48 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))
          ) : featuredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No featured products available</p>
            </div>
          ) : (
            featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={handleAddToCart}
              />
            ))
          )}
        </div>
      </section>

      {/* Featured Services */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Popular Services</h2>
            <Link href="/services">
              <Button variant="ghost" className="text-buylock-primary font-semibold hover:underline">
                View All Services
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border">
                  <Skeleton className="w-full h-48 rounded-t-xl" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                </div>
              ))
            ) : featuredServices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No featured services available</p>
              </div>
            ) : (
              featuredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
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
