import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Bike, MapPin, Store, Home, Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- Marker Icons ---
const riderIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: #3B82F6; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const shopIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: #F97316; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const homeIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: #22C55E; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// --- Haversine Distance ---
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- API Response ---
interface RiderLocationResponse {
  rider: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    latitude: string;
    longitude: string;
    isOnline: boolean;
  } | null;
  shop: {
    latitude: string;
    longitude: string;
    name: string;
  };
  destination: {
    latitude: string;
    longitude: string;
    address: string;
  };
  jobStatus: string;
}

// --- Map auto-fit component ---
function MapBoundsUpdater({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, bounds]);

  return null;
}

// --- Props ---
interface LiveTrackingProps {
  orderId: string;
  className?: string;
}

export default function LiveTracking({ orderId, className }: LiveTrackingProps) {
  const mapRef = useRef<L.Map | null>(null);

  const { data, isLoading, error } = useQuery<RiderLocationResponse>({
    queryKey: [`/api/orders/${orderId}/rider-location`],
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  // Compute positions
  const positions = useMemo(() => {
    if (!data) return null;

    const shopLat = parseFloat(data.shop.latitude);
    const shopLng = parseFloat(data.shop.longitude);
    const destLat = parseFloat(data.destination.latitude);
    const destLng = parseFloat(data.destination.longitude);

    const result: {
      shop: [number, number];
      destination: [number, number];
      rider?: [number, number];
    } = {
      shop: [shopLat, shopLng],
      destination: [destLat, destLng],
    };

    if (data.rider) {
      const riderLat = parseFloat(data.rider.latitude);
      const riderLng = parseFloat(data.rider.longitude);
      result.rider = [riderLat, riderLng];
    }

    return result;
  }, [data]);

  // Map bounds
  const bounds = useMemo(() => {
    if (!positions) return null;

    const points: [number, number][] = [positions.shop, positions.destination];
    if (positions.rider) points.push(positions.rider);

    return L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
  }, [positions]);

  // Distance calculation
  const distanceToDestination = useMemo(() => {
    if (!positions?.rider) return null;
    return haversineDistance(
      positions.rider[0],
      positions.rider[1],
      positions.destination[0],
      positions.destination[1]
    );
  }, [positions]);

  // --- Loading state ---
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <Skeleton className="w-full h-[350px] rounded-t-lg" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Unable to load tracking</p>
          <p className="text-sm text-gray-500 mt-1">Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  // --- Waiting for rider ---
  if (!data?.rider) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          {/* Still show the map with shop & destination */}
          {positions && (
            <div className="h-[300px] rounded-t-lg overflow-hidden">
              <MapContainer
                center={positions.shop}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {bounds && <MapBoundsUpdater bounds={bounds} />}
                <Marker position={positions.shop} icon={shopIcon}>
                  <Popup>{data?.shop.name || "Pickup Location"}</Popup>
                </Marker>
                <Marker position={positions.destination} icon={homeIcon}>
                  <Popup>{data?.destination.address || "Delivery Destination"}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
          <div className="p-5 text-center">
            <div className="animate-pulse inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
              <Bike className="w-4 h-4" />
              Waiting for rider assignment…
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A rider will be assigned shortly. This page updates automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Full tracking view ---
  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Map */}
        <div className="h-[350px] rounded-t-lg overflow-hidden relative">
          {positions && (
            <MapContainer
              center={positions.rider || positions.shop}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {bounds && <MapBoundsUpdater bounds={bounds} />}

              {/* Rider marker */}
              {positions.rider && (
                <Marker position={positions.rider} icon={riderIcon}>
                  <Popup>
                    <strong>{data.rider.firstName} {data.rider.lastName}</strong>
                    <br />
                    Rider
                  </Popup>
                </Marker>
              )}

              {/* Shop marker */}
              <Marker position={positions.shop} icon={shopIcon}>
                <Popup>{data.shop.name}</Popup>
              </Marker>

              {/* Destination marker */}
              <Marker position={positions.destination} icon={homeIcon}>
                <Popup>{data.destination.address}</Popup>
              </Marker>
            </MapContainer>
          )}

          {/* Status badge overlay */}
          <div className="absolute top-3 left-3 z-[1000]">
            <Badge
              variant="secondary"
              className="bg-white/95 backdrop-blur-sm shadow-md text-xs font-medium px-3 py-1.5"
            >
              <Navigation className="w-3 h-3 mr-1.5 text-blue-500" />
              {data.jobStatus === "picked_up" ? "Out for Delivery" :
               data.jobStatus === "in_transit" ? "On the Way" :
               data.jobStatus === "arriving" ? "Arriving Soon" :
               data.jobStatus}
            </Badge>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 pt-3 flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            Rider
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
            Shop
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            Your Location
          </span>
        </div>

        {/* Rider Info Panel */}
        <div className="p-4 border-t mt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {data.rider.firstName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {data.rider.firstName} {data.rider.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {data.rider.isOnline ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Online
                    </span>
                  ) : (
                    <span className="text-gray-400">Offline</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {distanceToDestination !== null && (
                <Badge variant="outline" className="text-xs px-2.5 py-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  {distanceToDestination < 1
                    ? `${Math.round(distanceToDestination * 1000)}m`
                    : `${distanceToDestination.toFixed(1)}km`}
                  &nbsp;away
                </Badge>
              )}
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4"
                onClick={() => window.open(`tel:${data.rider!.phone}`, "_self")}
              >
                <Phone className="w-4 h-4 mr-1.5" />
                Call
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
