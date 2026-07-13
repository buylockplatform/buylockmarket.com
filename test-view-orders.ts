import { db } from "./server/db";
import { orders } from "./shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const allOrders = await db.select().from(orders);
  console.log("Total orders in database:", allOrders.length);
  allOrders.forEach(o => {
    console.log(`Order ID: ${o.id}, Short: ${o.id.slice(0, 8)}, Status: ${o.status}, PaymentStatus: ${o.paymentStatus}, OrderType: ${o.orderType}`);
  });
}

main().catch(console.error);
