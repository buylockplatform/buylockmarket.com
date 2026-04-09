import type { Express } from "express";
import { createServer, type Server } from "http";
import { vendorStorage } from "./storage.js";
import { getVendorSession, isVendorAuthenticated } from "./auth.js";
import { insertVendorSchema, loginVendorSchema, insertProductSchema, insertServiceSchema } from "../shared/schema.js";
import { fromZodError } from "zod-validation-error";
import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { sendPasswordResetEmail } from "./emailService.js";

export async function registerVendorRoutes(app: Express): Promise<Server> {
  // Serve a simple homepage for now
  app.get("/", (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BuyLock Vendor Dashboard</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .logo { color: #FF4605; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .title { font-size: 28px; font-weight: bold; margin-bottom: 16px; color: #1f2937; }
          .description { color: #6b7280; margin-bottom: 32px; line-height: 1.6; }
          .demo-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .demo-title { font-weight: bold; margin-bottom: 8px; }
          .credentials { font-family: 'Monaco', 'Menlo', monospace; font-size: 14px; }
          .status { color: #059669; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">🏪 BuyLock</div>
          <h1 class="title">Vendor Dashboard</h1>
          <p class="description">
            Welcome to the BuyLock Vendor Dashboard! This is your dedicated platform for managing 
            your products, services, orders, and business operations on the BuyLock marketplace.
          </p>
          
          <div class="demo-box">
            <div class="demo-title">🔐 Demo Account Access</div>
            <div class="credentials">
              <div>Email: vendor@buylock.com</div>
              <div>Password: password123</div>
            </div>
          </div>
          
          <div class="status">✅ Server Status: Running on Port 5001</div>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            🚧 <strong>Development Mode:</strong> Full vendor dashboard interface is being built. 
            Database setup and authentication system are in progress.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <h3 style="color: #1f2937; margin-bottom: 12px;">Coming Soon:</h3>
            <ul style="color: #6b7280; line-height: 1.8;">
              <li>Vendor login and registration</li>
              <li>Product and service management</li>
              <li>Order processing dashboard</li>
              <li>Sales analytics and reports</li>
              <li>Business profile settings</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Session middleware
  app.use(getVendorSession());

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      
      // Check if vendor already exists
      const existingVendor = await vendorStorage.getVendorByEmail(validatedData.email);
      if (existingVendor) {
        return res.status(400).json({ message: "Vendor already exists with this email" });
      }

      const vendor = await vendorStorage.createVendor(validatedData);
      
      // Set session
      (req.session as any).vendorId = vendor.id;
      
      // Return vendor without password
      const { password: _, ...vendorWithoutPassword } = vendor;
      res.json(vendorWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register vendor" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginVendorSchema.parse(req.body);
      
      const vendor = await vendorStorage.validateVendor(email, password);
      if (!vendor) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set session
      (req.session as any).vendorId = vendor.id;
      
      // Return vendor without password
      const { password: _, ...vendorWithoutPassword } = vendor;
      res.json(vendorWithoutPassword);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const vendor = await vendorStorage.getVendorByEmail(email.toLowerCase().trim());

      if (!vendor) {
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await vendorStorage.createPasswordResetToken(vendor.id, token, expiresAt);

      const baseUrl = process.env.VENDOR_BASE_URL || `http://localhost:${process.env.VENDOR_PORT || 5001}`;
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail(vendor.email, vendor.contactName, resetUrl);

      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const resetRecord = await vendorStorage.getPasswordResetToken(token);

      if (!resetRecord) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
      if (resetRecord.used) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }
      if (new Date() > new Date(resetRecord.expiresAt)) {
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await vendorStorage.updateVendorPassword(resetRecord.vendorId, hashedPassword);
      await vendorStorage.markPasswordResetTokenUsed(token);

      res.json({ message: "Password reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/vendor', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const vendor = await vendorStorage.getVendorById(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      
      // Return vendor without password
      const { password: _, ...vendorWithoutPassword } = vendor;
      res.json(vendorWithoutPassword);
    } catch (error) {
      console.error("Get vendor error:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await vendorStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get('/api/products', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const products = await vendorStorage.getVendorProducts(vendorId);
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const validatedData = insertProductSchema.parse(req.body);
      
      const product = await vendorStorage.createProduct({
        ...validatedData,
        vendorId,
      });
      
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const productId = req.params.id;
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      const product = await vendorStorage.updateProduct(productId, vendorId, validatedData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const productId = req.params.id;
      
      const deleted = await vendorStorage.deleteProduct(productId, vendorId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Services routes
  app.get('/api/services', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const services = await vendorStorage.getVendorServices(vendorId);
      res.json(services);
    } catch (error) {
      console.error("Get services error:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const validatedData = insertServiceSchema.parse(req.body);
      
      const service = await vendorStorage.createService({
        ...validatedData,
        vendorId,
      });
      
      res.json(service);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Create service error:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const serviceId = req.params.id;
      const validatedData = insertServiceSchema.partial().parse(req.body);
      
      const service = await vendorStorage.updateService(serviceId, vendorId, validatedData);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Update service error:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', isVendorAuthenticated, async (req, res) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const serviceId = req.params.id;
      
      const deleted = await vendorStorage.deleteService(serviceId, vendorId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Delete service error:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}