import { storage } from "./storage";
import { calculateDistance, type Coordinates } from "./geoUtils";

export interface LogisticsSettings {
  baseDeliveryFee: number;
  perKmRate: number;
  maxDeliveryRadiusKm: number;
  freeDeliveryThreshold: number;
  minOrderForDelivery: number;
  surgeEnabled: boolean;
  surgeMultiplier: number;
  surgeStartHour: number;
  surgeEndHour: number;
  weekendSurchargePct: number;
  rainSurchargePct: number;
  expressMultiplier: number;
}

export interface DeliveryQuoteInput {
  vendorLat: number;
  vendorLng: number;
  customerLat: number;
  customerLng: number;
  orderSubtotal?: number;
  weight?: number;
  express?: boolean;
  isRainy?: boolean;
}

export interface DeliveryQuoteBreakdown {
  baseFee: number;
  distanceCharge: number;
  distanceKm: number;
  distanceMethod: "osrm" | "haversine";
  weekendSurcharge: number;
  rainSurcharge: number;
  surgeApplied: boolean;
  expressApplied: boolean;
  freeDeliveryApplied: boolean;
  subtotalBeforeFreeDelivery: number;
}

export interface DeliveryQuoteResult {
  success: boolean;
  distanceKm: number;
  distanceMethod: "osrm" | "haversine";
  deliveryFee: number;
  isFreeDelivery: boolean;
  withinRadius: boolean;
  maxRadiusKm: number;
  estimatedDurationMinutes?: number;
  breakdown: DeliveryQuoteBreakdown;
  error?: string;
  code?: string;
}

const DEFAULT_SETTINGS: LogisticsSettings = {
  baseDeliveryFee: 300,
  perKmRate: 15,
  maxDeliveryRadiusKm: 50,
  freeDeliveryThreshold: 5000,
  minOrderForDelivery: 500,
  surgeEnabled: false,
  surgeMultiplier: 1.5,
  surgeStartHour: 18,
  surgeEndHour: 21,
  weekendSurchargePct: 10,
  rainSurchargePct: 20,
  expressMultiplier: 2,
};

const OSRM_BASE_URL = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";
const SETTINGS_CACHE_TTL_MS = 60_000;

let settingsCache: { data: LogisticsSettings; expiresAt: number } | null = null;

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true";
}

export async function getLogisticsSettings(): Promise<LogisticsSettings> {
  if (settingsCache && Date.now() < settingsCache.expiresAt) {
    return settingsCache.data;
  }

  const rows = await storage.getPlatformSettings();
  const map = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.settingKey] = row.settingValue;
    return acc;
  }, {});

  const data: LogisticsSettings = {
    baseDeliveryFee: parseNumber(map.base_delivery_fee, DEFAULT_SETTINGS.baseDeliveryFee),
    perKmRate: parseNumber(map.per_km_rate, DEFAULT_SETTINGS.perKmRate),
    maxDeliveryRadiusKm: parseNumber(map.max_delivery_radius_km, DEFAULT_SETTINGS.maxDeliveryRadiusKm),
    freeDeliveryThreshold: parseNumber(map.free_delivery_threshold, DEFAULT_SETTINGS.freeDeliveryThreshold),
    minOrderForDelivery: parseNumber(map.min_order_for_delivery, DEFAULT_SETTINGS.minOrderForDelivery),
    surgeEnabled: parseBool(map.surge_enabled, DEFAULT_SETTINGS.surgeEnabled),
    surgeMultiplier: parseNumber(map.surge_multiplier, DEFAULT_SETTINGS.surgeMultiplier),
    surgeStartHour: parseNumber(map.surge_start_hour, DEFAULT_SETTINGS.surgeStartHour),
    surgeEndHour: parseNumber(map.surge_end_hour, DEFAULT_SETTINGS.surgeEndHour),
    weekendSurchargePct: parseNumber(map.weekend_surcharge_pct, DEFAULT_SETTINGS.weekendSurchargePct),
    rainSurchargePct: parseNumber(map.rain_surcharge_pct, DEFAULT_SETTINGS.rainSurchargePct),
    expressMultiplier: parseNumber(map.express_multiplier, DEFAULT_SETTINGS.expressMultiplier),
  };

  settingsCache = { data, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };
  return data;
}

