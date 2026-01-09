import { db } from "./db";
import { orders } from "../shared/schema";
import { desc } from "drizzle-orm";

async function checkOrders() {
    const recent = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5);

    console.log('\n📦 Recent Orders:');
    console.log('================');

    recent.forEach(o => {
        console.log(`\nOrder ID: ${o.id.slice(-8)}`);
        console.log(`Status: ${o.status}`);
        console.log(`Courier ID: ${o.courierId || 'NOT SET'}`);
        console.log(`Courier Name: ${o.courierName || 'NOT SET'}`);
        console.log(`Order Type: ${o.orderType}`);
    });

    process.exit(0);
}

checkOrders();
