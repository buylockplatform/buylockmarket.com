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

export function getDeliveryStatusLabel(status: string): string {
  const option = DELIVERY_STATUS_UPDATE_OPTIONS.find((o) => o.value === status);
  if (option) return option.label;
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
