import dotenv from "dotenv";
import path from "path";
import { db } from "../server/db";
import { payoutRequests, vendors } from "@shared/schema";
import { eq } from "drizzle-orm";
import { PaystackService } from "../server/paystackService";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is missing in .env");
    return;
  }

  // Find a pending request
  const [request] = await db
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.status, "pending"))
    .limit(1);

  if (!request) {
    console.log("No pending payout requests found in database to test!");
    return;
  }

  console.log(`Found pending payout request: ${request.id} for KES ${request.requestedAmount}`);
  const [vendor] = await db
    .select()
    .from(vendors)
    .where(eq(vendors.id, request.vendorId))
    .limit(1);

  if (!vendor) {
    console.error(`Vendor ${request.vendorId} not found!`);
    return;
  }

  console.log(`Processing payout for vendor: ${vendor.businessName} (Bank: ${vendor.bankName}, Account: ${vendor.accountNumber})`);

  try {
    const paystack = new PaystackService();
    const result = await paystack.processVendorPayout(
      {
        businessName: vendor.businessName,
        contactName: vendor.contactName,
        email: vendor.email,
        bankName: vendor.bankName,
        bankCode: vendor.bankCode!,
        accountNumber: vendor.accountNumber!,
        accountName: vendor.accountName!
      },
      parseFloat(request.requestedAmount),
      `Test payout for request ${request.id}`,
      request.id
    );

    console.log("\n✅ Paystack Payout Result:");
    console.log(JSON.stringify(result, null, 2));

    // Update database request to completed
    await db
      .update(payoutRequests)
      .set({
        status: "completed",
        paystackTransferId: result.transferId,
        paystackTransferCode: result.transferCode,
        transferStatus: result.status === "otp" ? "otp_pending" : "success",
        completedAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: "test_script"
      })
      .where(eq(payoutRequests.id, request.id));

    console.log(`\n✅ Database updated for request ${request.id}`);
  } catch (error: any) {
    console.error("\n❌ Paystack Payout Execution Failed:");
    console.error(error.message || error);
  }
}

main().catch(console.error);
