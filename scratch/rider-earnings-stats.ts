import { db } from "../server/db";
import { riderEarnings } from "@shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  const result = await db.select({
    status: riderEarnings.status,
    count: sql<number>`count(*)`
  }).from(riderEarnings).groupBy(riderEarnings.status);

  console.log("Rider earnings status breakdown:");
  console.log(result);
}

main().catch(console.error);
