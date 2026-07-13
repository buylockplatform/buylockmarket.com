import fetch from "node-fetch";

async function main() {
  const url = "http://localhost:5000/api/vendor/forgot-password";
  console.log(`Sending POST request to ${url} for vendor@buylock.com...`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: "vendor@buylock.com" })
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response body: ${text}`);
  } catch (error: any) {
    console.error("Forgot password request failed:", error.message);
  }
}

main().catch(console.error);
