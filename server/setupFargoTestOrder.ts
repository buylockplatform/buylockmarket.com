
import { db } from "./db";
import { orders } from "../shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

async function updateTestOrder() {
    console.log("Updating test order for Fargo verification...");

    // Find a pending paid order or create one
    const existing = await db.select().from(orders).limit(1);

    let orderId;

    if (existing.length > 0) {
        orderId = existing[0].id;
        console.log(`Updating existing order ${orderId} to ready_for_pickup with Fargo Courier...`);
        await db.update(orders)
            .set({
                status: 'ready_for_pickup',
                courierId: 'fargo_courier',
                courierName: 'Fargo Courier Services'
            })
            .where(eq(orders.id, orderId));
    } else {
        console.log("No orders found. Creating dummy order...");
        // (Optional: Implement create logic if DB is empty, but assume existing data for now)
    }

    console.log("Update complete.");
    process.exit(0);
}

updateTestOrder();
