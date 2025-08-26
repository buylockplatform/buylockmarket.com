# BuyLock Database Documentation

## Overview

The BuyLock marketplace platform uses PostgreSQL with Neon serverless hosting and Drizzle ORM for type-safe database interactions. The database is designed to support a multi-vendor e-commerce marketplace with integrated delivery management, user authentication, and comprehensive order fulfillment workflows.

## Database Configuration

- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit with `npm run db:push`
- **Connection**: Via `DATABASE_URL` environment variable
- **Session Storage**: PostgreSQL-based sessions (not in-memory)

## Core Schema Structure

### Authentication & Users

#### `sessions` Table
```sql
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
```
- **Purpose**: Server-side session storage for Replit Auth
- **Index**: IDX_session_expire on expire column
- **Critical**: Required for authentication system

#### `users` Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Authentication**: Integrated with Replit OpenID Connect
- **User Claims**: Supports email, first_name, last_name, profile_image_url
- **Upsert Logic**: Handles user updates on login via `onConflictDoUpdate`

### Product Catalog

#### `categories` Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  image_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Hierarchy**: Supports subcategories via self-referencing
- **Status**: Active/inactive categories for dynamic catalog management

#### `products` Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  stock_quantity INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Vendor Relationship**: Each product belongs to a vendor (user)
- **Pricing**: Decimal precision for accurate financial calculations
- **Currency**: Standardized to KES (Kenyan Shillings)
- **Images**: Array of image URLs
- **Featured**: For homepage product highlights

#### `services` Table
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id VARCHAR NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  duration_minutes INTEGER,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Service Booking**: Supports appointment-based services
- **Duration**: Service length in minutes for scheduling

### Shopping & Orders

#### `cart_items` Table
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Flexible Design**: Supports both products and services
- **User Session**: Tied to authenticated user sessions

#### `orders` Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id),
  vendor_id VARCHAR NOT NULL REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  status VARCHAR DEFAULT 'pending',
  delivery_address TEXT,
  delivery_phone VARCHAR,
  courier_id VARCHAR,
  internal_tracking_id VARCHAR,
  payment_reference VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Multi-Vendor**: Each order assigned to specific vendor
- **Payment Integration**: Paystack payment_reference tracking
- **Delivery**: Courier assignment and internal tracking
- **Status Flow**: pending → confirmed → processing → shipped → delivered

