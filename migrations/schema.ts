import { pgTable, unique, varchar, boolean, timestamp, foreignKey, uuid, integer, numeric, text, jsonb, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("order_status", ['paid', 'ready_for_pickup', 'cancelled', 'completed'])


export const admins = pgTable("admins", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	password: varchar().notNull(),
	name: varchar().notNull(),
	role: varchar().default('admin').notNull(),
	isActive: boolean("is_active").default(true),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);

export const cartItems = pgTable("cart_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	productId: uuid("product_id"),
	serviceId: uuid("service_id"),
	quantity: integer().default(1),
	price: numeric({ precision: 10, scale:  2 }).default('0'),
	appointmentDate: timestamp("appointment_date", { mode: 'string' }),
	appointmentTime: varchar("appointment_time", { length: 10 }),
	duration: integer().default(1),
	notes: text(),
	serviceLocation: text("service_location"),
	locationCoordinates: varchar("location_coordinates"),
	detailedInstructions: text("detailed_instructions"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_items_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "cart_items_service_id_services_id_fk"
		}),
]);

export const deliveries = pgTable("deliveries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	providerId: varchar("provider_id").notNull(),
	externalTrackingId: varchar("external_tracking_id"),
	courierTrackingId: varchar("courier_tracking_id"),
	status: varchar({ length: 30 }).default('pending'),
	pickupAddress: text("pickup_address").notNull(),
	deliveryAddress: text("delivery_address").notNull(),
	estimatedPickupTime: timestamp("estimated_pickup_time", { mode: 'string' }),
	actualPickupTime: timestamp("actual_pickup_time", { mode: 'string' }),
	estimatedDeliveryTime: timestamp("estimated_delivery_time", { mode: 'string' }),
	actualDeliveryTime: timestamp("actual_delivery_time", { mode: 'string' }),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }).notNull(),
	distance: numeric({ precision: 5, scale:  2 }),
	weight: numeric({ precision: 5, scale:  2 }),
	packageDescription: text("package_description"),
	specialInstructions: text("special_instructions"),
	customerPhone: varchar("customer_phone"),
	vendorPhone: varchar("vendor_phone"),
	courierPhone: varchar("courier_phone"),
	courierName: varchar("courier_name"),
	failureReason: text("failure_reason"),
	proofOfDelivery: varchar("proof_of_delivery"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "deliveries_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [deliveryProviders.id],
			name: "deliveries_provider_id_delivery_providers_id_fk"
		}),
	unique("deliveries_order_id_unique").on(table.orderId),
]);

export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	logoUrl: varchar("logo_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("brands_slug_unique").on(table.slug),
]);

