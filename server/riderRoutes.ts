import { Router, type Request, type Response } from "express";
import { db } from "./db";
import { eq, and, sql, inArray, desc, isNull, ne } from "drizzle-orm";
import {
  users,
  deliveryJobs,
  orders,
  riderEarnings,
  riderCashCollections,
  riderBonusEvents,
  paymentRequests,
  riderDocuments,
  riderDocumentTypes,
} from "@shared/schema";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";
import { generateTokens, verifyToken, extractBearerToken } from "./jwtUtils";
import { sendPushNotification } from "./firebaseAdmin";
import { sendUserPasswordResetEmail } from "./emailService";
import multer from "multer";
const multerUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const router = Router();
const storageService = new ObjectStorageService();
const riderResetTokens = new Map<string, { userId: string; expiresAt: Date }>();

// ─── Auth middleware for riders ────────────────────────────────────────────
const isRiderAuthenticated = async (req: any, res: any, next: any) => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === "access") {
        const [rider] = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
        if (!rider) return res.status(401).json({ message: "Rider not found" });
        if (rider.isSuspended || rider.riderStatus === "suspended")
          return res.status(403).json({ message: "Account suspended. Contact support." });
        req.rider = rider;
        return next();
      }
    }
    return res.status(401).json({ message: "Authentication required" });
  } catch {
    res.status(500).json({ message: "Authentication error" });
  }
};

const isAdminOrRider = async (req: any, res: any, next: any) => {
  // Simplified: allow x-admin-auth header or valid rider JWT
  if (req.headers["x-admin-auth"] || req.session?.adminData) return next();
  return isRiderAuthenticated(req, res, next);
};

// ─── Registration ──────────────────────────────────────────────────────────
router.post(
  "/api/auth/driver/register",
  multerUpload.fields([
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "licenseFront", maxCount: 1 },
    { name: "licenseBack", maxCount: 1 },
    { name: "insurance", maxCount: 1 },
    { name: "goodConduct", maxCount: 1 },
  ]),
  async (req: any, res: Response) => {
    try {
      const { fullName, email, phone, password, idNumber } = req.body;

      if (!fullName || !email || !phone || !password || !idNumber) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if email/phone already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existing) {
        // If suspended (previously rejected), delete and allow re-apply
        if (existing.riderStatus === "suspended" || existing.isSuspended) {
          await db.delete(users).where(eq(users.id, existing.id));
        } else {
          return res.status(400).json({ error: "Email already registered. Use your existing credentials." });
        }
      }

      // Upload documents — supports both multipart (multer) and base64 JSON
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;

      const uploadFile = async (field: string): Promise<string | undefined> => {
        // Multipart file upload
        const file = files?.[field]?.[0];
        if (file) {
          const key = `rider-docs/${Date.now()}-${field}-${file.originalname || field}`;
          return storage.uploadBuffer(file.buffer, key, file.mimetype);
        }
        // Base64 JSON fallback: body.idFrontBase64, etc.
        const b64 = req.body?.[`${field}Base64`] as string | undefined;
        if (b64) {
          const matches = b64.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            const mime = matches[1];
            const buf = Buffer.from(matches[2], "base64");
            const key = `rider-docs/${Date.now()}-${field}.${mime.split("/")[1] || "jpg"}`;
            return storage.uploadBuffer(buf, key, mime);
          }
        }
        return undefined;
      };

      const [idFrontUrl, idBackUrl, licenseFrontUrl, licenseBackUrl, insuranceUrl, goodConductUrl] =
        await Promise.all([
          uploadFile("idFront"),
          uploadFile("idBack"),
          uploadFile("licenseFront"),
          uploadFile("licenseBack"),
          uploadFile("insurance"),
          uploadFile("goodConduct"),
        ]);

      const passwordHash = await bcrypt.hash(password, 10);

      const [rider] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          fullName,
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" ") || "",
          phone,
          mpesaNumber: phone,
          passwordHash,
          idNumber,
          role: "delivery",
          riderStatus: "pending_verification",
          idFrontUrl,
          idBackUrl,
          licenseFrontUrl,
          licenseBackUrl,
          insuranceUrl,
          goodConductUrl,
        })
        .returning();

      return res.status(201).json({ message: "Application submitted successfully. Review takes 12–24 hours.", riderId: rider.id });
    } catch (err: any) {
      console.error("Rider registration error:", err);
      return res.status(500).json({ error: "Registration failed", details: err.message });
    }
  }
);

