/**
 * One-time fix script: 
 * - Resets order de1969e0 back to 'pending_acceptance' to match its appointment status
 * - This gives the vendor a clear signal to act on it
 */
import { db } from "./server/db";
import { orders, appointments } from "./shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const ORDER_ID = "de1969e0-cc22-4492-910d-03c18ba5cf19";
const APPOINTMENT_ID = "14f4ffeb-5c5f-48c7-b094-34f10b81e68a";

async function fix() {
  // Sync order status to match appointment (pending_acceptance)
  const [updatedOrder] = await db
    .update(orders)
    .set({ status: "pending_acceptance", updatedAt: new Date() })
    .where(eq(orders.id, ORDER_ID))
    .returning();

  console.log("✅ Order updated:", updatedOrder.id, "→ status:", updatedOrder.status);

  // Also verify appointment
  const [appt] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, APPOINTMENT_ID));
  
  console.log("Appointment status:", appt?.status, "(should be pending_acceptance)");
  console.log("Done. The vendor should now see this in their Appointments tab and can Accept → Start → Complete it.");
}

fix().catch(console.error);