export function clearLogisticsSettingsCache(): void {
  settingsCache = null;
}

function isSurgeHour(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  if (start < end) {
    return hour >= start && hour < end;
  }
  return hour >= start || hour < end;
}

/**
 * Road distance via OSRM (OpenStreetMap routing data).
 * Falls back to straight-line haversine distance if routing is unavailable.
 */
export async function getRoadDistanceKm(
  origin: Coordinates,
  destination: Coordinates
): Promise<{ distanceKm: number; method: "osrm" | "haversine"; durationMinutes?: number }> {
  const haversineKm = calculateDistance(origin, destination);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const url =
      `${OSRM_BASE_URL}/route/v1/driving/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=false&alternatives=false&steps=false`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`OSRM responded with ${response.status}`);
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    if (data?.code !== "Ok" || !route?.distance) {
      throw new Error(data?.message || "No OSRM route found");
    }

    const distanceKm = Math.round((route.distance / 1000) * 100) / 100;
    const durationMinutes = route.duration
      ? Math.max(1, Math.round(route.duration / 60))
      : undefined;

    return { distanceKm, method: "osrm", durationMinutes };
  } catch (error) {
    console.warn("OSRM distance lookup failed, using haversine fallback:", error);
    return { distanceKm: haversineKm, method: "haversine" };
  }
}

export async function calculateDeliveryQuote(
  input: DeliveryQuoteInput,
  settingsOverride?: LogisticsSettings
): Promise<DeliveryQuoteResult> {
  const settings = settingsOverride ?? (await getLogisticsSettings());

  const origin: Coordinates = {
    latitude: input.vendorLat,
    longitude: input.vendorLng,
  };
  const destination: Coordinates = {
    latitude: input.customerLat,
    longitude: input.customerLng,
  };

  const { distanceKm, method, durationMinutes } = await getRoadDistanceKm(origin, destination);
  const withinRadius = distanceKm <= settings.maxDeliveryRadiusKm;

  const baseBreakdown: DeliveryQuoteBreakdown = {
    baseFee: settings.baseDeliveryFee,
    distanceCharge: Math.round(settings.perKmRate * distanceKm),
    distanceKm,
    distanceMethod: method,
    weekendSurcharge: 0,
    rainSurcharge: 0,
    surgeApplied: false,
    expressApplied: false,
    freeDeliveryApplied: false,
    subtotalBeforeFreeDelivery: 0,
  };

  if (!withinRadius) {
    return {
      success: false,
      distanceKm,
      distanceMethod: method,
      deliveryFee: 0,
      isFreeDelivery: false,
      withinRadius: false,
      maxRadiusKm: settings.maxDeliveryRadiusKm,
      estimatedDurationMinutes: durationMinutes,
      breakdown: baseBreakdown,
      error: `Delivery address is ${distanceKm.toFixed(1)}km away. Maximum delivery radius is ${settings.maxDeliveryRadiusKm}km.`,
      code: "OUTSIDE_RADIUS_LIMIT",
    };
  }

  const orderSubtotal = input.orderSubtotal ?? 0;
  if (orderSubtotal > 0 && orderSubtotal < settings.minOrderForDelivery) {
    return {
      success: false,
      distanceKm,
      distanceMethod: method,
      deliveryFee: 0,
      isFreeDelivery: false,
      withinRadius: true,
      maxRadiusKm: settings.maxDeliveryRadiusKm,
      estimatedDurationMinutes: durationMinutes,
      breakdown: baseBreakdown,
      error: `Minimum order for delivery is KSh ${settings.minOrderForDelivery.toLocaleString("en-KE")}.`,
      code: "MIN_ORDER_NOT_MET",
    };
  }

  let fee = settings.baseDeliveryFee + settings.perKmRate * distanceKm;

  const now = new Date();
  const day = now.getDay();
  if ((day === 0 || day === 6) && settings.weekendSurchargePct > 0) {
    const surcharge = fee * (settings.weekendSurchargePct / 100);
    baseBreakdown.weekendSurcharge = Math.round(surcharge);
    fee += surcharge;
  }

  if (input.isRainy && settings.rainSurchargePct > 0) {
    const surcharge = fee * (settings.rainSurchargePct / 100);
    baseBreakdown.rainSurcharge = Math.round(surcharge);
    fee += surcharge;
  }

  if (settings.surgeEnabled && isSurgeHour(now.getHours(), settings.surgeStartHour, settings.surgeEndHour)) {
    fee *= settings.surgeMultiplier;
    baseBreakdown.surgeApplied = true;
  }

  if (input.express && settings.expressMultiplier > 1) {
    fee *= settings.expressMultiplier;
    baseBreakdown.expressApplied = true;
  }

  const weight = Math.max(1, input.weight ?? 1);
  const weightMultiplier = Math.max(1, Math.ceil(weight / 5));
  if (weightMultiplier > 1) {
    fee *= weightMultiplier;
  }

  baseBreakdown.subtotalBeforeFreeDelivery = Math.round(fee);

  let isFreeDelivery = false;
  if (orderSubtotal >= settings.freeDeliveryThreshold && settings.freeDeliveryThreshold > 0) {
    fee = 0;
    isFreeDelivery = true;
    baseBreakdown.freeDeliveryApplied = true;
  }

  return {
    success: true,
    distanceKm,
    distanceMethod: method,
    deliveryFee: Math.round(fee),
    isFreeDelivery,
    withinRadius: true,
    maxRadiusKm: settings.maxDeliveryRadiusKm,
    estimatedDurationMinutes: durationMinutes,
    breakdown: baseBreakdown,
  };
}

