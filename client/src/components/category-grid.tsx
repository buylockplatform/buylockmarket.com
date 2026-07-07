import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

const defaultCategories = [
  { id: "1", name: "Electronics",    slug: "electronics",   sub: "Top gadgets & devices",  imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&h=300" },
  { id: "2", name: "Fashion",        slug: "fashion",       sub: "Trendy styles",           imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&h=300" },
  { id: "3", name: "Home & Kitchen", slug: "home-kitchen",  sub: "Essential for home",      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&h=300" },
  { id: "4", name: "Health & Beauty",slug: "health-beauty", sub: "Look & feel your best",   imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&h=300" },
  { id: "5", name: "Sports",         slug: "sports",        sub: "Gear up & play active",   imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&h=300" },
  { id: "6", name: "Books",          slug: "books",         sub: "Read, Learn, Grow",       imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=300" },
  { id: "7", name: "Services",       slug: "services",      sub: "Professional help",       imageUrl: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=400&h=300" },
];

export function CategoryGrid() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const display = (categories.length > 0 ? categories : defaultCategories).slice(0, 7);

  return (
    <section className="bg-[#FAFAFB] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="bl-section-title">Shop by Category</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-[#FF5A1F] hover:underline flex items-center gap-1 transition-colors">
            View all categories →
          </Link>
        </div>

        {/* Grid — 2 cols mobile → 4 tablet → 7 desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="bl-skeleton rounded-2xl h-[220px]" />
              ))
            : display.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={cat.slug === "services" ? "/shop?product_type=services" : `/shop?category=${cat.slug}`}
                >
                  <div
                    className="group relative overflow-hidden rounded-2xl cursor-pointer bg-white border border-[#F1F5F9]"
                    style={{
                      height: "220px",
                      boxShadow: "0 8px 30px rgba(15,23,42,.05)",
                      transition: "transform 180ms ease-out, box-shadow 180ms ease-out",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.015)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 15px 45px rgba(15,23,42,.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(15,23,42,.05)";
                    }}
                  >
                    {/* Image */}
                    <img
                      src={cat.imageUrl || ""}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-semibold text-[13px] leading-tight">{cat.name}</p>
                      <p className="text-white/70 text-[11px] mt-0.5 leading-tight line-clamp-1">
                        {(cat as any).sub || ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
