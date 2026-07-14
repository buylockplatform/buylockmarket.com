import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("PAYSTACK_SECRET_KEY is missing in .env");
    return;
  }

  const recipientData = {
    type: "mobile_money",
    name: "Test Rider",
    account_number: "0712345678",
    bank_code: "MPESA",
    currency: "KES",
    description: "Test M-Pesa Recipient"
  };

  const url = "https://api.paystack.co/transferrecipient";
  console.log(`Creating recipient on ${url}...`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(recipientData)
    });

    const data: any = await res.json();
    const recipientCode = data.data.recipient_code;
    console.log(`\nInitiating transfer of 1000 KES (100000 kobo) to ${recipientCode}...`);

    const transferUrl = "https://api.paystack.co/transfer";
    const transferRes = await fetch(transferUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source: "balance",
        amount: 100000,
        recipient: recipientCode,
        currency: "KES",
        reason: "Test Rider Payout"
      })
    });

    const transferData: any = await transferRes.json();
    console.log("Transfer Response Status:", transferRes.status);
    console.log("Transfer Response Body:", JSON.stringify(transferData, null, 2));
  } catch (error: any) {
    console.error("Request failed:", error.message);
  }
}

main().catch(console.error);
