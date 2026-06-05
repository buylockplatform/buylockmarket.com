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
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border group cursor-pointer">
        <div className="relative">
          <img 
            src={service.imageUrl || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250"} 
            alt={service.name} 
            className="w-full h-48 object-cover rounded-t-xl"
          />
          {service.isAvailableToday && (
            <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Available Today
            </div>
          )}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition-colors z-10"
          >
            <Heart className={`w-4 h-4 transition-colors ${isWished ? 'fill-buylock-orange text-buylock-orange' : 'text-gray-600'}`} />
          </button>
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-2 text-xl">{service.name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-2">{service.shortDescription}</p>
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400 text-sm">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.floor(parseFloat(service.rating || "0")) ? 'fill-current' : ''}`} 
                />
              ))}
            </div>
            <span className="text-gray-500 text-sm ml-2">({service.reviewCount || 0} reviews)</span>
          </div>
          <div className="flex flex-col gap-4">
            <ServicePriceDisplay 
              price={service.price} 
              priceType={(service.priceType as any) || "fixed"}
              size="lg"
              className="text-buylock-primary" 
            />
            {showDistanceBadge && <ProximityBadge distance={service.distance} />}
            <Button className="bg-buylock-primary text-white hover:bg-buylock-primary/90 font-semibold w-full">
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