// ─── Rider Login (handled by existing /api/auth/login in routes.ts) ───────
// Rider-specific login that validates role
router.post("/api/auth/rider/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const [rider] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (!rider || !rider.passwordHash) return res.status(401).json({ error: "Invalid credentials" });
    if (rider.role !== "delivery") return res.status(403).json({ error: "Not a rider account" });
    if (rider.riderStatus === "pending_verification")
      return res.status(403).json({ error: "Account pending approval. You will receive an SMS when approved." });
    if (rider.riderStatus === "suspended" || rider.isSuspended)
      return res.status(403).json({ error: "Account suspended. Contact support." });
    if (rider.riderStatus !== "active")
      return res.status(403).json({ error: "Account not yet active." });

    const valid = await bcrypt.compare(password, rider.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const tokens = generateTokens({
      userId: rider.id,
      email: rider.email!,
      firstName: rider.firstName || rider.fullName || "",
      lastName: rider.lastName || "",
    });

    const { passwordHash, ...riderData } = rider;
    return res.json({ ...tokens, user: riderData });
  } catch (err: any) {
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── Forgot Password ───────────────────────────────────────────────────────
router.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const [rider] = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim())).limit(1);

    // Always return success to prevent email enumeration
    if (!rider) {
      return res.json({ message: "If an account with that email exists, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    riderResetTokens.set(token, { userId: rider.id, expiresAt });

    const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const resetUrl = `${baseUrl}/delivery/reset-password?token=${token}`;
    const riderName = (rider as any).fullName || (rider as any).firstName || rider.email;

    await sendUserPasswordResetEmail({
      userEmail: rider.email!,
      userName: riderName,
      resetUrl,
    });

    return res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (err: any) {
    console.error("[RiderForgotPassword]", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// ─── Reset Password (token-based) ─────────────────────────────────────────
router.post("/api/auth/rider/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and new password are required" });

    const entry = riderResetTokens.get(token);
    if (!entry || entry.expiresAt < new Date()) {
      riderResetTokens.delete(token);
      return res.status(400).json({ error: "Reset link is invalid or has expired" });
    }

    const hash = await bcrypt.hash(password, 10);
    await db.update(users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(users.id, entry.userId));
    riderResetTokens.delete(token);

    return res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// ─── Heartbeat ─────────────────────────────────────────────────────────────
router.get("/api/delivery/heartbeat", (_req: Request, res: Response) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// ─── Online/Offline Status ─────────────────────────────────────────────────
router.patch("/api/delivery/status", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { userId, isOnline } = req.body;
    await db.update(users).set({ isOnline: Boolean(isOnline), updatedAt: new Date() }).where(eq(users.id, userId || req.rider.id));
    res.json({ message: "Status updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Location Broadcast ────────────────────────────────────────────────────
router.patch("/api/delivery/location", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { userId, latitude, longitude } = req.body;
    await db
      .update(users)
      .set({ latitude: String(latitude), longitude: String(longitude), updatedAt: new Date() })
      .where(eq(users.id, userId || req.rider.id));
    res.json({ message: "Location updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rider's Assigned Orders ───────────────────────────────────────────────
router.get("/api/delivery/orders/:personId", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { personId } = req.params;
    const jobs = await db
      .select({
        id: deliveryJobs.id,
        orderId: deliveryJobs.orderId,
        pickupAddress: deliveryJobs.pickupAddress,
        dropoffAddress: deliveryJobs.dropoffAddress,
        pickupLatitude: deliveryJobs.pickupLatitude,
        pickupLongitude: deliveryJobs.pickupLongitude,
        dropoffLatitude: deliveryJobs.dropoffLatitude,
        dropoffLongitude: deliveryJobs.dropoffLongitude,
        status: deliveryJobs.status,
        jobType: deliveryJobs.jobType,
        createdAt: deliveryJobs.createdAt,
        updatedAt: deliveryJobs.updatedAt,
        orderNumber: orders.id,
        totalAmount: orders.totalAmount,
        customerName: orders.customerName,
        customerPhone: orders.customerPhone,
        deliveryAddress: orders.deliveryAddress,
        deliveryFee: orders.deliveryFee,
        vendorId: orders.vendorId,
      })
      .from(deliveryJobs)
      .leftJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .where(eq(deliveryJobs.deliveryPersonId, personId))
      .orderBy(desc(deliveryJobs.createdAt));

    const enriched = jobs.map((j) => ({
      ...j,
      orderNumber: j.orderNumber?.slice(-8).toUpperCase() ?? "N/A",
    }));

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Available Jobs (ASSIGNING status near rider) ─────────────────────────
router.get("/api/delivery/available-jobs", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { lat, lng } = req.query;

    const jobs = await db
      .select({
        id: deliveryJobs.id,
        orderId: deliveryJobs.orderId,
        pickupAddress: deliveryJobs.pickupAddress,
        dropoffAddress: deliveryJobs.dropoffAddress,
        pickupLatitude: deliveryJobs.pickupLatitude,
        pickupLongitude: deliveryJobs.pickupLongitude,
        dropoffLatitude: deliveryJobs.dropoffLatitude,
        dropoffLongitude: deliveryJobs.dropoffLongitude,
        jobType: deliveryJobs.jobType,
        createdAt: deliveryJobs.createdAt,
        orderNumber: orders.id,
        totalAmount: orders.totalAmount,
        deliveryFee: orders.deliveryFee,
      })
      .from(deliveryJobs)
      .leftJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .where(and(eq(deliveryJobs.status, "ASSIGNING"), isNull(deliveryJobs.deliveryPersonId)))
      .orderBy(desc(deliveryJobs.createdAt))
      .limit(20);

    const withDistance = jobs.map((j) => {
      let distance: string | null = null;
      if (lat && lng && j.pickupLatitude && j.pickupLongitude) {
        const dLat = parseFloat(String(j.pickupLatitude)) - parseFloat(String(lat));
        const dLng = parseFloat(String(j.pickupLongitude)) - parseFloat(String(lng));
        distance = (Math.sqrt(dLat * dLat + dLng * dLng) * 111).toFixed(1);
      }
      return {
        ...j,
        distance,
        type: j.jobType,
        orderNumber: j.orderNumber?.slice(-8).toUpperCase() ?? "N/A",
      };
    });

    res.json(withDistance);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Accept Job ────────────────────────────────────────────────────────────
router.patch("/api/delivery/jobs/:id/accept", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const riderId = req.body.riderId || req.rider.id;

    const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, id)).limit(1);
    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.status !== "AWAITING_ACCEPTANCE" && job.status !== "ASSIGNING")
      return res.status(409).json({ error: "Job is no longer available" });

    await db
      .update(deliveryJobs)
      .set({ status: "ASSIGNED", deliveryPersonId: riderId, updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id));

    res.json({ message: "Job accepted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Decline Job ───────────────────────────────────────────────────────────
router.patch("/api/delivery/jobs/:id/decline", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    await db
      .update(deliveryJobs)
      .set({ status: "ASSIGNING", deliveryPersonId: null, updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id));
    res.json({ message: "Job declined" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Update Job Status (pickup / delivered) ────────────────────────────────
router.patch("/api/delivery-jobs/:id/status", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    await db.update(deliveryJobs).set({ status, updatedAt: new Date() }).where(eq(deliveryJobs.id, id));

    // Auto-create earnings when job is delivered
    if (status === "DELIVERED") {
      const [job] = await db.select().from(deliveryJobs).where(eq(deliveryJobs.id, id)).limit(1);
      if (job?.deliveryPersonId) {
        const [order] = await db.select().from(orders).where(eq(orders.id, job.orderId)).limit(1);
        const deliveryFee = parseFloat(String(order?.deliveryFee ?? "200"));
        const commission = deliveryFee * 0.15; // 15% platform commission
        const payout = deliveryFee - commission;

        await db.insert(riderEarnings).values({
          deliveryJobId: job.id,
          driverId: job.deliveryPersonId,
          orderId: job.orderId,
          deliveryFee: String(deliveryFee),
          platformCommission: String(commission.toFixed(2)),
          driverPayout: String(payout.toFixed(2)),
        });

        // Check daily bonus
        await _checkDailyBonus(job.deliveryPersonId);
      }
    }

    res.json({ message: "Status updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function _checkDailyBonus(driverId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(riderEarnings)
    .where(
      and(
        eq(riderEarnings.driverId, driverId),
        sql`DATE(${riderEarnings.createdAt}) = ${today}`
      )
    );
  const deliveryCount = Number(countRow?.count ?? 0);

  const bonusTiers = [
    { threshold: 20, amount: 500 },
    { threshold: 10, amount: 200 },
  ];

  for (const tier of bonusTiers) {
    if (deliveryCount >= tier.threshold) {
      const [existing] = await db
        .select()
        .from(riderBonusEvents)
        .where(
          and(
            eq(riderBonusEvents.driverId, driverId),
            eq(riderBonusEvents.date, today),
            eq(riderBonusEvents.bonusThreshold, tier.threshold)
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(riderBonusEvents).values({
          driverId,
          date: today,
          deliveriesCount: deliveryCount,
          bonusThreshold: tier.threshold,
          bonusAmount: String(tier.amount),
        });
      }
      break;
    }
  }
}

// ─── Rider Location for Customers ─────────────────────────────────────────
router.get("/api/orders/:id/rider-location", async (req: Request, res: Response) => {
  try {
    const [job] = await db
      .select({ deliveryPersonId: deliveryJobs.deliveryPersonId })
      .from(deliveryJobs)
      .where(eq(deliveryJobs.orderId, req.params.id))
      .limit(1);

    if (!job?.deliveryPersonId) return res.json({ latitude: null, longitude: null });

    const [rider] = await db
      .select({ latitude: users.latitude, longitude: users.longitude })
      .from(users)
      .where(eq(users.id, job.deliveryPersonId))
      .limit(1);

    res.json(rider ?? { latitude: null, longitude: null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── All Delivery Jobs (admin view) ───────────────────────────────────────
router.get("/api/delivery/jobs", async (req: Request, res: Response) => {
  try {
    const jobs = await db
      .select()
      .from(deliveryJobs)
      .leftJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .orderBy(desc(deliveryJobs.createdAt))
      .limit(200);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── List All Delivery Personnel ───────────────────────────────────────────
router.get("/api/delivery/personnel", async (_req: Request, res: Response) => {
  try {
    const riders = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        mpesaNumber: users.mpesaNumber,
        isOnline: users.isOnline,
        riderStatus: users.riderStatus,
        isSuspended: users.isSuspended,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, "delivery"))
      .orderBy(desc(users.createdAt));
    res.json(riders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Manually Assign Rider to Order ────────────────────────────────
router.post("/api/orders/:orderId/assign", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;

    const [job] = await db
      .select()
      .from(deliveryJobs)
      .where(and(eq(deliveryJobs.orderId, orderId), eq(deliveryJobs.status, "ASSIGNING")))
      .limit(1);

    if (!job) return res.status(404).json({ error: "No ASSIGNING job found for this order" });

    await db
      .update(deliveryJobs)
      .set({ deliveryPersonId: riderId, status: "AWAITING_ACCEPTANCE", updatedAt: new Date() })
      .where(eq(deliveryJobs.id, job.id));

    // Notify rider via FCM
    const [rider] = await db.select({ fcmToken: users.fcmToken }).from(users).where(eq(users.id, riderId)).limit(1);
    if (rider?.fcmToken) {
      await sendPushNotification(rider.fcmToken, "New Job Assigned", "You have a new delivery job. Tap to view.", {
        type: "new_job",
        jobId: job.id,
        orderId,
      });
    }

    res.json({ message: "Rider assigned", jobId: job.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Earnings ──────────────────────────────────────────────────────────────
router.get("/api/rider-earnings", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { driverId, status } = req.query;
    const conditions: any[] = [];
    if (driverId) conditions.push(eq(riderEarnings.driverId, driverId as string));
    if (status) conditions.push(eq(riderEarnings.status, (status as string).toUpperCase()));

    const earnings = await db
      .select()
      .from(riderEarnings)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(riderEarnings.createdAt));

    res.json(earnings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/rider-earnings/stats", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: "driverId required" });

    const [stats] = await db
      .select({
        totalPending: sql<string>`SUM(CASE WHEN status='PENDING' THEN driver_payout ELSE 0 END)`,
        totalApproved: sql<string>`SUM(CASE WHEN status='APPROVED' THEN driver_payout ELSE 0 END)`,
        totalPaid: sql<string>`SUM(CASE WHEN status='PAID' THEN driver_payout ELSE 0 END)`,
        totalJobs: sql<number>`COUNT(*)`,
      })
      .from(riderEarnings)
      .where(eq(riderEarnings.driverId, driverId as string));

    res.json({
      pending: parseFloat(stats?.totalPending ?? "0"),
      approved: parseFloat(stats?.totalApproved ?? "0"),
      paid: parseFloat(stats?.totalPaid ?? "0"),
      totalJobs: Number(stats?.totalJobs ?? 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/api/rider-earnings/:id/approve", async (req: Request, res: Response) => {
  try {
    await db.update(riderEarnings).set({ status: "APPROVED", updatedAt: new Date() }).where(eq(riderEarnings.id, req.params.id));
    res.json({ message: "Approved" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/api/rider-earnings/:id/decline", async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    await db.update(riderEarnings).set({ status: "DECLINED", notes, updatedAt: new Date() }).where(eq(riderEarnings.id, req.params.id));
    res.json({ message: "Declined" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/api/rider-earnings/:id/mark-paid", async (req: Request, res: Response) => {
  try {
    await db
      .update(riderEarnings)
      .set({ status: "PAID", paidAt: new Date(), updatedAt: new Date() })
      .where(eq(riderEarnings.id, req.params.id));
    res.json({ message: "Marked as paid" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/rider-earnings/:id/pay-now", async (req: Request, res: Response) => {
  // TODO: Integrate M-Pesa B2C API
  try {
    const [earning] = await db.select().from(riderEarnings).where(eq(riderEarnings.id, req.params.id)).limit(1);
    if (!earning) return res.status(404).json({ error: "Earning not found" });

    const [rider] = await db.select().from(users).where(eq(users.id, earning.driverId)).limit(1);
    // Placeholder – in production call M-Pesa B2C here
    console.log(`[PayNow] Would pay KES ${earning.driverPayout} to ${rider?.mpesaNumber ?? rider?.phone}`);

    await db.update(riderEarnings).set({ status: "PAID", paidAt: new Date(), updatedAt: new Date() }).where(eq(riderEarnings.id, req.params.id));
    res.json({ message: "Payment initiated", amount: earning.driverPayout });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/rider-earnings/bulk-approve", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await db.update(riderEarnings).set({ status: "APPROVED", updatedAt: new Date() }).where(inArray(riderEarnings.id, ids));
    res.json({ message: `${ids.length} earnings approved` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/rider-earnings/bulk-mark-paid", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await db.update(riderEarnings).set({ status: "PAID", paidAt: new Date(), updatedAt: new Date() }).where(inArray(riderEarnings.id, ids));
    res.json({ message: `${ids.length} earnings marked paid` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/rider-earnings/bulk-decline", async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] };
    await db.update(riderEarnings).set({ status: "DECLINED", updatedAt: new Date() }).where(inArray(riderEarnings.id, ids));
    res.json({ message: `${ids.length} earnings declined` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/rider-earnings/approve-all-for-rider", async (req: Request, res: Response) => {
  try {
    const { driverId } = req.body;
    await db
      .update(riderEarnings)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(and(eq(riderEarnings.driverId, driverId), eq(riderEarnings.status, "PENDING")));
    res.json({ message: "All pending earnings approved" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/rider-earnings/pay-rider", async (req: Request, res: Response) => {
  // Consolidated B2C payout: sum all APPROVED earnings minus unreconciled cash
  try {
    const { driverId } = req.body;
    const earnings = await db
      .select()
      .from(riderEarnings)
      .where(and(eq(riderEarnings.driverId, driverId), eq(riderEarnings.status, "APPROVED")));

    const totalEarnings = earnings.reduce((sum, e) => sum + parseFloat(String(e.driverPayout)), 0);

    const [cashRow] = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(riderCashCollections)
      .where(and(eq(riderCashCollections.driverId, driverId), eq(riderCashCollections.isReconciled, false)));

    const cashDebt = parseFloat(cashRow?.total ?? "0");
    const netPayout = Math.max(0, totalEarnings - cashDebt);

    const [rider] = await db.select().from(users).where(eq(users.id, driverId)).limit(1);
    console.log(`[PayRider] Would pay KES ${netPayout} to ${rider?.mpesaNumber ?? rider?.phone}`);

    // Mark all approved earnings as paid and reconcile cash
    await db
      .update(riderEarnings)
      .set({ status: "PAID", paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(riderEarnings.driverId, driverId), eq(riderEarnings.status, "APPROVED")));

    await db
      .update(riderCashCollections)
      .set({ isReconciled: true, reconciledAt: new Date() })
      .where(and(eq(riderCashCollections.driverId, driverId), eq(riderCashCollections.isReconciled, false)));

    res.json({ message: "Payment initiated", netPayout, totalEarnings, cashDebt });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Unpaid Jobs ───────────────────────────────────────────────────────────
router.get("/api/delivery/unpaid-jobs", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { driverId } = req.query;
    const id = driverId || req.rider.id;

    const paidJobIds = await db
      .select({ jobId: riderEarnings.deliveryJobId })
      .from(riderEarnings)
      .where(and(eq(riderEarnings.driverId, id), ne(riderEarnings.status, "DECLINED")));

    const paidIds = paidJobIds.map((r) => r.jobId);

    const jobs = await db
      .select({
        id: deliveryJobs.id,
        orderId: deliveryJobs.orderId,
        status: deliveryJobs.status,
        jobType: deliveryJobs.jobType,
        createdAt: deliveryJobs.createdAt,
        orderNumber: orders.id,
        totalAmount: orders.totalAmount,
        deliveryFee: orders.deliveryFee,
      })
      .from(deliveryJobs)
      .leftJoin(orders, eq(deliveryJobs.orderId, orders.id))
      .where(
        and(
          eq(deliveryJobs.deliveryPersonId, id),
          eq(deliveryJobs.status, "DELIVERED"),
          paidIds.length ? sql`${deliveryJobs.id} NOT IN (${sql.join(paidIds.map((pid) => sql`${pid}`), sql`, `)})` : sql`1=1`
        )
      );

    res.json(jobs.map((j) => ({ ...j, orderNumber: j.orderNumber?.slice(-8).toUpperCase() })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Payment Requests ──────────────────────────────────────────────────────
router.post("/api/delivery/payment-requests", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { driverId, jobIds, notes } = req.body;
    const [pr] = await db
      .insert(paymentRequests)
      .values({ driverId: driverId || req.rider.id, jobIds, notes })
      .returning();
    res.json(pr);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/delivery/payment-requests", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { driverId } = req.query;
    const id = driverId || req.rider.id;
    const reqs = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.driverId, id))
      .orderBy(desc(paymentRequests.createdAt));
    res.json(reqs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Rider Applications ─────────────────────────────────────────────
router.get("/api/admin/rider-applications", async (_req: Request, res: Response) => {
  try {
    const applications = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        idNumber: users.idNumber,
        riderStatus: users.riderStatus,
        idFrontUrl: users.idFrontUrl,
        idBackUrl: users.idBackUrl,
        licenseFrontUrl: users.licenseFrontUrl,
        licenseBackUrl: users.licenseBackUrl,
        insuranceUrl: users.insuranceUrl,
        goodConductUrl: users.goodConductUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, "delivery"), eq(users.riderStatus, "pending_verification")))
      .orderBy(desc(users.createdAt));
    res.json(applications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/api/admin/rider-applications/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason, notes } = req.body; // action: 'approve' | 'reject'

    if (action === "approve") {
      await db.update(users).set({ riderStatus: "active", updatedAt: new Date() }).where(eq(users.id, id));
      // TODO: Send approval SMS
      res.json({ message: "Rider approved" });
    } else if (action === "reject") {
      // Delete the record so they can re-apply
      await db.delete(users).where(eq(users.id, id));
      // TODO: Send rejection SMS with reason
      res.json({ message: "Application rejected and record deleted" });
    } else {
      res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Single Rider Profile ───────────────────────────────────────────
router.get("/api/admin/riders/:id", async (req: Request, res: Response) => {
  try {
    const [rider] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, req.params.id), eq(users.role, "delivery")))
      .limit(1);

    if (!rider) return res.status(404).json({ error: "Rider not found" });
    const { passwordHash, ...riderData } = rider;
    res.json(riderData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Rider Documents ───────────────────────────────────────────────────────
router.get("/api/admin/rider-documents/:riderId", async (req: Request, res: Response) => {
  try {
    const docs = await db
      .select()
      .from(riderDocuments)
      .where(eq(riderDocuments.riderId, req.params.riderId))
      .orderBy(desc(riderDocuments.createdAt));
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post(
  "/api/admin/rider-documents",
  multerUpload.single("document"),
  async (req: any, res: Response) => {
    try {
      const { riderId, label, documentTypeId, expiryDate, notes } = req.body;
      let documentUrl = req.body.documentUrl;
      if (req.file) {
        const key = `rider-docs/${riderId}/${Date.now()}-${req.file.originalname}`;
        documentUrl = await storage.uploadBuffer(req.file.buffer, key, req.file.mimetype);
      }
      const [doc] = await db
        .insert(riderDocuments)
        .values({ riderId, label, documentTypeId, documentUrl, expiryDate: expiryDate ? new Date(expiryDate) : null, notes })
        .returning();
      res.json(doc);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.delete("/api/admin/rider-documents/:id", async (req: Request, res: Response) => {
  try {
    await db.delete(riderDocuments).where(eq(riderDocuments.id, req.params.id));
    res.json({ message: "Document deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/admin/rider-document-types", async (_req: Request, res: Response) => {
  try {
    const types = await db.select().from(riderDocumentTypes).where(eq(riderDocumentTypes.isActive, true));
    res.json(types);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Cash Collections ──────────────────────────────────────────────────────
router.get("/api/riders/:id/cash-collections", async (req: Request, res: Response) => {
  try {
    const collections = await db
      .select()
      .from(riderCashCollections)
      .where(eq(riderCashCollections.driverId, req.params.id))
      .orderBy(desc(riderCashCollections.createdAt));
    res.json(collections);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bonus Events ──────────────────────────────────────────────────────────
router.get("/api/riders/:id/bonus-events", async (req: Request, res: Response) => {
  try {
    const bonuses = await db
      .select()
      .from(riderBonusEvents)
      .where(eq(riderBonusEvents.driverId, req.params.id))
      .orderBy(desc(riderBonusEvents.createdAt));
    res.json(bonuses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Daily Cash Limit ──────────────────────────────────────────────────────
router.get("/api/riders/:id/daily-limit", async (req: Request, res: Response) => {
  try {
    const [rider] = await db
      .select({ dailyCashLimit: users.dailyCashLimit, dailySuspended: users.dailySuspended })
      .from(users)
      .where(eq(users.id, req.params.id))
      .limit(1);
    res.json(rider ?? { dailyCashLimit: 1500, dailySuspended: false });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/api/riders/:id/daily-limit", async (req: Request, res: Response) => {
  try {
    const { dailyCashLimit, dailySuspended } = req.body;
    await db
      .update(users)
      .set({ dailyCashLimit: String(dailyCashLimit), dailySuspended, updatedAt: new Date() })
      .where(eq(users.id, req.params.id));
    res.json({ message: "Updated" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Account Status (suspend / reactivate) ────────────────────────────────
router.patch("/api/users/:id/status", async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body; // status: 'active' | 'suspended'
    await db
      .update(users)
      .set({
        riderStatus: status,
        isSuspended: status === "suspended",
        suspendedAt: status === "suspended" ? new Date() : null,
        suspensionReason: reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.params.id));
    res.json({ message: `Account ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FCM Token Update ─────────────────────────────────────────────────────
router.patch("/api/users/:id", isRiderAuthenticated, async (req: any, res: Response) => {
  try {
    const { email, fullName, phone, mpesaNumber, fcmToken } = req.body;
    await db
      .update(users)
      .set({ email, fullName, phone, mpesaNumber, fcmToken, updatedAt: new Date() })
      .where(eq(users.id, req.params.id));
    const [updated] = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    const { passwordHash, ...data } = updated;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { router as riderRouter };
