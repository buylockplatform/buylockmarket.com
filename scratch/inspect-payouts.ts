import { db } from "../server/db";
import { vendors, payoutRequests } from "@shared/schema";

async function main() {
  console.log("Fetching vendors...");
  const allVendors = await db.select().from(vendors);
  console.log(`Found ${allVendors.length} vendors:`);
  for (const v of allVendors) {
    console.log({
      id: v.id,
      businessName: v.businessName,
      bankName: v.bankName,
      bankCode: v.bankCode,
      accountNumber: v.accountNumber,
      accountName: v.accountName,
      paystackSubaccountId: v.paystackSubaccountId,
      paystackSubaccountCode: v.paystackSubaccountCode,
      availableBalance: v.availableBalance,
      pendingBalance: v.pendingBalance
    });
  }

  console.log("\nFetching payout requests...");
  const allRequests = await db.select().from(payoutRequests);
  console.log(`Found ${allRequests.length} payout requests:`);
  for (const r of allRequests) {
    console.log({
      id: r.id,
      vendorId: r.vendorId,
      requestedAmount: r.requestedAmount,
      status: r.status,
      paystackTransferId: r.paystackTransferId,
      paystackTransferCode: r.paystackTransferCode,
      transferStatus: r.transferStatus,
      createdAt: r.createdAt
    });
  }
}

main().catch(console.error);