export const couriers = pgTable("couriers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	logo: varchar(),
	baseRate: varchar("base_rate").notNull(),
	perKmRate: varchar("per_km_rate").notNull(),
	maxWeight: varchar("max_weight").notNull(),
	estimatedTime: varchar("estimated_time").notNull(),
	coverage: varchar().notNull(),
	phone: varchar(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const deliveryProviders = pgTable("delivery_providers", {
	id: varchar().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar().default('courier').notNull(),
	logo: varchar(),
	apiEndpoint: varchar("api_endpoint"),
	apiKey: varchar("api_key"),
	isActive: boolean("is_active").default(true),
	notificationMethod: varchar("notification_method").default('email'),
	webhookNotificationUrl: varchar("webhook_notification_url"),
	contactEmail: varchar("contact_email"),
	contactPhone: varchar("contact_phone"),
	supportedRegions: text("supported_regions").array(),
	baseRate: numeric("base_rate", { precision: 10, scale:  2 }).default('0'),
	distanceRate: numeric("distance_rate", { precision: 10, scale:  2 }).default('0'),
	weightMultiplier: numeric("weight_multiplier", { precision: 3, scale:  2 }).default('1'),
	estimatedDeliveryTime: varchar("estimated_delivery_time").default('24-48 hours'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	imageUrl: varchar("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const deliveryAnalytics = pgTable("delivery_analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	providerId: varchar("provider_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	totalDeliveries: integer("total_deliveries").default(0),
	successfulDeliveries: integer("successful_deliveries").default(0),
	failedDeliveries: integer("failed_deliveries").default(0),
	averageDeliveryTime: integer("average_delivery_time"),
	averageDistance: numeric("average_distance", { precision: 5, scale:  2 }),
	totalRevenue: numeric("total_revenue", { precision: 10, scale:  2 }).default('0'),
}, (table) => [
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [deliveryProviders.id],
			name: "delivery_analytics_provider_id_delivery_providers_id_fk"
		}),
]);

export const appointments = pgTable("appointments", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	customerId: varchar("customer_id").notNull(),
	vendorId: varchar("vendor_id").notNull(),
	serviceId: varchar("service_id").notNull(),
	serviceName: varchar("service_name").notNull(),
	customerName: varchar("customer_name").notNull(),
	customerEmail: varchar("customer_email").notNull(),
	customerPhone: varchar("customer_phone").notNull(),
	appointmentDate: varchar("appointment_date").notNull(),
	appointmentTime: varchar("appointment_time").notNull(),
	address: varchar().notNull(),
	city: varchar().notNull(),
	state: varchar().notNull(),
	notes: varchar(),
	totalAmount: varchar("total_amount").notNull(),
	status: varchar().default('pending').notNull(),
	vendorNotes: varchar("vendor_notes"),
	orderId: uuid("order_id"),
	bookingDate: timestamp("booking_date", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [users.id],
			name: "appointments_customer_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "appointments_vendor_id_vendors_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "appointments_order_id_orders_id_fk"
		}),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id"),
	serviceId: uuid("service_id"),
	quantity: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	appointmentDate: timestamp("appointment_date", { mode: 'string' }),
	appointmentTime: varchar("appointment_time", { length: 10 }),
	duration: integer().default(1),
	notes: text(),
	serviceLocation: text("service_location"),
	locationCoordinates: varchar("location_coordinates"),
	detailedInstructions: text("detailed_instructions"),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "order_items_service_id_services_id_fk"
		}),
]);

export const emailNotifications = pgTable("email_notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	recipientEmail: varchar("recipient_email").notNull(),
	recipientType: varchar("recipient_type", { length: 20 }).notNull(),
	recipientId: varchar("recipient_id"),
	emailType: varchar("email_type", { length: 50 }).notNull(),
	subject: varchar().notNull(),
	status: varchar({ length: 20 }).default('pending'),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	failureReason: text("failure_reason"),
	relatedEntityType: varchar("related_entity_type", { length: 20 }),
	relatedEntityId: varchar("related_entity_id"),
	templateData: jsonb("template_data"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const deliveryRequests = pgTable("delivery_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	assignedCourierId: varchar("assigned_courier_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "delivery_requests_order_id_orders_id_fk"
		}),
]);

export const deliveryUpdates = pgTable("delivery_updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	deliveryId: uuid("delivery_id").notNull(),
	status: varchar({ length: 30 }).notNull(),
	description: text().notNull(),
	location: varchar(),
	coordinates: varchar(),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
	source: varchar({ length: 20 }).default('api'),
	externalEventId: varchar("external_event_id"),
}, (table) => [
	foreignKey({
			columns: [table.deliveryId],
			foreignColumns: [deliveries.id],
			name: "delivery_updates_delivery_id_deliveries_id_fk"
		}),
]);

export const orderTracking = pgTable("order_tracking", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	deliveryId: uuid("delivery_id"),
	status: varchar({ length: 30 }).notNull(),
	description: text().notNull(),
	location: varchar(),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
	isDelivered: boolean("is_delivered").default(false),
	source: varchar({ length: 20 }).default('internal'),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_tracking_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.deliveryId],
			foreignColumns: [deliveries.id],
			name: "order_tracking_delivery_id_deliveries_id_fk"
		}),
]);

export const payoutRequests = pgTable("payout_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	vendorId: varchar("vendor_id").notNull(),
	requestedAmount: numeric("requested_amount", { precision: 10, scale:  2 }).notNull(),
	availableBalance: numeric("available_balance", { precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	requestReason: text("request_reason"),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	adminNotes: text("admin_notes"),
	paystackTransferId: varchar("paystack_transfer_id"),
	paystackTransferCode: varchar("paystack_transfer_code"),
	transferStatus: varchar("transfer_status", { length: 20 }),
	transferFailureReason: text("transfer_failure_reason"),
	actualPaidAmount: numeric("actual_paid_amount", { precision: 10, scale:  2 }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	failedAt: timestamp("failed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "payout_requests_vendor_id_vendors_id_fk"
		}),
]);

export const productAttributes = pgTable("product_attributes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	options: jsonb(),
	categoryId: uuid("category_id"),
	subcategoryId: uuid("subcategory_id"),
	isRequired: boolean("is_required").default(false),
	isFilterable: boolean("is_filterable").default(false),
	displayOrder: integer("display_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "product_attributes_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.subcategoryId],
			foreignColumns: [subcategories.id],
			name: "product_attributes_subcategory_id_subcategories_id_fk"
		}),
]);

