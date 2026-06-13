import { storage } from "./storage";

async function checkVendor() {
  const vendorId = "74bf6c33-7f09-4844-903d-72bff3849c95";
  const summary = await storage.getVendorEarningsSummary(vendorId);

  console.log("STORAGE SUMMARY:");
  console.log(JSON.stringify(summary, null, 2));

  const orderEarnings = await storage.getVendorOrderEarnings(vendorId);
  console.log("\nORDER EARNINGS:");
  console.log(JSON.stringify(orderEarnings, null, 2));

  process.exit(0);
}

checkVendor().catch(err => {
  console.error(err);
  process.exit(1);
});
