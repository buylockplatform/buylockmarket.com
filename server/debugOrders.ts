import { db } from "./db";
import { orders, deliveryProviders } from "../shared/schema";
import { desc } from "drizzle-orm";

async function debugOrders() {
    console.log('🔍 Checking recent orders...');
    const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);

    recent.forEach(o => {
        console.log(`Order ${o.id.slice(-8)} | Status: ${o.status} | Courier: ${o.courierId} (${o.courierName}) | Type: ${o.orderType} | Created: ${o.createdAt}`);
    });

    console.log('\n🚚 Checking Delivery Providers...');
    const providers = await db.select().from(deliveryProviders);
    providers.forEach(p => {
        console.log(`Provider: ${p.id} | Name: ${p.name} | Type: ${p.type}`);
    });

    process.exit(0);
}

debugOrders();
