import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';

interface NominatimResult {
    place_id: number;
    display_name: string;
    address: {
        building?: string;
        road?: string;
        suburb?: string;
        neighbourhood?: string;
        quarter?: string;
        city?: string;
        town?: string;
        postcode?: string;
        country?: string;
    };
    lat: string;
    lon: string;
}

interface LocationData {
    address: string;
    city: string;
    suburb: string;
    building?: string;
    postalCode?: string;
}

interface LocationAutocompleteProps {
    onLocationSelect: (location: LocationData) => void;
    defaultValue?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
}

export function LocationAutocomplete({
    onLocationSelect,
    defaultValue = '',
    label = 'Delivery Address',
    placeholder = 'Start typing an address in Kenya...',
    required = false,
}: LocationAutocompleteProps) {
    const [query, setQuery] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchNominatim = async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Nominatim API - search all of Kenya
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(searchQuery)},Kenya` +
                `&format=json` +
                `&addressdetails=1` +
                `&limit=5` +
                `&countrycodes=ke`,
                {
                    headers: {
                        'User-Agent': 'BuyLock-Marketplace/1.0', // Required by Nominatim
                    },
                }
            );

            if (response.ok) {
                const results: NominatimResult[] = await response.json();
                setSuggestions(results);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Nominatim search error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (value: string) => {
        setQuery(value);

        // Debounce API calls
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            searchNominatim(value);
        }, 300);
    };

    const handleSelectSuggestion = (result: NominatimResult) => {
        const addr = result.address;

        // Extract suburb - try multiple fields
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || 'CBD';

        // Extract city
        const city = addr.city || addr.town || 'Nairobi';

        // Build full address string
        const addressParts = [
            addr.building,
            addr.road,
            suburb,
            city,
        ].filter(Boolean);

        const fullAddress = addressParts.join(', ');

        setQuery(fullAddress);
        setShowSuggestions(false);

        // Pass structured data to parent
        onLocationSelect({
            address: fullAddress,
            city: city,
            suburb: suburb,
            building: addr.building,
            postalCode: addr.postcode,
        });
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Label htmlFor="location-input">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    id="location-input"
                    type="text"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    placeholder={placeholder}
                    className="pl-10 pr-10"
                    required={required}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((result) => (
                        <button
                            key={result.place_id}
                            type="button"
                            onClick={() => handleSelectSuggestion(result)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {result.display_name}
                                    </p>
                                    {result.address.suburb && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Suburb: {result.address.suburb}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No results message */}
            {showSuggestions && !isLoading && query.length >= 3 && suggestions.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
                    <p className="text-sm text-gray-500 text-center">
                        No locations found. Try a different search term.
                    </p>
                </div>
            )}
        </div>
    );
}
