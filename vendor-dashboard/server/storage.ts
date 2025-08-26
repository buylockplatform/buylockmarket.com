import {
  vendors,
  categories,
  products,
  services,
  type Vendor,
  type InsertVendor,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type Service,
  type InsertService,
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export interface IVendorStorage {
  // Vendor authentication
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  getVendorByEmail(email: string): Promise<Vendor | undefined>;
  getVendorById(id: string): Promise<Vendor | undefined>;
  validateVendor(email: string, password: string): Promise<Vendor | null>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Products
  getVendorProducts(vendorId: string): Promise<Product[]>;
  createProduct(product: InsertProduct & { vendorId: string }): Promise<Product>;
  updateProduct(id: string, vendorId: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string, vendorId: string): Promise<boolean>;
  
  // Services
  getVendorServices(vendorId: string): Promise<Service[]>;
  createService(service: InsertService & { vendorId: string }): Promise<Service>;
  updateService(id: string, vendorId: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string, vendorId: string): Promise<boolean>;
}

export class DatabaseVendorStorage implements IVendorStorage {
  // Vendor authentication
  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const hashedPassword = await bcrypt.hash(vendorData.password, 10);
    const [vendor] = await db
      .insert(vendors)
      .values({
        ...vendorData,
        password: hashedPassword,
      })
      .returning();
    return vendor;
  }

  async getVendorByEmail(email: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.email, email));
    return vendor;
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async validateVendor(email: string, password: string): Promise<Vendor | null> {
    const vendor = await this.getVendorByEmail(email);
    if (!vendor) return null;
    
    const isValid = await bcrypt.compare(password, vendor.password);
    return isValid ? vendor : null;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    return category;
  }

  // Products
  async getVendorProducts(vendorId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.vendorId, vendorId))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(productData: InsertProduct & { vendorId: string }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(productData)
      .returning();
    return product;
  }

  async updateProduct(id: string, vendorId: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.vendorId, vendorId)))
      .returning();
    return product;
  }

  async deleteProduct(id: string, vendorId: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.vendorId, vendorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Services
  async getVendorServices(vendorId: string): Promise<Service[]> {
    return await db
      .select()
      .from(services)
      .where(eq(services.vendorId, vendorId))
      .orderBy(desc(services.createdAt));
  }

  async createService(serviceData: InsertService & { vendorId: string }): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async updateService(id: string, vendorId: string, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set({ ...serviceData, updatedAt: new Date() })
      .where(and(eq(services.id, id), eq(services.vendorId, vendorId)))
      .returning();
    return service;
  }

  async deleteService(id: string, vendorId: string): Promise<boolean> {
    const result = await db
      .delete(services)
      .where(and(eq(services.id, id), eq(services.vendorId, vendorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const vendorStorage = new DatabaseVendorStorage();