export const platformSettings = pgTable("platform_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	settingKey: varchar("setting_key", { length: 100 }).notNull(),
	settingValue: text("setting_value").notNull(),
	description: text(),
	settingType: varchar("setting_type", { length: 20 }).default('string'),
	isPublic: boolean("is_public").default(false),
	updatedBy: varchar("updated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("platform_settings_setting_key_unique").on(table.settingKey),
]);

export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	slug: varchar({ length: 200 }).notNull(),
	description: text(),
	shortDescription: varchar("short_description", { length: 500 }),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	priceType: varchar("price_type", { length: 20 }).default('fixed'),
	imageUrl: varchar("image_url"),
	imageUrls: text("image_urls").array(),
	categoryId: uuid("category_id"),
	providerId: varchar("provider_id"),
	rating: numeric({ precision: 3, scale:  2 }).default('0'),
	reviewCount: integer("review_count").default(0),
	isActive: boolean("is_active").default(true),
	isFeatured: boolean("is_featured").default(false),
	adminApproved: boolean("admin_approved").default(false),
	tags: text().array(),
	location: varchar(),
	isAvailableToday: boolean("is_available_today").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "services_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.providerId],
			foreignColumns: [users.id],
			name: "services_provider_id_users_id_fk"
		}),
	unique("services_slug_unique").on(table.slug),
]);

export const payoutHistory = pgTable("payout_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	vendorId: varchar("vendor_id").notNull(),
	payoutRequestId: uuid("payout_request_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paystackTransferId: varchar("paystack_transfer_id"),
	status: varchar({ length: 20 }).notNull(),
	transactionFee: numeric("transaction_fee", { precision: 10, scale:  2 }).default('0'),
	netAmount: numeric("net_amount", { precision: 10, scale:  2 }).notNull(),
	failureReason: text("failure_reason"),
	paystackReference: varchar("paystack_reference"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "payout_history_vendor_id_vendors_id_fk"
		}),
	foreignKey({
			columns: [table.payoutRequestId],
			foreignColumns: [payoutRequests.id],
			name: "payout_history_payout_request_id_payout_requests_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	vendorId: varchar("vendor_id").notNull(),
	status: varchar().notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	deliveryAddress: text("delivery_address").notNull(),
	deliveryFee: numeric("delivery_fee", { precision: 10, scale:  2 }),
	courierId: varchar("courier_id"),
	courierName: varchar("courier_name"),
	estimatedDeliveryTime: varchar("estimated_delivery_time"),
	paymentStatus: varchar("payment_status"),
	paymentMethod: varchar("payment_method"),
	notes: text(),
	vendorNotes: text("vendor_notes"),
	trackingNumber: varchar("tracking_number"),
	internalTrackingId: varchar("internal_tracking_id"),
	estimatedDelivery: timestamp("estimated_delivery", { mode: 'string' }),
	vendorAcceptedAt: timestamp("vendor_accepted_at", { mode: 'string' }),
	deliveryPickupAt: timestamp("delivery_pickup_at", { mode: 'string' }),
	orderType: varchar("order_type"),
	confirmationToken: varchar("confirmation_token"),
	confirmationStatus: varchar("confirmation_status"),
	customerConfirmedAt: timestamp("customer_confirmed_at", { mode: 'string' }),
	disputeReason: text("dispute_reason"),
	paymentReference: varchar("payment_reference").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "orders_vendor_id_vendors_id_fk"
		}),
	unique("orders_payment_reference_unique").on(table.paymentReference),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	slug: varchar({ length: 200 }).notNull(),
	description: text(),
	shortDescription: varchar("short_description", { length: 500 }),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	originalPrice: numeric("original_price", { precision: 10, scale:  2 }),
	imageUrl: varchar("image_url"),
	imageUrls: text("image_urls").array(),
	categoryId: uuid("category_id"),
	subcategoryId: uuid("subcategory_id"),
	brandId: uuid("brand_id"),
	vendorId: varchar("vendor_id"),
	stock: integer().default(0),
	rating: numeric({ precision: 3, scale:  2 }).default('0'),
	reviewCount: integer("review_count").default(0),
	isActive: boolean("is_active").default(true),
	isFeatured: boolean("is_featured").default(false),
	adminApproved: boolean("admin_approved").default(false),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.subcategoryId],
			foreignColumns: [subcategories.id],
			name: "products_subcategory_id_subcategories_id_fk"
		}),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "products_brand_id_brands_id_fk"
		}),
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [users.id],
			name: "products_vendor_id_users_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);

