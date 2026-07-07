import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/hero-section";
import { CategoryGrid } from "@/components/category-grid";
import { FlashDeals } from "@/components/flash-deals";
import { ProductCard } from "@/components/product-card";
import { ServiceCard } from "@/components/service-card";
import { WhyChoose } from "@/components/why-choose";
import { Newsletter } from "@/components/newsletter";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Product, Service } from "@shared/schema";

export default function Home() {

  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { featured: true, limit: 5 }],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true,
  });

  const { data: featuredServices = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", { featured: true, limit: 3 }],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true,
  });

  return (
    <div className="min-h-screen" style={{ background: "#FAFAFB" }}>
      <Header />
      <HeroSection />
      <CategoryGrid />
      <FlashDeals />

      {/* Featured Products */}
      <section className="bg-white py-14 border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="bl-section-title">Featured Products</h2>
              <p className="bl-section-sub mt-1">Handpicked products just for you</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="text-[#FF5A1F] font-semibold text-sm hover:underline p-0">
                View all products →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {productsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-[#F1F5F9] bg-white">
                  <div className="bl-skeleton h-48 rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="bl-skeleton h-4 w-3/4" />
                    <div className="bl-skeleton h-4 w-1/2" />
                    <div className="bl-skeleton h-4 w-1/3" />
                  </div>
                </div>
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#9CA3AF]">No featured products available</div>
            ) : (
              featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)
            )}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="bg-[#FAFAFB] py-14 border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="bl-section-title">Popular Services</h2>
              <p className="bl-section-sub mt-1">Professional services tailored for you</p>
            </div>
            <Link href="/services">
              <Button variant="ghost" className="text-[#FF5A1F] font-semibold text-sm hover:underline p-0">
                View all services →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-[#F1F5F9] bg-white">
                  <div className="bl-skeleton h-48 rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="bl-skeleton h-5 w-3/4" />
                    <div className="bl-skeleton h-4 w-full" />
                    <div className="bl-skeleton h-4 w-1/2" />
                  </div>
                </div>
              ))
            ) : featuredServices.length === 0 ? (
              <div className="col-span-full text-center py-12 text-[#9CA3AF]">No featured services available</div>
            ) : (
              featuredServices.map((service) => <ServiceCard key={service.id} service={service} />)
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
