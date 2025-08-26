import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ProximityBadge } from "@/components/ProximityBadge";
import type { Service } from "@shared/schema";
import { ServicePriceDisplay } from "./ServicePriceDisplay";

interface ServiceCardProps {
  service: Service & { distance?: number };
  showDistanceBadge?: boolean;
}

export function ServiceCard({ service, showDistanceBadge = false }: ServiceCardProps) {
  console.log("ServiceCard received service:", service.name, "distance:", service.distance, "showDistanceBadge:", showDistanceBadge);

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
            <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Available Today
            </div>
          )}
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
              priceType={service.priceType || "fixed"}
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
