/** Canonical delivery statuses — do not add new values without a schema migration. */
export const DELIVERY_STATUSES = [
  "pending",
  "pickup_scheduled",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "failed",
  "cancelled",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

/** Admin-facing labels for the status update dropdown (maps to existing DB values). */
export const DELIVERY_STATUS_UPDATE_OPTIONS: {
  value: DeliveryStatus;
  label: string;
}[] = [
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked from Shop" },
  { value: "in_transit", label: "On the Way" },
  { value: "out_for_delivery", label: "Arrived" },
  { value: "delivered", label: "Delivered" },
];

export const DEFAULT_COURIER_ID = "buylock_delivery";
export const DEFAULT_COURIER_NAME = "Buylock Delivery";

/** Legacy Fargo / external statuses mapped to canonical delivery statuses. */
export const LEGACY_DELIVERY_STATUS_MAP: Record<string, DeliveryStatus> = {
  booked: "pending",
  pickup_arranged: "pickup_scheduled",
  collected: "picked_up",
  in_warehouse: "in_transit",
  "To Deliver": "out_for_delivery",
  Delivered: "delivered",
  delivery_failed: "failed",
};

export const LEGACY_COURIER_IDS = ["fargo_courier"] as const;

export function isLegacyCourierId(id?: string | null): boolean {
  return !!id && (LEGACY_COURIER_IDS as readonly string[]).includes(id);
}

export function resolveCourierDisplayName(
  courierId?: string | null,
  courierName?: string | null
): string {
  if (
    isLegacyCourierId(courierId) ||
    courierName?.toLowerCase().includes("fargo")
  ) {
    return DEFAULT_COURIER_NAME;
  }
  return courierName || DEFAULT_COURIER_NAME;
}

export function normalizeDeliveryStatus(status: string): string {
  if ((DELIVERY_STATUSES as readonly string[]).includes(status)) {
    return status;
  }
  return LEGACY_DELIVERY_STATUS_MAP[status] || status;
}

export function getDeliveryStatusLabel(status: string): string {
  const normalized = normalizeDeliveryStatus(status);
  const option = DELIVERY_STATUS_UPDATE_OPTIONS.find((o) => o.value === normalized);
  if (option) return option.label;
  if (normalized === "pending") return "Pending";
  if (normalized === "failed") return "Failed";
  if (normalized === "cancelled") return "Cancelled";
  return normalized.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
