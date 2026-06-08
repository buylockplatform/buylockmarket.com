import { db } from "./server/db";
import { orders, customerAddresses } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const orderId = "6ecbb87c-745d-4e60-9399-bcf837544a31";
  console.log("Fetching order:", orderId);
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) {
    console.log("Order not found!");
    return;
  }
  console.log("Order details:", {
    id: order.id,
    userId: order.userId,
    deliveryAddress: order.deliveryAddress,
    deliveryAddressId: order.deliveryAddressId,
    isGuest: order.isGuest,
    guestLatitude: order.guestLatitude,
    guestLongitude: order.guestLongitude,
    status: order.status,
  });

  if (order.deliveryAddressId) {
    const [addr] = await db.select().from(customerAddresses).where(eq(customerAddresses.id, order.deliveryAddressId));
    console.log("Linked address details:", addr);
  } else {
    console.log("No linked address ID.");
  }
}

main().catch(console.error).finally(() => process.exit());
