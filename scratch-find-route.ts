import fs from "fs";

const content = fs.readFileSync("./server/routes.ts", "utf8");
const lines = content.split("\n");
lines.forEach((line, index) => {
  if (line.includes('/api/user/addresses') || line.includes('/addresses')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});
