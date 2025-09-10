import { relations } from "drizzle-orm/relations";
import { users, cartItems, products, services, orders, deliveries, deliveryProviders, deliveryAnalytics, appointments, vendors, orderItems, deliveryRequests, deliveryUpdates, orderTracking, payoutRequests, categories, productAttributes, subcategories, payoutHistory, brands, vendorEarnings } from "./schema";

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	user: one(users, {
		fields: [cartItems.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	}),
	service: one(services, {
		fields: [cartItems.serviceId],
		references: [services.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	cartItems: many(cartItems),
	appointments: many(appointments),
	services: many(services),
	orders: many(orders),
	products: many(products),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	cartItems: many(cartItems),
	orderItems: many(orderItems),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	subcategory: one(subcategories, {
		fields: [products.subcategoryId],
		references: [subcategories.id]
	}),
	brand: one(brands, {
		fields: [products.brandId],
		references: [brands.id]
	}),
	user: one(users, {
		fields: [products.vendorId],
		references: [users.id]
	}),
}));

export const servicesRelations = relations(services, ({one, many}) => ({
	cartItems: many(cartItems),
	orderItems: many(orderItems),
	category: one(categories, {
		fields: [services.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [services.providerId],
		references: [users.id]
	}),
}));

export const deliveriesRelations = relations(deliveries, ({one, many}) => ({
	order: one(orders, {
		fields: [deliveries.orderId],
		references: [orders.id]
	}),
	deliveryProvider: one(deliveryProviders, {
		fields: [deliveries.providerId],
		references: [deliveryProviders.id]
	}),
	deliveryUpdates: many(deliveryUpdates),
	orderTrackings: many(orderTracking),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	deliveries: many(deliveries),
	appointments: many(appointments),
	orderItems: many(orderItems),
	deliveryRequests: many(deliveryRequests),
	orderTrackings: many(orderTracking),
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	vendor: one(vendors, {
		fields: [orders.vendorId],
		references: [vendors.id]
	}),
	vendorEarnings: many(vendorEarnings),
}));

export const deliveryProvidersRelations = relations(deliveryProviders, ({many}) => ({
	deliveries: many(deliveries),
	deliveryAnalytics: many(deliveryAnalytics),
}));

export const deliveryAnalyticsRelations = relations(deliveryAnalytics, ({one}) => ({
	deliveryProvider: one(deliveryProviders, {
		fields: [deliveryAnalytics.providerId],
		references: [deliveryProviders.id]
	}),
}));

export const appointmentsRelations = relations(appointments, ({one}) => ({
	user: one(users, {
		fields: [appointments.customerId],
		references: [users.id]
	}),
	vendor: one(vendors, {
		fields: [appointments.vendorId],
		references: [vendors.id]
	}),
	order: one(orders, {
		fields: [appointments.orderId],
		references: [orders.id]
	}),
}));

export const vendorsRelations = relations(vendors, ({many}) => ({
	appointments: many(appointments),
	payoutRequests: many(payoutRequests),
	payoutHistories: many(payoutHistory),
	orders: many(orders),
	vendorEarnings: many(vendorEarnings),
}));

export const orderItemsRelations = relations(orderItems, ({one, many}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
	service: one(services, {
		fields: [orderItems.serviceId],
		references: [services.id]
	}),
	vendorEarnings: many(vendorEarnings),
}));

export const deliveryRequestsRelations = relations(deliveryRequests, ({one}) => ({
	order: one(orders, {
		fields: [deliveryRequests.orderId],
		references: [orders.id]
	}),
}));

export const deliveryUpdatesRelations = relations(deliveryUpdates, ({one}) => ({
	delivery: one(deliveries, {
		fields: [deliveryUpdates.deliveryId],
		references: [deliveries.id]
	}),
}));

export const orderTrackingRelations = relations(orderTracking, ({one}) => ({
	order: one(orders, {
		fields: [orderTracking.orderId],
		references: [orders.id]
	}),
	delivery: one(deliveries, {
		fields: [orderTracking.deliveryId],
		references: [deliveries.id]
	}),
}));

export const payoutRequestsRelations = relations(payoutRequests, ({one, many}) => ({
	vendor: one(vendors, {
		fields: [payoutRequests.vendorId],
		references: [vendors.id]
	}),
	payoutHistories: many(payoutHistory),
	vendorEarnings: many(vendorEarnings),
}));

export const productAttributesRelations = relations(productAttributes, ({one}) => ({
	category: one(categories, {
		fields: [productAttributes.categoryId],
		references: [categories.id]
	}),
	subcategory: one(subcategories, {
		fields: [productAttributes.subcategoryId],
		references: [subcategories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	productAttributes: many(productAttributes),
	services: many(services),
	products: many(products),
	subcategories: many(subcategories),
}));

export const subcategoriesRelations = relations(subcategories, ({one, many}) => ({
	productAttributes: many(productAttributes),
	products: many(products),
	category: one(categories, {
		fields: [subcategories.categoryId],
		references: [categories.id]
	}),
}));

export const payoutHistoryRelations = relations(payoutHistory, ({one}) => ({
	vendor: one(vendors, {
		fields: [payoutHistory.vendorId],
		references: [vendors.id]
	}),
	payoutRequest: one(payoutRequests, {
		fields: [payoutHistory.payoutRequestId],
		references: [payoutRequests.id]
	}),
}));

export const brandsRelations = relations(brands, ({many}) => ({
	products: many(products),
}));

export const vendorEarningsRelations = relations(vendorEarnings, ({one}) => ({
	vendor: one(vendors, {
		fields: [vendorEarnings.vendorId],
		references: [vendors.id]
	}),
	order: one(orders, {
		fields: [vendorEarnings.orderId],
		references: [orders.id]
	}),
	orderItem: one(orderItems, {
		fields: [vendorEarnings.orderItemId],
		references: [orderItems.id]
	}),
	payoutRequest: one(payoutRequests, {
		fields: [vendorEarnings.payoutRequestId],
		references: [payoutRequests.id]
	}),
}));