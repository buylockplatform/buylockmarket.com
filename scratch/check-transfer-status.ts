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

  // Codes from database to check
  const codes = [
    "TRF_8sqa7q78yzbixyi8",
    "TRF_7uq0jldw4qp1ycvk"
  ];

  for (const code of codes) {
    const url = `https://api.paystack.co/transfer/${code}`;
    console.log(`Checking transfer status for code: ${code}...`);
    try {
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        }
      });
      const data: any = await res.json();
      console.log(`Status: ${res.status}`);
      console.log(JSON.stringify(data, null, 2));
      console.log("-----------------------------------------");
    } catch (e: any) {
      console.error(`Failed to check ${code}:`, e.message);
    }
  }
}

main().catch(console.error);
