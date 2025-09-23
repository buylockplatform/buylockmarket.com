import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { appointments } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { getSession } from "./replitAuth";
import { sendVendorAccountUnderReviewNotification, sendVendorAccountApprovedNotification } from "./emailService";
// import { sendPayoutStatusNotification, PayoutNotificationData } from "./emailService";
type PayoutNotificationData = any;
const sendPayoutStatusNotification = async (..._args: any[]) => {}; // no-op placeholder
import { notificationService, type VendorNotificationData } from "./notificationService";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { PaystackService } from "./paystackService";
import { generateTokens, verifyToken, extractBearerToken, wantsTokenAuth, refreshAccessToken, type JWTPayload } from "./jwtUtils";

// Hybrid user authentication middleware (supports both sessions and JWT tokens)
const isUserAuthenticated = async (req: any, res: any, next: any) => {
  try {
    // Try JWT token authentication first
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === 'access') {
        // JWT authentication successful
        req.user = { 
          id: decoded.userId, 
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName 
        };
        req.authType = 'token';
        return next();
      }
    }
    
    // Fall back to session authentication
    if (req.session?.userId && req.session?.user) {
      req.user = { id: req.session.userId, ...req.session.user };
      req.authType = 'session';
      return next();
    }
    
    return res.status(401).json({ message: "Not authenticated" });
  } catch (error) {
    console.error("User authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// Vendor authentication middleware (supports both header-based and JWT authentication)
const isVendorAuthenticated = async (req: any, res: any, next: any) => {
  try {
    // Try JWT token authentication first
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.type === 'access') {
        // Fetch vendor from database using JWT user ID
        const vendor = await storage.getVendorById(decoded.userId);
        if (vendor && vendor.verificationStatus === 'verified') {
          req.vendor = vendor;
          req.authType = 'token';
          return next();
        }
      }
    }
    
    // Fall back to header-based authentication
    const vendorId = req.headers['x-vendor-id'] || req.params.vendorId;

    if (!vendorId) {
      return res.status(401).json({ message: "Vendor authentication required. Use either 'Authorization: Bearer <token>' or 'x-vendor-id' header." });
    }

    // Get vendor from storage and verify they exist and are approved
    const vendor = await storage.getVendorById(vendorId);
    if (!vendor) {
      return res.status(401).json({ message: "Invalid vendor credentials" });
    }

    if (vendor.verificationStatus !== 'verified') {
      return res.status(403).json({ 
        message: "Account not approved", 
        details: "Your vendor account is pending approval by our admin team.",
        status: vendor.verificationStatus 
      });
    }

    // Add vendor to request for use in endpoints
    req.vendor = vendor;
    req.authType = 'header';
    next();
  } catch (error) {
    console.error("Vendor authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// Admin authentication middleware
const isAdminAuthenticated = async (req: any, res: any, next: any) => {
  try {
    // Check if admin is authenticated (simplified check)
    const adminAuth = req.headers['x-admin-auth'] || req.headers['authorization'];
    
    // For demo purposes, we'll use a simple check
    // In production, this would verify JWT tokens or session data
    if (!adminAuth && !req.session?.adminData) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

import { fetchExchangeRates } from "./exchange-rates";
import Paystack from "paystack";
import { insertCartItemSchema, insertOrderSchema, insertOrderItemSchema, serviceBookingSchema } from "@shared/schema";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sortByDistance, filterByRadius, getDefaultKenyaLocation, calculateDistance, type Coordinates } from "./geoUtils";
import { seedDatabase } from "./seedDatabase";
import rateLimit from "express-rate-limit";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Paystack SDK (only if credentials available)
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const paystack = secret ? Paystack(secret) : null;
  
  // Initialize PaystackService for subaccounts
  const paystackService = new PaystackService(secret);

  // Rate limiting for authentication endpoints
  const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs for auth
    message: { message: "Too many authentication attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const generalAuthRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: 20, // more lenient for general auth endpoints
    message: { message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session middleware only (no more Replit Auth)
  app.set("trust proxy", 1);
  app.use(getSession());

  // Debug endpoint to check database connection
  app.get('/api/debug/db', async (req, res) => {
    try {
      const dbInfo = await db.execute(sql`SELECT current_database(), current_user, current_schema()`);
      const columns = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name='orders' ORDER BY 1`);
      
      res.json({
        database: dbInfo.rows[0],
        ordersColumns: columns.rows.map(row => row.column_name),
        hasPaymentReference: columns.rows.some(row => row.column_name === 'payment_reference')
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Exchange rates API
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      const rates = await fetchExchangeRates();
      res.json(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      res.status(500).json({ message: 'Failed to fetch exchange rates' });
    }
  });


  app.get('/api/auth/vendor', isVendorAuthenticated, async (req: any, res) => {
    try {
      const vendor = req.vendor;
      
      if (!vendor) {
        return res.status(401).json({ message: "Invalid vendor session" });
      }

      // Return vendor data (without password hash)
      const { passwordHash, ...vendorData } = vendor;
      res.json(vendorData);
    } catch (error) {
      console.error("Vendor auth check error:", error);
      res.status(500).json({ message: "Failed to verify vendor authentication" });
    }
  });



  // Vendor authentication routes
  app.post("/api/vendor/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find vendor by email
      const vendor = await storage.getVendorByEmail(email);
      if (!vendor) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const bcrypt = await import("bcrypt");
      const isValidPassword = await bcrypt.compare(password, vendor.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if vendor is approved
      if (vendor.verificationStatus !== 'verified') {
        return res.status(403).json({ 
          message: "Account not approved", 
          details: "Your vendor account is pending approval by our admin team. You will be notified once your account is verified.",
          status: vendor.verificationStatus 
        });
      }

      // Check if client wants token-based authentication
      if (wantsTokenAuth(req)) {
        // Generate JWT tokens for mobile/API clients
        const tokens = generateTokens({
          id: vendor.id,
          email: vendor.email,
          firstName: vendor.contactName,
          lastName: vendor.businessName
        });
        
        const { passwordHash, ...vendorData } = vendor;
        
        return res.status(200).json({
          success: true,
          message: "Login successful",
          vendor: vendorData,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            tokenType: "Bearer"
          }
        });
      }

      // Return vendor data (without password hash) for header-based auth
      const { passwordHash, ...vendorData } = vendor;
      res.json(vendorData);

    } catch (error) {
      console.error("Vendor login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Vendor JWT token refresh endpoint
  app.post("/api/vendor/refresh-token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }
      
      // Refresh the access token
      const newTokens = refreshAccessToken(refreshToken);
      if (!newTokens) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      
      res.json({
        success: true,
        message: "Token refreshed successfully",
        tokens: newTokens
      });
    } catch (error) {
      console.error("Vendor token refresh error:", error);
      res.status(500).json({ message: "Token refresh failed" });
    }
  });

  // Vendor JWT profile endpoint
  app.get("/api/vendor/me", isVendorAuthenticated, async (req: any, res) => {
    try {
      const vendor = req.vendor;
      
      if (!vendor) {
        return res.status(401).json({ message: "Invalid vendor session" });
      }

      // Return vendor data (without password hash)
      const { passwordHash, ...vendorData } = vendor;
      res.json(vendorData);
    } catch (error) {
      console.error("Vendor profile error:", error);
      res.status(500).json({ message: "Failed to get vendor profile" });
    }
  });

  // User authentication routes (form-based)
  app.post("/api/user/register", authRateLimit, async (req, res) => {
    try {
      const { registerUserSchema } = await import("@shared/schema");
      const validatedData = registerUserSchema.parse(req.body);
      
      // Normalize email to lowercase
      const normalizedEmail = validatedData.email.toLowerCase();
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create user (password gets hashed in storage.createUser)
      const user = await storage.createUser({
        email: normalizedEmail,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        password: validatedData.password,
      });

      // Check if client wants token-based authentication
      if (wantsTokenAuth(req)) {
        // Generate JWT tokens for mobile/API clients
        const tokens = generateTokens(user);
        const { passwordHash, ...userData } = user;
        
        return res.status(201).json({
          success: true,
          message: "Account created successfully",
          user: userData,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            tokenType: "Bearer"
          }
        });
      }

      // Use session-based authentication for browsers
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error during registration:", err);
          return res.status(500).json({ message: "Registration completed but session failed" });
        }
        
        // Set up session for the newly registered user
        req.session.userId = user.id;
        req.session.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        };
        
        // Save session
        req.session.save((err) => {
          if (err) {
            console.error("Session save error during registration:", err);
            return res.status(500).json({ message: "Registration completed but session failed" });
          }
          
          // Return user data (without password hash)
          const { passwordHash, ...userData } = user;
          res.status(201).json({
            success: true,
            message: "Account created successfully",
            user: userData
          });
        });
      });

    } catch (error) {
      console.error("User registration error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/user/login", authRateLimit, async (req, res) => {
    try {
      const { loginUserSchema } = await import("@shared/schema");
      const { email, password } = loginUserSchema.parse(req.body);

      // Validate user credentials
      const user = await storage.validateUser(email.toLowerCase(), password);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if client wants token-based authentication
      if (wantsTokenAuth(req)) {
        // Generate JWT tokens for mobile/API clients
        const tokens = generateTokens(user);
        const { passwordHash, ...userData } = user;
        
        return res.json({
          success: true,
          message: "Login successful",
          user: userData,
          tokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
            tokenType: "Bearer"
          }
        });
      }

      // Use session-based authentication for browsers
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Set up session for the user
        req.session.userId = user.id;
        req.session.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        };
        
        // Save session
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          
          // Return user data (without password hash)
          const { passwordHash, ...userData } = user;
          res.json({
            success: true,
            message: "Login successful",
            user: userData
          });
        });
      });


    } catch (error) {
      console.error("User login error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User profile update endpoint
  app.put("/api/user/profile", isUserAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phone, address, city, country } = req.body;

      const updatedUser = await storage.updateUser(userId, {
        firstName,
        lastName,
        phone,
        address,
        city,
        country: country || 'Kenya'
      });

      const { passwordHash, ...userData } = updatedUser;
      res.json({
        success: true,
        user: userData
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User password change endpoint
  app.put("/api/user/change-password", isUserAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found or password not set" });
      }

      // Verify current password
      const bcrypt = await import("bcrypt");
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { passwordHash: hashedPassword });

      res.json({ 
        success: true,
        message: "Password updated successfully" 
      });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  });

  // Token refresh endpoint
  app.post("/api/user/refresh-token", authRateLimit, async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      const result = refreshAccessToken(refreshToken);
      if (!result) {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
      }

      res.json({
        success: true,
        message: "Token refreshed successfully",
        tokens: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
          tokenType: "Bearer"
        }
      });
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });

  app.post("/api/user/logout", generalAuthRateLimit, async (req, res) => {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
            return res.status(500).json({ message: "Logout failed" });
          }
          res.json({ success: true, message: "Logged out successfully" });
        });
      } else {
        res.json({ success: true, message: "Already logged out" });
      }
    } catch (error) {
      console.error("User logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get current authenticated user (supports both JWT and session)
  app.get("/api/user/me", isUserAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Return user data (without password hash)
      const { passwordHash, ...userData } = user;
      res.json({
        success: true,
        user: userData
      });

    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Vendor stats/dashboard endpoint  
  app.get("/api/vendor/stats", isVendorAuthenticated, async (req: any, res) => {
    try {
      const vendor = req.vendor;
      const vendorId = vendor.id;

      // Get vendor statistics
      const stats = await storage.getVendorStats(vendorId);
      
      res.json({
        totalProducts: stats.totalProducts || 0,
        totalServices: stats.totalServices || 0,
        totalOrders: stats.totalOrders || 0,
        pendingOrders: stats.pendingOrders || 0,
        totalEarnings: parseFloat(vendor.totalEarnings || '0'),
        availableBalance: parseFloat(vendor.availableBalance || '0'),
        pendingBalance: parseFloat(vendor.pendingBalance || '0'),
        recentOrders: stats.recentOrders || [],
        monthlyEarnings: stats.monthlyEarnings || [],
        topProducts: stats.topProducts || [],
        businessName: vendor.businessName,
        verificationStatus: vendor.verificationStatus
      });

    } catch (error) {
      console.error("Vendor stats error:", error);
      res.status(500).json({ message: "Failed to fetch vendor statistics" });
    }
  });

  app.post("/api/vendor/register", async (req, res) => {
    try {
      const { 
        email, 
        password, 
        businessName, 
        contactName, 
        phone, 
        address, 
        businessCategory,
        description,
        vendorType,
        nationalIdNumber,
        taxPinNumber,
        businessLatitude,
        businessLongitude,
        locationDescription,
        nationalIdUrl,
        taxCertificateUrl
      } = req.body;
      
      // Basic validation
      if (!email || !password || !businessName || !contactName || !businessCategory || 
          !nationalIdNumber || !nationalIdUrl || !vendorType || 
          !businessLatitude || !businessLongitude || !locationDescription) {
        return res.status(400).json({ 
          message: "Missing required fields: email, password, businessName, contactName, businessCategory, vendorType, nationalIdNumber, location coordinates, location description, and national ID document" 
        });
      }

      // Validate vendor type
      if (!['registered', 'non_registered'].includes(vendorType)) {
        return res.status(400).json({ message: "Vendor type must be either 'registered' or 'non_registered'" });
      }

      // For registered vendors, tax PIN and tax certificate are required
      if (vendorType === 'registered') {
        if (!taxPinNumber || !taxCertificateUrl) {
          return res.status(400).json({ 
            message: "Registered vendors must provide tax PIN and tax certificate document" 
          });
        }
        
        // Validate tax PIN format (Kenyan format: A followed by 9 digits followed by letter)
        if (!/^A\d{9}[A-Z]$/.test(taxPinNumber)) {
          return res.status(400).json({ message: "Tax PIN must be in format A000000000X" });
        }
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Validate national ID number format (assuming Kenyan format: 8 digits)
      if (!/^\d{8}$/.test(nationalIdNumber)) {
        return res.status(400).json({ message: "National ID number must be 8 digits" });
      }

      // Validate location coordinates
      const lat = parseFloat(businessLatitude);
      const lng = parseFloat(businessLongitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ message: "Invalid location coordinates" });
      }

      // Check if vendor already exists
      const existingVendor = await storage.getVendorByEmail(email);
      if (existingVendor) {
        return res.status(409).json({ message: "Vendor with this email already exists" });
      }

      // Hash password
      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.hash(password, 10);

      // Extract bank details if provided
      const { 
        bankName, 
        bankCode, 
        accountNumber, 
        accountName 
      } = req.body;

      // Create vendor with pending approval status
      const newVendor = await storage.createVendor({
        email,
        passwordHash,
        businessName,
        contactEmail: email,
        contactName,
        phone,
        address,
        businessCategory,
        description,
        vendorType,
        nationalIdNumber,
        taxPinNumber: vendorType === 'registered' ? taxPinNumber : null,
        businessLatitude: lat.toString(),
        businessLongitude: lng.toString(),
        locationDescription,
        nationalIdUrl,
        taxCertificateUrl: vendorType === 'registered' ? taxCertificateUrl : null,
        verificationStatus: 'pending',
        // Add bank details if provided
        bankName,
        bankCode,
        accountNumber,
        accountName,
      });

      // Create Paystack subaccount if bank details are complete
      let subaccountInfo = null;
      if (bankName && accountNumber && accountName) {
        try {
          console.log(`Creating Paystack subaccount for vendor: ${businessName}`);
          subaccountInfo = await paystackService.createVendorSubaccount({
            businessName,
            contactName,
            email,
            bankName,
            bankCode,
            accountNumber,
            accountName,
          });

          // Update vendor with subaccount information
          await storage.updateVendor(newVendor.id, {
            paystackSubaccountId: subaccountInfo.subaccountId,
            paystackSubaccountCode: subaccountInfo.subaccountCode,
            subaccountActive: true,
          });

          console.log(`✅ Paystack subaccount created: ${subaccountInfo.subaccountCode}`);
        } catch (error) {
          console.error("Failed to create Paystack subaccount:", error);
          // Continue registration even if subaccount creation fails
          // The vendor can add bank details later and create subaccount then
        }
      }

      // Send vendor account under review notification email
      try {
        await sendVendorAccountUnderReviewNotification({
          vendorEmail: email,
          vendorName: contactName,
          businessName: businessName,
        });
        console.log(`✅ Vendor account under review notification sent to ${email}`);
      } catch (emailError) {
        console.error("Failed to send vendor account under review notification:", emailError);
        // Continue with registration even if email fails
      }

      // Return vendor data (without password hash)
      const { passwordHash: _, ...vendorData } = newVendor;
      res.status(201).json({
        ...vendorData,
        subaccountCreated: !!subaccountInfo,
        subaccountCode: subaccountInfo?.subaccountCode,
        message: subaccountInfo 
          ? "Vendor registration successful with Paystack subaccount. Your application and documents are now pending admin approval."
          : "Vendor registration successful. Your application and documents are now pending admin approval."
      });

    } catch (error) {
      console.error("Vendor registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Order fulfillment and earnings calculation
  app.put("/api/orders/:orderId/fulfill", async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Get the order with items
      const order = await storage.getOrderWithItems(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify order can be fulfilled (must be ready for pickup)
      if (order.status !== 'ready_for_pickup') {
        return res.status(400).json({ 
          message: "Order must be ready for pickup before it can be fulfilled for payout" 
        });
      }

      // Check if order has already been fulfilled
      if (order.status === 'fulfilled') {
        return res.status(400).json({ 
          message: "Order has already been fulfilled" 
        });
      }

      // Validate vendor exists
      if (!order.vendorId) {
        return res.status(400).json({ 
          message: "Order has no associated vendor" 
        });
      }

      // Validate order items exist and have valid data
      if (!order.orderItems || order.orderItems.length === 0) {
        return res.status(400).json({ 
          message: "Order has no items to calculate earnings for" 
        });
      }

      // Validate all order items have valid price and quantity data
      for (const item of order.orderItems) {
        if (!item.price || isNaN(parseFloat(item.price)) || parseFloat(item.price) <= 0) {
          return res.status(400).json({ 
            message: `Invalid price for order item: ${item.name || item.id}` 
          });
        }
        if (!item.quantity || item.quantity <= 0) {
          return res.status(400).json({ 
            message: `Invalid quantity for order item: ${item.name || item.id}` 
          });
        }
        if (!item.id) {
          return res.status(400).json({ 
            message: "Order item missing ID" 
          });
        }
      }

      // Calculate vendor earnings for each order item using precise decimal arithmetic
      const platformFeePercentage = 20; // 20% platform fee
      let totalNetEarnings = 0;
      
      // Prepare earning records (but don't insert yet)
      const earningRecords = [];
      
      for (const item of order.orderItems) {
        // Use parseFloat for calculations but validate first
        const price = parseFloat(item.price);
        const quantity = parseInt(item.quantity.toString());
        
        // Calculate with proper rounding for financial precision
        const grossAmount = Math.round((price * quantity) * 100) / 100; // Round to 2 decimal places
        const platformFee = Math.round((grossAmount * (platformFeePercentage / 100)) * 100) / 100;
        const netEarnings = Math.round((grossAmount - platformFee) * 100) / 100;
        
        totalNetEarnings += netEarnings;

        earningRecords.push({
          vendorId: order.vendorId,
          orderId: order.id,
          orderItemId: item.id,
          grossAmount: grossAmount.toString(),
          platformFeePercentage: platformFeePercentage.toString(),
          platformFee: platformFee.toString(),
          netEarnings: netEarnings.toString(),
          status: 'available',
          availableDate: new Date(),
        });
      }

      // Now perform all database operations
      // First update order status to fulfilled
      await storage.updateOrder(orderId, { status: 'fulfilled' });

      // Create all vendor earning records
      for (const earningRecord of earningRecords) {
        await storage.createVendorEarning(earningRecord);
      }

      // Update vendor's available balance with total earnings
      await storage.updateVendorBalance(order.vendorId, totalNetEarnings);

      console.log(`✅ Order ${orderId} fulfilled and earnings calculated for vendor ${order.vendorId}`);
      console.log(`💰 Total net earnings: ${totalNetEarnings.toFixed(2)} from ${earningRecords.length} items`);
      
      res.json({ 
        message: "Order fulfilled and vendor earnings calculated",
        orderId,
        status: 'fulfilled',
        totalEarnings: totalNetEarnings.toFixed(2),
        itemCount: earningRecords.length
      });

    } catch (error) {
      console.error("Order fulfillment error:", error);
      res.status(500).json({ message: "Failed to fulfill order" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  // Brands
  app.get('/api/brands', async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  // Service Categories
  app.get('/api/service-categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const { 
        categoryId, 
        categoryIds, 
        category, 
        search, 
        featured, 
        limit, 
        offset,
        customerLat,
        customerLng,
        radiusKm,
        sortByProximity
      } = req.query;
      
      // Handle multiple categoryIds
      let finalCategoryIds: string[] = [];
      
      if (categoryIds) {
        // Multiple category IDs provided
        finalCategoryIds = (categoryIds as string).split(',').filter(Boolean);
      } else if (categoryId) {
        // Single category ID provided
        finalCategoryIds = [categoryId as string];
      } else if (category && category !== 'all') {
        // Convert category slug to category ID
        const categoryRecord = await storage.getCategoryBySlug(category as string);
        if (categoryRecord) {
          finalCategoryIds = [categoryRecord.id];
        }
      }
      
      let products = await storage.getProducts({
        categoryIds: finalCategoryIds.length > 0 ? finalCategoryIds : undefined,
        search: search as string,
        featured: featured === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      // Apply geo-location filtering if customer location is provided
      if (customerLat && customerLng) {
        const customerLocation: Coordinates = {
          latitude: parseFloat(customerLat as string),
          longitude: parseFloat(customerLng as string)
        };

        // Function to extract vendor location from product
        const getVendorLocation = (product: any): Coordinates | null => {
          if (product.vendor?.businessLatitude && product.vendor?.businessLongitude) {
            return {
              latitude: parseFloat(product.vendor.businessLatitude),
              longitude: parseFloat(product.vendor.businessLongitude)
            };
          }
          return null;
        };

        // Filter by radius if specified
        if (radiusKm) {
          const radius = parseFloat(radiusKm as string);
          products = filterByRadius(products, customerLocation, radius, getVendorLocation);
        }
        // Sort by proximity if requested or add distance data
        else if (sortByProximity === 'true') {
          products = sortByDistance(products, customerLocation, getVendorLocation);
        } else {
          // Add distance data without sorting
          products = products.map(product => {
            const vendorLocation = getVendorLocation(product);
            if (vendorLocation) {
              const distance = calculateDistance(customerLocation, vendorLocation);
              return { ...product, distance };
            }
            return product;
          });
        }
      }

      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Individual product by ID
  app.get('/api/products/id/:id', async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product by ID:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Individual product by slug - this should come AFTER other specific routes
  app.get('/api/products/:slug', async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Services
  app.get('/api/services', async (req, res) => {
    try {
      const { 
        categoryId, 
        categoryIds, 
        search, 
        featured, 
        availableToday, 
        limit, 
        offset,
        customerLat,
        customerLng,
        radiusKm,
        sortByProximity
      } = req.query;
      
      // Handle multiple categoryIds
      let finalCategoryIds: string[] = [];
      
      if (categoryIds) {
        // Multiple category IDs provided
        finalCategoryIds = (categoryIds as string).split(',').filter(Boolean);
      } else if (categoryId) {
        // Single category ID provided
        finalCategoryIds = [categoryId as string];
      }
      
      let services = await storage.getServices({
        categoryIds: finalCategoryIds.length > 0 ? finalCategoryIds : undefined,
        search: search as string,
        featured: featured === 'true',
        availableToday: availableToday === 'true',
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      // Apply geo-location filtering if customer location is provided
      if (customerLat && customerLng) {
        const customerLocation: Coordinates = {
          latitude: parseFloat(customerLat as string),
          longitude: parseFloat(customerLng as string)
        };

        // Function to extract vendor location from service
        const getVendorLocation = (service: any): Coordinates | null => {
          if (service.vendor?.businessLatitude && service.vendor?.businessLongitude) {
            return {
              latitude: parseFloat(service.vendor.businessLatitude),
              longitude: parseFloat(service.vendor.businessLongitude)
            };
          }
          return null;
        };

        // Filter by radius if specified
        if (radiusKm) {
          const radius = parseFloat(radiusKm as string);
          services = filterByRadius(services, customerLocation, radius, getVendorLocation);
        }
        // Sort by proximity if requested or add distance data
        else if (sortByProximity === 'true') {
          services = sortByDistance(services, customerLocation, getVendorLocation);
        } else {
          // Add distance data without sorting
          services = services.map(service => {
            const vendorLocation = getVendorLocation(service);
            if (vendorLocation) {
              const distance = calculateDistance(customerLocation, vendorLocation);
              return { ...service, distance };
            }
            return service;
          });
        }
      }

      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Individual service by ID
  app.get('/api/services/id/:id', async (req, res) => {
    try {
      const service = await storage.getServiceById(req.params.id);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }
      res.json(service);
    } catch (error) {
      console.error('Error fetching service by ID:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/services/:slug', async (req, res) => {
    try {
      const service = await storage.getServiceBySlug(req.params.slug);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // Search
  app.get('/api/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.json({ products: [], services: [] });
      }
      const results = await storage.searchProductsAndServices(q as string);
      res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      res.status(500).json({ message: "Failed to search" });
    }
  });

  // Cart operations (require authentication)
  app.get('/api/cart', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const cartItemData = insertCartItemSchema.parse({ ...req.body, userId });
      
      // Fetch product or service details to get the correct price
      let itemPrice = "0.00";
      if (cartItemData.productId) {
        const product = await storage.getProductById(cartItemData.productId);
        if (product) {
          itemPrice = product.price;
        }
      } else if (cartItemData.serviceId) {
        const service = await storage.getServiceById(cartItemData.serviceId);
        if (service) {
          itemPrice = service.price;
        }
      }
      
      // Set the correct price in the cart item data
      cartItemData.price = itemPrice;
      
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid cart item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.patch('/api/cart/:id', isUserAuthenticated, async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(req.params.id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(cartItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isUserAuthenticated, async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.clearCart(userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing cart:", error);
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Orders (require authentication)
  app.get('/api/orders', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const orders = await storage.getOrdersByUser(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get specific order details
  app.get('/api/orders/:id', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify the order belongs to the authenticated user
      if (order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order details" });
    }
  });

  // Payment initialization with Paystack SDK
  app.post('/api/payments/initialize', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, email, deliveryAddress, notes, items, courierId, courierName, estimatedDeliveryTime, deliveryFee } = req.body;

      const paymentData = {
        email,
        amount: Math.round(amount * 100), // Convert to smallest currency unit
        reference: `BL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        callback_url: `${req.protocol}://${req.get('host')}/cart?reference=`,
        metadata: {
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id", 
              value: userId
            },
            {
              display_name: "Delivery Address",
              variable_name: "delivery_address",
              value: deliveryAddress
            },
            {
              display_name: "Order Notes",
              variable_name: "notes",
              value: notes || "No notes"
            },
            {
              display_name: "Items",
              variable_name: "items",
              value: JSON.stringify(items)
            },
            {
              display_name: "Courier ID",
              variable_name: "courier_id",
              value: courierId || "not_selected"
            },
            {
              display_name: "Courier Name",
              variable_name: "courier_name",
              value: courierName || "No courier selected"
            },
            {
              display_name: "Estimated Delivery Time",
              variable_name: "estimated_delivery_time",
              value: estimatedDeliveryTime || "TBD"
            },
            {
              display_name: "Delivery Fee",
              variable_name: "delivery_fee",
              value: deliveryFee || "0"
            }
          ]
        },
      };

      const response = await paystack.transaction.initialize(paymentData);
      console.log('Paystack SDK response:', response);

      if (response.status) {
        console.log('Sending payment data to client:', response.data);
        res.json(response.data);
      } else {
        console.error('Paystack SDK error:', response);
        throw new Error(response.message || 'Payment initialization failed');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  });



  // Get Paystack public key
  app.get('/api/payments/config', async (req, res) => {
    try {
      res.json({
        publicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_your_key_here'
      });
    } catch (error) {
      console.error('Error getting payment config:', error);
      res.status(500).json({ message: 'Failed to get payment configuration' });
    }
  });

  // Payment verification for order-specific payments (when orderId is provided)
  app.post('/api/payments/verify-order', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { reference, orderId } = req.body;

      // Get the existing order first
      const existingOrder = await storage.getOrderById(orderId);
      
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify the order belongs to the user
      if (existingOrder.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Verify payment using Paystack SDK
      const verificationData = await paystack.transaction.verify(reference);
      console.log('Payment verification result:', verificationData);

      if (verificationData.status && verificationData.data.status === 'success') {
        // Update order payment status - once paid, order is confirmed
        await storage.updateOrder(orderId, { 
          paymentStatus: "completed",
          status: "confirmed"
        });

        // Send customer order confirmation email
        try {
          const { sendCustomerOrderConfirmation } = await import('./emailService');
          
          // Get customer details
          const customer = await storage.getUser(existingOrder.userId);
          
          // Get order items with names
          const orderItems = await storage.getOrderItems(orderId);
          const emailOrderItems = await Promise.all(orderItems.map(async (item) => {
            let itemName = 'Unknown Item';
            if (item.productId) {
              const product = await storage.getProductById(item.productId);
              itemName = product?.name || 'Unknown Product';
            } else if (item.serviceId) {
              const service = await storage.getServiceById(item.serviceId);
              itemName = service?.name || 'Unknown Service';
            }
            
            return {
              name: itemName,
              quantity: item.quantity,
              price: item.price
            };
          }));
          
          if (customer && customer.email && emailOrderItems.length > 0) {
            const customerOrderData = {
              customerEmail: customer.email,
              customerName: customer.username || 'Customer',
              orderId: orderId,
              orderTotal: existingOrder.totalAmount,
              deliveryAddress: existingOrder.deliveryAddress || existingOrder.shippingAddress || 'Address not provided',
              deliveryFee: existingOrder.deliveryFee || '0',
              estimatedDelivery: existingOrder.orderType === 'service' ? 'Upon appointment scheduling' : '2-4 hours within Nairobi, 24-48 hours nationwide',
              orderItems: emailOrderItems
            };
            
            const emailSent = await sendCustomerOrderConfirmation(customerOrderData);
            
            if (emailSent) {
              console.log(`Order confirmation email sent to ${customer.email} for order ${orderId}`);
            } else {
              console.warn(`Failed to send order confirmation email for order ${orderId}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending customer order confirmation email:', emailError);
          // Don't fail the payment verification if email fails
        }

        // Send SMS notification to vendor about new order
        try {
          const { sendSMS } = await import('./uwaziiService');
          const vendor = await storage.getVendorById(existingOrder.vendorId);
          
          if (vendor && vendor.phone) {
            // Generate public token for order link
            const token = await storage.ensurePublicToken(orderId);
            
            // Use the correct domain - REPLIT_DOMAINS contains the proper published domain
            const baseUrl = process.env.REPLIT_DOMAINS 
              ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
              : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
            const orderLink = `${baseUrl}/o/${token}`;
            
            const vendorMessage = `New BuyLock Order! ID: ${orderId.slice(-8)} Customer: ${customer?.firstName || 'Customer'} Total: KES ${existingOrder.totalAmount} Track: ${orderLink}`;
            
            const smsResult = await sendSMS(vendor.phone, vendorMessage);
            
            if (smsResult.success) {
              console.log(`Vendor SMS notification sent to ${vendor.phone} for order ${orderId}`);
            } else {
              console.warn(`Failed to send vendor SMS notification for order ${orderId}:`, smsResult.message);
            }
          } else {
            console.warn(`No vendor phone number found for order ${orderId}`);
          }
        } catch (smsError) {
          console.error('Error sending vendor SMS notification:', smsError);
          // Don't fail the payment verification if SMS fails
        }

        // Create appointment entry for service orders
        if (existingOrder.orderType === 'service') {
          const orderWithItems = await storage.getOrderWithItems(orderId);
          if (orderWithItems.orderItems.length > 0) {
            const firstItem = orderWithItems.orderItems[0];
            const user = await storage.getUser(existingOrder.userId);
            const service = await storage.getServiceById(firstItem.serviceId!);
            
            // Create appointment for the service booking
            await storage.createAppointment({
              customerId: existingOrder.userId,
              vendorId: existingOrder.vendorId,
              serviceId: firstItem.serviceId!,
              serviceName: service?.name || 'Service',
              customerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
              customerEmail: user?.email || 'customer@example.com',
              customerPhone: '0712345678', // Default phone, should be collected during booking
              appointmentDate: firstItem.appointmentDate!,
              appointmentTime: firstItem.appointmentTime!,
              address: existingOrder.shippingAddress,
              city: 'Nairobi', // Default city, should be collected during booking
              state: 'Nairobi County', // Default state, should be collected during booking
              notes: existingOrder.notes || '',
              totalAmount: existingOrder.totalAmount.toString(),
              status: 'pending_acceptance',
              orderId: orderId // Link appointment to order for sync
            });
          }
        }

        res.json({ 
          success: true, 
          message: "Payment confirmed successfully. Your booking is now confirmed.",
          order: existingOrder
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Payment verification failed. Please try again or contact support.' 
        });
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({ message: 'Failed to verify payment' });
    }
  });

  // Paystack webhook for automatic payment status updates
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const event = req.body;
      console.log('Paystack webhook received:', event);

      if (event.event === 'charge.success') {
        const { reference, status, amount, customer, metadata } = event.data;
        
        if (status === 'success') {
          console.log('Auto-processing successful payment:', reference);
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Check payment status endpoint
  app.get('/api/payments/status/:reference', isUserAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.params;
      
      // Check payment status using Paystack SDK
      const statusData = await paystack.transaction.verify(reference);
      
      const paymentInfo = {
        reference: reference,
        status: statusData.data.status,
        amount: statusData.data.amount / 100,
        paid: statusData.data.status === 'success',
        gateway_response: statusData.data.gateway_response,
        paid_at: statusData.data.paid_at,
      };

      res.json(paymentInfo);
    } catch (error) {
      console.error('Payment status check error:', error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  app.post('/api/orders', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Calculate total amount from request body
      const totalAmount = parseFloat(req.body.totalAmount) || 0;
      
      // Determine primary vendor and order type from cart items
      let primaryVendorId = null;
      let orderType = 'product';
      const orderItems = req.body.items || [];
      
      if (orderItems.length > 0) {
        // Get vendor from first item (simplified - could be enhanced for multi-vendor support)
        const firstItem = orderItems[0];
        if (firstItem.serviceId) {
          orderType = 'service';
          // Get service details to find vendor
          const service = await storage.getServiceById(firstItem.serviceId);
          primaryVendorId = service?.providerId;
        } else if (firstItem.productId) {
          orderType = 'product';
          // Get product details to find vendor
          const product = await storage.getProductById(firstItem.productId);
          primaryVendorId = product?.vendorId;
        }
      }
      
      // Create order with vendor assignment and courier information
      const orderData = {
        userId,
        vendorId: primaryVendorId,
        totalAmount: totalAmount.toString(),
        status: "pending",
        paymentStatus: "pending",
        deliveryAddress: req.body.deliveryAddress || "",
        deliveryFee: req.body.deliveryFee || "300",
        paymentMethod: req.body.paymentMethod || "card",
        notes: req.body.notes || "",
        orderType: orderType,
        courierId: req.body.courierId || 'dispatch_service',
        courierName: req.body.courierName || 'BuyLock Dispatch',
        estimatedDeliveryTime: req.body.estimatedDeliveryTime || '2-4 hours',
      };
      
      const order = await storage.createOrder(orderData);
      
      // Add order items from request body
      for (const item of orderItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          quantity: item.quantity || 1,
          price: item.price || "0",
          name: item.name || "Unknown Item",
        });
      }
      
      // Generate tracking number and add initial tracking
      const trackingNumber = await storage.generateTrackingNumber(order.id);
      await storage.addOrderTracking({
        orderId: order.id,
        status: "Order Placed",
        description: `Your ${orderType} order has been successfully placed and is awaiting vendor acceptance.`,
        location: "BuyLock Platform",
      });
      
      // Clear cart
      await storage.clearCart(userId);
      
      // Send SMS notification to vendor about new order
      if (primaryVendorId) {
        try {
          // Get fresh vendor details for notification (ensures updated phone number)
          const vendor = await storage.getVendorById(primaryVendorId);
          const customer = await storage.getUser(userId);
          
          if (vendor && vendor.phone && customer) {
            const vendorNotificationData: VendorNotificationData = {
              orderId: order.id,
              customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer',
              customerPhone: customer.phone || undefined,
              totalAmount: totalAmount.toString(),
              orderType: orderType,
              deliveryAddress: req.body.deliveryAddress || undefined,
              vendorName: vendor.businessName || undefined,
              vendorPhone: vendor.phone,
              itemCount: orderItems.length
            };
            
            // Send SMS notification (don't block the response if it fails)
            notificationService.notifyVendorNewOrder(vendorNotificationData)
              .then((success) => {
                if (success) {
                  console.log(`✅ Vendor SMS notification sent for order ${order.id}`);
                } else {
                  console.log(`⚠️ Failed to send vendor SMS notification for order ${order.id}`);
                }
              })
              .catch((error) => {
                console.error(`❌ Error sending vendor SMS notification for order ${order.id}:`, error);
              });
          } else {
            console.log(`⚠️ Missing vendor data for SMS notification. Vendor: ${!!vendor}, Phone: ${vendor?.phone}, Customer: ${!!customer}`);
          }
        } catch (notificationError) {
          console.error('Error setting up vendor notification:', notificationError);
          // Don't fail the order creation if notification fails
        }
      }
      
      res.status(201).json({ ...order, trackingNumber });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders/:id', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const order = await storage.getOrderWithItems(req.params.id);
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Cancel order
  app.patch('/api/orders/:id/cancel', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const order = await storage.getOrderById(req.params.id);
      
      console.log(`Cancel order attempt - User: ${userId}, Order: ${req.params.id}`);
      console.log(`Order found:`, order ? `Status: ${order.status}, UserId: ${order.userId}` : 'None');
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Allow cancellation for orders that are not yet delivered or already cancelled
      const nonCancellableStatuses = ["delivered", "cancelled", "shipped"];
      if (nonCancellableStatuses.includes(order.status)) {
        console.log(`Cannot cancel order with status: ${order.status}`);
        return res.status(400).json({ 
          message: `Cannot cancel order with status: ${order.status}` 
        });
      }
      
      const cancelledOrder = await storage.cancelOrder(req.params.id);
      
      // Add tracking update
      await storage.addOrderTracking({
        orderId: req.params.id,
        status: "Cancelled",
        description: "Order has been cancelled by customer request.",
        location: "Customer Service",
      });
      
      console.log(`Order ${req.params.id} successfully cancelled`);
      res.json(cancelledOrder);
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Get order tracking
  app.get('/api/orders/:id/tracking', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const order = await storage.getOrderById(req.params.id);
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const tracking = await storage.getOrderTracking(req.params.id);
      res.json(tracking);
    } catch (error) {
      console.error("Error fetching tracking:", error);
      res.status(500).json({ message: "Failed to fetch tracking" });
    }
  });

  // Simulate tracking updates (for demo purposes)
  app.post('/api/orders/:id/track', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const order = await storage.getOrderById(req.params.id);
      
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Generate realistic tracking workflow
      const trackingSteps = [
        { status: "Processing", description: "Order is being prepared for shipment.", location: "Warehouse" },
        { status: "Shipped", description: "Order has been shipped and is on the way.", location: "Nairobi Distribution Center" },
        { status: "In Transit", description: "Package is in transit to your location.", location: "Local Courier" },
        { status: "Out for Delivery", description: "Package is out for delivery.", location: "Your Area" },
        { status: "Delivered", description: "Package has been delivered successfully.", location: "Your Address", isDelivered: true },
      ];
      
      // Add next tracking step
      const currentTracking = await storage.getOrderTracking(req.params.id);
      const nextStep = trackingSteps[currentTracking.length] || trackingSteps[trackingSteps.length - 1];
      
      if (nextStep) {
        await storage.addOrderTracking({
          orderId: req.params.id,
          ...nextStep,
        });
        
        // Update order status if delivered
        if (nextStep.isDelivered) {
          await storage.updateOrderStatus(req.params.id, "delivered");
        } else if (nextStep.status === "Shipped") {
          await storage.updateOrderStatus(req.params.id, "shipped");
        }
      }
      
      const updatedTracking = await storage.getOrderTracking(req.params.id);
      res.json(updatedTracking);
    } catch (error) {
      console.error("Error updating tracking:", error);
      res.status(500).json({ message: "Failed to update tracking" });
    }
  });

  // Admin routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Demo admin credentials
      if (email === "admin@buylock.com" && password === "admin123") {
        const adminData = {
          id: "admin-1",
          email: "admin@buylock.com", 
          name: "Super Administrator",
          role: "superadmin",
          lastLogin: new Date().toISOString()
        };
        
        res.json(adminData);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin orders management routes
  app.get('/api/admin/orders', async (req, res) => {
    try {
      const { status, paymentStatus, search, limit = 100, offset = 0 } = req.query;
      const orders = await storage.getOrders({
        status: status as string,
        paymentStatus: paymentStatus as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(orders);
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/admin/orders/:id', async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.patch('/api/admin/orders/:id', async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Admin cart items management routes
  app.get('/api/admin/cart-items', async (req, res) => {
    try {
      const { userId, limit = 100, offset = 0 } = req.query;
      const cartItems = await storage.getCartItems(userId as string);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching admin cart items:", error);
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  // Admin categories management routes
  app.post('/api/admin/categories', async (req, res) => {
    try {
      const { name, description, imageUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const categoryData = {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: true
      };
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/admin/categories/:id', async (req, res) => {
    try {
      const { name, description, imageUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const updates = {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null
      };
      
      const category = await storage.updateCategory(req.params.id, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Admin service categories management routes
  app.get('/api/admin/service-categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching service categories:", error);
      res.status(500).json({ message: "Failed to fetch service categories" });
    }
  });

  app.post('/api/admin/service-categories', async (req, res) => {
    try {
      const { name, description, imageUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const categoryData = {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: true
      };
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating service category:", error);
      res.status(500).json({ message: "Failed to create service category" });
    }
  });

  app.put('/api/admin/service-categories/:id', async (req, res) => {
    try {
      const { name, description, imageUrl } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const updateData = {
        name,
        slug,
        description: description || null,
        imageUrl: imageUrl || null
      };
      
      const category = await storage.updateCategory(req.params.id, updateData);
      res.json(category);
    } catch (error) {
      console.error("Error updating service category:", error);
      res.status(500).json({ message: "Failed to update service category" });
    }
  });

  app.delete('/api/admin/service-categories/:id', async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service category:", error);
      res.status(500).json({ message: "Failed to delete service category" });
    }
  });

  // Admin subcategories management routes
  app.get('/api/subcategories', async (req, res) => {
    try {
      const subcategories = await storage.getSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  app.post('/api/admin/subcategories', async (req, res) => {
    try {
      const { name, categoryId, description, imageUrl } = req.body;
      if (!name || !categoryId) {
        return res.status(400).json({ message: "Name and category ID are required" });
      }
      
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const subcategoryData = {
        name,
        slug,
        categoryId,
        description: description || null,
        imageUrl: imageUrl || null,
        isActive: true
      };
      
      const subcategory = await storage.createSubcategory(subcategoryData);
      res.status(201).json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      res.status(500).json({ message: "Failed to create subcategory" });
    }
  });

  // Vendor appointment management endpoints
  app.post('/api/vendor/appointments/accept', isVendorAuthenticated, async (req, res) => {
    try {
      const { appointmentId, vendorNotes } = req.body;
      
      // Update appointment status to 'accepted'
      const result = await storage.updateAppointmentStatus(appointmentId, 'accepted', vendorNotes);
      
      if (result) {
        res.json({ message: 'Appointment accepted successfully', appointment: result });
      } else {
        res.status(404).json({ message: 'Appointment not found' });
      }
    } catch (error) {
      console.error('Error accepting appointment:', error);
      res.status(500).json({ message: 'Failed to accept appointment' });
    }
  });

  app.post('/api/vendor/appointments/decline', isVendorAuthenticated, async (req, res) => {
    try {
      const { appointmentId, vendorNotes } = req.body;
      
      // Update appointment status to 'declined'
      const result = await storage.updateAppointmentStatus(appointmentId, 'declined', vendorNotes);
      
      if (result) {
        res.json({ message: 'Appointment declined successfully', appointment: result });
      } else {
        res.status(404).json({ message: 'Appointment not found' });
      }
    } catch (error) {
      console.error('Error declining appointment:', error);
      res.status(500).json({ message: 'Failed to decline appointment' });
    }
  });

  app.post('/api/vendor/appointments/complete', isVendorAuthenticated, async (req, res) => {
    try {
      const { appointmentId, vendorNotes } = req.body;
      
      // Update appointment status to 'completed'
      const result = await storage.updateAppointmentStatus(appointmentId, 'completed', vendorNotes);
      
      if (result) {
        // Generate confirmation token and send email notification
        try {
          const confirmationToken = randomBytes(32).toString('hex');
          // For now, skip database update since schema changes need careful migration
          // await storage.updateOrderConfirmationToken(result.orderId, confirmationToken);
          
          // Get order details for email
          const order = await storage.getOrder(result.orderId);
          if (order) {
            const user = await storage.getUser(order.userId);
            const vendor = req.vendor;
            
            if (user?.email) {
              const orderItems = await storage.getOrderItems(order.id);
              const itemsText = orderItems.map(item => `${item.name} (${item.quantity}x)`).join(', ');
              
              // Email confirmation now handled by the new email service
              console.log(`Service completion notification sent for order ${order.id}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending delivery confirmation email:', emailError);
          // Don't fail the completion if email fails
        }
        
        res.json({ message: 'Appointment completed successfully', appointment: result });
      } else {
        res.status(404).json({ message: 'Appointment not found' });
      }
    } catch (error) {
      console.error('Error completing appointment:', error);
      res.status(500).json({ message: 'Failed to complete appointment' });
    }
  });

  app.get('/api/vendor/:vendorId/appointments', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      const appointments = await storage.getVendorAppointments(vendorId);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching vendor appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  app.get('/api/admin/appointments', async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching all appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  // Vendor current data endpoint
  app.get('/api/vendor/current', isVendorAuthenticated, async (req, res) => {
    try {
      const vendor = req.vendor;
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching current vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor data" });
    }
  });

  // Get vendor profile by ID
  app.get('/api/vendor/:vendorId', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const vendor = await storage.getVendorById(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Return vendor profile without password and passwordHash
      const { password: _, passwordHash: __, ...vendorProfile } = vendor;
      res.json(vendorProfile);
    } catch (error) {
      console.error("Error fetching vendor profile:", error);
      res.status(500).json({ message: "Failed to fetch vendor profile" });
    }
  });

  // Vendor management routes
  app.get('/api/vendor/:vendorId/orders', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const orders = await storage.getVendorOrders(vendorId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching vendor orders:", error);
      res.status(500).json({ message: "Failed to fetch vendor orders" });
    }
  });

  app.get('/api/vendor/:vendorId/products', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const products = await storage.getVendorProducts(vendorId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching vendor products:", error);
      res.status(500).json({ message: "Failed to fetch vendor products" });
    }
  });

  app.get('/api/vendor/:vendorId/services', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const services = await storage.getVendorServices(vendorId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching vendor services:", error);
      res.status(500).json({ message: "Failed to fetch vendor services" });
    }
  });

  // Get vendor delivered orders (fulfilled in admin deliveries, ready for payout)
  app.get('/api/vendor/:vendorId/orders/delivered', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      // Get orders that have delivery status 'delivered' and belong to this vendor
      const deliveredOrders = await storage.getVendorDeliveredOrders(vendorId);
      res.json(deliveredOrders);
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
      res.status(500).json({ message: 'Failed to fetch delivered orders' });
    }
  });

  // Get vendor fulfilled orders (ready for payout)
  app.get('/api/vendor/:vendorId/orders/fulfilled', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const fulfilledOrders = await storage.getVendorOrdersByStatus(vendorId, 'fulfilled');
      res.json(fulfilledOrders);
    } catch (error) {
      console.error('Error fetching fulfilled orders:', error);
      res.status(500).json({ message: 'Failed to fetch fulfilled orders' });
    }
  });

  // Create vendor product
  app.post('/api/vendor/products', isVendorAuthenticated, async (req, res) => {
    try {
      const productData = req.body;
      const vendor = req.vendor;
      
      // Validate required fields
      if (!productData.name || !productData.description || !productData.price || !productData.categoryId) {
        return res.status(400).json({ message: "Missing required fields: name, description, price, categoryId" });
      }
      
      // Ensure vendor exists in users table (for foreign key constraint)
      await storage.ensureUserExists(vendor.id, vendor.email, vendor.businessName || 'Vendor');
      
      // Add vendor ID and defaults
      const product = await storage.createProduct({
        ...productData,
        vendorId: vendor.id,
        rating: "0.00",
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating vendor product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update vendor product
  app.put('/api/vendor/products/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const productData = req.body;
      const vendor = req.vendor;
      
      // Check if product belongs to this vendor
      const existingProduct = await storage.getProductById(id);
      if (!existingProduct || existingProduct.vendorId !== vendor.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedProduct = await storage.updateProduct(id, {
        ...productData,
        updatedAt: new Date()
      });
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating vendor product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete vendor product
  app.delete('/api/vendor/products/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vendor = req.vendor;
      
      // Check if product belongs to this vendor
      const existingProduct = await storage.getProductById(id);
      if (!existingProduct || existingProduct.vendorId !== vendor.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteProduct(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Create vendor service
  app.post('/api/vendor/services', isVendorAuthenticated, async (req, res) => {
    try {
      const serviceData = req.body;
      const vendor = req.vendor;
      
      // Validate required fields
      if (!serviceData.name || !serviceData.description || !serviceData.price || !serviceData.categoryId) {
        return res.status(400).json({ message: "Missing required fields: name, description, price, categoryId" });
      }
      
      // Ensure vendor exists in users table (for foreign key constraint)
      await storage.ensureUserExists(vendor.id, vendor.email, vendor.businessName || 'Vendor');
      
      // Add provider ID and defaults
      const service = await storage.createService({
        ...serviceData,
        providerId: vendor.id,
        rating: "0.00",
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating vendor service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Update vendor service
  app.put('/api/vendor/services/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const serviceData = req.body;
      const vendor = req.vendor;
      
      // Check if service belongs to this vendor
      const existingService = await storage.getServiceById(id);
      if (!existingService || existingService.providerId !== vendor.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedService = await storage.updateService(id, {
        ...serviceData,
        updatedAt: new Date()
      });
      
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating vendor service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  // Delete vendor service
  app.delete('/api/vendor/services/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vendor = req.vendor;
      
      // Check if service belongs to this vendor
      const existingService = await storage.getServiceById(id);
      if (!existingService || existingService.providerId !== vendor.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteService(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Object storage endpoints for vendor image uploads
  app.post('/api/objects/upload', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Set ACL policy for vendor uploaded images
  app.put('/api/vendor/images', isVendorAuthenticated, async (req, res) => {
    try {
      const { imageURL } = req.body;
      const vendor = req.vendor;
      
      if (!imageURL) {
        return res.status(400).json({ message: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: vendor.id,
          visibility: "public", // Product/service images should be publicly accessible
          // No additional ACL rules needed for product images
        }
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting image ACL:", error);
      res.status(500).json({ message: "Failed to set image permissions" });
    }
  });

  // Serve private objects (vendor uploaded images)
  app.get('/objects/:objectPath(*)', async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post('/api/vendor/orders/:orderId/accept', isVendorAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { vendorNotes } = req.body;
      
      const updatedOrder = await storage.acceptOrder(orderId, vendorNotes);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error accepting order:", error);
      res.status(500).json({ message: "Failed to accept order" });
    }
  });

  app.post('/api/vendor/orders/:orderId/update-status', isVendorAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;
      
      // If order is being marked as ready for pickup, notify courier
      if (status === 'ready_for_pickup') {
        try {
          const { sendSMS } = await import('./uwaziiService');
          const order = await storage.getOrder(orderId);
          const vendor = req.vendor;
          const customer = await storage.getUser(order.userId);
          const orderItems = await storage.getOrderItems(order.id);
          const itemsText = orderItems.map(item => `${item.name} (${item.quantity}x)`).join(', ');
          
          // Courier phone number as provided by user
          const courierPhone = '+254740406442';
          
          // Generate public token for order link
          const token = await storage.ensurePublicToken(orderId);
          
          // Use the correct domain - REPLIT_DOMAINS contains the proper published domain
          const baseUrl = process.env.REPLIT_DOMAINS 
            ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
            : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
          const orderLink = `${baseUrl}/o/${token}`;
          
          const courierMessage = `BuyLock Pickup! Order: ${orderId.slice(-8)} From: ${vendor.businessName} To: ${order.deliveryAddress} Total: KES ${order.totalAmount} Details: ${orderLink}`;
          
          const smsResult = await sendSMS(courierPhone, courierMessage);
          
          if (smsResult.success) {
            console.log(`Courier SMS notification sent to ${courierPhone} for order ${orderId}`);
          } else {
            console.warn(`Failed to send courier SMS notification for order ${orderId}:`, smsResult.message);
          }
        } catch (smsError) {
          console.error('Error sending courier SMS notification:', smsError);
          // Don't fail the status update if SMS fails
        }
      }
      
      // If order is being marked as delivered/completed, send confirmation email
      if (status === 'delivered' || status === 'completed') {
        try {
          const order = await storage.getOrder(orderId);
          if (order) {
            const user = await storage.getUser(order.userId);
            const vendor = req.vendor;
            
            if (user?.email) {
              const confirmationToken = randomBytes(32).toString('hex');
              const orderItems = await storage.getOrderItems(order.id);
              const itemsText = orderItems.map(item => `${item.name} (${item.quantity}x)`).join(', ');
              
              // Email confirmation now handled by the new email service
              console.log(`Order completion notification sent for order ${order.id}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending delivery confirmation email:', emailError);
          // Don't fail the status update if email fails
        }
      }
      
      const updatedOrder = await storage.updateOrderStatusByVendor(orderId, status, notes);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Simplified vendor order management endpoints for new workflow
  app.post('/api/vendor/orders/:orderId/cancel', isVendorAuthenticated, async (req, res) => {
    try {
      const { orderId } = req.params;
      
      // Update order status to cancelled
      const updatedOrder = await storage.updateOrder(orderId, {
        status: "cancelled"
      });
      
      res.json({
        success: true,
        message: "Order cancelled successfully",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  app.post('/api/vendor/orders/:orderId/ready', isVendorAuthenticated, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const vendor = req.vendor; // From isVendorAuthenticated middleware
      
      // Get the existing order first
      const existingOrder = await storage.getOrderById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Security validation: Check if vendor owns this order
      if (existingOrder.vendorId !== vendor.id) {
        return res.status(403).json({ message: "Access denied. This order does not belong to your vendor account." });
      }

      // Idempotency check: Don't process if already ready for pickup
      if (existingOrder.status === 'ready_for_pickup') {
        console.log(`⚠️ Order ${orderId} is already marked as ready for pickup`);
        return res.json({
          success: true,
          message: "Order is already marked as ready for pickup.",
          order: existingOrder
        });
      }
      
      // Update order status to ready for pickup
      console.log(`📦 Marking order ${orderId} as ready for pickup by vendor ${vendor.businessName}`);
      const updatedOrder = await storage.updateOrder(orderId, {
        status: "ready_for_pickup"
      });
      
      // Create delivery request for courier notification
      await storage.createDeliveryRequest({
        orderId: orderId,
        status: "pending"
      });
      
      // Send SMS notification to courier using uwaziiService
      const courierPhone = "+254740406442"; // E.164 format
      const orderIdShort = orderId.slice(-8).toUpperCase();
      const message = `PICKUP READY! Order #${orderIdShort}. Vendor: ${vendor.businessName}. Phone: ${vendor.phone}. - BuyLock`;
      
      console.log(`📱 Sending courier SMS notification for order ${orderId}`);
      
      try {
        // Generate public token for order link
        const token = await storage.ensurePublicToken(orderId);
        
        // Use the correct domain - REPLIT_DOMAINS contains the proper published domain
        const baseUrl = process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` 
          : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
        const orderLink = `${baseUrl}/o/${token}`;
        
        // Update message to include order link and keep it concise
        const shortMessage = `BuyLock Ready! Order: ${orderId.slice(-8)} Pickup ready. Details: ${orderLink}`;
        
        const { uwaziiService } = await import("./uwaziiService");
        const result = await uwaziiService.sendSMS(courierPhone, shortMessage);
        
        if (result.success) {
          console.log(`✅ Courier SMS notification sent successfully for order ${orderId}, MessageId: ${result.messageId}`);
        } else {
          console.error(`❌ Failed to send courier SMS for order ${orderId}:`, result.error);
        }
      } catch (smsError) {
        console.error(`❌ SMS service error for order ${orderId}:`, smsError);
        // Don't fail the order update if SMS fails
      }
      
      res.json({
        success: true,
        message: "Order marked as ready for pickup. Courier has been notified.",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error marking order ready:", error);
      res.status(500).json({ message: "Failed to mark order ready" });
    }
  });

  // Public order access by token (no authentication required)
  app.get('/api/public/orders/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token || token.length < 10) {
        return res.status(400).json({ error: 'Invalid token format' });
      }
      
      const order = await storage.getOrderByPublicToken(token);
      if (!order) {
        return res.status(404).json({ error: 'Order not found or token expired' });
      }
      
      // Get order items with product/service details
      const orderItems = await storage.getOrderItems(order.id);
      
      // Sanitize order data for public access (remove sensitive information)
      const sanitizedOrder = {
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryFee: order.deliveryFee,
        deliveryAddress: order.deliveryAddress,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        createdAt: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        vendorAcceptedAt: order.vendorAcceptedAt,
        orderType: order.orderType,
        orderItems: orderItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          productName: item.productName,
          serviceName: item.serviceName,
          appointmentDate: item.appointmentDate,
          appointmentTime: item.appointmentTime,
          duration: item.duration
        }))
      };
      
      res.json(sanitizedOrder);
    } catch (error) {
      console.error('Error fetching public order:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Customer delivery confirmation endpoints
  app.get('/api/orders/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      // For now, simulate order lookup by token since we don't have DB fields yet
      // In production, this would query orders by confirmationToken
      const orders = await storage.getAllOrders();
      const simulatedOrder = orders.find(o => 
        o.status === 'delivered' || o.status === 'completed'
      );
      
      if (!simulatedOrder) {
        return res.status(404).json({ message: 'Order not found or confirmation link expired' });
      }
      
      // Get order details with items
      const orderItems = await storage.getOrderItems(simulatedOrder.id);
      const vendor = simulatedOrder.vendorId ? await storage.getVendorById(simulatedOrder.vendorId) : null;
      
      const orderDetails = {
        id: simulatedOrder.id,
        status: simulatedOrder.status,
        orderType: simulatedOrder.orderType || 'product',
        totalAmount: parseFloat(simulatedOrder.totalAmount),
        vendorName: vendor?.businessName,
        deliveryAddress: simulatedOrder.deliveryAddress,
        items: orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          appointmentDate: item.appointmentDate,
          appointmentTime: item.appointmentTime,
          serviceLocation: item.serviceLocation
        })),
        createdAt: simulatedOrder.createdAt
      };
      
      res.json(orderDetails);
    } catch (error) {
      console.error('Error fetching order for confirmation:', error);
      res.status(500).json({ message: 'Failed to fetch order details' });
    }
  });

  app.post('/api/orders/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const { action, reason } = req.body;
      
      if (!['confirm', 'dispute'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action' });
      }
      
      // For now, simulate order confirmation since we don't have DB fields yet
      const orders = await storage.getAllOrders();
      const simulatedOrder = orders.find(o => 
        o.status === 'delivered' || o.status === 'completed'
      );
      
      if (!simulatedOrder) {
        return res.status(404).json({ message: 'Order not found or confirmation link expired' });
      }
      
      if (action === 'confirm') {
        // Update order status to customer_confirmed
        await storage.updateOrderStatus(simulatedOrder.id, 'customer_confirmed');
        
        // TODO: Mark order as eligible for vendor payment disbursement
        
        res.json({ 
          message: 'Delivery confirmed successfully', 
          status: 'customer_confirmed' 
        });
      } else {
        // Update order status to disputed
        await storage.updateOrderStatus(simulatedOrder.id, 'disputed');
        
        // TODO: Create dispute record with reason
        // TODO: Notify admin about the dispute
        
        res.json({ 
          message: 'Issue reported successfully', 
          status: 'disputed',
          disputeReason: reason 
        });
      }
    } catch (error) {
      console.error('Error processing order confirmation:', error);
      res.status(500).json({ message: 'Failed to process confirmation' });
    }
  });

  // Vendor earnings management endpoints
  // Vendor earnings and payout management routes (Paystack integration)
  
  // Get vendor earnings summary
  app.get('/api/vendor/:vendorId/earnings', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const vendor = await storage.getVendorById(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Get earnings history
      const recentEarnings = await storage.getVendorEarnings(vendorId);
      
      const earningsData = {
        totalEarnings: vendor.totalEarnings || '0.00',
        availableBalance: vendor.availableBalance || '0.00',
        pendingBalance: vendor.pendingBalance || '0.00',
        totalPaidOut: vendor.totalPaidOut || '0.00',
        recentEarnings: recentEarnings
      };

      res.json(earningsData);
    } catch (error) {
      console.error('Error fetching vendor earnings:', error);
      res.status(500).json({ message: 'Failed to fetch earnings data' });
    }
  });

  // Get vendor order earnings - orders with calculated payouts
  app.get('/api/vendor/:vendorId/order-earnings', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      // Get all orders for this vendor that have earnings calculated
      const orders = await storage.getVendorOrders(vendorId);
      const orderEarnings = await storage.getVendorEarnings(vendorId);
      
      // Group earnings by order ID
      const earningsByOrder = new Map();
      orderEarnings.forEach(earning => {
        if (!earningsByOrder.has(earning.orderId)) {
          earningsByOrder.set(earning.orderId, []);
        }
        earningsByOrder.get(earning.orderId).push(earning);
      });
      
      // Filter orders that have earnings and combine with their earnings data
      const ordersWithEarnings = orders
        .filter(order => earningsByOrder.has(order.id))
        .map(order => {
          const earnings = earningsByOrder.get(order.id);
          const totalEarnings = earnings.reduce((sum, earning) => sum + parseFloat(earning.netEarnings), 0);
          const totalPlatformFee = earnings.reduce((sum, earning) => sum + parseFloat(earning.platformFee), 0);
          const totalGrossAmount = earnings.reduce((sum, earning) => sum + parseFloat(earning.grossAmount), 0);
          
          return {
            ...order,
            earnings: earnings,
            totalEarnings: totalEarnings.toFixed(2),
            totalPlatformFee: totalPlatformFee.toFixed(2),
            totalGrossAmount: totalGrossAmount.toFixed(2),
            earningsCount: earnings.length
          };
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      res.json(ordersWithEarnings);
    } catch (error) {
      console.error('Error fetching vendor order earnings:', error);
      res.status(500).json({ message: 'Failed to fetch order earnings data' });
    }
  });

  // Create payout request
  app.post('/api/vendor/:vendorId/payout-request', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { orderId, amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid amount is required' });
      }

      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }

      const vendor = await storage.getVendorById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const payoutAmount = parseFloat(amount.toString());
      const availableBalance = parseFloat(vendor.availableBalance || '0');

      // Create payout request
      const payoutRequest = await storage.createPayoutRequest({
        vendorId,
        orderId,
        requestedAmount: payoutAmount.toString(),
        availableBalance: availableBalance.toString(),
        status: 'pending',
        requestReason: reason,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update vendor pending balance
      await storage.updateVendorPendingBalance(vendorId, payoutAmount, 'add');

      // Send notification to admin
      try {
        const notificationData: PayoutNotificationData = {
          vendorEmail: vendor.email,
          vendorName: vendor.contactName,
          businessName: vendor.businessName,
          amount: payoutAmount.toString(),
          status: 'requested'
        };
        // Payout notification will be implemented with the new email service
        console.log('Payout request notification would be sent here');
      } catch (emailError) {
        console.error('Failed to send payout request notification:', emailError);
        // Don't fail the request if email fails
      }

      res.json({ 
        message: 'Payout request submitted successfully',
        requestId: payoutRequest.id,
        amount: payoutRequest.requestedAmount,
        status: payoutRequest.status
      });
    } catch (error) {
      console.error('Error creating payout request:', error);
      res.status(500).json({ message: 'Failed to create payout request' });
    }
  });

  // Get vendor payout requests
  app.get('/api/vendor/:vendorId/payout-requests', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      // Set cache-control headers to prevent 304 caching issues
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      });
      
      // Only return pending payout requests for vendors
      // Approved/failed requests should not show up since they're no longer actionable
      const payoutRequests = await storage.getVendorPayoutRequests(vendorId);
      const pendingRequests = payoutRequests.filter(request => request.status === 'pending');
      res.json(pendingRequests);
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      res.status(500).json({ message: 'Failed to fetch payout requests' });
    }
  });

  // Get vendor completed payouts (for Order Earnings tab)
  app.get('/api/vendor/:vendorId/completed-payouts', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      // Return completed and approved payouts for display in Order Earnings tab
      const payoutRequests = await storage.getVendorPayoutRequests(vendorId);
      const completedPayouts = payoutRequests.filter(request => 
        request.status === 'completed' || request.status === 'approved'
      );
      res.json(completedPayouts);
    } catch (error) {
      console.error('Error fetching completed payouts:', error);
      res.status(500).json({ message: 'Failed to fetch completed payouts' });
    }
  });

  // Update vendor business details
  app.put('/api/vendor/:vendorId/business-details', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { businessName, contactName, phone, address } = req.body;
      
      if (!businessName || !contactName) {
        return res.status(400).json({ message: 'Business name and contact name are required' });
      }
      
      const updatedVendor = await storage.updateVendorBusinessDetails(vendorId, {
        businessName,
        contactName,
        phone,
        address
      });
      
      res.json({ message: 'Business details updated successfully', vendor: updatedVendor });
    } catch (error) {
      console.error('Error updating business details:', error);
      res.status(500).json({ message: 'Failed to update business details' });
    }
  });

  // Update vendor bank details
  app.put('/api/vendor/:vendorId/bank-details', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { bankName, bankCode, accountNumber, accountName } = req.body;
      
      if (!bankName || !accountNumber || !accountName) {
        return res.status(400).json({ message: 'Bank name, account number, and account name are required' });
      }
      
      // Validate account number (flexible for Kenyan banks and mobile money)
      if (bankName === 'm-pesa' || bankName === 'airtel-money') {
        // Mobile money: validate Kenyan mobile number format
        if (!/^254\d{9}$/.test(accountNumber) && !/^07\d{8}$/.test(accountNumber) && !/^01\d{8}$/.test(accountNumber)) {
          return res.status(400).json({ message: 'Mobile number must be in format 254XXXXXXXXX, 07XXXXXXXX, or 01XXXXXXXX' });
        }
      } else {
        // Bank account: more flexible validation for Kenyan banks
        if (!/^\d{6,16}$/.test(accountNumber)) {
          return res.status(400).json({ message: 'Bank account number must be 6-16 digits' });
        }
      }
      
      const updatedVendor = await storage.updateVendorBankDetails(vendorId, {
        bankName,
        bankCode,
        accountNumber,
        accountName
      });
      
      // Create Paystack subaccount when bank details are updated
      if (updatedVendor.bankName && updatedVendor.accountNumber && updatedVendor.accountName) {
        try {
          // Only create if vendor doesn't already have a subaccount
          if (!updatedVendor.paystackSubaccountId || !updatedVendor.paystackSubaccountCode) {
            console.log(`Creating Paystack subaccount for vendor ${vendorId}...`);
            const paystackService = new PaystackService();
            const subaccountResult = await paystackService.createVendorSubaccount({
              businessName: updatedVendor.businessName,
              contactName: updatedVendor.contactName,
              email: updatedVendor.email,
              bankName: updatedVendor.bankName,
              bankCode: updatedVendor.bankCode,
              accountNumber: updatedVendor.accountNumber,
              accountName: updatedVendor.accountName
            });
            
            // Update vendor with subaccount information
            await storage.updateVendor(vendorId, {
              paystackSubaccountId: subaccountResult.subaccountId,
              paystackSubaccountCode: subaccountResult.subaccountCode,
              subaccountActive: true
            });
            
            console.log(`✅ Paystack subaccount created: ${subaccountResult.subaccountCode}`);
          }
        } catch (subaccountError) {
          console.error('Failed to create Paystack subaccount:', subaccountError);
          // Continue with success response even if subaccount creation fails
        }
      }
      
      res.json({ message: 'Bank details updated successfully', vendor: updatedVendor });
    } catch (error) {
      console.error('Error updating bank details:', error);
      res.status(500).json({ message: 'Failed to update bank details' });
    }
  });

  // Admin payout management routes
  
  // Get all payout requests (admin)
  app.get('/api/admin/payout-requests', isAdminAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const payoutRequests = await storage.getAllPayoutRequests(status as string);
      
      // Enhance with vendor information for frontend display
      const enhancedRequests = payoutRequests.map((request: any) => ({
        ...request,
        vendorName: request.vendor?.businessName || request.vendor?.contactName || 'Unknown Vendor',
        businessName: request.vendor?.businessName || 'Unknown Business',
        bankAccount: request.vendor?.accountNumber ? `****${request.vendor.accountNumber.slice(-4)}` : 'Not provided',
        bankName: request.vendor?.bankName || null,
        bankCode: request.vendor?.bankCode || null,
        accountNumber: request.vendor?.accountNumber || null,
        accountName: request.vendor?.accountName || null,
        paystackSubaccountId: request.vendor?.paystackSubaccountId || null,
        paystackSubaccountCode: request.vendor?.paystackSubaccountCode || null,
        subaccountActive: request.vendor?.subaccountActive || false,
        amount: parseFloat(request.requestedAmount || '0'),
        requestDate: request.createdAt,
        processedDate: request.completedAt
      }));
      
      res.json(enhancedRequests);
    } catch (error) {
      console.error('Error fetching admin payout requests:', error);
      res.status(500).json({ message: 'Failed to fetch payout requests' });
    }
  });

  // Approve payout request (admin)
  app.post('/api/admin/payout-requests/:requestId/approve', isAdminAuthenticated, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { adminNotes } = req.body;

      const request = await storage.getPayoutRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Payout request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending requests can be approved' });
      }

      const vendor = await storage.getVendorById(request.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      try {
        // Initialize Paystack service
        const paystackService = new PaystackService();
        
        // Ensure vendor has complete bank details
        if (!vendor.bankName || !vendor.accountNumber || !vendor.accountName) {
          return res.status(400).json({ 
            message: 'Vendor bank details incomplete. Bank name, account number, and account name are required.' 
          });
        }
        
        // Create Paystack subaccount if it doesn't exist
        if (!vendor.paystackSubaccountId || !vendor.paystackSubaccountCode) {
          try {
            console.log(`Creating Paystack subaccount for vendor ${vendor.id}...`);
            const subaccountResult = await paystackService.createVendorSubaccount({
              businessName: vendor.businessName,
              contactName: vendor.contactName,
              email: vendor.email,
              bankName: vendor.bankName,
              bankCode: vendor.bankCode,
              accountNumber: vendor.accountNumber,
              accountName: vendor.accountName
            });
            
            // Update vendor with subaccount information
            await storage.updateVendor(vendor.id, {
              paystackSubaccountId: subaccountResult.subaccountId,
              paystackSubaccountCode: subaccountResult.subaccountCode,
              subaccountActive: true
            });
            
            // Refresh vendor data
            const refreshedVendor = await storage.getVendorById(request.vendorId);
            if (refreshedVendor) {
              Object.assign(vendor, refreshedVendor);
            }
            
            console.log(`✅ Paystack subaccount created: ${subaccountResult.subaccountCode}`);
          } catch (subaccountError) {
            console.error('Failed to create Paystack subaccount:', subaccountError);
            return res.status(400).json({ 
              message: `Failed to create Paystack subaccount: ${subaccountError.message}` 
            });
          }
        }
        
        // Process the payout via Paystack
        const transferResult = await paystackService.processVendorPayout(
          {
            businessName: vendor.businessName,
            contactName: vendor.contactName,
            email: vendor.email,
            bankName: vendor.bankName,
            bankCode: vendor.bankCode,
            accountNumber: vendor.accountNumber,
            accountName: vendor.accountName
          },
          parseFloat(request.requestedAmount),
          `Payout to ${vendor.businessName}`
        );

        // Update request status
        const updatedRequest = await storage.updatePayoutRequest(requestId, {
          status: 'approved',
          reviewedBy: 'admin', // In production, use actual admin ID
          reviewedAt: new Date(),
          adminNotes,
          paystackTransferId: transferResult.transferId,
          paystackTransferCode: transferResult.transferCode,
          transferStatus: 'pending'
        });

        // Update vendor balances
        await storage.updateVendorPendingBalance(request.vendorId, parseFloat(request.requestedAmount), 'subtract');

        // Create earnings record for the order so it appears in order-earnings
        if (request.orderId) {
          try {
            const payoutAmount = parseFloat(request.requestedAmount);
            // Calculate platform fee (20% by default)
            const platformFeePercentage = 0.20; // 20%
            const platformFee = payoutAmount * (platformFeePercentage / (1 - platformFeePercentage)); // Reverse calculate from net amount
            const grossAmount = payoutAmount + platformFee;
            
            await storage.createVendorEarning({
              vendorId: request.vendorId,
              orderId: request.orderId,
              grossAmount: grossAmount.toString(),
              platformFee: platformFee.toString(),
              netEarnings: payoutAmount.toString(),
              payoutDate: new Date(),
              status: 'paid'
            });
            
            console.log(`✅ Created earnings record for order ${request.orderId}: KES ${payoutAmount.toLocaleString()}`);
          } catch (earningsError) {
            console.error('Failed to create earnings record:', earningsError);
            // Don't fail the payout approval if earnings creation fails
          }
        }

        // Send approval notification to vendor
        try {
          const notificationData: PayoutNotificationData = {
            vendorEmail: vendor.email,
            vendorName: vendor.contactName,
            businessName: vendor.businessName,
            amount: request.requestedAmount,
            status: 'approved',
            adminNotes
          };
          // Payout approval notification will be implemented with the new email service
          console.log('Payout approval notification would be sent here');
        } catch (emailError) {
          console.error('Failed to send approval notification:', emailError);
        }

        res.json({ 
          message: 'Payout approved and transfer initiated',
          requestId: updatedRequest.id,
          transferId: transferResult.transferId,
          transferCode: transferResult.transferCode
        });

      } catch (paystackError: any) {
        console.error('Paystack transfer failed:', paystackError);
        
        // Update request as failed
        await storage.updatePayoutRequest(requestId, {
          status: 'failed',
          reviewedBy: 'admin',
          reviewedAt: new Date(),
          adminNotes: `${adminNotes} - Transfer failed: ${paystackError.message}`,
          transferFailureReason: paystackError.message,
          failedAt: new Date()
        });

        // Return pending balance to vendor
        await storage.updateVendorPendingBalance(request.vendorId, parseFloat(request.requestedAmount), 'subtract');

        res.status(500).json({ 
          message: 'Payout approval failed',
          error: paystackError.message
        });
      }

    } catch (error) {
      console.error('Error approving payout request:', error);
      res.status(500).json({ message: 'Failed to approve payout request' });
    }
  });

  // Reject payout request (admin)
  app.post('/api/admin/payout-requests/:requestId/reject', isAdminAuthenticated, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { adminNotes } = req.body;

      const request = await storage.getPayoutRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Payout request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending requests can be rejected' });
      }

      const vendor = await storage.getVendorById(request.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Update request status
      const updatedRequest = await storage.updatePayoutRequest(requestId, {
        status: 'rejected',
        reviewedBy: 'admin', // In production, use actual admin ID
        reviewedAt: new Date(),
        adminNotes,
        failedAt: new Date(),
        transferFailureReason: adminNotes || 'Rejected by administrator'
      });

      // Return pending balance to available balance
      await storage.updateVendorPendingBalance(request.vendorId, parseFloat(request.requestedAmount), 'subtract');

      // Send rejection notification to vendor
      try {
        const notificationData: PayoutNotificationData = {
          vendorEmail: vendor.email,
          vendorName: vendor.contactName,
          businessName: vendor.businessName,
          amount: request.requestedAmount,
          status: 'rejected',
          rejectionReason: adminNotes || 'Rejected by administrator'
        };
        await vendorEmailService.sendPayoutRejectedNotification(notificationData);
      } catch (emailError) {
        console.error('Failed to send rejection notification:', emailError);
      }

      res.json({ 
        message: 'Payout request rejected',
        requestId: updatedRequest.id,
        status: updatedRequest.status
      });

    } catch (error) {
      console.error('Error rejecting payout request:', error);
      res.status(500).json({ message: 'Failed to reject payout request' });
    }
  });

  // Paystack webhook handler for transfer completion
  app.post('/api/webhooks/paystack', async (req, res) => {
    try {
      const signature = req.headers['x-paystack-signature'] as string;
      const event = req.body;

      // Verify webhook signature (in production, implement proper signature verification)
      if (!signature) {
        return res.status(400).json({ message: 'Missing signature' });
      }

      console.log('Received Paystack webhook:', event.event, event.data);

      // Handle transfer completion events
      if (event.event === 'transfer.success') {
        const transferData = event.data;
        const transferCode = transferData.transfer_code;

        // Find the payout request by transfer code
        const payoutRequest = await storage.getPayoutRequestByTransferCode(transferCode);
        if (payoutRequest) {
          // Update request as completed
          await storage.updatePayoutRequest(payoutRequest.id, {
            transferStatus: 'completed',
            completedAt: new Date()
          });

          // Send completion notification to vendor
          const vendor = await storage.getVendorById(payoutRequest.vendorId);
          if (vendor) {
            try {
              const notificationData: PayoutNotificationData = {
                vendorEmail: vendor.email,
                vendorName: vendor.contactName,
                businessName: vendor.businessName,
                amount: payoutRequest.requestedAmount,
                status: 'completed'
              };
              await vendorEmailService.sendPayoutCompletedNotification(notificationData);
            } catch (emailError) {
              console.error('Failed to send completion notification:', emailError);
            }
          }
        }
      }

      // Handle transfer failure events
      if (event.event === 'transfer.failed') {
        const transferData = event.data;
        const transferCode = transferData.transfer_code;

        // Find the payout request by transfer code
        const payoutRequest = await storage.getPayoutRequestByTransferCode(transferCode);
        if (payoutRequest) {
          // Update request as failed
          await storage.updatePayoutRequest(payoutRequest.id, {
            status: 'failed',
            transferStatus: 'failed',
            transferFailureReason: transferData.reason || 'Transfer failed',
            failedAt: new Date()
          });

          // Return pending balance to vendor
          await storage.updateVendorPendingBalance(payoutRequest.vendorId, parseFloat(payoutRequest.requestedAmount), 'subtract');
        }
      }

      res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Bank list endpoint for vendor registration
  app.get('/api/banks', async (req, res) => {
    try {
      const banks = [
        { code: 'kcb', name: 'Kenya Commercial Bank (KCB)' },
        { code: 'equity-bank', name: 'Equity Bank' },
        { code: 'cooperative-bank', name: 'Cooperative Bank' },
        { code: 'standard-chartered', name: 'Standard Chartered Bank' },
        { code: 'ncba-bank', name: 'NCBA Bank' },
        { code: 'absa-bank', name: 'Absa Bank Kenya' },
        { code: 'dtb-bank', name: 'Diamond Trust Bank' },
        { code: 'family-bank', name: 'Family Bank' },
        { code: 'im-bank', name: 'I&M Bank' },
        { code: 'prime-bank', name: 'Prime Bank' },
        { code: 'sidian-bank', name: 'Sidian Bank' },
        { code: 'housing-finance', name: 'Housing Finance Company' },
        { code: 'm-pesa', name: 'M-Pesa' },
        { code: 'airtel-money', name: 'Airtel Money' }
      ];
      res.json(banks);
    } catch (error) {
      console.error('Error fetching banks:', error);
      res.status(500).json({ message: 'Failed to fetch banks' });
    }
  });

  // Paystack Subaccount Management Functions
  const createPaystackSubaccount = async (vendor: any) => {
    try {
      // Get bank code from bank name mapping
      const getBankCode = (bankName: string) => {
        const bankCodes: Record<string, string> = {
          "kcb": "01", "equity-bank": "68", "ncba-bank": "07", 
          "cooperative-bank": "11", "standard-chartered": "02", "im-bank": "57",
          "absa-bank": "03", "dtb-bank": "49", "family-bank": "70",
          "gulf-african-bank": "72", "housing-finance": "61", "national-bank": "12",
          "nic-bank": "41", "paramount-bank": "50", "prime-bank": "10", "sidian-bank": "76",
          "m-pesa": "MPESA", "airtel-money": "AIRTEL"
        };
        return bankCodes[bankName] || "";
      };

      const bankCode = getBankCode(vendor.bankName);
      if (!bankCode) {
        throw new Error(`Unsupported bank: ${vendor.bankName}`);
      }

      // Create subaccount with Paystack
      const subaccountData = {
        business_name: vendor.businessName,
        settlement_bank: bankCode,
        account_number: vendor.accountNumber,
        percentage_charge: 20.0, // Platform takes 20%
        description: `BuyLock vendor: ${vendor.businessName}`,
        primary_contact_email: vendor.email,
        primary_contact_name: vendor.contactName,
        primary_contact_phone: vendor.phone || "",
        metadata: {
          vendor_id: vendor.id,
          business_category: vendor.businessCategory
        }
      };

      const response = await fetch('https://api.paystack.co/subaccount', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subaccountData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Paystack API error: ${errorData.message}`);
      }

      const result = await response.json();
      
      // Update vendor with subaccount details
      await storage.updateVendorPaystackSubaccount(vendor.id, {
        paystackSubaccountId: result.data.id.toString(),
        paystackSubaccountCode: result.data.subaccount_code,
        subaccountActive: result.data.active
      });

      return result.data;
    } catch (error) {
      console.error('Error creating Paystack subaccount:', error);
      throw error;
    }
  };

  // Get platform commission percentage
  const getPlatformCommission = async (): Promise<number> => {
    try {
      const settings = await storage.getPlatformSettings();
      const commissionSetting = settings.find(s => s.settingKey === 'platform_commission_percentage');
      return commissionSetting ? parseFloat(commissionSetting.settingValue) : 20.0;
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      return 20.0; // Default fallback
    }
  };

  // Track vendor earnings when order is completed
  const trackVendorEarnings = async (orderId: string, orderItems: any[]) => {
    try {
      const commission = await getPlatformCommission();
      
      for (const item of orderItems) {
        if (item.productId) {
          const product = await storage.getProduct(item.productId);
          if (product?.vendorId) {
            const grossAmount = parseFloat(item.price) * item.quantity;
            const platformFee = (grossAmount * commission) / 100;
            const netEarnings = grossAmount - platformFee;

            await storage.createVendorEarning({
              vendorId: product.vendorId,
              orderId,
              orderItemId: item.id,
              grossAmount,
              platformFeePercentage: commission,
              platformFee,
              netEarnings,
              status: 'available', // Make earnings immediately available
              availableDate: new Date()
            });

            // Update vendor balance
            await storage.updateVendorBalance(product.vendorId, netEarnings);
          }
        } else if (item.serviceId) {
          const service = await storage.getService(item.serviceId);
          if (service?.providerId) {
            const grossAmount = parseFloat(item.price) * item.quantity;
            const platformFee = (grossAmount * commission) / 100;
            const netEarnings = grossAmount - platformFee;

            await storage.createVendorEarning({
              vendorId: service.providerId,
              orderId,
              orderItemId: item.id,
              grossAmount,
              platformFeePercentage: commission,
              platformFee,
              netEarnings,
              status: 'available',
              availableDate: new Date()
            });

            await storage.updateVendorBalance(service.providerId, netEarnings);
          }
        }
      }
    } catch (error) {
      console.error('Error tracking vendor earnings:', error);
    }
  };

  // Vendor Earnings API
  app.get('/api/vendor/:vendorId/earnings', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      // Set cache-control headers to prevent 304 caching issues
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      });
      
      const vendor = await storage.getVendorById(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      const earnings = await storage.getVendorEarnings(vendorId);
      const earningsHistory = await storage.getVendorEarningsHistory(vendorId);
      
      res.json({
        totalEarnings: vendor.totalEarnings || '0.00',
        availableBalance: vendor.availableBalance || '0.00',
        pendingBalance: vendor.pendingBalance || '0.00',
        totalPaidOut: vendor.totalPaidOut || '0.00',
        recentEarnings: earnings,
        earningsHistory: earningsHistory
      });
    } catch (error) {
      console.error('Error fetching vendor earnings:', error);
      res.status(500).json({ message: 'Failed to fetch earnings' });
    }
  });


  // Email notification functions
  const sendPayoutRequestNotification = async (vendor: any, payoutRequest: any) => {
    try {
      const adminEmails = ['admin@buylock.com']; // Configure admin emails
      
      for (const email of adminEmails) {
        await vendorEmailService.sendPayoutRequestEmail({
          adminEmail: email,
          vendorName: vendor.businessName,
          amount: payoutRequest.requestedAmount,
          requestId: payoutRequest.id,
          vendorEmail: vendor.email
        });
      }
    } catch (error) {
      console.error('Error sending payout request notification:', error);
    }
  };

  const sendPayoutStatusNotification = async (vendor: any, payoutRequest: any, status: 'approved' | 'rejected' | 'completed') => {
    try {
      await vendorEmailService.sendPayoutStatusEmail({
        vendorEmail: vendor.email,
        vendorName: vendor.businessName,
        amount: payoutRequest.requestedAmount,
        status,
        adminNotes: payoutRequest.adminNotes || '',
        completedAt: payoutRequest.completedAt
      });
    } catch (error) {
      console.error('Error sending payout status notification:', error);
    }
  };

  // Admin Payout Management - Enhanced with Paystack Integration
  app.get('/api/admin/payout-requests', isAdminAuthenticated, async (req, res) => {
    try {
      const { status } = req.query;
      const payoutRequests = await storage.getAllPayoutRequests(status as string);
      res.json(payoutRequests);
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      res.status(500).json({ message: 'Failed to fetch payout requests' });
    }
  });


  app.post('/api/admin/payout-requests/:requestId/reject', isAdminAuthenticated, async (req, res) => {
    try {
      const { requestId } = req.params;
      const { adminNotes } = req.body;
      const adminId = (req as any).user?.claims?.sub;

      const payoutRequest = await storage.getPayoutRequest(requestId);
      if (!payoutRequest) {
        return res.status(404).json({ message: 'Payout request not found' });
      }

      const vendor = await storage.getVendorById(payoutRequest.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }

      // Update payout request as rejected
      const updatedRequest = await storage.updatePayoutRequest(requestId, {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNotes: adminNotes || 'Payout request rejected by admin'
      });

      // Return funds to vendor's available balance
      await storage.updateVendorPendingBalance(vendor.id, parseFloat(payoutRequest.requestedAmount.toString()), 'subtract');
      await storage.updateVendorBalance(vendor.id, parseFloat(payoutRequest.requestedAmount.toString()));

      // Send notification to vendor
      await sendPayoutStatusNotification(vendor, updatedRequest, 'rejected');

      res.json({
        message: 'Payout request rejected successfully',
        payoutRequest: updatedRequest
      });

    } catch (error) {
      console.error('Error rejecting payout request:', error);
      res.status(500).json({ message: 'Failed to reject payout request' });
    }
  });

  // Platform Settings Management
  app.get('/api/admin/platform-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      res.status(500).json({ message: 'Failed to fetch platform settings' });
    }
  });

  app.put('/api/admin/platform-settings/:settingKey', isAdminAuthenticated, async (req, res) => {
    try {
      const { settingKey } = req.params;
      const { settingValue } = req.body;
      const adminId = (req as any).user?.claims?.sub;

      // Validate commission percentage if updating commission
      if (settingKey === 'platform_commission_percentage') {
        const commission = parseFloat(settingValue);
        if (isNaN(commission) || commission < 0 || commission > 100) {
          return res.status(400).json({ message: 'Commission must be between 0 and 100' });
        }
      }

      const updatedSetting = await storage.updatePlatformSetting(settingKey, settingValue, adminId);
      
      res.json({
        message: 'Platform setting updated successfully',
        setting: updatedSetting
      });
    } catch (error) {
      console.error('Error updating platform setting:', error);
      res.status(500).json({ message: 'Failed to update platform setting' });
    }
  });

  // Paystack Webhook for transfer status updates
  app.post('/api/webhooks/paystack', async (req, res) => {
    try {
      const event = req.body;
      
      if (event.event === 'transfer.success') {
        const transfer = event.data;
        const payoutRequestId = transfer.metadata?.payout_request_id;
        
        if (payoutRequestId) {
          await storage.updatePayoutRequest(payoutRequestId, {
            transferStatus: 'success',
            completedAt: new Date(),
            actualPaidAmount: transfer.amount / 100 // Convert from kobo
          });

          // Update vendor's total paid out
          const payoutRequest = await storage.getPayoutRequest(payoutRequestId);
          if (payoutRequest) {
            const vendor = await storage.getVendorById(payoutRequest.vendorId);
            if (vendor) {
              const newTotalPaidOut = parseFloat(vendor.totalPaidOut || '0') + parseFloat(payoutRequest.requestedAmount.toString());
              await storage.updateVendorTotalPaidOut(vendor.id, newTotalPaidOut);
              
              // Send completion notification
              await sendPayoutStatusNotification(vendor, payoutRequest, 'completed');
            }
          }
        }
      } else if (event.event === 'transfer.failed') {
        const transfer = event.data;
        const payoutRequestId = transfer.metadata?.payout_request_id;
        
        if (payoutRequestId) {
          const payoutRequest = await storage.getPayoutRequest(payoutRequestId);
          
          await storage.updatePayoutRequest(payoutRequestId, {
            status: 'failed',
            transferStatus: 'failed',
            failedAt: new Date(),
            transferFailureReason: transfer.reason || 'Transfer failed'
          });

          if (payoutRequest) {
            const vendor = await storage.getVendorById(payoutRequest.vendorId);
            if (vendor) {
              // Return funds to available balance
              await storage.updateVendorBalance(vendor.id, parseFloat(payoutRequest.requestedAmount.toString()));
            }
          }
        }
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing Paystack webhook:', error);
      res.status(500).json({ message: 'Failed to process webhook' });
    }
  });

  // Admin earnings management endpoints
  app.get('/api/admin/platform-earnings', isAdminAuthenticated, async (req, res) => {
    try {
      const { period = 'month' } = req.query;
      
      // Get all orders
      const allOrders = await storage.getAllOrders();
      
      // Filter by period if needed
      // For now, return all-time data
      const totalOrderValue = allOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const platformFeePercentage = await storage.getPlatformCommissionPercentage();
      const totalPlatformEarnings = totalOrderValue * (platformFeePercentage / 100);
      const totalVendorEarnings = totalOrderValue - totalPlatformEarnings;
      
      // Get top earning vendors
      const vendorEarnings = new Map();
      for (const order of allOrders) {
        const currentEarnings = vendorEarnings.get(order.vendorId) || { earnings: 0, vendorId: order.vendorId };
        currentEarnings.earnings += parseFloat(order.totalAmount) * (await storage.getVendorCommissionPercentage()) / 100;
        vendorEarnings.set(order.vendorId, currentEarnings);
      }
      
      // Get vendor names and sort
      const topEarningVendors = [];
      for (const [vendorId, data] of vendorEarnings.entries()) {
        const vendor = await storage.getVendorById(vendorId);
        if (vendor) {
          topEarningVendors.push({
            vendorId,
            businessName: vendor.businessName,
            earnings: data.earnings
          });
        }
      }
      
      topEarningVendors.sort((a, b) => b.earnings - a.earnings).slice(0, 5);
      
      const platformEarnings = {
        totalPlatformEarnings,
        totalVendorEarnings,
        platformFeePercentage,
        totalOrders: allOrders.length,
        avgOrderValue: allOrders.length > 0 ? totalOrderValue / allOrders.length : 0,
        topEarningVendors
      };
      
      res.json(platformEarnings);
    } catch (error) {
      console.error('Error fetching platform earnings:', error);
      res.status(500).json({ message: 'Failed to fetch platform earnings' });
    }
  });

  app.get('/api/admin/vendor-earnings', isAdminAuthenticated, async (req, res) => {
    try {
      // Get all vendors
      const vendors = await storage.getAllVendors();
      const vendorEarnings = [];
      
      for (const vendor of vendors) {
        const vendorOrders = await storage.getVendorOrders(vendor.id);
        const confirmedOrders = vendorOrders.filter(order => order.status === 'customer_confirmed');
        const pendingOrders = vendorOrders.filter(order => 
          ['delivered', 'completed'].includes(order.status) && order.status !== 'customer_confirmed'
        );
        const disputedOrders = vendorOrders.filter(order => order.status === 'disputed');
        
        const totalEarnings = confirmedOrders.reduce((sum, order) => 
          sum + parseFloat(order.totalAmount), 0
        );
        const pendingBalance = pendingOrders.reduce((sum, order) => 
          sum + parseFloat(order.totalAmount), 0
        );
        const availableBalance = totalEarnings * 0.8; // 80% after platform fee
        
        vendorEarnings.push({
          vendorId: vendor.id,
          businessName: vendor.businessName,
          totalEarnings,
          availableBalance,
          pendingBalance,
          confirmedOrders: confirmedOrders.length,
          pendingOrders: pendingOrders.length,
          disputedOrders: disputedOrders.length,
          lastPayoutDate: null, // TODO: Implement payout tracking
          lastPayoutAmount: null
        });
      }
      
      // Sort by total earnings, highest first
      vendorEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings);
      
      res.json(vendorEarnings);
    } catch (error) {
      console.error('Error fetching vendor earnings:', error);
      res.status(500).json({ message: 'Failed to fetch vendor earnings' });
    }
  });

  // Platform settings management endpoints
  app.get('/api/admin/platform-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching platform settings:', error);
      res.status(500).json({ message: 'Failed to fetch platform settings' });
    }
  });

  app.post('/api/admin/platform-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { settingKey, settingValue, description } = req.body;
      const adminId = (req as any).user?.claims?.sub;

      if (!settingKey || !settingValue) {
        return res.status(400).json({ message: 'Setting key and value are required' });
      }

      await storage.setPlatformSetting(settingKey, settingValue, adminId, description);

      res.json({
        message: 'Platform setting updated successfully',
        settingKey,
        settingValue
      });
    } catch (error) {
      console.error('Error updating platform setting:', error);
      res.status(500).json({ message: 'Failed to update platform setting' });
    }
  });

  app.get('/api/admin/commission-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const platformCommission = await storage.getPlatformCommissionPercentage();
      const vendorCommission = await storage.getVendorCommissionPercentage();
      
      res.json({
        platformCommissionPercentage: platformCommission,
        vendorCommissionPercentage: vendorCommission
      });
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      res.status(500).json({ message: 'Failed to fetch commission settings' });
    }
  });

  app.post('/api/admin/commission-settings', isAdminAuthenticated, async (req, res) => {
    try {
      const { platformCommissionPercentage } = req.body;
      const adminId = (req as any).user?.claims?.sub;

      if (!platformCommissionPercentage || platformCommissionPercentage < 0 || platformCommissionPercentage > 100) {
        return res.status(400).json({ 
          message: 'Platform commission percentage must be between 0 and 100' 
        });
      }

      await storage.setPlatformSetting(
        'platform_commission_percentage', 
        platformCommissionPercentage.toString(), 
        adminId,
        'Platform commission percentage (vendor gets the remainder)'
      );

      const vendorCommission = 100 - platformCommissionPercentage;

      res.json({
        message: 'Commission settings updated successfully',
        platformCommissionPercentage,
        vendorCommissionPercentage: vendorCommission
      });
    } catch (error) {
      console.error('Error updating commission settings:', error);
      res.status(500).json({ message: 'Failed to update commission settings' });
    }
  });

  // Create Paystack subaccount for existing vendor (admin)
  app.post('/api/admin/vendor/:vendorId/create-subaccount', isAdminAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.params;
      
      const vendor = await storage.getVendorById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      // Check if vendor already has a subaccount
      if (vendor.paystackSubaccountId && vendor.paystackSubaccountCode) {
        return res.status(400).json({ 
          message: 'Vendor already has a Paystack subaccount',
          subaccountCode: vendor.paystackSubaccountCode
        });
      }
      
      // Ensure vendor has complete bank details
      if (!vendor.bankName || !vendor.accountNumber || !vendor.accountName) {
        return res.status(400).json({ 
          message: 'Vendor bank details incomplete. Bank name, account number, and account name are required.' 
        });
      }
      
      try {
        // Initialize Paystack service
        const paystackService = new PaystackService();
        
        console.log(`Creating Paystack subaccount for vendor ${vendor.id}...`);
        const subaccountResult = await paystackService.createVendorSubaccount({
          businessName: vendor.businessName,
          contactName: vendor.contactName,
          email: vendor.email,
          bankName: vendor.bankName,
          bankCode: vendor.bankCode,
          accountNumber: vendor.accountNumber,
          accountName: vendor.accountName
        });
        
        // Update vendor with subaccount information
        await storage.updateVendor(vendor.id, {
          paystackSubaccountId: subaccountResult.subaccountId,
          paystackSubaccountCode: subaccountResult.subaccountCode,
          subaccountActive: true
        });
        
        console.log(`✅ Paystack subaccount created: ${subaccountResult.subaccountCode}`);
        
        res.json({ 
          message: 'Paystack subaccount created successfully',
          subaccountId: subaccountResult.subaccountId,
          subaccountCode: subaccountResult.subaccountCode,
          vendor: {
            id: vendor.id,
            businessName: vendor.businessName,
            bankName: vendor.bankName,
            accountNumber: vendor.accountNumber ? `****${vendor.accountNumber.slice(-4)}` : null
          }
        });
      } catch (subaccountError) {
        console.error('Failed to create Paystack subaccount:', subaccountError);
        return res.status(400).json({ 
          message: `Failed to create Paystack subaccount: ${subaccountError.message}` 
        });
      }
    } catch (error) {
      console.error('Error creating subaccount for vendor:', error);
      res.status(500).json({ message: 'Failed to create subaccount for vendor' });
    }
  });

  app.post('/api/admin/process-payout', isAdminAuthenticated, async (req, res) => {
    try {
      const { requestId, action, reason } = req.body;
      
      if (!requestId || !action) {
        return res.status(400).json({ message: 'Request ID and action are required' });
      }
      
      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Action must be approve or reject' });
      }
      
      // For demo purposes, simulate processing
      // In production, this would:
      // 1. Update payout request status in database
      // 2. If approved, initiate actual payout via payment processor
      // 3. Send notification to vendor
      // 4. Log the action for audit trail
      
      const newStatus = action === 'approve' ? 'processing' : 'failed';
      const responseMessage = action === 'approve' 
        ? 'Payout approved and processing initiated'
        : `Payout rejected: ${reason || 'Administrative review'}`;
      
      console.log(`Payout ${requestId} ${action}ed by admin. New status: ${newStatus}`);
      
      res.json({ 
        message: responseMessage,
        requestId,
        newStatus,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing payout request:', error);
      res.status(500).json({ message: 'Failed to process payout request' });
    }
  });


  // Simplified payment verification endpoint for new workflow
  app.post('/api/payments/verify', isUserAuthenticated, async (req: any, res) => {
    try {
      const { reference } = req.body;
      const userId = req.user.id;

      console.log(`=== Payment Verification Started ===`);
      console.log(`User ID: ${userId}`);
      console.log(`Reference: ${reference}`);

      if (!reference) {
        console.log('ERROR: No payment reference provided');
        return res.status(400).json({ 
          success: false,
          verified: false,
          message: "Payment reference is required" 
        });
      }

      // Verify payment with Paystack SDK
      const verification = await paystack.transaction.verify(reference);

      if (verification.status && verification.data.status === 'success') {
        console.log('✅ Payment verified successfully, checking for existing order...');
        
        // Check if an order already exists with this payment reference (idempotency)
        const existingOrder = await storage.getOrderByPaymentReference(reference);
        if (existingOrder) {
          console.log(`⚠️ Order already exists for payment reference ${reference}`);
          return res.json({
            success: true,
            verified: true,
            orderId: existingOrder.id,
            message: "Payment already processed",
            amount: verification.data.amount / 100,
            reference: reference
          });
        }
        
        // Get user's cart items
        const cartItems = await storage.getCartItems(userId);
        if (cartItems.length === 0) {
          return res.status(400).json({
            success: false,
            verified: false,
            message: "No items in cart to process"
          });
        }

        // Extract delivery address from payment metadata
        const metadata = verification.data.metadata;
        const customFields = metadata?.custom_fields || [];
        const deliveryAddress = customFields.find(f => f.variable_name === 'delivery_address')?.value || "No address provided";
        
        // Group cart items by vendor with debugging
        console.log('Cart items for vendor grouping:', cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          serviceId: item.serviceId,
          productVendorId: item.product?.vendorId,
          serviceProviderId: item.service?.providerId
        })));
        
        const vendorGroups = cartItems.reduce((groups: any, item: any) => {
          let vendorId = item.product?.vendorId || item.service?.providerId;
          
          // Fallback: if no vendor found, use the seeded vendor ID
          if (!vendorId || vendorId === 'undefined') {
            console.log(`⚠️ No vendor ID found for item ${item.id}, using fallback vendor`);
            vendorId = '74bf6c33-7f09-4844-903d-72bff3849c95'; // Default vendor from seeding
          }
          
          console.log(`📦 Item ${item.id} assigned to vendor: ${vendorId}`);
          
          if (!groups[vendorId]) {
            groups[vendorId] = [];
          }
          groups[vendorId].push(item);
          return groups;
        }, {});
        
        console.log('Vendor groups:', Object.keys(vendorGroups));

        const createdOrders = [];
        
        // Create one order per vendor
        for (const [vendorId, items] of Object.entries(vendorGroups)) {
          const vendorItems = items as any[];
          const totalAmount = vendorItems.reduce((sum, item) => {
            // Prioritize product/service price over cart item price to ensure correct pricing
            const itemPrice = parseFloat(item.product?.price || item.service?.price || item.price || '0');
            const itemQuantity = item.quantity || 1;
            console.log(`💰 Item ${item.id}: price=${itemPrice}, quantity=${itemQuantity}, subtotal=${itemPrice * itemQuantity}`);
            return sum + (itemPrice * itemQuantity);
          }, 0);

          // Create the order with 'paid' status
          console.log(`📝 Creating order for vendor ${vendorId} with total ${totalAmount}`);
          const order = await storage.createOrder({
            userId,
            vendorId: vendorId.toString(), // Ensure it's a string
            status: "paid",
            totalAmount: totalAmount.toString(),
            deliveryAddress,
            paymentReference: reference,
            confirmedAt: new Date()
          });

          // Create order items
          for (const item of vendorItems) {
            await storage.createOrderItem({
              orderId: order.id,
              productId: item.productId,
              serviceId: item.serviceId,
              quantity: item.quantity,
              price: item.price,
              name: item.product?.name || item.service?.name || 'Unknown Item',
              appointmentDate: item.appointmentDate,
              appointmentTime: item.appointmentTime,
              duration: item.duration,
              notes: item.notes,
              serviceLocation: item.serviceLocation,
              locationCoordinates: item.locationCoordinates,
              detailedInstructions: item.detailedInstructions
            });
          }

          createdOrders.push(order);
        }

        // Send vendor SMS notifications for each created order
        console.log(`📱 Sending vendor SMS notifications for ${createdOrders.length} orders...`);
        
        for (const order of createdOrders) {
          try {
            // Get vendor details
            const vendor = await storage.getVendorById(order.vendorId);
            if (!vendor || !vendor.phone) {
              console.warn(`⚠️ No vendor phone found for order ${order.id}, skipping SMS`);
              continue;
            }

            // Get customer details
            const customer = await storage.getUser(order.userId);
            const customerName = customer?.firstName && customer?.lastName 
              ? `${customer.firstName} ${customer.lastName}`
              : customer?.username || 'Customer';

            // Get order items for SMS
            const orderItems = await storage.getOrderItems(order.id);
            const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
            const orderType = orderItems.some(item => item.serviceId) ? 'service' : 'product';

            // Send vendor SMS notification
            const { notificationService } = await import("./notificationService");
            
            const vendorNotificationData = {
              orderId: order.id,
              customerName,
              customerPhone: customer?.phone,
              totalAmount: order.totalAmount,
              orderType,
              deliveryAddress: order.deliveryAddress,
              vendorName: vendor.businessName,
              vendorPhone: vendor.phone,
              itemCount
            };

            const smsResult = await notificationService.notifyVendorNewOrder(vendorNotificationData);
            
            if (smsResult) {
              console.log(`✅ Vendor SMS notification sent for order ${order.id}`);
            } else {
              console.error(`❌ Failed to send vendor SMS notification for order ${order.id}`);
            }
          } catch (smsError) {
            console.error(`❌ Error sending vendor SMS for order ${order.id}:`, smsError);
            // Don't fail the payment verification if SMS fails
          }
        }

        // Clear the user's cart
        for (const item of cartItems) {
          await storage.removeFromCart(item.id);
        }

        console.log(`✅ Created ${createdOrders.length} orders for payment ${reference}`);
        
        return res.json({
          success: true,
          verified: true,
          orderIds: createdOrders.map(o => o.id),
          message: "Payment verified and orders created successfully",
          amount: verification.data.amount / 100,
          reference: reference
        });
      } else {
        console.log('❌ Payment verification failed');
        return res.status(400).json({
          success: false,
          verified: false,
          message: "Payment verification failed"
        });
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      return res.status(500).json({
        success: false,
        verified: false,
        message: "Payment verification failed due to server error",
        error: error.message
      });
    }
  });
  app.get('/api/payments/status/:reference', isUserAuthenticated, async (req, res) => {
    try {
      const { reference } = req.params;
      
      // Check payment status with Paystack SDK
      const verification = await paystack.transaction.verify(reference);
      
      res.json({
        reference,
        status: verification.data?.status || "unknown",
        verified: verification.status && verification.data.status === 'success',
        amount: verification.data?.amount ? verification.data.amount / 100 : 0,
        message: verification.message
      });

    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({ message: "Failed to check payment status" });
    }
  });

  // Payment callback handler for when users return from Paystack
  app.get('/api/payments/callback', async (req, res) => {
    try {
      const { reference, trxref } = req.query;
      const paymentReference = reference || trxref;
      
      if (!paymentReference) {
        return res.redirect('/cart?payment=failed&message=No payment reference provided');
      }

      console.log(`Payment callback received for reference: ${paymentReference}`);
      
      // Redirect to cart page with reference for verification
      res.redirect(`/cart?reference=${paymentReference}&status=returned`);
      
    } catch (error) {
      console.error("Payment callback error:", error);
      res.redirect('/cart?payment=failed&message=Payment verification failed');
    }
  });

  // Get available couriers
  app.get('/api/couriers', async (req, res) => {
    try {
      const allProviders = await storage.getDeliveryProviders();
      console.log('All providers from DB:', allProviders.length);
      const dbCouriers = allProviders.filter(provider => provider.type === 'courier');
      console.log('Filtered courier providers:', dbCouriers.map(c => c.name));
      
      if (dbCouriers.length === 0) {
        throw new Error('No couriers found in database');
      }
      
      // Transform database format to frontend expected format
      const couriers = dbCouriers.map(courier => ({
        id: courier.id,
        name: courier.name,
        logo: courier.logo,
        baseRate: courier.baseRate,
        perKmRate: courier.distanceRate,
        maxWeight: "50", // Default for now, could be added to database later
        estimatedTime: courier.estimatedDeliveryTime,
        coverage: courier.supportedRegions.join(", "),
        phone: courier.contactPhone,
        isActive: courier.isActive
      }));
      
      console.log('Transformed couriers:', couriers.map(c => c.name));
      res.json(couriers);
    } catch (error) {
      console.error("Error fetching couriers from database:", error);
      // Use fallback data with only Fargo Courier
      const fallbackCouriers = [
        {
          id: "fargo-courier",
          name: "Fargo Courier Services",
          logo: "🚛",
          baseRate: "200",
          perKmRate: "18",
          maxWeight: "50",
          estimatedTime: "2-4 hours within Nairobi, 24-48 hours nationwide",
          coverage: "Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Thika, Machakos",
          phone: "+254722555888",
          isActive: true
        }
      ];
      res.json(fallbackCouriers);
    }
  });

  // Calculate delivery cost based on location and courier
  app.post('/api/couriers/calculate', async (req, res) => {
    try {
      const { courierId, location, weight = 1 } = req.body;
      
      const couriers = {
        "fargo-courier": { baseRate: 200, perKmRate: 18, name: "Fargo Courier Services", estimatedTime: "2-4 hours within Nairobi, 24-48 hours nationwide" }
      };
      
      const courier = couriers[courierId as keyof typeof couriers];
      if (!courier) {
        return res.status(400).json({ message: "Invalid courier selected" });
      }
      
      // Calculate distance based on location (simplified)
      let estimatedDistance = 5; // Default 5km
      const locationLower = location?.toLowerCase() || "";
      
      if (locationLower.includes("westlands") || locationLower.includes("karen") || locationLower.includes("runda")) {
        estimatedDistance = 12;
      } else if (locationLower.includes("thika") || locationLower.includes("kiambu") || locationLower.includes("machakos")) {
        estimatedDistance = 25;
      } else if (locationLower.includes("nakuru") || locationLower.includes("mombasa")) {
        estimatedDistance = 150;
      } else if (locationLower.includes("cbd") || locationLower.includes("downtown") || locationLower.includes("city center")) {
        estimatedDistance = 3;
      } else if (locationLower.includes("kasarani") || locationLower.includes("embakasi") || locationLower.includes("kahawa")) {
        estimatedDistance = 8;
      }
      
      // Weight multiplier
      const weightMultiplier = Math.max(1, Math.ceil(weight / 5));
      
      const totalCost = (courier.baseRate + (courier.perKmRate * estimatedDistance)) * weightMultiplier;
      
      res.json({
        courierId,
        courierName: courier.name,
        baseRate: courier.baseRate,
        distanceRate: courier.perKmRate * estimatedDistance,
        weightMultiplier,
        estimatedDistance,
        totalCost: Math.round(totalCost),
        estimatedTime: courier.estimatedTime,
        location
      });
      
    } catch (error) {
      console.error("Error calculating delivery cost:", error);
      res.status(500).json({ message: "Failed to calculate delivery cost" });
    }
  });

  // ==================== DELIVERY MODULE API ENDPOINTS ====================
  
  // Get all delivery providers (for admin)
  app.get('/api/delivery/providers', async (req, res) => {
    try {
      const providers = await storage.getDeliveryProviders();
      res.json(providers);
    } catch (error) {
      console.error('Error fetching delivery providers:', error);
      res.status(500).json({ message: 'Failed to fetch delivery providers' });
    }
  });

  // Get all delivery providers (alternative endpoint for frontend)
  app.get('/api/delivery-providers', async (req, res) => {
    try {
      const providers = await storage.getDeliveryProviders();
      res.json(providers);
    } catch (error) {
      console.error('Error fetching delivery providers:', error);
      res.status(500).json({ message: 'Failed to fetch delivery providers' });
    }
  });

  // Get all deliveries (with filters)
  app.get('/api/deliveries', async (req, res) => {
    try {
      const { status, providerId, orderId, limit = 50, offset = 0 } = req.query;
      
      const deliveries = await storage.getDeliveries({
        status: status as string,
        providerId: providerId as string,
        orderId: orderId as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      
      res.json(deliveries);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      res.status(500).json({ message: 'Failed to fetch deliveries' });
    }
  });

  // Get orders ready for pickup
  app.get('/api/deliveries/pickup-orders', async (req, res) => {
    try {
      const orders = await storage.getOrdersReadyForPickup();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching pickup orders:', error);
      res.status(500).json({ message: 'Failed to fetch pickup orders' });
    }
  });

  // Get delivery by ID with updates
  app.get('/api/deliveries/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const delivery = await storage.getDeliveryById(id);
      
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      
      const updates = await storage.getDeliveryUpdates(delivery.id);
      res.json({ ...delivery, updates });
    } catch (error) {
      console.error('Error fetching delivery:', error);
      res.status(500).json({ message: 'Failed to fetch delivery' });
    }
  });

  // Trigger delivery creation when vendor marks order as "ready_for_pickup"
  app.post('/api/deliveries/create', async (req, res) => {
    try {
      const { orderId, providerId, pickupInstructions } = req.body;
      
      // Get the order details
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      if (order.status !== 'ready_for_pickup') {
        return res.status(400).json({ message: 'Order must be ready for pickup to create delivery' });
      }
      
      // Check if delivery already exists
      const existingDelivery = await storage.getDeliveryByOrderId(orderId);
      if (existingDelivery) {
        return res.json(existingDelivery);
      }
      
      // Use the courier selected during checkout, or provided courier, or fallback to Fargo courier
      const courierProviderId = providerId || order.courierId || 'fargo-courier';
      const provider = await storage.getDeliveryProviderById(courierProviderId);
      if (!provider) {
        return res.status(400).json({ message: 'Courier provider not found' });
      }
      
      // Create delivery record
      const delivery = await storage.createDelivery({
        orderId: order.id,
        providerId: provider.id,
        status: 'pickup_scheduled',
        pickupAddress: 'Vendor Business Address', // This should come from vendor profile
        deliveryAddress: order.deliveryAddress || '',
        estimatedPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedDeliveryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        deliveryFee: order.deliveryFee || '0',
        packageDescription: `Order ${order.trackingNumber} - ${order.orderType}`,
        customerPhone: '0700000000', // This should come from user profile
        vendorPhone: '0700000001', // This should come from vendor profile
        courierName: provider.name,
      });
      
      // Create initial delivery update
      await storage.addDeliveryUpdate({
        deliveryId: delivery.id,
        status: 'pickup_scheduled',
        description: `Pickup requested from ${provider.name}. Courier will arrive within 2 hours for collection.`,
        source: 'api',
      });
      
      // Update order status to reflect delivery creation
      await storage.updateOrder(orderId, { 
        status: 'dispatched',
        deliveryPickupAt: new Date(),
        courierName: provider.name
      });
      
      // Send notification to courier using the new email service
      if (provider.contactEmail) {
        const { sendCourierNotification } = await import('./emailService');
        
        // Get vendor details
        const vendor = await storage.getVendorById(order.vendorId);
        
        // Get customer details
        const customer = await storage.getUser(order.userId);
        
        // Get order items
        const orderItems = await storage.getOrderItems(order.id);
        
        if (vendor && customer && orderItems.length > 0) {
          // Prepare order items for email
          const emailOrderItems = await Promise.all(orderItems.map(async (item) => {
            let itemName = 'Unknown Item';
            if (item.productId) {
              const product = await storage.getProductById(item.productId);
              itemName = product?.name || 'Unknown Product';
            } else if (item.serviceId) {
              const service = await storage.getServiceById(item.serviceId);
              itemName = service?.name || 'Unknown Service';
            }
            
            return {
              name: itemName,
              quantity: item.quantity,
              price: item.price
            };
          }));
          
          const courierNotificationData = {
            courierEmail: provider.contactEmail,
            courierName: provider.name,
            orderId: order.id,
            customerName: customer.username || 'Customer',
            customerPhone: customer.phone || 'Not provided',
            vendorBusinessName: vendor.businessName,
            vendorLocation: vendor.businessAddress || 'Address not provided',
            vendorPhone: vendor.phoneNumber || 'Phone not provided',
            deliveryAddress: order.deliveryAddress || 'Address not provided',
            orderTotal: order.totalAmount,
            pickupInstructions: pickupInstructions || '',
            orderItems: emailOrderItems
          };
          
          // Send courier notification email
          const emailSent = await sendCourierNotification(courierNotificationData);
          
          if (emailSent) {
            console.log(`Courier notification email sent to ${provider.contactEmail} for order ${order.id}`);
          } else {
            console.warn(`Failed to send courier notification email for order ${order.id}`);
          }
        }
      }
      
      res.json(delivery);
    } catch (error) {
      console.error('Error creating delivery:', error);
      res.status(500).json({ message: 'Failed to create delivery' });
    }
  });

  // Webhook endpoint for courier status updates (TEMPORARILY DISABLED for debugging)
  app.post('/api/deliveries/webhook/:providerId', async (req, res) => {
    try {
      const { providerId } = req.params;
      const webhookData = req.body;
      
      // Log all webhook calls for debugging
      console.log(`🚫 WEBHOOK BLOCKED (debugging mode) from ${providerId}:`, JSON.stringify(webhookData, null, 2));
      console.log('📍 Webhook source IP:', req.ip || req.connection.remoteAddress);
      console.log('📍 Webhook headers:', JSON.stringify(req.headers, null, 2));
      
      // TEMPORARILY BLOCK ALL WEBHOOK PROCESSING TO DEBUG STATUS UPDATE ISSUE
      console.log('⚠️ Webhook processing is temporarily disabled for debugging manual status updates');
      
      res.json({ success: true, message: 'Webhook logged but processing disabled for debugging' });
    } catch (error) {
      console.error('Delivery webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // Delivery analytics endpoint
  app.get('/api/delivery/analytics', async (req, res) => {
    try {
      const { providerId, dateFrom, dateTo } = req.query;
      
      const analytics = await storage.getDeliveryAnalytics({
        providerId: providerId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });
      
      // Calculate real-time statistics
      const allDeliveries = await storage.getDeliveries();
      const totalDeliveries = allDeliveries.length;
      const successfulDeliveries = allDeliveries.filter(d => d.status === 'delivered').length;
      const failedDeliveries = allDeliveries.filter(d => d.status === 'failed').length;
      const pendingDeliveries = allDeliveries.filter(d => ['pending', 'pickup_scheduled', 'picked_up', 'in_transit', 'out_for_delivery'].includes(d.status)).length;
      
      // Calculate average delivery time (for delivered orders)
      const deliveredOrders = allDeliveries.filter(d => d.actualDeliveryTime && d.actualPickupTime);
      const avgDeliveryTime = deliveredOrders.length > 0 
        ? deliveredOrders.reduce((sum, d) => {
            const deliveryTime = (new Date(d.actualDeliveryTime!).getTime() - new Date(d.actualPickupTime!).getTime()) / (1000 * 60); // minutes
            return sum + deliveryTime;
          }, 0) / deliveredOrders.length
        : 0;
      
      // Group by courier for performance comparison
      const courierStats = allDeliveries.reduce((acc, delivery) => {
        if (!acc[delivery.providerId]) {
          acc[delivery.providerId] = {
            total: 0,
            delivered: 0,
            failed: 0,
            pending: 0,
          };
        }
        
        acc[delivery.providerId].total++;
        if (delivery.status === 'delivered') acc[delivery.providerId].delivered++;
        else if (delivery.status === 'failed') acc[delivery.providerId].failed++;
        else acc[delivery.providerId].pending++;
        
        return acc;
      }, {} as Record<string, any>);
      
      res.json({
        summary: {
          totalDeliveries,
          successfulDeliveries,
          failedDeliveries,
          pendingDeliveries,
          successRate: totalDeliveries > 0 ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(1) : 0,
          averageDeliveryTime: Math.round(avgDeliveryTime),
        },
        courierPerformance: courierStats,
        historicalAnalytics: analytics,
      });
    } catch (error) {
      console.error('Error fetching delivery analytics:', error);
      res.status(500).json({ message: 'Failed to fetch delivery analytics' });
    }
  });

  // Admin: Reassign delivery to another courier
  app.post('/api/deliveries/:id/reassign', async (req, res) => {
    try {
      const { id } = req.params;
      const { newProviderId, reason } = req.body;
      
      const delivery = await storage.getDeliveryById(id);
      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }
      
      const newProvider = await storage.getDeliveryProviderById(newProviderId);
      if (!newProvider) {
        return res.status(400).json({ message: 'New courier provider not found' });
      }
      
      // Update delivery
      await storage.updateDelivery(id, {
        providerId: newProviderId,
        status: 'pending',
        failureReason: reason || 'Reassigned by admin',
      });
      
      // Add reassignment update
      await storage.addDeliveryUpdate({
        deliveryId: id,
        status: 'reassigned',
        description: `Delivery reassigned to ${newProvider.name}. Reason: ${reason || 'Admin decision'}`,
        source: 'manual',
      });
      
      res.json({ success: true, message: 'Delivery reassigned successfully' });
    } catch (error) {
      console.error('Error reassigning delivery:', error);
      res.status(500).json({ message: 'Failed to reassign delivery' });
    }
  });

  // Admin statistics endpoint
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // Admin users management
  app.get('/api/admin/users', async (req, res) => {
    try {
      const { search, limit = 50, offset = 0 } = req.query;
      const users = await storage.getAllUsers({
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin vendors management
  app.get('/api/admin/vendors', async (req, res) => {
    try {
      const { search, verified, limit = 50, offset = 0 } = req.query;
      const vendors = await storage.getAllVendors({
        search: search as string,
        verified: verified === 'true' ? true : verified === 'false' ? false : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching admin vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get('/api/admin/vendors/:id', async (req, res) => {
    try {
      const vendor = await storage.getVendorById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.patch('/api/admin/vendors/:id/verify', async (req, res) => {
    try {
      const { verificationStatus, verificationNotes } = req.body;
      const updates: any = { 
        verificationStatus,
        verificationNotes,
        updatedAt: new Date()
      };
      
      if (verificationStatus === 'verified') {
        updates.verifiedAt = new Date();
        updates.verifiedBy = 'admin'; // Could be req.user.id if we have admin auth
        updates.verified = true; // Set the boolean field for UI display
      } else {
        updates.verified = false; // Set to false if not verified
      }
      
      const vendor = await storage.updateVendor(req.params.id, updates);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor verification:", error);
      res.status(500).json({ message: "Failed to update vendor verification" });
    }
  });

  // Vendor Applications API endpoints for admin portal
  app.get('/api/admin/vendor-applications', async (req, res) => {
    try {
      const { status, search, limit = 50, offset = 0 } = req.query;
      const applications = await storage.getVendorApplications({
        status: status as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });
      res.json(applications);
    } catch (error) {
      console.error("Error fetching vendor applications:", error);
      res.status(500).json({ message: "Failed to fetch vendor applications" });
    }
  });

  // Admin endpoint to serve vendor documents securely
  app.get("/api/admin/vendor-documents/:vendorId/:documentType", isUserAuthenticated, async (req, res) => {
    try {
      const { vendorId, documentType } = req.params;
      
      // Validate document type
      if (!['nationalId', 'taxCertificate'].includes(documentType)) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      // Get vendor data to retrieve document URL
      const vendor = await storage.getVendorById(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const documentUrl = documentType === 'nationalId' ? vendor.nationalIdUrl : vendor.taxCertificateUrl;
      if (!documentUrl) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Extract object path from the URL
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(documentUrl);
      
      if (!objectPath.startsWith('/objects/')) {
        return res.status(400).json({ message: "Invalid document path" });
      }

      // Get the file from object storage and serve it
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
      
    } catch (error) {
      console.error("Error serving vendor document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.status(500).json({ message: "Failed to serve document" });
    }
  });

  app.get('/api/admin/vendor-applications/:id', async (req, res) => {
    try {
      const application = await storage.getVendorApplicationById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Vendor application not found" });
      }
      res.json(application);
    } catch (error) {
      console.error("Error fetching vendor application:", error);
      res.status(500).json({ message: "Failed to fetch vendor application" });
    }
  });

  app.put('/api/admin/vendor-applications/:id/approve', async (req, res) => {
    try {
      const applicationId = req.params.id;
      const application = await storage.approveVendorApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Vendor application not found" });
      }

      // Send approval notification email
      try {
        await sendVendorAccountApprovedNotification({
          vendorEmail: application.email,
          vendorName: application.contactName,
          businessName: application.businessName,
          loginUrl: "https://buylockmarket.com/vendor-dashboard/login"
        });
        console.log(`✅ Vendor account approved notification sent to ${application.email}`);
      } catch (emailError) {
        console.error("Failed to send approval notification email:", emailError);
        // Continue with approval even if email fails
      }

      res.json(application);
    } catch (error) {
      console.error("Error approving vendor application:", error);
      res.status(500).json({ message: "Failed to approve vendor application" });
    }
  });

  app.put('/api/admin/vendor-applications/:id/reject', async (req, res) => {
    try {
      const applicationId = req.params.id;
      const { reason } = req.body;
      const application = await storage.rejectVendorApplication(applicationId, reason);
      if (!application) {
        return res.status(404).json({ message: "Vendor application not found" });
      }

      // Send rejection notification email
      try {
        // TODO: Implement rejection email notification if needed
        console.log(`Vendor rejection notification would be sent to ${application.email} (reason: ${reason})`);
      } catch (emailError) {
        console.error("Failed to send rejection notification email:", emailError);
        // Continue with rejection even if email fails
      }

      res.json(application);
    } catch (error) {
      console.error("Error rejecting vendor application:", error);
      res.status(500).json({ message: "Failed to reject vendor application" });
    }
  });

  // Admin user and vendor creation endpoints
  
  // Create user via admin
  app.post('/api/admin/users', async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;
      
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const userId = crypto.randomUUID();
      const user = await storage.createUser({
        id: userId,
        email,
        firstName,
        lastName,
        password: hashedPassword,
        profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
      });
      
      res.status(201).json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Create vendor via admin
  app.post('/api/admin/vendors', async (req, res) => {
    try {
      const { 
        email, 
        password, 
        businessName, 
        contactName, 
        contactPhone, 
        businessAddress, 
        businessDescription, 
        registrationType,
        nationalIdNumber,
        taxPinNumber 
      } = req.body;
      
      if (!email || !password || !businessName || !contactName || !contactPhone || !businessAddress || !businessDescription || !nationalIdNumber) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }
      
      if (registrationType === "registered" && !taxPinNumber) {
        return res.status(400).json({ message: "Tax PIN number is required for registered businesses" });
      }
      
      // Check if vendor already exists
      const existingVendor = await storage.getVendorByEmail(email);
      if (existingVendor) {
        return res.status(400).json({ message: "Vendor with this email already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create vendor with verified status (created by admin)
      const vendorId = crypto.randomUUID();
      const vendor = await storage.createVendor({
        id: vendorId,
        email,
        password: hashedPassword,
        businessName,
        contactEmail: email,
        contactName,
        phone: contactPhone,
        address: businessAddress,
        businessCategory: "General",
        description: businessDescription,
        nationalIdNumber,
        taxPinNumber: registrationType === "registered" ? taxPinNumber : undefined,
        verificationStatus: "verified", // Auto-verify admin-created vendors
        verifiedAt: new Date().toISOString(),
        verifiedBy: "admin",
      });
      
      res.status(201).json({ 
        id: vendor.id, 
        email: vendor.email, 
        businessName: vendor.businessName,
        verificationStatus: vendor.verificationStatus
      });
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });
  
  // Admin product and service approval endpoints
  
  // Get all products for admin management
  app.get('/api/admin/products', async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Toggle product approval status
  app.put('/api/admin/products/:id/approval', async (req, res) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;
      
      const product = await storage.updateProductApproval(id, approved);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error updating product approval:", error);
      res.status(500).json({ message: "Failed to update product approval" });
    }
  });

  // Get all services for admin management
  app.get('/api/admin/services', async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching admin services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Toggle service approval status
  app.put('/api/admin/services/:id/approval', async (req, res) => {
    try {
      const { id } = req.params;
      const { approved } = req.body;
      
      const service = await storage.updateServiceApproval(id, approved);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      console.error("Error updating service approval:", error);
      res.status(500).json({ message: "Failed to update service approval" });
    }
  });

  // New delivery workflow endpoints
  
  // Vendor confirms order (paid -> confirmed)
  app.post('/api/orders/:id/confirm', async (req, res) => {
    try {
      const { id } = req.params;
      const { vendorNotes } = req.body;
      
      await storage.confirmOrder(id, vendorNotes);
      
      res.json({ success: true, message: 'Order confirmed successfully' });
    } catch (error) {
      console.error('Error confirming order:', error);
      res.status(500).json({ message: 'Failed to confirm order' });
    }
  });

  // Process dispatch (confirmed -> awaiting_dispatch) 
  app.post('/api/orders/:id/dispatch', async (req, res) => {
    try {
      const { id } = req.params;
      const { providerId, trackingId, pickupInstructions } = req.body;
      
      if (!providerId) {
        return res.status(400).json({ message: 'Provider ID is required' });
      }
      
      await storage.processOrderDispatch(id, providerId, trackingId);
      
      // Get order, vendor, customer, and provider details
      const order = await storage.getOrder(id);
      const provider = await storage.getDeliveryProviderById(providerId);
      
      if (provider && order && provider.contactEmail) {
        // Get vendor details
        const vendor = await storage.getVendorById(order.vendorId);
        
        // Get customer details
        const customer = await storage.getUser(order.userId);
        
        // Get order items
        const orderItems = await storage.getOrderItems(id);
        
        if (vendor && customer && orderItems.length > 0) {
          const { sendCourierNotification } = await import('./emailService');
          
          // Prepare order items for email
          const emailOrderItems = await Promise.all(orderItems.map(async (item) => {
            let itemName = 'Unknown Item';
            if (item.productId) {
              const product = await storage.getProductById(item.productId);
              itemName = product?.name || 'Unknown Product';
            } else if (item.serviceId) {
              const service = await storage.getServiceById(item.serviceId);
              itemName = service?.name || 'Unknown Service';
            }
            
            return {
              name: itemName,
              quantity: item.quantity,
              price: item.price
            };
          }));
          
          const courierNotificationData = {
            courierEmail: provider.contactEmail,
            courierName: provider.name,
            orderId: id,
            customerName: customer.username || 'Customer',
            customerPhone: customer.phone || 'Not provided',
            vendorBusinessName: vendor.businessName,
            vendorLocation: vendor.businessAddress || 'Address not provided',
            vendorPhone: vendor.phoneNumber || 'Phone not provided',
            deliveryAddress: order.deliveryAddress || 'Address not provided',
            orderTotal: order.totalAmount,
            pickupInstructions: pickupInstructions || '',
            orderItems: emailOrderItems
          };
          
          // Send courier notification email
          const emailSent = await sendCourierNotification(courierNotificationData);
          
          if (emailSent) {
            console.log(`Courier notification email sent to ${provider.contactEmail} for order ${id}`);
          } else {
            console.warn(`Failed to send courier notification email for order ${id}`);
          }
        }
      }
      
      res.json({ success: true, message: 'Order dispatched successfully' });
    } catch (error) {
      console.error('Error dispatching order:', error);
      res.status(500).json({ message: 'Failed to dispatch order' });
    }
  });

  // Update delivery status with tracking ID
  app.put('/api/deliveries/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, description, trackingId } = req.body;
      
      // Log manual status updates for debugging
      console.log(`🔧 Manual status update for delivery ${id}:`, {
        newStatus: status,
        description: description,
        trackingId: trackingId,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent']
      });
      
      // Get current status before update
      const currentDelivery = await storage.getDeliveryById(id);
      if (currentDelivery) {
        console.log(`📋 Current status: ${currentDelivery.status} → Updating to: ${status}`);
      }
      
      await storage.updateDeliveryStatus(id, status, description, trackingId);
      
      // Verify the update was successful
      const updatedDelivery = await storage.getDeliveryById(id);
      if (updatedDelivery) {
        console.log(`✅ Status update completed. Final status: ${updatedDelivery.status}`);
      }
      
      res.json({ success: true, message: 'Delivery status updated' });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      res.status(500).json({ message: 'Failed to update delivery status' });
    }
  });

  // Get delivery provider configurations
  app.get('/api/delivery/providers/config', async (req, res) => {
    try {
      const providers = await storage.getDeliveryProviders();
      res.json(providers);
    } catch (error) {
      console.error('Error fetching provider configs:', error);
      res.status(500).json({ message: 'Failed to fetch provider configurations' });
    }
  });

  // Update delivery provider configuration
  app.put('/api/delivery/providers/:id/config', async (req, res) => {
    try {
      const { id } = req.params;
      const { notificationMethod, webhookNotificationUrl, contactEmail, contactPhone } = req.body;
      
      const updateData: any = {};
      if (notificationMethod) updateData.notificationMethod = notificationMethod;
      if (webhookNotificationUrl) updateData.webhookNotificationUrl = webhookNotificationUrl;
      if (contactEmail) updateData.contactEmail = contactEmail;
      if (contactPhone) updateData.contactPhone = contactPhone;
      
      const updatedProvider = await storage.updateDeliveryProvider(id, updateData);
      res.json(updatedProvider);
    } catch (error) {
      console.error('Error updating provider config:', error);
      res.status(500).json({ message: 'Failed to update provider configuration' });
    }
  });

  // Direct Service Booking endpoint (bypasses cart)
  app.post('/api/services/book', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookingData = serviceBookingSchema.parse(req.body);
      
      // Get service details
      const service = await storage.getServiceById(bookingData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Calculate total price
      const totalAmount = (parseFloat(service.price) * bookingData.duration).toString();

      // Create order directly
      const orderData = {
        userId,
        vendorId: service.providerId, // Assign to service provider
        status: "pending_payment", // Service specific status - payment first, then acceptance
        totalAmount,
        deliveryAddress: bookingData.serviceLocation, // Use service location as delivery address
        deliveryFee: "0", // No delivery fee for services
        paymentStatus: "pending",
        paymentMethod: "card",
        notes: bookingData.notes,
        orderType: "service",
      };
      
      const order = await storage.createOrder(orderData);

      // Add service as order item
      await storage.addOrderItem({
        orderId: order.id,
        serviceId: service.id,
        quantity: 1,
        price: totalAmount,
        name: service.name,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        duration: bookingData.duration,
        notes: bookingData.notes,
        serviceLocation: bookingData.serviceLocation,
        locationCoordinates: bookingData.locationCoordinates,
        detailedInstructions: bookingData.detailedInstructions,
      });

      res.status(201).json({ 
        success: true, 
        order,
        totalAmount,
        message: "Service booked successfully! Proceed to payment." 
      });
    } catch (error) {
      console.error("Service booking error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to book service" });
    }
  });

  // Direct Service Booking API endpoint
  app.post('/api/services/book', isUserAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const {
        serviceId,
        appointmentDate,
        appointmentTime,
        duration,
        notes,
        serviceLocation,
        locationCoordinates,
        detailedInstructions,
      } = req.body;

      // Get service details
      const service = await storage.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      // Calculate total amount
      const totalAmount = parseFloat(service.price) * duration;

      // Parse location coordinates
      let serviceLatitude = null;
      let serviceLongitude = null;
      if (locationCoordinates) {
        const [lat, lng] = locationCoordinates.split(',');
        serviceLatitude = parseFloat(lat);
        serviceLongitude = parseFloat(lng);
      }

      // Create appointment directly
      const appointment = await storage.createAppointment({
        userId,
        vendorId: service.providerId,
        serviceId,
        serviceName: service.name,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        duration,
        status: "pending_acceptance",
        totalAmount: totalAmount.toString(),
        paymentStatus: "pending",
        paymentMethod: "card",
        customerNotes: notes,
        serviceLocation,
        serviceLatitude,
        serviceLongitude,
        detailedInstructions,
      });

      res.json({
        success: true,
        order: {
          id: appointment.id,
          userId: appointment.userId,
          vendorId: appointment.vendorId,
          status: appointment.status,
          totalAmount: appointment.totalAmount,
          paymentStatus: appointment.paymentStatus,
          orderType: "service",
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
          orderItems: []
        },
        totalAmount,
        message: "Service booked successfully! Proceed to payment."
      });
    } catch (error) {
      console.error("Service booking error:", error);
      res.status(500).json({ message: "Failed to book service" });
    }
  });

  // Vendor Task Management API endpoints
  
  // Get vendor's service appointments (tasks)
  app.get('/api/vendor/tasks', isVendorAuthenticated, async (req, res) => {
    try {
      const { vendorId } = req.query;
      
      if (!vendorId) {
        return res.status(400).json({ message: "Vendor ID is required" });
      }

      // Get appointments assigned to this vendor
      const appointments = await storage.getVendorAppointments(vendorId as string);
      
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching vendor tasks:', error);
      res.status(500).json({ message: 'Failed to fetch vendor tasks' });
    }
  });

  // Update service task status (appointments)
  app.patch('/api/vendor/tasks/:appointmentId/status', isVendorAuthenticated, async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { status, vendorNotes } = req.body;
      
      // Valid service statuses for comprehensive workflow
      const validStatuses = [
        'pending_acceptance', 'accepted', 'starting_job', 'in_progress', 
        'delayed', 'almost_done', 'completed', 'cancelled', 'declined'
      ];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updatedAppointment = await storage.updateAppointmentStatus(appointmentId, status, vendorNotes);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Also update the corresponding order status for customer visibility
      try {
        await storage.updateOrderStatus(appointmentId, status);
      } catch (error) {
        console.error('Error updating order status:', error);
        // Continue even if order update fails, appointment update is primary
      }

      res.json({ 
        success: true, 
        appointment: updatedAppointment,
        message: `Task status updated to ${status}` 
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ message: 'Failed to update task status' });
    }
  });



  // Object storage routes for document uploads
  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.put("/api/vendor/documents", async (req, res) => {
    try {
      const { documentUrls } = req.body;
      const objectStorageService = new ObjectStorageService();
      
      const normalizedPaths = {
        nationalIdFrontUrl: documentUrls.nationalIdFrontUrl ? 
          objectStorageService.normalizeObjectEntityPath(documentUrls.nationalIdFrontUrl) : null,
        nationalIdBackUrl: documentUrls.nationalIdBackUrl ? 
          objectStorageService.normalizeObjectEntityPath(documentUrls.nationalIdBackUrl) : null,
        taxCertificateUrl: documentUrls.taxCertificateUrl ? 
          objectStorageService.normalizeObjectEntityPath(documentUrls.taxCertificateUrl) : null,
      };

      res.status(200).json({
        normalizedPaths,
        message: "Documents processed successfully"
      });
    } catch (error) {
      console.error("Error processing vendor documents:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test payment reference storage
  app.post('/api/test/payment-storage', async (req, res) => {
    try {
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ error: 'Payment reference required' });
      }
      
      console.log(`🔍 Testing payment reference: ${reference}`);
      
      const existingOrder = await storage.getOrderByPaymentReference(reference);
      
      res.json({
        success: true,
        found: !!existingOrder,
        order: existingOrder,
        message: existingOrder ? 'Order found!' : 'No order found with this reference'
      });
    } catch (error) {
      console.error('Payment storage test error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Test failed',
        details: error.toString()
      });
    }
  });

  // Simple SMS test endpoint
  app.post('/api/sms/test', async (req, res) => {
    try {
      const { phone } = req.body;
      
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number is required' });
      }
      
      // Import uwaziiService
      const { uwaziiService } = await import('./uwaziiService');
      
      // Create simple test message
      const message = `Test from BuyLock: Hello! This is a test message.`;
      
      console.log(`📱 Sending test SMS to ${phone}`);
      
      const result = await uwaziiService.sendSMS(phone, message);
      
      if (result.success) {
        console.log(`✅ Test SMS sent successfully to ${phone}`);
        res.json({ 
          success: true, 
          message: 'Test SMS sent successfully',
          messageId: result.messageId,
          phone: phone,
          formattedPhone: phone.replace(/\D/g, '').startsWith('0') ? '254' + phone.replace(/\D/g, '').substring(1) : phone
        });
      } else {
        console.error(`❌ Failed to send test SMS to ${phone}:`, result.error);
        res.status(500).json({ 
          success: false, 
          error: result.error || 'Failed to send SMS' 
        });
      }
    } catch (error) {
      console.error('SMS test error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // SMS endpoint for sending dispatch notifications
  app.post('/api/sms/dispatch', async (req, res) => {
    try {
      const { phone, orderId } = req.body;
      
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Phone number is required' });
      }
      
      // Import uwaziiService
      const { uwaziiService } = await import('./uwaziiService');
      
      // Create dispatch message
      const message = `🚚 Great news! Your order has been dispatched and is on its way to you. ${orderId ? `Order #${orderId.slice(-8).toUpperCase()} ` : ''}You will receive it within the estimated delivery time. Track your order in the BuyLock app. - BuyLock Marketplace`;
      
      console.log(`📱 Sending dispatch SMS to ${phone}`);
      
      const result = await uwaziiService.sendSMS(phone, message);
      
      if (result.success) {
        console.log(`✅ Dispatch SMS sent successfully to ${phone}`);
        res.json({ 
          success: true, 
          message: 'Dispatch notification sent successfully',
          messageId: result.messageId 
        });
      } else {
        console.error(`❌ Failed to send dispatch SMS to ${phone}:`, result.error);
        res.status(500).json({ 
          success: false, 
          error: result.error || 'Failed to send SMS' 
        });
      }
    } catch (error) {
      console.error('SMS dispatch error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });

  // Seed database on startup for development
  if (process.env.NODE_ENV === "development") {
    try {
      await seedDatabase();
      console.log("✅ Database seeded successfully");
    } catch (error) {
      console.error("❌ Failed to seed database:", error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
