import { db } from "./db";
import { orders } from "../shared/schema";
import { eq, and, or, isNull } from "drizzle-orm";

async function fixRemainingOrders() {
    console.log('🔧 Fixing remaining orders...');

    // Find orders that are ready for pickup but have dispatch_service or no courier
    const ordersToFix = await db.select().from(orders).where(
        and(
            eq(orders.status, 'ready_for_pickup'),
            or(
                eq(orders.courierId, 'dispatch_service'),
                isNull(orders.courierId)
            )
        )
    );

    console.log(`Found ${ordersToFix.length} orders to fix.`);

    for (const order of ordersToFix) {
        console.log(`Updating order ${order.id.slice(-8)} from ${order.courierId} to fargo_courier`);
        await db.update(orders)
            .set({
                courierId: 'fargo_courier',
                courierName: 'Fargo Courier Services',
                orderType: 'product'
            })
            .where(eq(orders.id, order.id));
    }

    console.log('✅ All ready_for_pickup orders updated to Fargo Courier.');
    process.exit(0);
}

fixRemainingOrders();
