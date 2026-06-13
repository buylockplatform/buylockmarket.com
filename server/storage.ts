import {
  users,
  vendors,
  admins,
  categories,
  subcategories,
  brands,
  productAttributes,
  products,
  services,
  cartItems,
  orders,
  orderItems,
  orderTracking,
  appointments,
  deliveryProviders,
  deliveries,
  deliveryRequests,
  deliveryUpdates,
  deliveryAnalytics,
  payoutRequests,
  vendorEarnings,
  payoutHistory,
  platformSettings,
  emailNotifications,
  type User,
  type UpsertUser,
  type InsertUser,
  type Vendor,
  type InsertVendor,
  type Admin,
  type InsertAdmin,
  type Category,
  type Subcategory,
  type Brand,
  type ProductAttribute,
  type Product,
  type Service,
  type CartItem,
  type Order,
  type OrderItem,
  type OrderTracking,
  type Appointment,
  type DeliveryProvider,
  type Delivery,
  type DeliveryRequest,
  type DeliveryUpdate,
  type DeliveryAnalytics,
  type InsertCategory,
  type InsertSubcategory,
  type InsertBrand,
  type InsertProductAttribute,
  type InsertProduct,
  type InsertService,
  type InsertCartItem,
  type InsertOrder,
  type InsertOrderItem,
  type InsertOrderTracking,
  type InsertDeliveryRequest,
  type InsertAppointment,
  type InsertDeliveryProvider,
  type InsertDelivery,
  type InsertDeliveryUpdate,
  type InsertDeliveryAnalytics,
  type PayoutRequest,
  type InsertPayoutRequest,
  type VendorEarning,
  type InsertVendorEarning,
  type PayoutHistory,
  type InsertPayoutHistory,
  type PlatformSetting,
  type InsertPlatformSetting,
  type EmailNotification,
  type InsertEmailNotification,
  type MerchantLocation,
  type InsertMerchantLocation,
  customerAddresses,
  mpesaTransactions,
  deliveryJobs,
  type CustomerAddress,
  type InsertCustomerAddress,
  type MpesaTransaction,
  type InsertMpesaTransaction,
  type DeliveryJob,
  type InsertDeliveryJob,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, ilike, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";
import { generatePublicToken, getTokenExpiration } from "./tokenUtils";

export interface IStorage {
  // User operations (supports both Replit Auth and form authentication)
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  ensureUserExists(id: string, email: string, name: string): Promise<User>;

  // User authentication (form-based)
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;

  // Vendor operations
  getAllVendors(): Promise<Vendor[]>;
  getVendorById(id: string): Promise<Vendor | undefined>;
  getVendorByEmail(email: string): Promise<Vendor | undefined>;
  getVendorByPhone(phone: string): Promise<Vendor | undefined>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor>;
  updateVendorBusinessDetails(id: string, details: { businessName: string; contactName: string; phone?: string; address?: string; city?: string; suburb?: string; building?: string; postalCode?: string; businessLatitude?: string; businessLongitude?: string; locationDescription?: string }): Promise<Vendor>;
  updateVendorBankDetails(id: string, details: { bankName: string; bankCode?: string; accountNumber: string; accountName: string }): Promise<Vendor>;
  getVendorStats(vendorId: string): Promise<{
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    pendingOrders: number;
    recentOrders: any[];
    monthlyEarnings: any[];
    topProducts: any[];
  }>;

  // Paystack Subaccount operations
  updateVendorPaystackSubaccount(id: string, details: { paystackSubaccountId: string; paystackSubaccountCode: string; subaccountActive: boolean }): Promise<Vendor>;

  // Vendor Earnings operations
  createVendorEarning(earning: InsertVendorEarning): Promise<VendorEarning>;
  getVendorEarnings(vendorId: string): Promise<VendorEarning[]>;
  getVendorEarningsHistory(vendorId: string): Promise<VendorEarning[]>;
  updateVendorBalance(vendorId: string, amount: number): Promise<void>;
  updateVendorPendingBalance(vendorId: string, amount: number, operation: 'add' | 'subtract'): Promise<void>;
  completeVendorPayout(vendorId: string, amount: number): Promise<void>;
  reverseVendorPayout(vendorId: string, amount: number): Promise<void>;
  markVendorEarningsPaidOut(vendorId: string, orderId: string, payoutRequestId: string): Promise<void>;
  updateVendorTotalPaidOut(vendorId: string, totalAmount: number): Promise<void>;

  // Payout Request operations
  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  getPayoutRequest(id: string): Promise<PayoutRequest | undefined>;
  getPayoutRequestByTransferCode(transferCode: string): Promise<PayoutRequest | undefined>;
  getVendorPayoutRequests(vendorId: string): Promise<PayoutRequest[]>;
  getAllPayoutRequests(status?: string): Promise<PayoutRequest[]>;
  updatePayoutRequest(id: string, updates: Partial<PayoutRequest>): Promise<PayoutRequest>;

  // Platform Settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  updatePlatformSetting(key: string, value: string, updatedBy?: string): Promise<PlatformSetting>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  // Subcategory operations
  getSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;

  // Brand operations
  getBrands(): Promise<Brand[]>;

  // Product operations
  getProducts(params?: {
    categoryId?: string;
    categoryIds?: string[];
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Service operations
  getServices(params?: {
    categoryId?: string;
    categoryIds?: string[];
    search?: string;
    featured?: boolean;
    availableToday?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Service[]>;
  getServiceById(id: string): Promise<Service | undefined>;
  getService(id: string): Promise<Service | undefined>;
  getServiceBySlug(slug: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Cart operations
  getCartItems(userId?: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  getAllOrders(): Promise<Order[]>;
  getOrders(params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    vendorId?: string; // New: filter by vendor
    limit?: number;
    offset?: number;
  }): Promise<Order[]>;

  // Delivery Request operations (for simplified workflow)
  createDeliveryRequest(request: InsertDeliveryRequest): Promise<DeliveryRequest>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrderByPaymentReference(paymentReference: string): Promise<Order | undefined>;
  getOrderByPublicToken(token: string): Promise<Order | undefined>;
  ensurePublicToken(orderId: string): Promise<string>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Vendor order management
  getVendorOrders(vendorId: string, statuses?: string[]): Promise<Order[]>;
  getVendorOrdersByStatus(vendorId: string, status: string): Promise<Order[]>;
  getVendorDeliveredOrders(vendorId: string): Promise<Order[]>;
  acceptOrder(orderId: string, vendorNotes?: string): Promise<Order>;
  updateOrderStatusByVendor(orderId: string, status: string, notes?: string): Promise<Order>;

  // Order item and user operations
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getOrderWithItems(id: string): Promise<(Order & { orderItems: OrderItem[] }) | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;

  // Order tracking operations
  addOrderTracking(tracking: InsertOrderTracking): Promise<OrderTracking>;
  getOrderTracking(orderId: string): Promise<OrderTracking[]>;
  generateTrackingNumber(orderId: string): Promise<string>;

  // Search operations
  searchProductsAndServices(query: string): Promise<{
    products: Product[];
    services: Service[];
  }>;

  // Admin operations
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  getAllUsers(params?: { search?: string; limit?: number; offset?: number }): Promise<User[]>;
  getAllVendors(params?: { search?: string; verified?: boolean; limit?: number; offset?: number }): Promise<Vendor[]>;
  getVendorById(id: string): Promise<Vendor | undefined>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined>;
  getAdminStats(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    pendingVendors: number;
    totalRevenue: number;
  }>;

  // Appointment operations
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointmentStatus(appointmentId: string, status: string, vendorNotes?: string): Promise<Appointment | undefined>;
  getVendorAppointments(vendorId: string): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;

  // Category management operations
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  getAllSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;
  updateSubcategory(id: string, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined>;
  deleteSubcategory(id: string): Promise<boolean>;

  getAllBrands(): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined>;
  deleteBrand(id: string): Promise<boolean>;

  getAllProductAttributes(): Promise<ProductAttribute[]>;
  getAttributesByCategory(categoryId: string): Promise<ProductAttribute[]>;
  getAttributesBySubcategory(subcategoryId: string): Promise<ProductAttribute[]>;
  createProductAttribute(attribute: InsertProductAttribute): Promise<ProductAttribute>;
  updateProductAttribute(id: string, attribute: Partial<InsertProductAttribute>): Promise<ProductAttribute | undefined>;
  deleteProductAttribute(id: string): Promise<boolean>;

  // Delivery operations
  getDeliveryProviders(): Promise<DeliveryProvider[]>;
  getDeliveryProviderById(id: string): Promise<DeliveryProvider | undefined>;
  createDeliveryProvider(provider: InsertDeliveryProvider): Promise<DeliveryProvider>;
  updateDeliveryProvider(id: string, updates: Partial<InsertDeliveryProvider>): Promise<DeliveryProvider>;

  getDeliveries(params?: {
    status?: string;
    providerId?: string;
    orderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Delivery[]>;
  getDeliveryById(id: string): Promise<Delivery | undefined>;
  getDeliveryByOrderId(orderId: string): Promise<Delivery | undefined>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: string, updates: Partial<InsertDelivery>): Promise<Delivery>;

  addDeliveryUpdate(update: InsertDeliveryUpdate): Promise<DeliveryUpdate>;
  getDeliveryUpdates(deliveryId: string): Promise<DeliveryUpdate[]>;

  getDeliveryAnalytics(params?: {
    providerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<DeliveryAnalytics[]>;
  createDeliveryAnalytics(analytics: InsertDeliveryAnalytics): Promise<DeliveryAnalytics>;

  // Admin product and service management
  getAllProducts(): Promise<Product[]>;
  updateProductApproval(id: string, approved: boolean): Promise<Product | undefined>;
  getAllServices(): Promise<Service[]>;
  updateServiceApproval(id: string, approved: boolean): Promise<Service | undefined>;

  // Vendor branch locations
  getVendorLocations(vendorId: string): Promise<MerchantLocation[]>;
  createVendorLocation(data: InsertMerchantLocation): Promise<MerchantLocation>;
  updateVendorLocation(id: string, data: Partial<InsertMerchantLocation>): Promise<MerchantLocation>;
  deleteVendorLocation(id: string): Promise<void>;

  // Saved Customer Address operations
  getAddresses(userId: string): Promise<CustomerAddress[]>;
  createAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  deleteAddress(id: string): Promise<void>;

  // M-Pesa Transaction operations
  getMpesaTransaction(checkoutRequestId: string): Promise<MpesaTransaction | undefined>;
  getMpesaTransactionByOrderId(orderId: string): Promise<MpesaTransaction | undefined>;
  createMpesaTransaction(data: InsertMpesaTransaction): Promise<MpesaTransaction>;
  updateMpesaTransaction(checkoutRequestId: string, updates: Partial<MpesaTransaction>): Promise<MpesaTransaction>;

  // Delivery Job operations
  getDeliveryJobByOrderId(orderId: string): Promise<DeliveryJob | undefined>;
  getDeliveryJobById(id: string): Promise<DeliveryJob | undefined>;
  createDeliveryJob(data: InsertDeliveryJob): Promise<DeliveryJob>;
  updateDeliveryJob(id: string, updates: Partial<DeliveryJob>): Promise<DeliveryJob>;
  updateDeliveryJobStatus(id: string, status: string): Promise<DeliveryJob>;

  // User location operations
  updateUserLocation(userId: string, latitude: string, longitude: string, isOnline: boolean): Promise<User>;
  getRiderLocation(riderId: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found");
    }

    return updatedUser;
  }

  async ensureUserExists(id: string, email: string, name: string): Promise<User> {
    const existingUser = await this.getUser(id);
    if (existingUser) {
      return existingUser;
    }

    // Create user if not exists
    const [user] = await db
      .insert(users)
      .values({
        id,
        email,
        firstName: name,
        lastName: '',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }

  // User authentication methods (form-based)
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const { password, ...userDataWithoutPassword } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(users)
      .values({
        ...userDataWithoutPassword,
        passwordHash: hashedPassword,
      })
      .returning();
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user || !user.passwordHash) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  // Vendor operations
  async getVendorById(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorByEmail(email: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.email, email));
    return vendor || undefined;
  }

  async getVendorByPhone(phone: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.phone, phone));
    return vendor || undefined;
  }

  // Alias for backward compatibility
  async getVendor(id: string): Promise<Vendor | undefined> {
    return this.getVendorById(id);
  }

  async createVendor(vendorData: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(vendorData).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async updateVendorBusinessDetails(id: string, details: { businessName: string; contactName: string; phone?: string; address?: string; city?: string; suburb?: string; building?: string; postalCode?: string; businessLatitude?: string; businessLongitude?: string; locationDescription?: string }): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({
        businessName: details.businessName,
        contactName: details.contactName,
        phone: details.phone,
        address: details.address,
        city: details.city,
        suburb: details.suburb,
        building: details.building,
        postalCode: details.postalCode,
        businessLatitude: details.businessLatitude,
        businessLongitude: details.businessLongitude,
        locationDescription: details.locationDescription,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async updateVendorBankDetails(id: string, details: { bankName: string; bankCode?: string; accountNumber: string; accountName: string }): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({
        bankName: details.bankName,
        bankCode: details.bankCode,
        accountNumber: details.accountNumber,
        accountName: details.accountName,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async getVendorStats(vendorId: string): Promise<{
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    pendingOrders: number;
    recentOrders: any[];
    monthlyEarnings: any[];
    topProducts: any[];
  }> {
    try {
      // Get total products count
      const totalProductsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.vendorId, vendorId));
      const totalProducts = totalProductsResult[0]?.count || 0;

      // Get total services count
      const totalServicesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(services)
        .where(eq(services.providerId, vendorId));
      const totalServices = totalServicesResult[0]?.count || 0;

      // Get total orders count
      const totalOrdersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.vendorId, vendorId));
      const totalOrders = totalOrdersResult[0]?.count || 0;

      // Get pending orders count
      const pendingOrdersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(eq(orders.vendorId, vendorId), eq(orders.status, 'pending')));
      const pendingOrders = pendingOrdersResult[0]?.count || 0;

      // Get recent orders (last 5)
      const recentOrders = await db
        .select({
          id: orders.id,
          status: orders.status,
          totalAmount: orders.totalAmount,
          createdAt: orders.createdAt
        })
        .from(orders)
        .where(eq(orders.vendorId, vendorId))
        .orderBy(desc(orders.createdAt))
        .limit(5);

      // Get monthly earnings (basic implementation - can be enhanced)
      const monthlyEarnings = await db
        .select({
          month: sql<string>`DATE_TRUNC('month', ${orders.createdAt})`,
          total: sql<number>`SUM(CAST(${orders.totalAmount} AS DECIMAL))`
        })
        .from(orders)
        .where(and(eq(orders.vendorId, vendorId), eq(orders.status, 'fulfilled')))
        .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt}) DESC`)
        .limit(6);

      // Get top products (most ordered)
      const topProducts = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          totalSold: sql<number>`SUM(${orderItems.quantity})`,
          revenue: sql<number>`SUM(CAST(${orderItems.price} AS DECIMAL) * ${orderItems.quantity})`
        })
        .from(orderItems)
        .leftJoin(orders, eq(orderItems.orderId, orders.id))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(and(eq(orders.vendorId, vendorId), eq(orders.status, 'fulfilled')))
        .groupBy(orderItems.productId, products.name)
        .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
        .limit(5);

      return {
        totalProducts,
        totalServices,
        totalOrders,
        pendingOrders,
        recentOrders,
        monthlyEarnings,
        topProducts
      };
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      return {
        totalProducts: 0,
        totalServices: 0,
        totalOrders: 0,
        pendingOrders: 0,
        recentOrders: [],
        monthlyEarnings: [],
        topProducts: []
      };
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  // Aliases to satisfy IStorage interface
  async getAllCategories(): Promise<Category[]> {
    return this.getCategories();
  }

  async getAllSubcategories(): Promise<Subcategory[]> {
    return this.getSubcategories();
  }

  async getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
    return this.getSubcategoriesByCategoryId(categoryId);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Subcategory operations
  async getSubcategories(): Promise<Subcategory[]> {
    return db.select().from(subcategories).where(eq(subcategories.isActive, true)).orderBy(asc(subcategories.name));
  }

  async getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]> {
    return db.select().from(subcategories)
      .where(and(eq(subcategories.categoryId, categoryId), eq(subcategories.isActive, true)))
      .orderBy(asc(subcategories.name));
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const [newSubcategory] = await db.insert(subcategories).values(subcategory).returning();
    return newSubcategory;
  }

  // Brand operations
  async getBrands(): Promise<Brand[]> {
    return db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));
  }

  // Product operations
  async getProducts(params?: {
    categoryId?: string;
    categoryIds?: string[];
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let whereConditions = [eq(products.isActive, true), eq(products.adminApproved, true)];

    // Handle multiple categoryIds or single categoryId
    if (params?.categoryIds && params.categoryIds.length > 0) {
      whereConditions.push(inArray(products.categoryId, params.categoryIds));
    } else if (params?.categoryId) {
      whereConditions.push(eq(products.categoryId, params.categoryId));
    }

    if (params?.search) {
      const searchCondition = or(
        ilike(products.name, `%${params.search}%`),
        ilike(products.description, `%${params.search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    if (params?.featured) {
      whereConditions.push(eq(products.isFeatured, true));
    }

    let query = db.select()
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(...whereConditions))
      .orderBy(desc(products.createdAt));

    if (params?.limit !== undefined) {
      query = query.limit(params.limit) as any;
    }

    if (params?.offset !== undefined) {
      query = query.offset(params.offset) as any;
    }

    const result = await query;
    return result.map(r => ({
      ...r.products,
      vendor: r.vendors || undefined
    })) as any as Product[];
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await db.select()
      .from(products)
      .leftJoin(vendors, eq(products.vendorId, vendors.id))
      .where(eq(products.id, id));

    const productWithVendor = result[0];
    if (!productWithVendor) return undefined;

    return {
      ...productWithVendor.products,
      vendor: productWithVendor.vendors ? {
        id: productWithVendor.vendors.id,
        businessName: productWithVendor.vendors.businessName,
        email: productWithVendor.vendors.email
      } : undefined
    } as any as Product;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.getProductById(id);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getVendorProducts(vendorId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.createdAt));
  }

  // Service operations
  async getServices(params?: {
    categoryId?: string;
    categoryIds?: string[];
    search?: string;
    featured?: boolean;
    availableToday?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Service[]> {
    let whereConditions = [eq(services.isActive, true), eq(services.adminApproved, true)];

    // Handle multiple categoryIds or single categoryId
    if (params?.categoryIds && params.categoryIds.length > 0) {
      whereConditions.push(inArray(services.categoryId, params.categoryIds));
    } else if (params?.categoryId) {
      whereConditions.push(eq(services.categoryId, params.categoryId));
    }

    if (params?.search) {
      const searchCondition = or(
        ilike(services.name, `%${params.search}%`),
        ilike(services.description, `%${params.search}%`)
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    if (params?.featured) {
      whereConditions.push(eq(services.isFeatured, true));
    }

    if (params?.availableToday) {
      whereConditions.push(eq(services.isAvailableToday, true));
    }

    let query = db.select()
      .from(services)
      .leftJoin(vendors, eq(services.providerId, vendors.id))
      .where(and(...whereConditions))
      .orderBy(desc(services.createdAt));

    if (params?.limit !== undefined) {
      query = query.limit(params.limit) as any;
    }

    if (params?.offset !== undefined) {
      query = query.offset(params.offset) as any;
    }

    const result = await query;
    return result.map(r => ({
      ...r.services,
      vendor: r.vendors || undefined
    })) as any as Service[];
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const result = await db.select()
      .from(services)
      .leftJoin(vendors, eq(services.providerId, vendors.id))
      .where(eq(services.id, id));

    const serviceWithVendor = result[0];
    if (!serviceWithVendor) return undefined;

    return {
      ...serviceWithVendor.services,
      vendor: serviceWithVendor.vendors ? {
        id: serviceWithVendor.vendors.id,
        businessName: serviceWithVendor.vendors.businessName,
        email: serviceWithVendor.vendors.email
      } : undefined
    } as any as Service;
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.getServiceById(id);
  }

  async getServiceBySlug(slug: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.slug, slug));
    return service;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getVendorServices(vendorId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.providerId, vendorId)).orderBy(desc(services.createdAt));
  }

  // Cart operations
  async getCartItems(userId?: string): Promise<CartItem[]> {
    const baseQuery = db.select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      serviceId: cartItems.serviceId,
      quantity: cartItems.quantity,
      price: cartItems.price,
      productNameSnapshot: cartItems.productNameSnapshot,
      vendorNameSnapshot: cartItems.vendorNameSnapshot,
      createdAt: cartItems.createdAt,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
      product: {
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        price: products.price,
        vendorId: products.vendorId,
      },
      service: {
        id: services.id,
        name: services.name,
        imageUrl: services.imageUrl,
        price: services.price,
        providerId: services.providerId,
      }
    }).from(cartItems)
      .leftJoin(users, eq(cartItems.userId, users.id))
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(services, eq(cartItems.serviceId, services.id))
      .orderBy(desc(cartItems.createdAt));

    if (userId) {
      return baseQuery.where(eq(cartItems.userId, userId)) as any;
    }

    // For admin, get all cart items
    return baseQuery as any;
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const existingItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItem.userId),
          cartItem.productId ? eq(cartItems.productId, cartItem.productId) : eq(cartItems.serviceId, cartItem.serviceId!)
        )
      );

    if (existingItem.length > 0) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: (existingItem[0].quantity ?? 0) + (cartItem.quantity || 1) })
        .where(eq(cartItems.id, existingItem[0].id))
        .returning();
      return updatedItem;
    } else {
      // Add new item
      const [newItem] = await db.insert(cartItems).values(cartItem).returning();
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async getAllOrders(): Promise<Order[]> {
    const allOrders = await db.select({
      id: orders.id,
      userId: orders.userId,
      vendorId: orders.vendorId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      deliveryAddress: orders.deliveryAddress,
      deliveryCity: orders.deliveryCity,
      deliverySuburb: orders.deliverySuburb,
      deliveryBuilding: orders.deliveryBuilding,
      deliveryPostalCode: orders.deliveryPostalCode,
      deliveryFee: orders.deliveryFee,
      courierId: orders.courierId,
      courierName: orders.courierName,
      estimatedDeliveryTime: orders.estimatedDeliveryTime,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      notes: orders.notes,
      vendorNotes: orders.vendorNotes,
      trackingNumber: orders.trackingNumber,
      internalTrackingId: orders.internalTrackingId,
      estimatedDelivery: orders.estimatedDelivery,
      vendorAcceptedAt: orders.vendorAcceptedAt,
      deliveryPickupAt: orders.deliveryPickupAt,
      orderType: orders.orderType,
      confirmationToken: orders.confirmationToken,
      confirmationStatus: orders.confirmationStatus,
      customerConfirmedAt: orders.customerConfirmedAt,
      disputeReason: orders.disputeReason,
      paymentReference: orders.paymentReference,
      publicToken: orders.publicToken,
      publicTokenCreatedAt: orders.publicTokenCreatedAt,
      publicTokenExpiresAt: orders.publicTokenExpiresAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      vendorName: vendors.businessName,
      vendorEmail: vendors.email,
      userEmail: users.email,
      userName: sql<string>`TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName}))`
    })
      .from(orders)
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    return allOrders.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount.toString()),
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
    })) as any as Order[];
  }

  async getOrders(params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Order[]> {
    let whereConditions = [];

    if (params?.status) {
      whereConditions.push(eq(orders.status, params.status));
    }
    if (params?.paymentStatus) {
      whereConditions.push(eq(orders.paymentStatus, params.paymentStatus));
    }

    let query = db.select({
      id: orders.id,
      userId: orders.userId,
      vendorId: orders.vendorId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      deliveryAddress: orders.deliveryAddress,
      deliveryCity: orders.deliveryCity,
      deliverySuburb: orders.deliverySuburb,
      deliveryBuilding: orders.deliveryBuilding,
      deliveryPostalCode: orders.deliveryPostalCode,
      deliveryFee: orders.deliveryFee,
      courierId: orders.courierId,
      courierName: orders.courierName,
      estimatedDeliveryTime: orders.estimatedDeliveryTime,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      notes: orders.notes,
      vendorNotes: orders.vendorNotes,
      trackingNumber: orders.trackingNumber,
      internalTrackingId: orders.internalTrackingId,
      estimatedDelivery: orders.estimatedDelivery,
      vendorAcceptedAt: orders.vendorAcceptedAt,
      deliveryPickupAt: orders.deliveryPickupAt,
      orderType: orders.orderType,
      confirmationToken: orders.confirmationToken,
      confirmationStatus: orders.confirmationStatus,
      customerConfirmedAt: orders.customerConfirmedAt,
      disputeReason: orders.disputeReason,
      paymentReference: orders.paymentReference,
      publicToken: orders.publicToken,
      publicTokenCreatedAt: orders.publicTokenCreatedAt,
      publicTokenExpiresAt: orders.publicTokenExpiresAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      vendorName: vendors.businessName,
      vendorEmail: vendors.email,
      userEmail: users.email,
      userName: sql<string>`TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName}))`
    })
      .from(orders)
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions)) as any;
    }
    if (params?.limit) {
      query = query.limit(params.limit) as any;
    }
    if (params?.offset) {
      query = query.offset(params.offset) as any;
    }

    const result = await query;
    return result.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount.toString()),
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
    })) as any as Order[];
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    // TEST: Converting back to clean Drizzle ORM now that schema is fixed
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    // Get order items for this order using Drizzle ORM
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      serviceId: orderItems.serviceId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      name: orderItems.name,
      appointmentDate: orderItems.appointmentDate,
      appointmentTime: orderItems.appointmentTime,
      duration: orderItems.duration,
      serviceLocation: orderItems.serviceLocation,
      notes: orderItems.notes,
      product: {
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        description: products.description,
      },
      service: {
        id: services.id,
        name: services.name,
        imageUrl: services.imageUrl,
        description: services.description,
      }
    })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .where(eq(orderItems.orderId, id));

    return {
      ...order,
      deliveryFee: order.deliveryFee?.toString() || '0',
      totalAmount: order.totalAmount.toString(),
    };
  }

  async getOrderByPaymentReference(paymentReference: string): Promise<Order | undefined> {
    try {
      // Temporary fix: Use raw SQL to bypass Drizzle ORM connection issue
      const result = await db.execute(
        sql`SELECT * FROM orders WHERE payment_reference = ${paymentReference} LIMIT 1`
      );

      if (!result.rows || result.rows.length === 0) return undefined;

      const order = result.rows[0] as any;

      return {
        ...order,
        totalAmount: parseFloat(order.total_amount?.toString() || '0'),
        deliveryFee: parseFloat(order.delivery_fee?.toString() || '0'),
      };
    } catch (error) {
      console.error('Raw SQL payment reference query error:', error);
      // Fallback to original Drizzle query
      try {
        const [order] = await db.select().from(orders).where(eq(orders.paymentReference, paymentReference));
        if (!order) return undefined;

        return {
          ...order,
          totalAmount: order.totalAmount.toString(),
          deliveryFee: order.deliveryFee?.toString() || '0',
        };
      } catch (drizzleError) {
        console.error('Drizzle payment reference query error:', drizzleError);
        return undefined;
      }
    }
  }

  async getOrderByPublicToken(token: string): Promise<Order | undefined> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.publicToken, token));
      if (!order) return undefined;

      // Check if token has expired
      if (order.publicTokenExpiresAt && new Date() > order.publicTokenExpiresAt) {
        return undefined;
      }

      return {
        ...order,
        totalAmount: order.totalAmount.toString(),
        deliveryFee: order.deliveryFee?.toString() || '0',
      };
    } catch (error) {
      console.error('Error fetching order by public token:', error);
      return undefined;
    }
  }

  async ensurePublicToken(orderId: string): Promise<string> {
    try {
      // First check if order already has a valid token
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // If token exists and hasn't expired, return it
      if (order.publicToken && (!order.publicTokenExpiresAt || new Date() < order.publicTokenExpiresAt)) {
        return order.publicToken;
      }

      // Generate new token
      const token = generatePublicToken();
      const expiresAt = getTokenExpiration();

      // Update order with new token
      await db
        .update(orders)
        .set({
          publicToken: token,
          publicTokenCreatedAt: new Date(),
          publicTokenExpiresAt: expiresAt,
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return token;
    } catch (error) {
      console.error('Error ensuring public token:', error);
      throw error;
    }
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (updates.status) {
      setTimeout(() => {
        this.triggerAutoPayoutRequest(id, updates.status!).catch(err => 
          console.error("Error in triggerAutoPayoutRequest:", err)
        );
      }, 500);
    }

    return {
      ...updatedOrder,
      paymentMethod: updatedOrder.paymentMethod || 'Unknown',
      totalAmount: updatedOrder.totalAmount.toString(),
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values({
      ...order,
      paymentStatus: order.paymentStatus || 'paid',
      paymentMethod: order.paymentMethod || 'Paystack'
    }).returning();

    return {
      ...newOrder,
      totalAmount: newOrder.totalAmount.toString(),
      deliveryFee: newOrder.deliveryFee?.toString() || '0',
    };
  }

  async createDeliveryRequest(request: InsertDeliveryRequest): Promise<DeliveryRequest> {
    const [newRequest] = await db.insert(deliveryRequests).values(request).returning();
    return newRequest;
  }

  async addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values({
      ...orderItem,
      name: orderItem.name || 'Unknown Item',
      quantity: orderItem.quantity || 1
    }).returning();

    return {
      ...newItem,
      price: newItem.price.toString()
    };
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const userOrders = await db.select({
      id: orders.id,
      userId: orders.userId,
      vendorId: orders.vendorId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      deliveryAddress: orders.deliveryAddress,
      deliveryCity: orders.deliveryCity,
      deliverySuburb: orders.deliverySuburb,
      deliveryBuilding: orders.deliveryBuilding,
      deliveryPostalCode: orders.deliveryPostalCode,
      deliveryFee: orders.deliveryFee,
      courierId: orders.courierId,
      courierName: orders.courierName,
      estimatedDeliveryTime: orders.estimatedDeliveryTime,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      notes: orders.notes,
      vendorNotes: orders.vendorNotes,
      trackingNumber: orders.trackingNumber,
      internalTrackingId: orders.internalTrackingId,
      estimatedDelivery: orders.estimatedDelivery,
      vendorAcceptedAt: orders.vendorAcceptedAt,
      deliveryPickupAt: orders.deliveryPickupAt,
      orderType: orders.orderType,
      confirmationToken: orders.confirmationToken,
      confirmationStatus: orders.confirmationStatus,
      customerConfirmedAt: orders.customerConfirmedAt,
      disputeReason: orders.disputeReason,
      paymentReference: orders.paymentReference,
      publicToken: orders.publicToken,
      publicTokenCreatedAt: orders.publicTokenCreatedAt,
      publicTokenExpiresAt: orders.publicTokenExpiresAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      vendorName: vendors.businessName,
      vendorEmail: vendors.email
    })
      .from(orders)
      .leftJoin(vendors, eq(orders.vendorId, vendors.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    return userOrders.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount.toString()),
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      orderItems: []
    })) as any as Order[];
  }

  async getOrdersByVendor(vendorId: string, type?: string): Promise<Order[]> {
    const vendorOrders = await db.select({
      id: orders.id,
      userId: orders.userId,
      vendorId: orders.vendorId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      deliveryAddress: orders.deliveryAddress,
      deliveryCity: orders.deliveryCity,
      deliverySuburb: orders.deliverySuburb,
      deliveryBuilding: orders.deliveryBuilding,
      deliveryPostalCode: orders.deliveryPostalCode,
      deliveryFee: orders.deliveryFee,
      courierId: orders.courierId,
      courierName: orders.courierName,
      estimatedDeliveryTime: orders.estimatedDeliveryTime,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      notes: orders.notes,
      vendorNotes: orders.vendorNotes,
      trackingNumber: orders.trackingNumber,
      internalTrackingId: orders.internalTrackingId,
      estimatedDelivery: orders.estimatedDelivery,
      vendorAcceptedAt: orders.vendorAcceptedAt,
      deliveryPickupAt: orders.deliveryPickupAt,
      orderType: orders.orderType,
      confirmationToken: orders.confirmationToken,
      confirmationStatus: orders.confirmationStatus,
      customerConfirmedAt: orders.customerConfirmedAt,
      disputeReason: orders.disputeReason,
      paymentReference: orders.paymentReference,
      publicToken: orders.publicToken,
      publicTokenCreatedAt: orders.publicTokenCreatedAt,
      publicTokenExpiresAt: orders.publicTokenExpiresAt,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userEmail: users.email,
      userName: sql<string>`TRIM(CONCAT(${users.firstName}, ' ', ${users.lastName}))`
    })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.vendorId, vendorId))
      .orderBy(desc(orders.createdAt));

    return vendorOrders.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount.toString()),
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      orderItems: []
    })) as any as Order[];
  }

  // Get vendor orders that have been delivered (fulfilled orders ready for payout)
  async getVendorDeliveredOrders(vendorId: string): Promise<Order[]> {
    const deliveredOrders = await db.select()
      .from(orders)
      .where(
        and(
          eq(orders.vendorId, vendorId),
          eq(orders.status, 'fulfilled') // Look for fulfilled orders (ready for payout)
        )
      )
      .orderBy(desc(orders.updatedAt));

    return deliveredOrders.map(order => ({
      ...order,
      totalAmount: parseFloat(order.totalAmount.toString()),
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
    })) as any as Order[];
  }

  // Removed duplicate getOrderById method - using the enhanced one above

  async getOrderWithItems(id: string): Promise<(Order & { orderItems: OrderItem[] }) | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        orderItems: true,
      },
    });
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    setTimeout(() => {
      this.triggerAutoPayoutRequest(id, status).catch(err => 
        console.error("Error in triggerAutoPayoutRequest:", err)
      );
    }, 500);

    return updatedOrder;
  }

  async cancelOrder(id: string): Promise<Order> {
    const [cancelledOrder] = await db
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return cancelledOrder;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      serviceId: orderItems.serviceId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      name: orderItems.name,
      appointmentDate: orderItems.appointmentDate,
      appointmentTime: orderItems.appointmentTime,
      duration: orderItems.duration,
      serviceLocation: orderItems.serviceLocation,
      notes: orderItems.notes,
      locationCoordinates: orderItems.locationCoordinates,
      detailedInstructions: orderItems.detailedInstructions,
      vendorConfirmedQuantity: orderItems.vendorConfirmedQuantity,
      vendorConfirmedAt: orderItems.vendorConfirmedAt,
      vendorNotes: orderItems.vendorNotes,
      product: {
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl
      },
      service: {
        id: services.id,
        name: services.name,
        imageUrl: services.imageUrl
      }
    })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(services, eq(orderItems.serviceId, services.id))
      .where(eq(orderItems.orderId, orderId));

    return items.map(item => ({
      ...item,
      price: parseFloat(item.price.toString())
    })) as any as OrderItem[];
  }

  // Order tracking operations
  async addOrderTracking(tracking: InsertOrderTracking): Promise<OrderTracking> {
    const [newTracking] = await db.insert(orderTracking).values(tracking).returning();
    return newTracking;
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking[]> {
    return db.select().from(orderTracking).where(eq(orderTracking.orderId, orderId)).orderBy(desc(orderTracking.timestamp));
  }

  async generateTrackingNumber(orderId: string): Promise<string> {
    const trackingNumber = `BL${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await db
      .update(orders)
      .set({ trackingNumber, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    return trackingNumber;
  }

  // Search operations
  async searchProductsAndServices(query: string): Promise<{
    products: Product[];
    services: Service[];
  }> {
    const searchProducts = db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isActive, true),
          eq(products.adminApproved, true),
          or(
            ilike(products.name, `%${query}%`),
            ilike(products.description, `%${query}%`)
          )
        )
      )
      .limit(10);

    const searchServices = db
      .select()
      .from(services)
      .where(
        and(
          eq(services.isActive, true),
          eq(services.adminApproved, true),
          or(
            ilike(services.name, `%${query}%`),
            ilike(services.description, `%${query}%`)
          )
        )
      )
      .limit(10);

    const [productsResult, servicesResult] = await Promise.all([
      searchProducts,
      searchServices,
    ]);

    return {
      products: productsResult,
      services: servicesResult,
    };
  }

  // Admin operations
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [newAdmin] = await db.insert(admins).values(admin).returning();
    return newAdmin;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin;
  }

  async getAllUsers(params?: { search?: string; limit?: number; offset?: number }): Promise<User[]> {
    let query: any = db.select().from(users);

    if (params?.search) {
      const searchTerm = `%${params.search}%`;
      query = query.where(
        sql`${users.email} ILIKE ${searchTerm} OR ${users.firstName} ILIKE ${searchTerm} OR ${users.lastName} ILIKE ${searchTerm}`
      );
    }

    query = query.orderBy(desc(users.createdAt));

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.offset(params.offset);
    }

    return await query;
  }

  async getAllVendors(params?: { search?: string; verified?: boolean; limit?: number; offset?: number }): Promise<Vendor[]> {
    let query: any = db.select().from(vendors);

    const conditions = [];

    if (params?.search) {
      const searchTerm = `%${params.search}%`;
      conditions.push(
        or(
          ilike(vendors.email, searchTerm),
          ilike(vendors.businessName, searchTerm),
          ilike(vendors.contactName, searchTerm)
        )
      );
    }

    if (params?.verified !== undefined) {
      // Map old boolean verified to new verificationStatus
      const status = params.verified ? 'verified' : 'pending';
      conditions.push(eq(vendors.verificationStatus, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(vendors.createdAt));

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.offset(params.offset);
    }

    return await query;
  }

  // Vendor Applications methods for admin portal
  async getVendorApplications(filters: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Vendor[]> {
    let query: any = db.select().from(vendors);

    // Apply filters
    if (filters.status) {
      query = query.where(eq(vendors.verificationStatus, filters.status));
    }

    if (filters.search) {
      query = query.where(
        or(
          ilike(vendors.businessName, `%${filters.search}%`),
          ilike(vendors.email, `%${filters.search}%`),
          ilike(vendors.contactEmail, `%${filters.search}%`)
        )
      );
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    return await query.orderBy(desc(vendors.createdAt));
  }

  async getVendorApplicationById(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async approveVendorApplication(applicationId: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: 'admin',
        updatedAt: new Date()
      })
      .where(eq(vendors.id, applicationId))
      .returning();
    return vendor;
  }

  async rejectVendorApplication(applicationId: string, reason?: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({
        verificationStatus: 'rejected',
        verificationNotes: reason,
        updatedAt: new Date()
      })
      .where(eq(vendors.id, applicationId))
      .returning();
    return vendor;
  }

  // Appointment operations
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(appointmentData)
      .returning();

    return appointment;
  }

  async updateAppointmentStatus(appointmentId: string, status: string, vendorNotes?: string): Promise<Appointment | undefined> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (vendorNotes) {
      updateData.vendorNotes = vendorNotes;
    }

    const [appointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, appointmentId))
      .returning();

    // Sync appointment status to corresponding order
    if (appointment && appointment.orderId) {
      let orderStatus = status;

      // Map appointment status to order status
      switch (status) {
        case 'pending_acceptance':
          orderStatus = 'pending_acceptance';
          break;
        case 'accepted':
          orderStatus = 'vendor_accepted';
          break;
        case 'starting_job':
          orderStatus = 'vendor_accepted';
          break;
        case 'in_progress':
          orderStatus = 'doing';
          break;
        case 'delayed':
          orderStatus = 'doing';
          break;
        case 'almost_done':
          orderStatus = 'doing';
          break;
        case 'completed':
          orderStatus = 'completed';
          break;
        case 'declined':
          orderStatus = 'cancelled';
          break;
        case 'cancelled':
          orderStatus = 'cancelled';
          break;
        default:
          orderStatus = status;
      }

      // Update the corresponding order status
      await this.updateOrder(appointment.orderId, {
        status: orderStatus,
        vendorNotes: vendorNotes || undefined
      });

      // Add order tracking for the status change
      await this.addOrderTracking({
        orderId: appointment.orderId,
        status: this.formatStatusForTracking(status),
        description: vendorNotes || this.getStatusDescription(status),
        location: 'Service Location',
      });
    }

    return appointment;
  }

  // Helper method to format status for tracking
  private formatStatusForTracking(status: string): string {
    switch (status) {
      case 'pending_acceptance':
        return 'Pending Acceptance';
      case 'accepted':
        return 'Service Accepted';
      case 'starting_job':
        return 'Starting Service';
      case 'in_progress':
        return 'Service In Progress';
      case 'delayed':
        return 'Service Delayed';
      case 'almost_done':
        return 'Service Almost Complete';
      case 'completed':
        return 'Service Completed';
      case 'declined':
        return 'Service Declined';
      case 'cancelled':
        return 'Service Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  }

  // Helper method to get default status description
  private getStatusDescription(status: string): string {
    switch (status) {
      case 'pending_acceptance':
        return 'Service booking is awaiting vendor acceptance.';
      case 'accepted':
        return 'Vendor has accepted the service booking.';
      case 'starting_job':
        return 'Vendor is preparing to start the service.';
      case 'in_progress':
        return 'Service is currently being performed.';
      case 'delayed':
        return 'Service has been delayed but will be completed.';
      case 'almost_done':
        return 'Service is almost complete.';
      case 'completed':
        return 'Service has been completed successfully.';
      case 'declined':
        return 'Vendor has declined this service booking.';
      case 'cancelled':
        return 'Service booking has been cancelled.';
      default:
        return `Service status updated to ${status}.`;
    }
  }

  async getVendorAppointments(vendorId: string): Promise<Appointment[]> {
    return db.select().from(appointments).where(eq(appointments.vendorId, vendorId));
  }

  async getCustomerAppointments(customerId: string): Promise<Appointment[]> {
    return db.select().from(appointments).where(eq(appointments.customerId, customerId)).orderBy(desc(appointments.bookingDate));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments);
  }



  async updateSubcategory(id: string, subcategory: Partial<InsertSubcategory>): Promise<Subcategory | undefined> {
    const [updatedSubcategory] = await db
      .update(subcategories)
      .set(subcategory)
      .where(eq(subcategories.id, id))
      .returning();
    return updatedSubcategory;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const result = await db.delete(subcategories).where(eq(subcategories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllBrands(): Promise<Brand[]> {
    return await db.select().from(brands).orderBy(asc(brands.name));
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const [newBrand] = await db.insert(brands).values(brand).returning();
    return newBrand;
  }

  async updateBrand(id: string, brand: Partial<InsertBrand>): Promise<Brand | undefined> {
    const [updatedBrand] = await db
      .update(brands)
      .set(brand)
      .where(eq(brands.id, id))
      .returning();
    return updatedBrand;
  }

  async deleteBrand(id: string): Promise<boolean> {
    const result = await db.delete(brands).where(eq(brands.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllProductAttributes(): Promise<ProductAttribute[]> {
    return await db.select().from(productAttributes).orderBy(asc(productAttributes.displayOrder));
  }

  async getAttributesByCategory(categoryId: string): Promise<ProductAttribute[]> {
    return await db
      .select()
      .from(productAttributes)
      .where(eq(productAttributes.categoryId, categoryId))
      .orderBy(asc(productAttributes.displayOrder));
  }

  async getAttributesBySubcategory(subcategoryId: string): Promise<ProductAttribute[]> {
    return await db
      .select()
      .from(productAttributes)
      .where(eq(productAttributes.subcategoryId, subcategoryId))
      .orderBy(asc(productAttributes.displayOrder));
  }

  async createProductAttribute(attribute: InsertProductAttribute): Promise<ProductAttribute> {
    const [newAttribute] = await db.insert(productAttributes).values(attribute).returning();
    return newAttribute;
  }

  async updateProductAttribute(id: string, attribute: Partial<InsertProductAttribute>): Promise<ProductAttribute | undefined> {
    const [updatedAttribute] = await db
      .update(productAttributes)
      .set(attribute)
      .where(eq(productAttributes.id, id))
      .returning();
    return updatedAttribute;
  }

  async deleteProductAttribute(id: string): Promise<boolean> {
    const result = await db.delete(productAttributes).where(eq(productAttributes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Vendor order management methods
  async getVendorOrders(vendorId: string, statuses?: string[]): Promise<Order[]> {
    try {
      // Use raw SQL query to avoid ORM field selection issues
      let query = sql`
        SELECT 
          o.id, o.user_id, o.vendor_id, o.status, o.total_amount, o.delivery_address,
          o.delivery_fee, o.payment_status, o.payment_method,
          o.notes, o.vendor_notes, o.tracking_number, o.estimated_delivery,
          o.vendor_accepted_at, o.created_at, o.updated_at,
          u.id as user_id, u.email as user_email, u.first_name, u.last_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.vendor_id = ${vendorId}
      `;

      if (statuses && statuses.length > 0) {
        query = sql`${query} AND o.status IN (${sql.join(statuses.map(s => sql`${s}`), sql`, `)})`;
      }

      query = sql`${query} ORDER BY o.created_at DESC`;

      const result = await db.execute(query);

      const orders = result.rows as any[];

      // Get order items for all orders
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const itemsResult = await db.execute(sql`
            SELECT 
              oi.id, oi.order_id, oi.product_id, oi.service_id, oi.quantity, oi.price, oi.name,
              p.id as product_id, p.name as product_name, p.image_url as product_image, p.price as product_price,
              s.id as service_id, s.name as service_name, s.image_url as service_image, s.price as service_price
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            LEFT JOIN services s ON oi.service_id = s.id
            WHERE oi.order_id = ${order.id}
          `);

          const items = itemsResult.rows.map((item: any) => ({
            id: item.id,
            orderId: item.order_id,
            productId: item.product_id,
            serviceId: item.service_id,
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            name: item.name,
            product: item.product_id ? {
              id: item.product_id,
              name: item.product_name,
              imageUrl: item.product_image,
              price: item.product_price,
            } : undefined,
            service: item.service_id ? {
              id: item.service_id,
              name: item.service_name,
              imageUrl: item.service_image,
              price: item.service_price,
            } : undefined,
          }));

          return {
            id: order.id,
            userId: order.user_id,
            vendorId: order.vendor_id,
            status: order.status,
            totalAmount: parseFloat(order.total_amount.toString()),
            deliveryAddress: order.delivery_address,
            deliveryFee: parseFloat(order.delivery_fee?.toString() || '0'),
            paymentStatus: order.payment_status || 'completed',
            paymentMethod: order.payment_method || 'Paystack',
            notes: order.notes,
            vendorNotes: order.vendor_notes,
            trackingNumber: order.tracking_number,
            estimatedDelivery: order.estimated_delivery,
            vendorAcceptedAt: order.vendor_accepted_at,
            createdAt: order.created_at,
            updatedAt: order.updated_at,
            shippingAddress: order.delivery_address || '',
            orderDate: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
            user: order.user_id ? {
              id: order.user_id,
              email: order.user_email,
              firstName: order.first_name,
              lastName: order.last_name,
            } : undefined,
            orderItems: items
          };
        })
      );

      return ordersWithItems as any as Order[];
    } catch (error) {
      console.error('Error in getVendorOrders:', error);
      throw error;
    }
  }

  async getVendorOrdersByStatus(vendorId: string, status: string): Promise<Order[]> {
    return this.getVendorOrders(vendorId, [status]);
  }

  async acceptOrder(orderId: string, vendorNotes?: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: 'vendor_accepted',
        vendorNotes: vendorNotes || null,
        vendorAcceptedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Add tracking entry
    await this.addOrderTracking({
      orderId: orderId,
      status: 'Vendor Accepted',
      description: vendorNotes ? `Vendor accepted the order: ${vendorNotes}` : 'Vendor has accepted your order and will begin processing.',
      location: 'Vendor Location',
    });

    return updatedOrder;
  }

  async updateOrderStatusByVendor(orderId: string, status: string, notes?: string): Promise<Order> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (notes) {
      updateData.vendorNotes = notes;
    }

    if (status === 'ready_for_pickup') {
      // Add delivery pickup tracking
      await this.addOrderTracking({
        orderId: orderId,
        status: 'Ready for Pickup',
        description: 'Order is packed and ready for delivery pickup.',
        location: 'Vendor Location',
      });
    } else if (status === 'passed_to_delivery') {
      updateData.deliveryPickupAt = new Date();
      await this.addOrderTracking({
        orderId: orderId,
        status: 'Passed to Delivery',
        description: 'Order has been picked up by delivery and is on the way.',
        location: 'In Transit',
      });
    } else if (status === 'completed') {
      await this.addOrderTracking({
        orderId: orderId,
        status: 'Service Completed',
        description: 'Service has been completed successfully.',
        location: 'Service Location',
      });
    } else if (status === 'doing') {
      await this.addOrderTracking({
        orderId: orderId,
        status: 'Service In Progress',
        description: 'Service is currently being performed.',
        location: 'Service Location',
      });
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    setTimeout(() => {
      this.triggerAutoPayoutRequest(orderId, status).catch(err => 
        console.error("Error in triggerAutoPayoutRequest:", err)
      );
    }, 500);

    return updatedOrder;
  }

  // New delivery workflow methods
  async processOrderDispatch(orderId: string, providerId: string, trackingId?: string): Promise<void> {
    // Update order status to awaiting_dispatch
    await this.updateOrder(orderId, {
      status: 'awaiting_dispatch',
      courierId: providerId,
      trackingNumber: trackingId
    });

    // Create delivery record
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const provider = await this.getDeliveryProviderById(providerId);
    if (!provider) throw new Error('Provider not found');

    // Calculate delivery fee (simplified)
    const deliveryFee = Number(provider.baseRate) + (Math.random() * 500); // Simplified calculation

    await this.createDelivery({
      orderId: orderId,
      providerId: providerId,
      externalTrackingId: trackingId,
      status: 'pending',
      pickupAddress: 'Vendor Address', // Should get from vendor profile
      deliveryAddress: order.deliveryAddress || 'Customer Address',
      deliveryFee: deliveryFee.toString(),
      packageDescription: `Order ${orderId}`,
      customerPhone: 'Customer Phone', // Should get from user profile
      vendorPhone: 'Vendor Phone', // Should get from vendor profile
    });

    // Add order tracking
    await this.addOrderTracking({
      orderId: orderId,
      status: 'Awaiting Dispatch',
      description: `Order assigned to ${provider.name} for delivery`,
      location: 'Processing Center',
    });
  }

  async confirmOrder(orderId: string, vendorNotes?: string): Promise<void> {
    await this.updateOrder(orderId, {
      status: 'confirmed',
      vendorAcceptedAt: new Date(),
      vendorNotes: vendorNotes
    });

    await this.addOrderTracking({
      orderId: orderId,
      status: 'Confirmed',
      description: 'Order confirmed by vendor and ready for dispatch',
      location: 'Vendor Location',
    });
  }

  async updateDeliveryStatus(deliveryId: string, status: string, description?: string, trackingId?: string, source: 'manual' | 'webhook' = 'manual'): Promise<void> {
    const { normalizeDeliveryStatus } = await import("@shared/deliveryStatuses");
    status = normalizeDeliveryStatus(status);

    const currentDelivery = await this.getDeliveryById(deliveryId);
    if (!currentDelivery) {
      throw new Error(`Delivery not found: ${deliveryId}`);
    }
    if (currentDelivery.status === status) {
      return;
    }

    const updateData: any = { status, updatedAt: new Date() };

    console.log(`📋 UpdateDeliveryStatus called:`, {
      deliveryId,
      previousStatus: currentDelivery.status,
      newStatus: status,
      source,
      timestamp: new Date().toISOString()
    });

    if (status === 'picked_up') {
      updateData.actualPickupTime = new Date();
    } else if (status === 'delivered') {
      updateData.actualDeliveryTime = new Date();
    }

    if (trackingId) {
      updateData.externalTrackingId = trackingId;
    }

    await this.updateDelivery(deliveryId, updateData);

    const verifyDelivery = await this.getDeliveryById(deliveryId);
    console.log(`✅ Status update result: ${verifyDelivery?.status || 'ERROR'}`);

    const statusDescriptions: Record<string, { orderStatus: string; trackingStatus: string; description: string; location: string; isDelivered?: boolean }> = {
      pickup_scheduled: {
        orderStatus: 'ready_for_pickup',
        trackingStatus: 'Pickup Scheduled',
        description: 'Buylock Delivery has been notified and will collect from the vendor.',
        location: 'Vendor Location',
      },
      picked_up: {
        orderStatus: 'passed_to_delivery',
        trackingStatus: 'Picked Up',
        description: 'Package picked up from the shop.',
        location: 'Vendor Location',
      },
      in_transit: {
        orderStatus: 'in_delivery',
        trackingStatus: 'In Delivery',
        description: 'Order is on the way to you.',
        location: 'En Route',
      },
      out_for_delivery: {
        orderStatus: 'out_for_delivery',
        trackingStatus: 'Out for Delivery',
        description: 'Courier has arrived at the delivery area.',
        location: 'Near Customer',
      },
      delivered: {
        orderStatus: 'delivered',
        trackingStatus: 'Delivered',
        description: 'Order has been successfully delivered.',
        location: 'Customer Address',
        isDelivered: true,
      },
    };

    const statusMeta = statusDescriptions[status];
    const updateDescription = description || statusMeta?.description || `Status updated to ${status}`;

    await this.addDeliveryUpdate({
      deliveryId: deliveryId,
      status: status,
      description: updateDescription,
      source: source,
    });

    if (statusMeta) {
      const orderUpdate: Record<string, unknown> = { status: statusMeta.orderStatus };
      if (status === 'picked_up') {
        orderUpdate.deliveryPickupAt = new Date();
      }
      await this.updateOrder(currentDelivery.orderId, orderUpdate);
      await this.addOrderTracking({
        orderId: currentDelivery.orderId,
        deliveryId: deliveryId,
        status: statusMeta.trackingStatus,
        description: updateDescription,
        location: statusMeta.location,
        isDelivered: statusMeta.isDelivered,
      });
    }
  }

  // Delivery operations implementation
  async getDeliveryProviders(): Promise<DeliveryProvider[]> {
    return await db.select().from(deliveryProviders).where(eq(deliveryProviders.isActive, true));
  }

  async getDeliveryProviderById(id: string): Promise<DeliveryProvider | undefined> {
    const [provider] = await db.select().from(deliveryProviders).where(eq(deliveryProviders.id, id));
    return provider;
  }

  async createDeliveryProvider(provider: InsertDeliveryProvider): Promise<DeliveryProvider> {
    const [newProvider] = await db.insert(deliveryProviders).values(provider).returning();
    return newProvider;
  }

  async updateDeliveryProvider(id: string, updates: Partial<InsertDeliveryProvider>): Promise<DeliveryProvider> {
    const [updatedProvider] = await db
      .update(deliveryProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deliveryProviders.id, id))
      .returning();
    return updatedProvider;
  }

  async getDeliveries(params?: {
    status?: string;
    providerId?: string;
    orderId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Delivery[]> {
    let query: any = db.select().from(deliveries);

    const conditions = [];
    if (params?.status) conditions.push(eq(deliveries.status, params.status));
    if (params?.providerId) conditions.push(eq(deliveries.providerId, params.providerId));
    if (params?.orderId) conditions.push(eq(deliveries.orderId, params.orderId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(deliveries.createdAt));

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.offset(params.offset);
    }

    return await query;
  }

  async getDeliveryById(id: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery;
  }

  async getDeliveryByOrderId(orderId: string): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId));
    return delivery;
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [newDelivery] = await db.insert(deliveries).values(delivery).returning();
    return newDelivery;
  }

  async updateDelivery(id: string, updates: Partial<InsertDelivery>): Promise<Delivery> {
    const [updatedDelivery] = await db
      .update(deliveries)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deliveries.id, id))
      .returning();
    return updatedDelivery;
  }

  async addDeliveryUpdate(update: InsertDeliveryUpdate): Promise<DeliveryUpdate> {
    const [newUpdate] = await db.insert(deliveryUpdates).values(update).returning();
    return newUpdate;
  }

  async getDeliveryUpdates(deliveryId: string): Promise<DeliveryUpdate[]> {
    return await db
      .select()
      .from(deliveryUpdates)
      .where(eq(deliveryUpdates.deliveryId, deliveryId))
      .orderBy(desc(deliveryUpdates.timestamp));
  }

  async getDeliveryAnalytics(params?: {
    providerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<DeliveryAnalytics[]> {
    let query: any = db.select().from(deliveryAnalytics);

    const conditions = [];
    if (params?.providerId) conditions.push(eq(deliveryAnalytics.providerId, params.providerId));
    if (params?.dateFrom) conditions.push(sql`${deliveryAnalytics.date} >= ${params.dateFrom}`);
    if (params?.dateTo) conditions.push(sql`${deliveryAnalytics.date} <= ${params.dateTo}`);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(deliveryAnalytics.date));
  }

  async createDeliveryAnalytics(analytics: InsertDeliveryAnalytics): Promise<DeliveryAnalytics> {
    const [newAnalytics] = await db.insert(deliveryAnalytics).values(analytics).returning();
    return newAnalytics;
  }

  async getOrdersReadyForPickup(): Promise<Order[]> {
    const result = await db.select({
      id: orders.id,
      userId: orders.userId,
      vendorId: orders.vendorId,
      status: orders.status,
      totalAmount: orders.totalAmount,
      deliveryAddress: orders.deliveryAddress,
      deliveryFee: orders.deliveryFee,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      notes: orders.notes,
      vendorNotes: orders.vendorNotes,
      trackingNumber: orders.trackingNumber,
      internalTrackingId: orders.internalTrackingId,
      estimatedDelivery: orders.estimatedDelivery,
      courierId: orders.courierId,
      courierName: orders.courierName,
      estimatedDeliveryTime: orders.estimatedDeliveryTime,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      orderType: orders.orderType,
      user: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      }
    })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.status, 'ready_for_pickup'))
      .orderBy(desc(orders.updatedAt));

    return result.map(order => ({
      ...order,
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      paymentMethod: order.paymentMethod || 'Unknown',
      totalAmount: parseFloat(order.totalAmount.toString()),
      orderItems: []
    })) as any as Order[];
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalProducts: number;
    totalServices: number;
    totalOrders: number;
    pendingVendors: number;
    totalRevenue: number;
  }> {
    // Get counts separately to avoid destructuring issues
    const usersCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const vendorsCount = await db.select({ count: sql<number>`count(*)` }).from(vendors);
    const productsCount = await db.select({ count: sql<number>`count(*)` }).from(products);
    const servicesCount = await db.select({ count: sql<number>`count(*)` }).from(services);
    const ordersCount = await db.select({ count: sql<number>`count(*)` }).from(orders);
    const pendingVendorsCount = await db.select({ count: sql<number>`count(*)` }).from(vendors).where(eq(vendors.verificationStatus, 'pending'));
    const revenueSum = await db.select({ sum: sql<number>`COALESCE(sum(total_amount), 0)` }).from(orders).where(eq(orders.status, 'delivered'));

    return {
      totalUsers: Number(usersCount[0]?.count) || 0,
      totalVendors: Number(vendorsCount[0]?.count) || 0,
      totalProducts: Number(productsCount[0]?.count) || 0,
      totalServices: Number(servicesCount[0]?.count) || 0,
      totalOrders: Number(ordersCount[0]?.count) || 0,
      pendingVendors: Number(pendingVendorsCount[0]?.count) || 0,
      totalRevenue: Number(revenueSum[0]?.sum) || 0,
    };
  }

  // Vendor Earnings and Payout Methods
  async getVendorEarningsSummary(vendorId: string): Promise<any> {
    // Calculate real-time earnings from orders
    const vendorOrders = await this.getVendorOrders(vendorId);

    const confirmedStatuses = ['customer_confirmed', 'fulfilled', 'delivered', 'completed'];
    const confirmedOrders = vendorOrders.filter(order => confirmedStatuses.includes(order.status));
    const pendingOrders = vendorOrders.filter(order =>
      ['processing', 'ready_for_pickup', 'out_for_delivery', 'shipped'].includes(order.status)
    );
    const disputedOrders = vendorOrders.filter(order => order.status === 'disputed');

    const platformFeePercentage = await this.getPlatformCommissionPercentage();
    const vendorPercentage = await this.getVendorCommissionPercentage();

    // Total earnings from all confirmed orders (vendor's cut)
    const totalEarnings = confirmedOrders.reduce((sum, order) =>
      sum + (parseFloat(order.totalAmount) * vendorPercentage / 100), 0
    );

    // Fetch all payout requests for the vendor
    const payoutRequestsList = await db.select()
      .from(payoutRequests)
      .where(eq(payoutRequests.vendorId, vendorId));

    // Payouts that have been approved or completed (paid out already)
    const totalPaidOut = payoutRequestsList
      .filter(p => p.status && ['approved', 'completed'].includes(p.status))
      .reduce((sum, payout) => sum + parseFloat(payout.requestedAmount), 0);

    // Payouts that are pending or processing
    const pendingPayoutAmount = payoutRequestsList
      .filter(p => p.status && ['pending', 'processing'].includes(p.status))
      .reduce((sum, payout) => sum + parseFloat(payout.requestedAmount), 0);

    // Available balance is the remaining cut: totalEarnings - totalPaidOut - pendingPayoutAmount
    const availableBalance = Math.max(0, totalEarnings - totalPaidOut - pendingPayoutAmount);

    const lastPayout = payoutRequestsList
      .filter(p => p.status && ['approved', 'completed'].includes(p.status))
      .sort((a, b) => new Date(b.completedAt || b.reviewedAt || 0).getTime() - new Date(a.completedAt || a.reviewedAt || 0).getTime())[0];

    return {
      totalEarnings,
      availableBalance,
      pendingBalance: pendingPayoutAmount, // pending balance in payout processing
      totalPaidOut,
      confirmedOrders: confirmedOrders.length,
      pendingOrders: pendingOrders.length,
      disputedOrders: disputedOrders.length,
      lastPayoutDate: lastPayout?.completedAt || lastPayout?.reviewedAt || null,
      lastPayoutAmount: lastPayout ? parseFloat(lastPayout.requestedAmount) : null
    };
  }

  async getVendorOrderEarnings(vendorId: string): Promise<any[]> {
    const vendorOrders = await this.getVendorOrders(vendorId);
    const orderEarnings = [];

    for (const order of vendorOrders) {
      const user = await this.getUser(order.userId);
      const orderItems = await this.getOrderItems(order.id);
      const itemsText = orderItems.map(item => `${item.name} (${item.quantity}x)`).join(', ');

      let status = 'pending';
      if (['customer_confirmed', 'fulfilled', 'delivered', 'completed'].includes(order.status)) {
        status = 'confirmed';
      } else if (order.status === 'disputed') {
        status = 'disputed';
      }

      orderEarnings.push({
        orderId: order.id,
        customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined,
        orderDate: order.createdAt,
        amount: parseFloat(order.totalAmount) * (await this.getVendorCommissionPercentage()) / 100,
        status,
        items: itemsText,
        confirmationDate: order.status === 'customer_confirmed' ? order.updatedAt : undefined
      });
    }

    return orderEarnings.sort((a, b) => new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime());
  }

  // Paystack Subaccount operations
  async updateVendorPaystackSubaccount(id: string, details: {
    paystackSubaccountId: string;
    paystackSubaccountCode: string;
    subaccountActive: boolean
  }): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({
        paystackSubaccountId: details.paystackSubaccountId,
        paystackSubaccountCode: details.paystackSubaccountCode,
        subaccountActive: details.subaccountActive
      })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  // Vendor Earnings operations
  async createVendorEarning(earning: InsertVendorEarning): Promise<VendorEarning> {
    const [newEarning] = await db.insert(vendorEarnings).values(earning).returning();
    return newEarning;
  }

  async getVendorEarnings(vendorId: string): Promise<VendorEarning[]> {
    const earnings = await db.select()
      .from(vendorEarnings)
      .where(eq(vendorEarnings.vendorId, vendorId))
      .orderBy(desc(vendorEarnings.earningDate))
      .limit(50); // Recent 50 earnings
    return earnings;
  }

  async getVendorEarningsHistory(vendorId: string): Promise<VendorEarning[]> {
    const earnings = await db.select()
      .from(vendorEarnings)
      .where(eq(vendorEarnings.vendorId, vendorId))
      .orderBy(desc(vendorEarnings.earningDate));
    return earnings;
  }

  async updateVendorBalance(vendorId: string, amount: number): Promise<void> {
    await db
      .update(vendors)
      .set({
        availableBalance: sql`COALESCE(${vendors.availableBalance}, 0) + ${amount}`,
        totalEarnings: sql`COALESCE(${vendors.totalEarnings}, 0) + ${amount}`
      })
      .where(eq(vendors.id, vendorId));
  }

  async updateVendorPendingBalance(vendorId: string, amount: number, operation: 'add' | 'subtract'): Promise<void> {
    const adjustment = operation === 'add' ? amount : -amount;
    await db
      .update(vendors)
      .set({
        pendingBalance: sql`COALESCE(${vendors.pendingBalance}, 0) + ${adjustment}`,
        availableBalance: sql`COALESCE(${vendors.availableBalance}, 0) - ${adjustment}`
      })
      .where(eq(vendors.id, vendorId));
  }

  async completeVendorPayout(vendorId: string, amount: number): Promise<void> {
    await db
      .update(vendors)
      .set({
        pendingBalance: sql`GREATEST(0, COALESCE(${vendors.pendingBalance}, 0) - ${amount})`,
        totalPaidOut: sql`COALESCE(${vendors.totalPaidOut}, 0) + ${amount}`
      })
      .where(eq(vendors.id, vendorId));
  }

  async reverseVendorPayout(vendorId: string, amount: number): Promise<void> {
    await db
      .update(vendors)
      .set({
        availableBalance: sql`COALESCE(${vendors.availableBalance}, 0) + ${amount}`,
        totalPaidOut: sql`GREATEST(0, COALESCE(${vendors.totalPaidOut}, 0) - ${amount})`
      })
      .where(eq(vendors.id, vendorId));
  }

  async markVendorEarningsPaidOut(vendorId: string, orderId: string, payoutRequestId: string): Promise<void> {
    await db
      .update(vendorEarnings)
      .set({
        status: 'paid_out',
        paidOutAt: new Date(),
        payoutRequestId
      })
      .where(and(
        eq(vendorEarnings.vendorId, vendorId),
        eq(vendorEarnings.orderId, orderId)
      ));
  }

  async updateVendorTotalPaidOut(vendorId: string, totalAmount: number): Promise<void> {
    await db
      .update(vendors)
      .set({
        totalPaidOut: totalAmount.toString()
      })
      .where(eq(vendors.id, vendorId));
  }

  // Payout Request operations
  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    const [payoutRequest] = await db.insert(payoutRequests).values(request).returning();
    return payoutRequest;
  }

  async triggerAutoPayoutRequest(orderId: string, status: string): Promise<void> {
    const completedStatuses = ['customer_confirmed', 'fulfilled', 'delivered', 'completed'];
    if (!status || !completedStatuses.includes(status.toLowerCase())) {
      return;
    }

    try {
      // Check if a payout request already exists for this order
      const existing = await db
        .select()
        .from(payoutRequests)
        .where(eq(payoutRequests.orderId, orderId))
        .limit(1);

      if (existing.length > 0) {
        return; // Already created
      }

      // Fetch order
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId)
      });

      if (!order || !order.vendorId) {
        return;
      }

      const vendorPercentage = await this.getVendorCommissionPercentage();
      const payoutAmount = parseFloat(order.totalAmount.toString()) * vendorPercentage / 100;

      // Create pending payout request
      const payoutRequest = await this.createPayoutRequest({
        vendorId: order.vendorId,
        orderId: order.id,
        requestedAmount: payoutAmount.toFixed(2),
        availableBalance: '0.00',
        status: 'pending',
        requestReason: 'Automatic payout request upon order completion.',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update vendor pending balance (reduces available balance, increases pending balance)
      await this.updateVendorPendingBalance(order.vendorId, payoutAmount, 'add');

      console.log(`[Auto Payout] Created pending payout request ${payoutRequest.id} for order ${orderId} vendor ${order.vendorId} amount ${payoutAmount.toFixed(2)}`);
    } catch (err) {
      console.error(`[Auto Payout] Failed to create auto payout request for order ${orderId}:`, err);
    }
  }

  async getPayoutRequest(id: string): Promise<PayoutRequest | undefined> {
    const [request] = await db.select().from(payoutRequests).where(eq(payoutRequests.id, id));
    return request;
  }

  async getVendorPayoutRequests(vendorId: string): Promise<PayoutRequest[]> {
    const requests = await db.select()
      .from(payoutRequests)
      .where(eq(payoutRequests.vendorId, vendorId))
      .orderBy(desc(payoutRequests.createdAt));
    return requests;
  }

  async getAllPayoutRequests(status?: string): Promise<PayoutRequest[]> {
    let query = db.select({
      id: payoutRequests.id,
      vendorId: payoutRequests.vendorId,
      orderId: payoutRequests.orderId,
      requestedAmount: payoutRequests.requestedAmount,
      availableBalance: payoutRequests.availableBalance,
      status: payoutRequests.status,
      requestReason: payoutRequests.requestReason,
      reviewedBy: payoutRequests.reviewedBy,
      reviewedAt: payoutRequests.reviewedAt,
      adminNotes: payoutRequests.adminNotes,
      paystackTransferId: payoutRequests.paystackTransferId,
      paystackTransferCode: payoutRequests.paystackTransferCode,
      transferStatus: payoutRequests.transferStatus,
      transferFailureReason: payoutRequests.transferFailureReason,
      actualPaidAmount: payoutRequests.actualPaidAmount,
      completedAt: payoutRequests.completedAt,
      failedAt: payoutRequests.failedAt,
      createdAt: payoutRequests.createdAt,
      updatedAt: payoutRequests.updatedAt,
      vendor: {
        businessName: vendors.businessName,
        contactName: vendors.contactName,
        email: vendors.email,
        bankName: vendors.bankName,
        bankCode: vendors.bankCode,
        accountNumber: vendors.accountNumber,
        accountName: vendors.accountName,
        paystackSubaccountId: vendors.paystackSubaccountId,
        paystackSubaccountCode: vendors.paystackSubaccountCode,
        subaccountActive: vendors.subaccountActive
      }
    })
      .from(payoutRequests)
      .leftJoin(vendors, eq(payoutRequests.vendorId, vendors.id));

    if (status && status !== 'all') {
      query = query.where(eq(payoutRequests.status, status)) as any;
    }

    const requests = await query.orderBy(desc(payoutRequests.createdAt));
    return requests as PayoutRequest[];
  }

  async updatePayoutRequest(id: string, updates: Partial<PayoutRequest>): Promise<PayoutRequest> {
    const [updatedRequest] = await db
      .update(payoutRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payoutRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async getPayoutRequestByTransferCode(transferCode: string): Promise<PayoutRequest | undefined> {
    const [request] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.paystackTransferCode, transferCode));
    return request;
  }

  // Platform Settings operations
  async getPlatformSettings(): Promise<PlatformSetting[]> {
    const settings = await db.select().from(platformSettings).orderBy(asc(platformSettings.settingKey));
    return settings;
  }

  async updatePlatformSetting(key: string, value: string, updatedBy?: string): Promise<PlatformSetting> {
    // Try to update existing setting
    const [updated] = await db
      .update(platformSettings)
      .set({
        settingValue: value,
        updatedBy,
        updatedAt: new Date()
      })
      .where(eq(platformSettings.settingKey, key))
      .returning();

    if (updated) {
      return updated;
    }

    // If no existing setting, create new one
    const [created] = await db
      .insert(platformSettings)
      .values({
        settingKey: key,
        settingValue: value,
        updatedBy
      })
      .returning();

    return created;
  }

  async getPlatformSetting(key: string): Promise<string | null> {
    const [setting] = await db.select()
      .from(platformSettings)
      .where(eq(platformSettings.settingKey, key))
      .limit(1);

    return setting?.settingValue || null;
  }

  async setPlatformSetting(key: string, value: string, adminId: string, description?: string): Promise<void> {
    const existing = await this.getPlatformSetting(key);

    if (existing) {
      await db.update(platformSettings)
        .set({
          settingValue: value,
          updatedBy: adminId,
          updatedAt: new Date()
        })
        .where(eq(platformSettings.settingKey, key));
    } else {
      await db.insert(platformSettings).values({
        settingKey: key,
        settingValue: value,
        description,
        updatedBy: adminId
      });
    }
  }

  async getAllPlatformSettings(): Promise<any[]> {
    return await db.select().from(platformSettings).orderBy(platformSettings.settingKey);
  }

  // Get platform commission percentage (default 20% if not set)
  async getPlatformCommissionPercentage(): Promise<number> {
    const setting = await this.getPlatformSetting('platform_commission_percentage');
    return setting ? parseFloat(setting) : 20; // Default 20%
  }

  // Get vendor percentage (100 - platform commission)
  async getVendorCommissionPercentage(): Promise<number> {
    const platformCommission = await this.getPlatformCommissionPercentage();
    return 100 - platformCommission;
  }

  // Admin product and service management methods
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.createdAt);
  }

  async updateProductApproval(id: string, approved: boolean): Promise<Product | undefined> {
    try {
      const [product] = await db
        .update(products)
        .set({ adminApproved: approved })
        .where(eq(products.id, id))
        .returning();
      return product;
    } catch (error) {
      console.error("Error updating product approval:", error);
      return undefined;
    }
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.createdAt);
  }

  async updateServiceApproval(id: string, approved: boolean): Promise<Service | undefined> {
    try {
      const [service] = await db
        .update(services)
        .set({ adminApproved: approved })
        .where(eq(services.id, id))
        .returning();
      return service;
    } catch (error) {
      console.error("Error updating service approval:", error);
      return undefined;
    }
  }

  // ── Vendor Branch Locations ──────────────────────────────────────────────────

  async getVendorLocations(vendorId: string): Promise<MerchantLocation[]> {
    const { merchantLocations } = await import("@shared/schema");
    let locations = await db
      .select()
      .from(merchantLocations)
      .where(eq(merchantLocations.vendorId, vendorId))
      .orderBy(merchantLocations.createdAt);

    if (locations.length === 0) {
      const vendor = await this.getVendorById(vendorId);
      if (vendor && vendor.businessLatitude && vendor.businessLongitude) {
        try {
          const mainBranch = await this.createVendorLocation({
            vendorId,
            branchName: "Main",
            address: vendor.locationDescription || vendor.address || "Main Shop Location",
            city: vendor.city || null,
            latitude: vendor.businessLatitude,
            longitude: vendor.businessLongitude,
            supportsDelivery: true,
            supportsPickup: true,
            isActive: true,
          });
          locations = [mainBranch];
        } catch (err) {
          console.error("Failed to auto-create Main branch location for vendor:", err);
        }
      }
    }

    return locations;
  }

  async createVendorLocation(data: InsertMerchantLocation): Promise<MerchantLocation> {
    const { merchantLocations } = await import("@shared/schema");
    const [location] = await db
      .insert(merchantLocations)
      .values(data)
      .returning();
    return location;
  }

  async updateVendorLocation(id: string, data: Partial<InsertMerchantLocation>): Promise<MerchantLocation> {
    const { merchantLocations } = await import("@shared/schema");
    const [location] = await db
      .update(merchantLocations)
      .set(data)
      .where(eq(merchantLocations.id, id))
      .returning();
    return location;
  }

  async deleteVendorLocation(id: string): Promise<void> {
    const { merchantLocations } = await import("@shared/schema");
    await db.delete(merchantLocations).where(eq(merchantLocations.id, id));
  }

  // Saved Customer Address operations
  async getAddresses(userId: string): Promise<CustomerAddress[]> {
    return await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.userId, userId))
      .orderBy(desc(customerAddresses.createdAt));
  }

  async createAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [newAddress] = await db
      .insert(customerAddresses)
      .values(address)
      .returning();
    return newAddress;
  }

  async deleteAddress(id: string): Promise<void> {
    await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
  }

  // M-Pesa Transaction operations
  async getMpesaTransaction(checkoutRequestId: string): Promise<MpesaTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestId));
    return transaction;
  }

  async getMpesaTransactionByOrderId(orderId: string): Promise<MpesaTransaction | undefined> {
    const [transaction] = await db
      .select()
      .from(mpesaTransactions)
      .where(eq(mpesaTransactions.orderId, orderId))
      .orderBy(desc(mpesaTransactions.createdAt))
      .limit(1);
    return transaction;
  }

  async createMpesaTransaction(data: InsertMpesaTransaction): Promise<MpesaTransaction> {
    const [transaction] = await db
      .insert(mpesaTransactions)
      .values(data)
      .returning();
    return transaction;
  }

  async updateMpesaTransaction(checkoutRequestId: string, updates: Partial<MpesaTransaction>): Promise<MpesaTransaction> {
    const [transaction] = await db
      .update(mpesaTransactions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestId))
      .returning();
    if (!transaction) throw new Error("Transaction not found");
    return transaction;
  }

  // Delivery Job operations
  async getDeliveryJobByOrderId(orderId: string): Promise<DeliveryJob | undefined> {
    const [job] = await db
      .select()
      .from(deliveryJobs)
      .where(eq(deliveryJobs.orderId, orderId))
      .orderBy(desc(deliveryJobs.createdAt))
      .limit(1);
    return job;
  }

  async getDeliveryJobById(id: string): Promise<DeliveryJob | undefined> {
    const [job] = await db
      .select()
      .from(deliveryJobs)
      .where(eq(deliveryJobs.id, id));
    return job || undefined;
  }

  async updateDeliveryJobStatus(id: string, status: string): Promise<DeliveryJob> {
    const [job] = await db
      .update(deliveryJobs)
      .set({ status, updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id))
      .returning();
    if (!job) throw new Error("Delivery job not found");
    return job;
  }

  async createDeliveryJob(data: InsertDeliveryJob): Promise<DeliveryJob> {
    const [job] = await db
      .insert(deliveryJobs)
      .values(data)
      .returning();
    return job;
  }

  async updateDeliveryJob(id: string, updates: Partial<DeliveryJob>): Promise<DeliveryJob> {
    const [job] = await db
      .update(deliveryJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deliveryJobs.id, id))
      .returning();
    if (!job) throw new Error("Delivery job not found");
    return job;
  }

  // User location operations
  async updateUserLocation(userId: string, latitude: string, longitude: string, isOnline: boolean): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        latitude,
        longitude,
        isOnline,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    if (!updatedUser) throw new Error("User not found");
    return updatedUser;
  }

  async getRiderLocation(riderId: string): Promise<User | undefined> {
    const [rider] = await db
      .select()
      .from(users)
      .where(eq(users.id, riderId));
    return rider;
  }
}

export const storage = new DatabaseStorage();
