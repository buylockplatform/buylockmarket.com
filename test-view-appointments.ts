import { db } from "./server/db";
import { appointments } from "./shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const orderId = "de1969e0-cc22-4492-910d-03c18ba5cf19";
  const appts = await db.select().from(appointments).where(eq(appointments.orderId, orderId));
  console.log(`Appointments for order ${orderId}:`, appts.length);
  appts.forEach(a => {
    console.log(`Appointment ID: ${a.id}, Status: ${a.status}, ScheduledAt: ${a.scheduledAt}, Code: ${a.confirmationCode}`);
  });
}

main().catch(console.error);
