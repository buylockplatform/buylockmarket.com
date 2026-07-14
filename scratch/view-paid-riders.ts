import { db } from "../server/db";
import { riderEarnings } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const result = await db.select().from(riderEarnings).where(eq(riderEarnings.status, "PAID"));
  console.log("PAID rider earnings detail:");
  console.log(result);
}

main().catch(console.error);
