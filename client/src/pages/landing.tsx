import { HeroSection } from "@/components/hero-section";
import { CategoryGrid } from "@/components/category-grid";
import { FlashDeals } from "@/components/flash-deals";
import { WhyChoose } from "@/components/why-choose";
import { Newsletter } from "@/components/newsletter";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen" style={{ background: "#FAFAFB" }}>
      <Header />
      <HeroSection />
      <CategoryGrid />
      <FlashDeals />

      {/* Featured Products Section */}
      <section className="bg-white py-14 border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="bl-section-title">Featured Products</h2>
              <p className="bl-section-sub mt-1">Handpicked products just for you</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" className="text-[#FF5A1F] font-semibold text-sm hover:underline p-0 hidden sm:flex items-center gap-1">
                View all products →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {productsLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-[#F1F5F9] bg-white">
                  <div className="bl-skeleton h-48 rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="bl-skeleton h-4 w-3/4" />
                    <div className="bl-skeleton h-4 w-1/2" />
                    <div className="bl-skeleton h-4 w-1/3" />
                  </div>
                </div>
              ))
            ) : (
              featuredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div
                    className="group relative bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden cursor-pointer"
                    style={{ boxShadow: "0 8px 30px rgba(15,23,42,.05)", transition: "transform 180ms ease-out, box-shadow 180ms ease-out" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.015)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 45px rgba(15,23,42,.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(15,23,42,.05)"; }}
                  >
                    <div className="relative overflow-hidden" style={{ height: "192px" }}>
                      <img src={product.imageUrl || ""} alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]" />
                      <div className="absolute top-3 left-3 bl-pill bg-[#FF5A1F]/10 text-[#FF5A1F] text-[10px]">Featured</div>
                      <button className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="h-4 w-4 text-[#9CA3AF]" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="text-[14px] font-semibold text-[#111827] line-clamp-2 mb-1.5 group-hover:text-[#FF5A1F] transition-colors">{product.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[12px] text-[#9CA3AF]">{parseFloat(product.rating || "0").toFixed(1)}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[16px] font-bold text-[#FF5A1F]">{formatPrice(product.price)}</span>
                        {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                          <span className="text-[12px] text-[#9CA3AF] line-through">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="bg-[#FAFAFB] py-14 border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="bl-section-title">Popular Services</h2>
              <p className="bl-section-sub mt-1">Professional services to meet your needs</p>
            </div>
            <Link href="/services">
              <Button variant="ghost" className="text-[#FF5A1F] font-semibold text-sm hover:underline p-0 hidden sm:flex items-center gap-1">
                View all services →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-[#F1F5F9] bg-white">
                  <div className="bl-skeleton h-48 rounded-none" />
                  <div className="p-4 space-y-3">
                    <div className="bl-skeleton h-5 w-3/4" />
                    <div className="bl-skeleton h-4 w-full" />
                    <div className="bl-skeleton h-4 w-2/3" />
                  </div>
                </div>
              ))
            ) : (
              featuredServices.map((service) => (
                <Link key={service.id} href={`/services/${service.slug}`}>
                  <div
                    className="group relative bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden cursor-pointer"
                    style={{ boxShadow: "0 8px 30px rgba(15,23,42,.05)", transition: "transform 180ms ease-out, box-shadow 180ms ease-out" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.015)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 45px rgba(15,23,42,.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(15,23,42,.05)"; }}
                  >
                    <div className="relative overflow-hidden" style={{ height: "192px" }}>
                      <img src={service.imageUrl || ""} alt={service.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]" />
                      <div className="absolute top-3 left-3 bl-pill bg-blue-100 text-blue-700 text-[10px]">Service</div>
                      {service.isAvailableToday && (
                        <div className="absolute top-3 right-3 bl-pill bg-emerald-500 text-white text-[10px]">Available Today</div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-[15px] font-semibold text-[#111827] mb-1 group-hover:text-[#FF5A1F] transition-colors">{service.name}</h3>
                      <p className="text-[13px] text-[#6B7280] line-clamp-2 mb-3">{service.shortDescription}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[17px] font-bold text-[#FF5A1F]">{formatPrice(service.price)}</span>
                          {service.priceType && <span className="text-[12px] text-[#9CA3AF] ml-1">/{service.priceType}</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[12px] text-[#9CA3AF]">{parseFloat(service.rating || "0").toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
