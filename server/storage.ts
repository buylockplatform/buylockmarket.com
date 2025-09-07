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
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, ilike, and, or, desc, asc, sql, inArray } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  ensureUserExists(id: string, email: string, name: string): Promise<User>;

  // Vendor operations
  getAllVendors(): Promise<Vendor[]>;
  getVendorById(id: string): Promise<Vendor | undefined>;
  getVendorByEmail(email: string): Promise<Vendor | undefined>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor>;
  updateVendorBusinessDetails(id: string, details: { businessName: string; contactName: string; phone?: string; address?: string }): Promise<Vendor>;
  updateVendorBankDetails(id: string, details: { bankName: string; bankCode?: string; accountNumber: string; accountName: string }): Promise<Vendor>;

  // Paystack Subaccount operations
  updateVendorPaystackSubaccount(id: string, details: { paystackSubaccountId: string; paystackSubaccountCode: string; subaccountActive: boolean }): Promise<Vendor>;
  
  // Vendor Earnings operations
  createVendorEarning(earning: InsertVendorEarning): Promise<VendorEarning>;
  getVendorEarnings(vendorId: string): Promise<VendorEarning[]>;
  getVendorEarningsHistory(vendorId: string): Promise<VendorEarning[]>;
  updateVendorBalance(vendorId: string, amount: number): Promise<void>;
  updateVendorPendingBalance(vendorId: string, amount: number, operation: 'add' | 'subtract'): Promise<void>;
  updateVendorTotalPaidOut(vendorId: string, totalAmount: number): Promise<void>;

  // Payout Request operations
  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  getPayoutRequest(id: string): Promise<PayoutRequest | undefined>;
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
  deleteCategory(id: string): Promise<void>;

  // Subcategory operations
  getSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategoryId(categoryId: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;

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
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  // Vendor order management
  getVendorOrders(vendorId: string): Promise<Order[]>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // Vendor operations
  async getVendorById(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorByEmail(email: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.email, email));
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

  async updateVendorBusinessDetails(id: string, details: { businessName: string; contactName: string; phone?: string; address?: string }): Promise<Vendor> {
    const [vendor] = await db
      .update(vendors)
      .set({ 
        businessName: details.businessName,
        contactName: details.contactName,
        phone: details.phone,
        address: details.address,
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

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
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

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
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

    let query = db.select({
      ...products,
      vendor: vendors
    }).from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(...whereConditions))
    .orderBy(desc(products.createdAt));

    if (params?.limit !== undefined) {
      query = query.limit(params.limit) as any;
    }

    if (params?.offset !== undefined) {
      query = query.offset(params.offset) as any;
    }

    return await query;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const result = await db.select({
      ...products,
      vendor: {
        id: vendors.id,
        businessName: vendors.businessName,
        email: vendors.email
      }
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(products.id, id));
    
    const [product] = result;
    return product || undefined;
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

    let query = db.select({
      ...services,
      vendor: vendors
    }).from(services)
    .leftJoin(vendors, eq(services.providerId, vendors.id))
    .where(and(...whereConditions))
    .orderBy(desc(services.createdAt));

    if (params?.limit !== undefined) {
      query = query.limit(params.limit) as any;
    }

    if (params?.offset !== undefined) {
      query = query.offset(params.offset) as any;
    }

    return await query;
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    const result = await db.select({
      ...services,
      vendor: {
        id: vendors.id,
        businessName: vendors.businessName,
        email: vendors.email
      }
    })
    .from(services)
    .leftJoin(vendors, eq(services.providerId, vendors.id))
    .where(eq(services.id, id));
    
    const [service] = result;
    return service || undefined;
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
      },
      service: {
        id: services.id,
        name: services.name,
        imageUrl: services.imageUrl,
        price: services.price,
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
        .set({ quantity: existingItem[0].quantity + (cartItem.quantity || 1) })
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
      ...orders,
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
    }));
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
      ...orders,
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
    }));
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
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      totalAmount: parseFloat(order.totalAmount.toString()),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: items.map(item => ({
        ...item,
        price: parseFloat(item.price.toString()),
        // Add missing required fields with defaults
        locationCoordinates: null,
        detailedInstructions: null
      }))
    };
  }

  async getOrderByPaymentReference(paymentReference: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.paymentReference, paymentReference));
    if (!order) return undefined;
    
    return {
      ...order,
      totalAmount: parseFloat(order.totalAmount.toString()),
      deliveryFee: parseFloat(order.deliveryFee?.toString() || '0'),
      shippingAddress: order.deliveryAddress || '',
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
    };
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    
    return {
      ...updatedOrder,
      shippingAddress: updatedOrder.deliveryAddress || '',
      orderDate: updatedOrder.createdAt?.toISOString() || new Date().toISOString(),
      paymentMethod: updatedOrder.paymentMethod || 'Unknown',
      totalAmount: parseFloat(updatedOrder.totalAmount.toString()),
      orderItems: []
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
      totalAmount: parseFloat(newOrder.totalAmount.toString()),
      deliveryFee: parseFloat(newOrder.deliveryFee?.toString() || '0'),
      shippingAddress: newOrder.deliveryAddress || '',
      orderDate: newOrder.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
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
      price: parseFloat(newItem.price.toString())
    };
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const userOrders = await db.select({
      ...orders,
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
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
    }));
  }

  async getOrdersByVendor(vendorId: string, type?: string): Promise<Order[]> {
    const vendorOrders = await db.select({
      ...orders,
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
      orderDate: order.createdAt?.toISOString() || new Date().toISOString(),
      orderItems: []
    }));
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
    }));
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
    let query = db.select().from(users);
    
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
    let query = db.select().from(vendors);
    
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
    let query = db.select().from(vendors);
    
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
  }

  // Vendor order management methods
  async getVendorOrders(vendorId: string): Promise<Order[]> {
    try {
      // Use raw SQL query to avoid ORM field selection issues
      const result = await db.execute(sql`
        SELECT 
          o.id, o.user_id, o.vendor_id, o.status, o.total_amount, o.delivery_address,
          o.delivery_fee, o.payment_status, o.payment_method,
          o.notes, o.vendor_notes, o.tracking_number, o.estimated_delivery,
          o.vendor_accepted_at, o.created_at, o.updated_at,
          u.id as user_id, u.email as user_email, u.first_name, u.last_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.vendor_id = ${vendorId}
        ORDER BY o.created_at DESC
      `);

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

      return ordersWithItems;
    } catch (error) {
      console.error('Error in getVendorOrders:', error);
      throw error;
    }
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
    const order = await this.getOrder(orderId);
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
    const updateData: any = { status, updatedAt: new Date() };
    
    // Log the status update request
    console.log(`📋 UpdateDeliveryStatus called:`, {
      deliveryId,
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
    
    // Verify the status was actually updated
    const verifyDelivery = await this.getDeliveryById(deliveryId);
    console.log(`✅ Status update result: ${verifyDelivery?.status || 'ERROR'}`);

    // Add delivery update
    await this.addDeliveryUpdate({
      deliveryId: deliveryId,
      status: status,
      description: description || `Status updated to ${status}`,
      source: source,
    });

    // Update order status if delivery is complete
    if (status === 'delivered') {
      const delivery = await this.getDeliveryById(deliveryId);
      if (delivery) {
        await this.updateOrder(delivery.orderId, { status: 'delivered' });
        await this.addOrderTracking({
          orderId: delivery.orderId,
          deliveryId: deliveryId,
          status: 'Delivered',
          description: 'Order has been successfully delivered',
          location: 'Customer Address',
          isDelivered: true,
        });
      }
    } else if (status === 'in_transit') {
      const delivery = await this.getDeliveryById(deliveryId);
      if (delivery) {
        await this.updateOrder(delivery.orderId, { status: 'in_delivery' });
        await this.addOrderTracking({
          orderId: delivery.orderId,
          deliveryId: deliveryId,
          status: 'In Delivery',
          description: 'Order is out for delivery',
          location: 'En Route',
        });
      }
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
    let query = db.select().from(deliveries);
    
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
    let query = db.select().from(deliveryAnalytics);
    
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
    }));
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
    
    const confirmedOrders = vendorOrders.filter(order => order.status === 'customer_confirmed');
    const pendingOrders = vendorOrders.filter(order => 
      ['delivered', 'completed'].includes(order.status) && order.status !== 'customer_confirmed'
    );
    const disputedOrders = vendorOrders.filter(order => order.status === 'disputed');
    
    const platformFeePercentage = await this.getPlatformCommissionPercentage();
    const vendorPercentage = await this.getVendorCommissionPercentage();
    
    const totalEarnings = confirmedOrders.reduce((sum, order) => 
      sum + (parseFloat(order.totalAmount) * vendorPercentage / 100), 0
    );
    
    const pendingBalance = pendingOrders.reduce((sum, order) => 
      sum + (parseFloat(order.totalAmount) * vendorPercentage / 100), 0
    );
    
    // Get total payouts
    const payoutRequests = await db.select()
      .from(vendorPayoutRequests)
      .where(and(
        eq(vendorPayoutRequests.vendorId, vendorId),
        eq(vendorPayoutRequests.status, 'completed')
      ));
    
    const totalPayouts = payoutRequests.reduce((sum, payout) => 
      sum + parseFloat(payout.amount), 0
    );
    
    const availableBalance = Math.max(0, totalEarnings - totalPayouts);
    
    const lastPayout = payoutRequests
      .sort((a, b) => new Date(b.processedDate || 0).getTime() - new Date(a.processedDate || 0).getTime())[0];
    
    return {
      totalEarnings,
      availableBalance,
      pendingBalance,
      confirmedOrders: confirmedOrders.length,
      pendingOrders: pendingOrders.length,
      disputedOrders: disputedOrders.length,
      lastPayoutDate: lastPayout?.processedDate,
      lastPayoutAmount: lastPayout ? parseFloat(lastPayout.amount) : null
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
      if (order.status === 'customer_confirmed') {
        status = 'confirmed';
      } else if (order.status === 'disputed') {
        status = 'disputed';
      } else if (['delivered', 'completed'].includes(order.status)) {
        status = 'pending';
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
    
    return orderEarnings.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
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

  async updateVendorTotalPaidOut(vendorId: string, totalAmount: number): Promise<void> {
    await db
      .update(vendors)
      .set({
        totalPaidOut: totalAmount
      })
      .where(eq(vendors.id, vendorId));
  }

  // Payout Request operations
  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    const [payoutRequest] = await db.insert(payoutRequests).values(request).returning();
    return payoutRequest;
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
        accountNumber: vendors.accountNumber,
        accountName: vendors.accountName
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
}

export const storage = new DatabaseStorage();
