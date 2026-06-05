import { Router } from "express";
import { db } from "./db";
import { eq, inArray, sql, and } from "drizzle-orm";
import { deviceTokens } from "@shared/schema";
import { verifyToken, extractBearerToken } from "./jwtUtils";
import { storage } from "./storage";
import { sendMulticastPushNotification } from "./firebaseAdmin";
import { z } from "zod";

export const pushRouter = Router();

// Middleware to authenticate user or vendor from JWT Bearer token
const authenticatePushUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid or expired authorization token" });
    }

    // Check if it's a vendor
    const vendor = await storage.getVendor(decoded.userId);
    if (vendor) {
      req.auth = {
        id: vendor.id,
        type: 'vendor',
        email: vendor.email,
        name: vendor.contactName
      };
      return next();
    }

    // Check if it's a customer
    const user = await storage.getUser(decoded.userId);
    if (user) {
      req.auth = {
        id: user.id,
        type: 'user',
        email: user.email,
        name: user.firstName || 'User'
      };
      return next();
    }

    return res.status(401).json({ message: "User/Vendor not found" });
  } catch (error) {
    console.error("Auth error in push routes:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

// Middleware to authenticate admin
const authenticatePushAdmin = (req: any, res: any, next: any) => {
  const adminAuth = req.headers['x-admin-auth'] || req.headers['authorization'];
  if (!adminAuth && !req.session?.adminData) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  if (adminAuth && typeof adminAuth === 'string' && adminAuth.startsWith('Bearer ')) {
    const token = adminAuth.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded && decoded.email === "admin@buylock.com") {
      req.admin = {
        id: "admin-1",
        email: decoded.email,
        name: "Super Administrator"
      };
      return next();
    }
  }

  if (req.session?.adminData) {
    req.admin = req.session.adminData;
    return next();
  }

  // Demo fallback token
  if (adminAuth === "admin-auth-token-demo") {
    req.admin = { id: "admin-1", email: "admin@buylock.com", name: "Super Administrator" };
    return next();
  }

  return res.status(401).json({ message: "Admin authorization failed" });
};

// Register FCM token
pushRouter.post("/api/push/token", authenticatePushUser, async (req: any, res) => {
  try {
    const { token, platform } = req.body;
    if (!token || !platform) {
      return res.status(400).json({ message: "Token and platform are required" });
    }

    const validPlatforms = ['android', 'ios', 'web'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: "Invalid platform. Must be 'android', 'ios', or 'web'" });
    }

    // Insert or update token (upsert)
    await db.insert(deviceTokens)
      .values({
        userId: req.auth.id,
        userType: req.auth.type,
        token: token,
        platform: platform,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: deviceTokens.token,
        set: {
          userId: req.auth.id,
          userType: req.auth.type,
          platform: platform,
          updatedAt: new Date()
        }
      });

    console.log(`[FCM] Token registered: userId=${req.auth.id} userType=${req.auth.type} platform=${platform}`);
    return res.status(200).json({ success: true, userId: req.auth.id, userType: req.auth.type });
  } catch (error) {
    console.error("Error registering push token:", error);
    return res.status(500).json({ message: "Failed to register push token" });
  }
});

// Remove FCM token (logout)
pushRouter.delete("/api/push/token", authenticatePushUser, async (req: any, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    await db.delete(deviceTokens).where(eq(deviceTokens.token, token));
    console.log(`[FCM] Token deleted successfully: token=${token.substring(0, 10)}...`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting push token:", error);
    return res.status(500).json({ message: "Failed to delete push token" });
  }
});

// Get device token stats (Admin only)
pushRouter.get("/api/admin/push/stats", authenticatePushAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        platform: deviceTokens.platform,
        count: sql<number>`count(*)`
      })
      .from(deviceTokens)
      .groupBy(deviceTokens.platform);

    const formattedStats = rows.map(row => ({
      platform: row.platform,
      count: Number(row.count)
    }));

    const total = formattedStats.reduce((sum, item) => sum + item.count, 0);

    return res.json({
      total,
      byPlatform: formattedStats
    });
  } catch (error) {
    console.error("Error fetching push stats:", error);
    return res.status(500).json({ message: "Failed to fetch push stats" });
  }
});

// Admin Broadcast Push
pushRouter.post("/api/admin/push/broadcast", authenticatePushAdmin, async (req, res) => {
  try {
    const { title, body, target, userId, data } = req.body;
    if (!title || !body || !target) {
      return res.status(400).json({ message: "Title, body, and target are required" });
    }

    const validTargets = ['all', 'vendor', 'user'];
    if (!validTargets.includes(target)) {
      return res.status(400).json({ message: "Invalid target. Must be 'all', 'vendor', or 'user'" });
    }

    // Query device tokens based on target
    let query = db.select({ token: deviceTokens.token }).from(deviceTokens);
    
    if (target === 'vendor') {
      if (userId) {
        query = query.where(and(eq(deviceTokens.userType, 'vendor'), eq(deviceTokens.userId, userId))) as any;
      } else {
        query = query.where(eq(deviceTokens.userType, 'vendor')) as any;
      }
    } else if (target === 'user') {
      if (userId) {
        query = query.where(and(eq(deviceTokens.userType, 'user'), eq(deviceTokens.userId, userId))) as any;
      } else {
        query = query.where(eq(deviceTokens.userType, 'user')) as any;
      }
    } else if (target === 'all' && userId) {
      query = query.where(eq(deviceTokens.userId, userId)) as any;
    }

    const tokenRows = await query;
    const tokens = tokenRows.map(r => r.token);

    if (tokens.length === 0) {
      return res.json({ success: true, successCount: 0, failureCount: 0, total: 0, message: "No devices found for target" });
    }

    const result = await sendMulticastPushNotification(tokens, title, body, data);

    // Auto-cleanup failed tokens
    if (result.failedTokens.length > 0) {
      await db.delete(deviceTokens).where(inArray(deviceTokens.token, result.failedTokens));
      console.log(`[FCM] Cleaned up ${result.failedTokens.length} expired tokens`);
    }

    console.log(`[FCM] Broadcast complete: total=${tokens.length} success=${result.successCount} failed=${result.failureCount}`);
    return res.json({
      success: true,
      successCount: result.successCount,
      failureCount: result.failureCount,
      total: tokens.length
    });
  } catch (error) {
    console.error("Error sending broadcast push:", error);
    return res.status(500).json({ message: "Failed to send broadcast push" });
  }
});
