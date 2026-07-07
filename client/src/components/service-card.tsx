import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ProximityBadge } from "@/components/ProximityBadge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Service } from "@shared/schema";
import { ServicePriceDisplay } from "./ServicePriceDisplay";

interface ServiceCardProps {
  service: Service & { distance?: number };
  showDistanceBadge?: boolean;
}

export function ServiceCard({ service, showDistanceBadge = false }: ServiceCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wishlist to check if this service is wishlisted
  const { data: wishlist = [] } = useQuery<Array<{ id: string; productId: string | null; serviceId: string | null }>>({
    queryKey: ["/api/wishlist"],
    enabled: isAuthenticated,
  });
  const isWished = wishlist.some((w) => w.serviceId === service.id);
  const wishlistEntry = wishlist.find((w) => w.serviceId === service.id);

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWished && wishlistEntry) {
        await apiRequest(`/api/wishlist/${wishlistEntry.id}`, "DELETE");
      } else {
        await apiRequest("/api/wishlist", "POST", { serviceId: service.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({
        title: isWished ? "Removed from wishlist" : "Added to wishlist",
        description: isWished ? `${service.name} removed` : `${service.name} saved to wishlist`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update wishlist", variant: "destructive" });
    },
  });

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ title: "Login required", description: "Please log in to save items", variant: "destructive" });
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <Link href={`/services/${service.slug}`}>
      <div
        className="group relative bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden cursor-pointer"
        style={{
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
        <div className="relative overflow-hidden" style={{ height: "192px" }}>
          <img
            src={service.imageUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&h=250"}
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
          />
          {service.isAvailableToday && (
            <div className="absolute top-3 left-3 bl-pill bg-emerald-500 text-white text-[10px]">
              Available Today
            </div>
          )}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-10"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? "fill-[#FF5A1F] text-[#FF5A1F]" : "text-[#9CA3AF]"}`} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-[#111827] mb-1 group-hover:text-[#FF5A1F] transition-colors line-clamp-1">
            {service.name}
          </h3>
          <p className="text-[13px] text-[#6B7280] mb-3 line-clamp-2">{service.shortDescription}</p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(parseFloat(service.rating || "0")) ? "fill-yellow-400 text-yellow-400" : "text-[#E5E7EB]"}`} />
              ))}
            </div>
            <span className="text-[11px] text-[#9CA3AF]">({service.reviewCount || 0})</span>
          </div>

          <div className="flex items-center justify-between">
            <ServicePriceDisplay price={service.price} priceType={(service.priceType as any) || "fixed"} size="lg" className="text-[#FF5A1F] font-bold" />
            <Button className="bg-[#FF5A1F] text-white text-[12px] font-semibold px-4 py-2 rounded-xl hover:bg-[#e64e17] transition-colors h-auto">
              Book Now
            </Button>
          </div>

          {showDistanceBadge && <ProximityBadge distance={service.distance} className="mt-2" />}
        </div>
      </div>
    </Link>
  );
}