export async function quoteDeliveryForVendor(
  vendorId: string,
  customerLat: number,
  customerLng: number,
  options?: { orderSubtotal?: number; weight?: number; express?: boolean; isRainy?: boolean }
): Promise<DeliveryQuoteResult> {
  const vendor = await storage.getVendorById(vendorId);
  if (!vendor) {
    return {
      success: false,
      distanceKm: 0,
      distanceMethod: "haversine",
      deliveryFee: 0,
      isFreeDelivery: false,
      withinRadius: false,
      maxRadiusKm: DEFAULT_SETTINGS.maxDeliveryRadiusKm,
      breakdown: {
        baseFee: 0,
        distanceCharge: 0,
        distanceKm: 0,
        distanceMethod: "haversine",
        weekendSurcharge: 0,
        rainSurcharge: 0,
        surgeApplied: false,
        expressApplied: false,
        freeDeliveryApplied: false,
        subtotalBeforeFreeDelivery: 0,
      },
      error: "Vendor not found",
      code: "VENDOR_NOT_FOUND",
    };
  }

  const vendorLat = parseFloat(vendor.businessLatitude?.toString() ?? "");
  const vendorLng = parseFloat(vendor.businessLongitude?.toString() ?? "");
  if (!Number.isFinite(vendorLat) || !Number.isFinite(vendorLng)) {
    return {
      success: false,
      distanceKm: 0,
      distanceMethod: "haversine",
      deliveryFee: 0,
      isFreeDelivery: false,
      withinRadius: false,
      maxRadiusKm: DEFAULT_SETTINGS.maxDeliveryRadiusKm,
      breakdown: {
        baseFee: 0,
        distanceCharge: 0,
        distanceKm: 0,
        distanceMethod: "haversine",
        weekendSurcharge: 0,
        rainSurcharge: 0,
        surgeApplied: false,
        expressApplied: false,
        freeDeliveryApplied: false,
        subtotalBeforeFreeDelivery: 0,
      },
      error: "Vendor location is not configured",
      code: "VENDOR_LOCATION_MISSING",
    };
  }

  return calculateDeliveryQuote({
    vendorLat,
    vendorLng,
    customerLat,
    customerLng,
    orderSubtotal: options?.orderSubtotal,
    weight: options?.weight,
    express: options?.express,
    isRainy: options?.isRainy,
  });
}
