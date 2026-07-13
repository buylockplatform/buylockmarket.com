import fetch from "node-fetch";

async function main() {
  const vendorId = "74bf6c33-7f09-4844-903d-72bff3849c95";
  const url = `http://localhost:5000/api/vendor/locations`;
  
  console.log(`Fetching from: ${url}`);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-vendor-id": vendorId,
        "x-vendor-auth": vendorId,
        "Accept": "application/json"
      }
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response body: ${text.slice(0, 1000)}`);
  } catch (error: any) {
    console.error("Fetch failed:", error.message);
  }
}

main().catch(console.error);
