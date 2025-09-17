import { useState, useRef, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LatLng, Map as LeafletMap } from "leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, Loader2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationData {
  latitude: number;
  longitude: number;
  description: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
  className?: string;
}

interface PlaceSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

// Component to handle map clicks
function MapClickHandler({ onLocationClick }: { onLocationClick: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e: any) {
      onLocationClick(e.latlng);
    },
  });
  return null;
}

export function LocationPicker({ onLocationSelect, initialLocation, className }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : [-1.2921, 36.8219] // Nairobi, Kenya
  );
  const mapRef = useRef<LeafletMap | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle map click to select location
  const handleMapClick = async (latlng: LatLng) => {
    const { lat, lng } = latlng;
    
    try {
      // Reverse geocoding to get address description
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&countrycodes=ke&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        const location: LocationData = {
          latitude: lat,
          longitude: lng,
          description: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
      }
    } catch (error) {
      console.error("Error getting location description:", error);
      // Fallback to coordinates
      const location: LocationData = {
        latitude: lat,
        longitude: lng,
        description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      };
      
      setSelectedLocation(location);
      onLocationSelect(location);
    }
  };

  // Real-time search with debouncing
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query + ", Kenya"
        )}&countrycodes=ke&limit=5&addressdetails=1`
      );

      if (response.ok) {
        const data = await response.json();
        const placeSuggestions: PlaceSuggestion[] = data.map((place: any) => ({
          place_id: place.place_id,
          display_name: place.display_name,
          lat: place.lat,
          lon: place.lon,
        }));
        
        setSuggestions(placeSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Error searching places:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input changes with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: PlaceSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    const location: LocationData = {
      latitude: lat,
      longitude: lng,
      description: suggestion.display_name,
    };
    
    setSelectedLocation(location);
    setMapCenter([lat, lng]);
    setSearchQuery(suggestion.display_name.split(',').slice(0, 2).join(', '));
    setShowSuggestions(false);
    onLocationSelect(location);
    
    // Pan map to the selected location with error handling
    try {
      if (mapRef.current) {
        mapRef.current.setView([lat, lng], 15);
      }
    } catch (error) {
      console.error("Error updating map view:", error);
      // Fallback: update map center state
      setMapCenter([lat, lng]);
    }
  };

  // Clear search and suggestions
  const clearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Select Your Location
        </CardTitle>
        <CardDescription>
          Your location is used to search for products and services close to you. 
          Search for your address or click on the map to select your exact location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input with Suggestions */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search for your address in Kenya..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.length >= 3 && setShowSuggestions(true)}
                className="flex-1 pr-8"
                autoComplete="off"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            {isSearching && (
              <div className="flex items-center px-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
              </div>
            )}
          </div>
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[1000] mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.display_name.split(',').slice(0, 2).join(', ')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {suggestion.display_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">Selected Location:</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedLocation.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </p>
              </div>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onLocationSelect(selectedLocation)}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Pick Location
              </Button>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="h-96 rounded-lg overflow-hidden border">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
            key={`map-${mapCenter[0]}-${mapCenter[1]}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onLocationClick={handleMapClick} />
            {selectedLocation && (
              <Marker
                position={[selectedLocation.latitude, selectedLocation.longitude]}
                key={`marker-${selectedLocation.latitude}-${selectedLocation.longitude}`}
              />
            )}
          </MapContainer>
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Use the search box to find your address quickly</p>
          <p>• Click anywhere on the map to set your exact location</p>
          <p>• Your location helps us show you nearby products and services</p>
        </div>
      </CardContent>
    </Card>
  );
}