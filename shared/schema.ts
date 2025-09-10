import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  pgEnum,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subcategories
export const subcategories = pgTable("subcategories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  categoryId: uuid("category_id").notNull().references(() => categories.id),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Brands
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  logoUrl: varchar("logo_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Attributes for filtering
export const productAttributes = pgTable("product_attributes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'text', 'number', 'boolean', 'select'
  options: jsonb("options"), // For select type attributes
  categoryId: uuid("category_id").references(() => categories.id),
  subcategoryId: uuid("subcategory_id").references(() => subcategories.id),
  isRequired: boolean("is_required").default(false),
  isFilterable: boolean("is_filterable").default(false),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  imageUrl: varchar("image_url"),
  imageUrls: text("image_urls").array(),
  categoryId: uuid("category_id").references(() => categories.id),
  subcategoryId: uuid("subcategory_id").references(() => subcategories.id),
  brandId: uuid("brand_id").references(() => brands.id),
  vendorId: varchar("vendor_id").references(() => users.id),
  stock: integer("stock").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  adminApproved: boolean("admin_approved").default(false),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services
export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  shortDescription: varchar("short_description", { length: 500 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceType: varchar("price_type", { length: 20 }).default("fixed"), // fixed, hourly, per_service
  imageUrl: varchar("image_url"),
  imageUrls: text("image_urls").array(),
  categoryId: uuid("category_id").references(() => categories.id),
  providerId: varchar("provider_id").references(() => users.id),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  adminApproved: boolean("admin_approved").default(false),
  tags: text("tags").array(),
  location: varchar("location"),
  isAvailableToday: boolean("is_available_today").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart Items
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  serviceId: uuid("service_id").references(() => services.id),
  quantity: integer("quantity").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).default("0"),
  // Service booking fields
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: varchar("appointment_time", { length: 10 }), // e.g., "14:00"
  duration: integer("duration").default(1), // hours
  notes: text("notes"),
  // Service location fields
  serviceLocation: text("service_location"), // Address where service will be performed
  locationCoordinates: varchar("location_coordinates"), // lat,lng format
  detailedInstructions: text("detailed_instructions"), // Additional instructions for service provider
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
// Simplified order status enum
export const orderStatusEnum = pgEnum("order_status", ["paid", "ready_for_pickup", "cancelled", "completed"]);

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  status: varchar("status").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  courierId: varchar("courier_id"),
  courierName: varchar("courier_name"),
  estimatedDeliveryTime: varchar("estimated_delivery_time"),
  paymentStatus: varchar("payment_status"),
  paymentMethod: varchar("payment_method"),
  notes: text("notes"),
  vendorNotes: text("vendor_notes"),
  trackingNumber: varchar("tracking_number"),
  internalTrackingId: varchar("internal_tracking_id"),
  estimatedDelivery: timestamp("estimated_delivery"),
  vendorAcceptedAt: timestamp("vendor_accepted_at"),
  deliveryPickupAt: timestamp("delivery_pickup_at"),
  orderType: varchar("order_type"),
  confirmationToken: varchar("confirmation_token"),
  confirmationStatus: varchar("confirmation_status"),
  customerConfirmedAt: timestamp("customer_confirmed_at"),
  disputeReason: text("dispute_reason"),
  paymentReference: varchar("payment_reference").notNull(), // Paystack payment reference
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("orders_payment_reference_unique").on(table.paymentReference),
]);

// Delivery Requests - Simple table for courier pickup notifications
export const deliveryRequests = pgTable("delivery_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, assigned, picked_up, delivered, cancelled
  assignedCourierId: varchar("assigned_courier_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery Providers - Supported courier services
export const deliveryProviders = pgTable("delivery_providers", {
  id: varchar("id").primaryKey(), // e.g., "g4s", "fargo_courier", "dispatch_service"
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type").notNull().default("courier"), // 'courier' | 'dispatch' | 'internal'
  logo: varchar("logo"),
  apiEndpoint: varchar("api_endpoint"),
  apiKey: varchar("api_key"),
  isActive: boolean("is_active").default(true),
  notificationMethod: varchar("notification_method").default("email"), // 'email' | 'sms' | 'webhook'
  webhookNotificationUrl: varchar("webhook_notification_url"), // URL to send notifications to courier
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  supportedRegions: text("supported_regions").array(),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).default("0"),
  distanceRate: decimal("distance_rate", { precision: 10, scale: 2 }).default("0"),
  weightMultiplier: decimal("weight_multiplier", { precision: 3, scale: 2 }).default("1"),
  estimatedDeliveryTime: varchar("estimated_delivery_time").default("24-48 hours"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deliveries - Main delivery tracking table
export const deliveries = pgTable("deliveries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull().unique(),
  providerId: varchar("provider_id").references(() => deliveryProviders.id).notNull(),
  externalTrackingId: varchar("external_tracking_id"), // Courier-provided tracking ID
  courierTrackingId: varchar("courier_tracking_id"), // Backup field for courier tracking
  status: varchar("status", { length: 30 }).default("pending"), // pending, pickup_scheduled, picked_up, in_transit, out_for_delivery, delivered, failed, cancelled
  pickupAddress: text("pickup_address").notNull(), // Vendor address
  deliveryAddress: text("delivery_address").notNull(), // Customer address
  estimatedPickupTime: timestamp("estimated_pickup_time"),
  actualPickupTime: timestamp("actual_pickup_time"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  distance: decimal("distance", { precision: 5, scale: 2 }), // in kilometers
  weight: decimal("weight", { precision: 5, scale: 2 }), // in kg
  packageDescription: text("package_description"),
  specialInstructions: text("special_instructions"),
  customerPhone: varchar("customer_phone"),
  vendorPhone: varchar("vendor_phone"),
  courierPhone: varchar("courier_phone"),
  courierName: varchar("courier_name"),
  failureReason: text("failure_reason"),
  proofOfDelivery: varchar("proof_of_delivery"), // URL to photo/signature
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Delivery Updates - Real-time status updates from couriers
export const deliveryUpdates = pgTable("delivery_updates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryId: uuid("delivery_id").references(() => deliveries.id).notNull(),
  status: varchar("status", { length: 30 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location"),
  coordinates: varchar("coordinates"), // lat,lng format
  timestamp: timestamp("timestamp").defaultNow(),
  source: varchar("source", { length: 20 }).default("api"), // api, webhook, manual
  externalEventId: varchar("external_event_id"), // For deduplication
});

// Delivery Analytics - For performance tracking
export const deliveryAnalytics = pgTable("delivery_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").references(() => deliveryProviders.id).notNull(),
  date: timestamp("date").notNull(),
  totalDeliveries: integer("total_deliveries").default(0),
  successfulDeliveries: integer("successful_deliveries").default(0),
  failedDeliveries: integer("failed_deliveries").default(0),
  averageDeliveryTime: integer("average_delivery_time"), // in minutes
  averageDistance: decimal("average_distance", { precision: 5, scale: 2 }),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0"),
});

// Order Tracking - for detailed tracking history (enhanced)
export const orderTracking = pgTable("order_tracking", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  deliveryId: uuid("delivery_id").references(() => deliveries.id),
  status: varchar("status", { length: 30 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location"),
  timestamp: timestamp("timestamp").defaultNow(),
  isDelivered: boolean("is_delivered").default(false),
  source: varchar("source", { length: 20 }).default("internal"), // internal, courier_api, webhook
});

// Order Items
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  productId: uuid("product_id").references(() => products.id),
  serviceId: uuid("service_id").references(() => services.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  // Service booking fields
  appointmentDate: timestamp("appointment_date"),
  appointmentTime: varchar("appointment_time", { length: 10 }),
  duration: integer("duration").default(1), // hours
  notes: text("notes"),
  // Service location fields
  serviceLocation: text("service_location"), // Address where service will be performed
  locationCoordinates: varchar("location_coordinates"), // lat,lng format
  detailedInstructions: text("detailed_instructions"), // Additional instructions for service provider
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  services: many(services),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  services: many(services),
  subcategories: many(subcategories),
  productAttributes: many(productAttributes),
}));

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  products: many(products),
  productAttributes: many(productAttributes),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productAttributesRelations = relations(productAttributes, ({ one }) => ({
  category: one(categories, {
    fields: [productAttributes.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [productAttributes.subcategoryId],
    references: [subcategories.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [products.subcategoryId],
    references: [subcategories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  vendor: one(users, {
    fields: [products.vendorId],
    references: [users.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  provider: one(users, {
    fields: [services.providerId],
    references: [users.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  service: one(services, {
    fields: [cartItems.serviceId],
    references: [services.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
  tracking: many(orderTracking),
  delivery: one(deliveries),
}));

export const deliveryProvidersRelations = relations(deliveryProviders, ({ many }) => ({
  deliveries: many(deliveries),
  analytics: many(deliveryAnalytics),
}));

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  provider: one(deliveryProviders, {
    fields: [deliveries.providerId],
    references: [deliveryProviders.id],
  }),
  updates: many(deliveryUpdates),
}));

export const deliveryUpdatesRelations = relations(deliveryUpdates, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryUpdates.deliveryId],
    references: [deliveries.id],
  }),
}));

export const deliveryAnalyticsRelations = relations(deliveryAnalytics, ({ one }) => ({
  provider: one(deliveryProviders, {
    fields: [deliveryAnalytics.providerId],
    references: [deliveryProviders.id],
  }),
}));

export const orderTrackingRelations = relations(orderTracking, ({ one }) => ({
  order: one(orders, {
    fields: [orderTracking.orderId],
    references: [orders.id],
  }),
  delivery: one(deliveries, {
    fields: [orderTracking.deliveryId],
    references: [deliveries.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
}));

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
}).extend({
  appointmentDate: z.string().optional().nullable().transform((val) => 
    val ? new Date(val) : null
  ),
});

// Service Booking Schema - for direct checkout
export const serviceBookingSchema = z.object({
  serviceId: z.string(),
  appointmentDate: z.string().transform((val) => new Date(val)),
  appointmentTime: z.string(),
  duration: z.number().min(1).max(12),
  notes: z.string().optional().default(""),
  serviceLocation: z.string().min(10, "Please provide a detailed address"),
  locationCoordinates: z.string().optional(),
  detailedInstructions: z.string().optional().default(""),
});

export type ServiceBookingData = z.infer<typeof serviceBookingSchema>;

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertOrderTrackingSchema = createInsertSchema(orderTracking).omit({
  id: true,
  timestamp: true,
});

export const insertDeliveryProviderSchema = createInsertSchema(deliveryProviders).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryRequestSchema = createInsertSchema(deliveryRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeliveryUpdateSchema = createInsertSchema(deliveryUpdates).omit({
  id: true,
  timestamp: true,
});

export const insertDeliveryAnalyticsSchema = createInsertSchema(deliveryAnalytics).omit({
  id: true,
});

export const insertSubcategorySchema = createInsertSchema(subcategories).omit({
  id: true,
  createdAt: true,
});

export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
  createdAt: true,
});

export const insertProductAttributeSchema = createInsertSchema(productAttributes).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Courier services table
export const couriers = pgTable("couriers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  logo: varchar("logo"),
  baseRate: varchar("base_rate").notNull(), // Base delivery fee
  perKmRate: varchar("per_km_rate").notNull(), // Rate per kilometer
  maxWeight: varchar("max_weight").notNull(), // Maximum weight in kg
  estimatedTime: varchar("estimated_time").notNull(), // Delivery time estimate
  coverage: varchar("coverage").notNull(), // Coverage area
  phone: varchar("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Courier = typeof couriers.$inferSelect;
export type InsertCourier = typeof couriers.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof insertCategorySchema._type;
export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof insertSubcategorySchema._type;
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = typeof insertBrandSchema._type;
export type ProductAttribute = typeof productAttributes.$inferSelect;
export type InsertProductAttribute = typeof insertProductAttributeSchema._type;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof insertProductSchema._type;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof insertServiceSchema._type;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderTracking = typeof orderTracking.$inferSelect;
export type DeliveryProvider = typeof deliveryProviders.$inferSelect;
export type InsertDeliveryProvider = typeof insertDeliveryProviderSchema._type;
export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof insertDeliverySchema._type;
export type DeliveryUpdate = typeof deliveryUpdates.$inferSelect;
export type InsertDeliveryUpdate = typeof insertDeliveryUpdateSchema._type;
export type DeliveryAnalytics = typeof deliveryAnalytics.$inferSelect;
export type InsertDeliveryAnalytics = typeof insertDeliveryAnalyticsSchema._type;
export type DeliveryRequest = typeof deliveryRequests.$inferSelect;
export type InsertDeliveryRequest = typeof insertDeliveryRequestSchema._type;
export type InsertCartItem = typeof insertCartItemSchema._type;
export type InsertOrder = typeof insertOrderSchema._type;
export type InsertOrderItem = typeof insertOrderItemSchema._type;
export type InsertOrderTracking = typeof insertOrderTrackingSchema._type;

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  serviceId: varchar("service_id").notNull(),
  serviceName: varchar("service_name").notNull(),
  customerName: varchar("customer_name").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  customerPhone: varchar("customer_phone").notNull(),
  appointmentDate: varchar("appointment_date").notNull(),
  appointmentTime: varchar("appointment_time").notNull(),
  address: varchar("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  notes: varchar("notes"),
  totalAmount: varchar("total_amount").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, accepted, declined, completed, cancelled
  vendorNotes: varchar("vendor_notes"),
  orderId: uuid("order_id").references(() => orders.id), // Link to related order
  bookingDate: timestamp("booking_date").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Admin storage table
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").default("admin").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertAdmin = typeof admins.$inferInsert;
export type Admin = typeof admins.$inferSelect;

// Vendor storage table for vendor authentication and business information
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  businessName: varchar("business_name").notNull(),
  contactEmail: varchar("contact_email").notNull(),
  contactName: varchar("contact_name").notNull(),
  phone: varchar("phone"),
  address: varchar("address"),
  businessCategory: varchar("business_category").notNull(),
  description: text("description"),
  
  // Vendor Type - registered or non-registered
  vendorType: varchar("vendor_type", { length: 20 }).notNull().default('registered'), // 'registered' or 'non_registered'
  
  // Identity and Tax Information (conditionally required based on vendor type)
  nationalIdNumber: varchar("national_id_number").notNull(),
  taxPinNumber: varchar("tax_pin_number"), // Only required for registered vendors
  nationalIdUrl: varchar("national_id_url"), // PDF URL for national ID document
  taxCertificateUrl: varchar("tax_certificate_url"), // PDF URL for tax certificate (only for registered vendors)
  
  // Location Information (required for proximity-based services and customer matching)
  businessLatitude: decimal("business_latitude", { precision: 10, scale: 8 }).notNull(), // Business location latitude (required)
  businessLongitude: decimal("business_longitude", { precision: 11, scale: 8 }).notNull(), // Business location longitude (required)
  locationDescription: text("location_description").notNull(), // Human-readable location description from map search
  
  // Bank Details for Paystack payouts
  bankName: varchar("bank_name"), // Bank name from Paystack supported banks
  bankCode: varchar("bank_code"), // Bank code for Paystack integration
  accountNumber: varchar("account_number"), // Bank account number
  accountName: varchar("account_name"), // Account holder name
  
  // Paystack Subaccount Integration
  paystackSubaccountId: varchar("paystack_subaccount_id"), // Paystack subaccount ID
  paystackSubaccountCode: varchar("paystack_subaccount_code"), // Paystack subaccount code (ACCT_xxxx)
  subaccountActive: boolean("subaccount_active").default(false), // Whether subaccount is active
  
  // Vendor Earnings Tracking
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0"), // Total lifetime earnings
  availableBalance: decimal("available_balance", { precision: 12, scale: 2 }).default("0"), // Available for payout
  pendingBalance: decimal("pending_balance", { precision: 12, scale: 2 }).default("0"), // Pending payout requests
  totalPaidOut: decimal("total_paid_out", { precision: 12, scale: 2 }).default("0"), // Total amount paid out
  
  verificationStatus: varchar("verification_status", { length: 20 }).default('pending'),
  verificationNotes: text("verification_notes"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertVendor = typeof vendors.$inferInsert;
export type Vendor = typeof vendors.$inferSelect;


// Vendor Earnings - Track individual sales earnings
export const vendorEarnings = pgTable("vendor_earnings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  orderItemId: uuid("order_item_id").references(() => orderItems.id),
  grossAmount: decimal("gross_amount", { precision: 10, scale: 2 }).notNull(), // Full item price
  platformFeePercentage: decimal("platform_fee_percentage", { precision: 5, scale: 2 }).default("20.00"), // Platform fee %
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(), // Calculated platform fee
  netEarnings: decimal("net_earnings", { precision: 10, scale: 2 }).notNull(), // Amount vendor earns
  status: varchar("status", { length: 20 }).default("pending"), // pending, available, paid_out
  earningDate: timestamp("earning_date").defaultNow(),
  availableDate: timestamp("available_date"), // When earnings become available for payout
  paidOutAt: timestamp("paid_out_at"), // When earnings were paid out
  payoutRequestId: uuid("payout_request_id").references(() => payoutRequests.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payout Requests - Vendor withdrawal requests
export const payoutRequests = pgTable("payout_requests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  requestedAmount: decimal("requested_amount", { precision: 10, scale: 2 }).notNull(),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }).notNull(), // Balance at time of request
  status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, processing, completed, failed
  requestReason: text("request_reason"), // Optional reason from vendor
  
  // Admin Review
  reviewedBy: varchar("reviewed_by"), // Admin user ID who reviewed
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"), // Admin review notes
  
  // Paystack Transfer Details
  paystackTransferId: varchar("paystack_transfer_id"), // Paystack transfer reference
  paystackTransferCode: varchar("paystack_transfer_code"), // Paystack transfer code
  transferStatus: varchar("transfer_status", { length: 20 }), // pending, success, failed, cancelled
  transferFailureReason: text("transfer_failure_reason"),
  
  // Completion Details
  actualPaidAmount: decimal("actual_paid_amount", { precision: 10, scale: 2 }), // Actual amount transferred
  completedAt: timestamp("completed_at"), // When transfer completed successfully
  failedAt: timestamp("failed_at"), // When transfer failed
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Settings - Configurable platform settings
export const platformSettings = pgTable("platform_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  settingType: varchar("setting_type", { length: 20 }).default("string"), // string, number, boolean, json
  isPublic: boolean("is_public").default(false), // Whether setting can be accessed by non-admins
  updatedBy: varchar("updated_by"), // Admin user ID who last updated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payout History - Detailed payout tracking
export const payoutHistory = pgTable("payout_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").references(() => vendors.id).notNull(),
  payoutRequestId: uuid("payout_request_id").references(() => payoutRequests.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paystackTransferId: varchar("paystack_transfer_id"),
  status: varchar("status", { length: 20 }).notNull(), // success, failed, cancelled
  transactionFee: decimal("transaction_fee", { precision: 10, scale: 2 }).default("0"), // Paystack transaction fee
  netAmount: decimal("net_amount", { precision: 10, scale: 2 }).notNull(), // Amount after fees
  failureReason: text("failure_reason"),
  paystackReference: varchar("paystack_reference"), // Paystack transaction reference
  createdAt: timestamp("created_at").defaultNow(),
});

// Email Notifications Log
export const emailNotifications = pgTable("email_notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientEmail: varchar("recipient_email").notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // vendor, admin, customer
  recipientId: varchar("recipient_id"), // User/Vendor ID
  emailType: varchar("email_type", { length: 50 }).notNull(), // payout_requested, payout_approved, payout_rejected, payout_completed, payout_failed
  subject: varchar("subject").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  relatedEntityType: varchar("related_entity_type", { length: 20 }), // payout_request, order, vendor
  relatedEntityId: varchar("related_entity_id"), // ID of related entity
  templateData: jsonb("template_data"), // Data used to render email template
  createdAt: timestamp("created_at").defaultNow(),
});

// Type definitions for tables
export type VendorEarning = typeof vendorEarnings.$inferSelect;
export type InsertVendorEarning = typeof vendorEarnings.$inferInsert;

export type PayoutRequest = typeof payoutRequests.$inferSelect;
export type InsertPayoutRequest = typeof payoutRequests.$inferInsert;

export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

export type PayoutHistory = typeof payoutHistory.$inferSelect;
export type InsertPayoutHistory = typeof payoutHistory.$inferInsert;

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;
export type InsertAdmin = typeof admins.$inferInsert;
