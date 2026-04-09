import express from "express";
import path from "path";
import { registerVendorRoutes } from "./routes.js";
import { seedVendorDatabase } from "./seed.js";
import { pool } from "./db.js";

const app = express();
const PORT = parseInt(process.env.VENDOR_PORT || "5001", 10);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

async function ensureTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_password_reset_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        vendor_id VARCHAR NOT NULL REFERENCES vendors(id),
        token VARCHAR UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ vendor_password_reset_tokens table ready");
  } finally {
    client.release();
  }
}

async function startServer() {
  try {
    console.log("🚀 Starting Vendor Dashboard server...");
    
    await ensureTables();
    
    // TODO: Set up database tables first
    // await seedVendorDatabase();
    
    // Register routes
    const server = await registerVendorRoutes(app);
    
    // Serve static files in production
    if (process.env.NODE_ENV === "production") {
      app.use(express.static("dist"));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../dist/index.html"));
      });
    }
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🏪 Vendor Dashboard server running on port ${PORT}`);
      console.log(`📱 Access dashboard at: http://localhost:${PORT}`);
      console.log(`📧 Demo login: vendor@buylock.com / password123`);
    });
  } catch (error) {
    console.error("❌ Failed to start vendor dashboard server:", error);
    process.exit(1);
  }
}

startServer();