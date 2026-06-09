import type { Delivery, DeliveryProvider, Order } from "@shared/schema";
import { DEFAULT_COURIER_ID, DEFAULT_COURIER_NAME } from "@shared/deliveryStatuses";
import { deliveryService } from "./deliveryService";
import { notificationService, type NotificationData } from "./notificationService";
import { storage } from "./storage";

export { DEFAULT_COURIER_ID, DEFAULT_COURIER_NAME };

export async function getActiveDeliveryProvider(): Promise<DeliveryProvider | undefined> {
  const activeProviders = await storage.getDeliveryProviders();
  if (activeProviders.length > 0) {
    return activeProviders[0];
  }
  return storage.getDeliveryProviderById(DEFAULT_COURIER_ID);
}

export async function resolveCourierForOrder(
  order: Order,
  providerId?: string
): Promise<{ providerId: string; providerName: string }> {
  if (providerId) {
    const provider = await storage.getDeliveryProviderById(providerId);
    if (provider) {
      return { providerId: provider.id, providerName: provider.name };
    }
  }

  if (order.courierId && order.courierId !== "dispatch_service") {
    const provider = await storage.getDeliveryProviderById(order.courierId);
    if (provider) {
      return { providerId: provider.id, providerName: provider.name };
    }
  }

  const active = await getActiveDeliveryProvider();
  return {
    providerId: active?.id ?? DEFAULT_COURIER_ID,
    providerName: active?.name ?? DEFAULT_COURIER_NAME,
  };
}

export async function notifyCourierForOrder(
  order: Order,
  provider: DeliveryProvider,
  pickupInstructions?: string
): Promise<void> {
  const vendor = await storage.getVendorById(order.vendorId);
  const customer = await storage.getUser(order.userId);
  if (!vendor || !customer) return;

  const notificationData: NotificationData = {
    orderId: order.id,
    customerName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer",
    customerPhone: customer.phone || "Not provided",
    pickupAddress: vendor.businessAddress || "Vendor Address",
    deliveryAddress: order.deliveryAddress || "Address not provided",
    packageDescription: `Order ${order.trackingNumber || order.id.slice(-8)}`,
    deliveryFee: parseFloat(order.deliveryFee || "0"),
    estimatedDeliveryTime: order.estimatedDeliveryTime || provider.estimatedDeliveryTime || undefined,
    vendorName: vendor.businessName,
    vendorPhone: vendor.phone || "Not provided",
    specialInstructions: pickupInstructions,
  };

  const notified = await notificationService.notifyCourier(provider, notificationData);
  if (!notified && provider.contactEmail) {
    const { sendCourierNotification } = await import("./emailService");
    const orderItems = await storage.getOrderItems(order.id);
    const emailOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        let itemName = item.name || "Unknown Item";
        if (item.productId) {
          const product = await storage.getProductById(item.productId);
          itemName = product?.name || itemName;
        } else if (item.serviceId) {
          const service = await storage.getServiceById(item.serviceId);
          itemName = service?.name || itemName;
        }
        return { name: itemName, quantity: item.quantity, price: item.price };
      })
    );

    await sendCourierNotification({
      courierEmail: provider.contactEmail,
      courierName: provider.name,
      orderId: order.id,
      customerName: notificationData.customerName,
      customerPhone: notificationData.customerPhone,
      vendorBusinessName: vendor.businessName,
      vendorLocation: vendor.businessAddress || "Address not provided",
      vendorPhone: vendor.phone || "Phone not provided",
      deliveryAddress: order.deliveryAddress || "Address not provided",
      orderTotal: order.totalAmount,
      pickupInstructions: pickupInstructions || "",
      orderItems: emailOrderItems,
    });
  }
}

export async function createDeliveryForOrder(
  orderId: string,
  providerId?: string,
  pickupInstructions?: string
): Promise<Delivery | null> {
  const order = await storage.getOrderById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "ready_for_pickup") {
    return null;
  }

  const existingDelivery = await storage.getDeliveryByOrderId(orderId);
  if (existingDelivery) {
    return existingDelivery;
  }

  const { providerId: courierProviderId } = await resolveCourierForOrder(order, providerId);
  const provider = await storage.getDeliveryProviderById(courierProviderId);
  if (!provider) {
    throw new Error("Courier provider not found");
  }

  const courierResponse = await deliveryService.createDelivery(order, provider);
  if (!courierResponse.success) {
    throw new Error(courierResponse.error || `Failed to register delivery with ${provider.name}`);
  }

  const vendor = await storage.getVendorById(order.vendorId);
  const customer = await storage.getUser(order.userId);

  const delivery = await storage.createDelivery({
    orderId: order.id,
    providerId: provider.id,
    externalTrackingId: courierResponse.trackingId,
    courierTrackingId: courierResponse.trackingId,
    status: "pickup_scheduled",
    pickupAddress: vendor?.businessAddress || "Vendor Address",
    pickupCity: vendor?.city || "Nairobi",
    pickupSuburb: (vendor as any)?.suburb,
    pickupBuilding: (vendor as any)?.building,
    pickupPostalCode: (vendor as any)?.postalCode,
    deliveryAddress: order.deliveryAddress || customer?.address || "",
    deliveryCity: (order as any).deliveryCity || customer?.city || "Nairobi",
    deliverySuburb: (order as any).deliverySuburb || (customer as any)?.suburb || "CBD",
    deliveryBuilding: (order as any).deliveryBuilding || (customer as any)?.building,
    deliveryPostalCode: (order as any).deliveryPostalCode || (customer as any)?.postalCode,
    estimatedPickupTime:
      courierResponse.estimatedPickupTime || new Date(Date.now() + 2 * 60 * 60 * 1000),
    estimatedDeliveryTime:
      courierResponse.estimatedDeliveryTime || new Date(Date.now() + 24 * 60 * 60 * 1000),
    deliveryFee: order.deliveryFee || "0",
    packageDescription: `Order ${order.trackingNumber} - ${order.orderType}`,
    customerPhone: customer?.phone || "0700000000",
    vendorPhone: vendor?.phone || "0700000001",
    courierName: provider.name,
  });

  await storage.addDeliveryUpdate({
    deliveryId: delivery.id,
    status: "pickup_scheduled",
    description: `Pickup scheduled with ${provider.name}.`,
    source: "api",
  });

  await storage.updateOrder(orderId, {
    status: "dispatched",
    deliveryPickupAt: new Date(),
    courierId: provider.id,
    courierName: provider.name,
  });

  await storage.addOrderTracking({
    orderId,
    deliveryId: delivery.id,
    status: "Passed to Delivery",
    description: `Pickup scheduled with ${provider.name}.`,
    location: "Vendor Location",
  });

  await notifyCourierForOrder(order, provider, pickupInstructions);

  return delivery;
}

export async function autoDispatchReadyOrders(): Promise<void> {
  const orders = await storage.getOrdersReadyForPickup();
  for (const order of orders) {
    if (order.orderType === "service" || order.courierId === "dispatch_service") {
      continue;
    }
    const existing = await storage.getDeliveryByOrderId(order.id);
    if (!existing) {
      try {
        await createDeliveryForOrder(order.id);
        console.log(`✅ Auto-dispatched order ${order.id.slice(-8)} to Buylock Delivery`);
      } catch (error) {
        console.error(`Failed to auto-dispatch order ${order.id}:`, error);
      }
    }
  }
}