export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const vendorEarnings = pgTable("vendor_earnings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	vendorId: varchar("vendor_id").notNull(),
	orderId: uuid("order_id").notNull(),
	orderItemId: uuid("order_item_id"),
	grossAmount: numeric("gross_amount", { precision: 10, scale:  2 }).notNull(),
	platformFeePercentage: numeric("platform_fee_percentage", { precision: 5, scale:  2 }).default('20.00'),
	platformFee: numeric("platform_fee", { precision: 10, scale:  2 }).notNull(),
	netEarnings: numeric("net_earnings", { precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	earningDate: timestamp("earning_date", { mode: 'string' }).defaultNow(),
	availableDate: timestamp("available_date", { mode: 'string' }),
	paidOutAt: timestamp("paid_out_at", { mode: 'string' }),
	payoutRequestId: uuid("payout_request_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "vendor_earnings_vendor_id_vendors_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "vendor_earnings_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.orderItemId],
			foreignColumns: [orderItems.id],
			name: "vendor_earnings_order_item_id_order_items_id_fk"
		}),
	foreignKey({
			columns: [table.payoutRequestId],
			foreignColumns: [payoutRequests.id],
			name: "vendor_earnings_payout_request_id_payout_requests_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const vendors = pgTable("vendors", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	passwordHash: varchar("password_hash").notNull(),
	businessName: varchar("business_name").notNull(),
	contactEmail: varchar("contact_email").notNull(),
	contactName: varchar("contact_name").notNull(),
	phone: varchar(),
	address: varchar(),
	businessCategory: varchar("business_category").notNull(),
	description: text(),
	vendorType: varchar("vendor_type", { length: 20 }).default('registered').notNull(),
	nationalIdNumber: varchar("national_id_number").notNull(),
	taxPinNumber: varchar("tax_pin_number"),
	nationalIdUrl: varchar("national_id_url"),
	taxCertificateUrl: varchar("tax_certificate_url"),
	businessLatitude: numeric("business_latitude", { precision: 10, scale:  8 }).notNull(),
	businessLongitude: numeric("business_longitude", { precision: 11, scale:  8 }).notNull(),
	locationDescription: text("location_description").notNull(),
	bankName: varchar("bank_name"),
	bankCode: varchar("bank_code"),
	accountNumber: varchar("account_number"),
	accountName: varchar("account_name"),
	paystackSubaccountId: varchar("paystack_subaccount_id"),
	paystackSubaccountCode: varchar("paystack_subaccount_code"),
	subaccountActive: boolean("subaccount_active").default(false),
	totalEarnings: numeric("total_earnings", { precision: 12, scale:  2 }).default('0'),
	availableBalance: numeric("available_balance", { precision: 12, scale:  2 }).default('0'),
	pendingBalance: numeric("pending_balance", { precision: 12, scale:  2 }).default('0'),
	totalPaidOut: numeric("total_paid_out", { precision: 12, scale:  2 }).default('0'),
	verificationStatus: varchar("verification_status", { length: 20 }).default('pending'),
	verificationNotes: text("verification_notes"),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	verifiedBy: varchar("verified_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("vendors_email_unique").on(table.email),
]);

export const subcategories = pgTable("subcategories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	categoryId: uuid("category_id").notNull(),
	imageUrl: varchar("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "subcategories_category_id_categories_id_fk"
		}),
	unique("subcategories_slug_unique").on(table.slug),
]);
