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

  const url = "https://api.paystack.co/bank";
  console.log(`Fetching banks from ${url}...`);

  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      }
    });

    const data: any = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `HTTP ${res.status}`);
    }

    console.log(`Found ${data.data?.length || 0} banks:`);
    if (data.data) {
      for (const b of data.data) {
        console.log(`- Code: ${b.code} | Name: ${b.name} | Type: ${b.type} | Active: ${b.active}`);
      }
    }
  } catch (error: any) {
    console.error("Failed to fetch Paystack banks:", error.message);
  }
}

main().catch(console.error);
