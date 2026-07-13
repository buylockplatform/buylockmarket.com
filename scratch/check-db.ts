import { db } from "../server/db";
import { orders, appointments, orderItems, users, services } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Repairing missing appointments...");

  const orderIds = ["f188e454-6b73-413a-b97b-00879b28372d", "d3a9a824-6fe9-47b6-98b1-a0b417d8ea98"];

  for (const orderId of orderIds) {
    // Check if appointment already exists
    const existingApps = await db.select().from(appointments).where(eq(appointments.orderId, orderId));
    if (existingApps.length > 0) {
      console.log(`Appointment already exists for order ${orderId}`);
      continue;
    }

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) {
      console.log(`Order ${orderId} not found`);
      continue;
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    if (items.length === 0) {
      console.log(`No items found for order ${orderId}`);
      continue;
    }

    const firstItem = items[0];
    const [user] = await db.select().from(users).where(eq(users.id, order.userId));
    const [serviceItem] = await db.select().from(services).where(eq(services.id, firstItem.serviceId!));

    console.log(`Creating appointment for order ${orderId}...`);
    const [newApp] = await db.insert(appointments).values({
      customerId: order.userId,
      vendorId: order.vendorId,
      serviceId: firstItem.serviceId!,
      serviceName: serviceItem?.name || 'Electrical Installation & Repair',
      customerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
      customerEmail: user?.email || 'customer@example.com',
      customerPhone: user?.phone || '0712345678',
      appointmentDate: firstItem.appointmentDate ? new Date(firstItem.appointmentDate).toISOString() : new Date().toISOString(),
      appointmentTime: firstItem.appointmentTime || '09:00',
      address: order.deliveryAddress || 'Address not provided',
      city: order.deliveryCity || 'Nairobi',
      state: order.deliverySuburb || 'Nairobi County',
      notes: order.notes || '',
      totalAmount: order.totalAmount.toString(),
      status: order.status === 'ready_for_pickup' ? 'accepted' : 'pending_acceptance',
      orderId: order.id
    }).returning();

    console.log(`✅ Appointment created: ${newApp.id}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
