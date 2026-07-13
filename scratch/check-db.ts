import { db } from "../server/db";
import { vendors } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const vendorId = "74bf6c33-7f09-4844-903d-72bff3849c95";
  const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId));
  if (vendor) {
    console.log(`Vendor: ${vendor.businessName}, verificationStatus: ${vendor.verificationStatus}`);
  } else {
    console.log(`Vendor ${vendorId} not found`);
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
