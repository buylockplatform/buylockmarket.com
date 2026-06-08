import fs from "fs";

const content = fs.readFileSync("./server/storage.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, index) => {
  if (line.includes('createOrder') || line.includes('IStorage')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});
