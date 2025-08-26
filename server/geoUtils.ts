// Geolocation utility functions for distance calculations and proximity filtering

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance between two points using the Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Sort array of items by distance from a reference point
 * @param items Array of items with vendor information
 * @param customerLocation Customer's coordinates
 * @param getVendorLocation Function to extract vendor coordinates from item
 */
export function sortByDistance<T>(
  items: T[],
  customerLocation: Coordinates,
  getVendorLocation: (item: T) => Coordinates | null
): (T & { distance?: number })[] {
  return items
    .map(item => {
      const vendorLocation = getVendorLocation(item);
      if (!vendorLocation) {
        return { ...item, distance: Infinity };
      }
      
      const distance = calculateDistance(customerLocation, vendorLocation);
      return { ...item, distance };
    })
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

/**
 * Filter items within a specified radius
 * @param items Array of items with vendor information
 * @param customerLocation Customer's coordinates
 * @param radiusKm Maximum distance in kilometers
 * @param getVendorLocation Function to extract vendor coordinates from item
 */
export function filterByRadius<T>(
  items: T[],
  customerLocation: Coordinates,
  radiusKm: number,
  getVendorLocation: (item: T) => Coordinates | null
): (T & { distance?: number })[] {
  return items
    .map(item => {
      const vendorLocation = getVendorLocation(item);
      if (!vendorLocation) {
        return null;
      }
      
      const distance = calculateDistance(customerLocation, vendorLocation);
      if (distance <= radiusKm) {
        return { ...item, distance };
      }
      return null;
    })
    .filter((item): item is T & { distance: number } => item !== null)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Get readable distance text
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km away`;
  } else {
    return `${Math.round(distanceKm)}km away`;
  }
}

/**
 * Determine if two locations are in the same city/area (within 25km)
 */
export function isNearby(point1: Coordinates, point2: Coordinates): boolean {
  const distance = calculateDistance(point1, point2);
  return distance <= 25; // Within 25km considered nearby
}

/**
 * Get default location for Kenya (Nairobi city center)
 */
export function getDefaultKenyaLocation(): Coordinates {
  return {
    latitude: -1.2921,
    longitude: 36.8219
  };
}