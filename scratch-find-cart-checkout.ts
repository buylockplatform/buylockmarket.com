import fs from "fs";

const content = fs.readFileSync("./client/src/pages/cart.tsx", "utf8");
const lines = content.split("\n");
lines.forEach((line, index) => {
  if (line.includes('api/orders') || line.includes('stkpush') || line.includes('deliveryAddress') || line.includes('guestLatitude')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});
