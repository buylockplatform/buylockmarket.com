import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";

export function getVendorSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "vendor_sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || "vendor-dashboard-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
    name: "vendor-session-id",
  });
}

export const isVendorAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session && (req.session as any).vendorId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

declare module "express-session" {
  interface SessionData {
    vendorId: string;
  }
}