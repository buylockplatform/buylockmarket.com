import { db } from "../server/db";
import { riderEarnings, users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Fetching rider earnings...");
  const earnings = await db.select().from(riderEarnings);
  console.log(`Found ${earnings.length} rider earnings:`);

  for (const e of earnings) {
    const [rider] = await db.select().from(users).where(eq(users.id, e.driverId)).limit(1);
    console.log({
      id: e.id,
      driverName: rider ? (rider.fullName || `${rider.firstName} ${rider.lastName}`) : 'Unknown Rider',
      orderId: e.orderId,
      amount: e.driverPayout,
      status: e.status,
      paidAt: e.paidAt,
      mpesaReceiptNumber: e.mpesaReceiptNumber
    });
  }
}

main().catch(console.error);
