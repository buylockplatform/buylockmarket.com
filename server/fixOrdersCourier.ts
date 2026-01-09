import { db } from "./db";
import { orders } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixOrders() {
    console.log('🔧 Updating ready_for_pickup orders to have Fargo Courier...\n');

    const result = await db.update(orders)
        .set({
            courierId: 'fargo_courier',
            courierName: 'Fargo Courier Services',
            orderType: 'product'
        })
        .where(eq(orders.status, 'ready_for_pickup'));

    console.log('✅ Updated all ready_for_pickup orders');
    console.log('   - Courier ID: fargo_courier');
    console.log('   - Courier Name: Fargo Courier Services');
    console.log('   - Order Type: product\n');

    process.exit(0);
}

fixOrders();