#### `order_items` Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  service_id UUID REFERENCES services(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'KES'
);
```
- **Order Composition**: Individual items within orders
- **Price Snapshot**: Captures price at time of order
- **Cascade Delete**: Automatically removes items when order deleted

### Delivery Management

#### `delivery_providers` Table
```sql
CREATE TABLE delivery_providers (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL, -- 'courier', 'logistics', 'self'
  logo VARCHAR,
  base_rate DECIMAL(10,2),
  per_km_rate DECIMAL(10,2),
  max_weight_kg DECIMAL(5,2),
  estimated_time VARCHAR,
  coverage_areas TEXT[],
  contact_phone VARCHAR,
  contact_email VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```
- **Multi-Courier Support**: G4S, Speed AF, Pickup Mtaani, Modern Minds Couriers
- **Rate Calculation**: Base rate + per-kilometer pricing
- **Coverage**: Array of service areas
- **Status**: Active/inactive for operational control

#### `deliveries` Table
```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  courier_id VARCHAR NOT NULL REFERENCES delivery_providers(id),
  pickup_address TEXT,
  delivery_address TEXT NOT NULL,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  status VARCHAR DEFAULT 'pending',
  courier_tracking_id VARCHAR,
  pickup_scheduled_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  delivered_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
- **Order Linking**: One delivery per order
- **Cost Tracking**: Estimated vs actual delivery costs
- **Timeline**: Scheduled pickup → pickup → delivery timestamps
- **Courier Integration**: External tracking ID support

## Key Relationships

### User-Centric Design
```
users (1) ←→ (many) products [vendor_id]
users (1) ←→ (many) services [vendor_id]
users (1) ←→ (many) cart_items [user_id]
users (1) ←→ (many) orders [user_id] (as customer)
users (1) ←→ (many) orders [vendor_id] (as vendor)
```

### Order Fulfillment Flow
```
cart_items → orders → order_items
orders (1) ←→ (1) deliveries
deliveries (many) ←→ (1) delivery_providers [courier_id]
```

### Catalog Structure
```
categories (1) ←→ (many) products
categories (1) ←→ (many) services
```

## Database Operations

### Common Queries

#### User Authentication
```typescript
// Get user by ID (from session)
const user = await db.select().from(users).where(eq(users.id, userId));

// Upsert user on login
await db.insert(users).values(userData).onConflictDoUpdate({
  target: users.id,
  set: { ...userData, updatedAt: new Date() }
});
```

#### Product Catalog
```typescript
// Featured products for homepage
const featuredProducts = await db.select().from(products)
  .where(and(eq(products.isFeatured, true), eq(products.isActive, true)))
  .limit(5);

// Products by category with vendor info
const categoryProducts = await db.select()
  .from(products)
  .leftJoin(users, eq(products.vendorId, users.id))
  .where(eq(products.categoryId, categoryId));
```

#### Cart Management
```typescript
// Add to cart
await db.insert(cartItems).values({
  userId,
  productId,
  quantity
});

// Get user's cart with product details
const cart = await db.select()
  .from(cartItems)
  .leftJoin(products, eq(cartItems.productId, products.id))
  .where(eq(cartItems.userId, userId));
```

#### Order Processing
```typescript
// Create order from cart
const [order] = await db.insert(orders).values({
  userId,
  vendorId,
  totalAmount,
  deliveryAddress,
  courierId
}).returning();

// Add order items
await db.insert(orderItems).values(cartItems.map(item => ({
  orderId: order.id,
  productId: item.productId,
  quantity: item.quantity,
  price: item.product.price
})));
```

### Courier Integration
```typescript
// Get active couriers
const couriers = await db.select()
  .from(deliveryProviders)
  .where(and(
    eq(deliveryProviders.type, 'courier'),
    eq(deliveryProviders.isActive, true)
  ));

// Create delivery record
await db.insert(deliveries).values({
  orderId,
  courierId,
  deliveryAddress,
  estimatedCost
});
```

## Migration Strategy

### Schema Changes
```bash
# Apply schema changes to development database
npm run db:push

# Generate migration files (when needed)
npx drizzle-kit generate:pg
```

### Seeding Data
```bash
# Seed delivery providers
node server/seedDeliveryProviders.cjs
```

## Performance Considerations

### Indexes
- `sessions.expire` - Session cleanup
- `products.vendor_id` - Vendor product queries
- `orders.user_id` - User order history
- `cart_items.user_id` - Cart retrieval

### Query Optimization
- Use `leftJoin` for optional relationships
- Limit results with `.limit()` for pagination
- Filter inactive records in application layer
- Use `select()` to specify needed columns only

## Security Measures

### Data Protection
- Session-based authentication via PostgreSQL store
- User data encryption in transit (HTTPS)
- Parameterized queries via Drizzle ORM (SQL injection protection)
- CORS and CSRF protection on API endpoints

### Access Control
- User isolation via `user_id` filtering
- Vendor-specific data access controls
- Admin-only operations for platform management
- API rate limiting on sensitive endpoints

## Environment Configuration

### Required Environment Variables
```bash
DATABASE_URL=postgresql://[connection_string]
SESSION_SECRET=[session_encryption_key]
GMAIL_USER=[notification_email]
GMAIL_APP_PASSWORD=[smtp_password]
PAYSTACK_SECRET_KEY=[payment_processing]
```

## Monitoring & Maintenance

### Health Checks
- Database connection status via `db` export
- Session store connectivity
- Courier API integrations
- Payment gateway connectivity

### Backup Strategy
- Neon automatic backups (point-in-time recovery)
- Schema versioning via Drizzle migrations
- Critical data export for compliance

## Development Workflow

### Local Development
1. Ensure `DATABASE_URL` points to development database
2. Run `npm run db:push` to sync schema changes
3. Seed test data as needed
4. Test API endpoints via curl or frontend

### Production Deployment
1. Schema changes applied via Drizzle migrations
2. Environment variables configured in production
3. Database connection pooling managed by Neon
4. Session cleanup via automated cron jobs

---

*Last Updated: January 2025*
*Database Version: 1.0*
*Schema Stability: Production Ready*