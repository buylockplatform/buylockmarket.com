import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProximityBadgeProps {
  distance?: number;
  className?: string;
}

export function ProximityBadge({ distance, className = "" }: ProximityBadgeProps) {
  // Debug logging
  console.log("ProximityBadge received distance:", distance, typeof distance);
  
  // Show badge for any valid distance
  if (distance === undefined || distance === null || distance === Infinity) {
    return null;
  }

  const formatDistance = (distanceKm: number): string => {
    console.log("Formatting distance:", distanceKm, "type:", typeof distanceKm);
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km away`;
    } else {
      return `${Math.round(distanceKm)}km away`;
    }
  };

  const getDistanceColor = (distanceKm: number): string => {
    if (distanceKm < 5) return "bg-green-100 text-green-800";
    if (distanceKm < 15) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <Badge 
      variant="secondary" 
      className={`${getDistanceColor(distance)} ${className} text-xs font-medium`}
    >
      <MapPin className="w-3 h-3 mr-1" />
      {formatDistance(distance)}
    </Badge>
  );
}