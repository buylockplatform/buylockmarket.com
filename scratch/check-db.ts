import { db } from "../server/db";
import { appointments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const vendorId = "74bf6c33-7f09-4844-903d-72bff3849c95";
  const list = await db.select().from(appointments).where(eq(appointments.vendorId, vendorId));
  console.log(`Appointments found for vendor ${vendorId}: ${list.length}`);
  for (const app of list) {
    console.log(`ID: ${app.id}, Customer: ${app.customerName}, Service: ${app.serviceName}, Status: ${app.status}, VendorID: ${app.vendorId}`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
