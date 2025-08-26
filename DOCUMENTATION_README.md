# BuyLock Platform Documentation

## Overview

BuyLock is a comprehensive multi-vendor e-commerce marketplace platform designed specifically for the Kenyan market. The platform connects buyers with vendors for both products and services, featuring location-based discovery, integrated delivery management, real-time order tracking, and seamless payment processing.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js + TypeScript  
- **Database**: PostgreSQL (Neon Serverless) + Drizzle ORM
- **Authentication**: Replit OpenID Connect (OIDC)
- **Payments**: Paystack SDK integration
- **Email**: Gmail SMTP via Nodemailer
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: Wouter

---

## Core Modules

### 1. Authentication Module (`server/replitAuth.ts`)

**Purpose**: Handles user authentication via Replit's OpenID Connect provider

**Key Features**:
- OpenID Connect integration with automatic discovery
- Session management with PostgreSQL storage
- Token refresh handling
- Multi-domain support for deployments
- Secure cookie configuration

**API Endpoints**:
- `GET /api/login` - Initiate authentication flow
- `GET /api/callback` - Handle OAuth callback
- `GET /api/logout` - Terminate user session
- `GET /api/auth/user` - Get current user info

**Authentication Flow**:
```
User → /api/login → Replit OAuth → /api/callback → Session Created → Protected Routes
```

**Security Features**:
- HTTP-only cookies with secure flags
- Session expiration and automatic refresh
- CSRF protection via session middleware
- Multi-domain cookie support

---

### 2. User Management Module (`server/storage.ts`)

**Purpose**: Core data persistence layer implementing the IStorage interface

**Key Operations**:
```typescript
interface IStorage {
  // User Management (Required for Auth)
  getUser(id: string): Promise<User | undefined>
  upsertUser(user: UpsertUser): Promise<User>
  
  // Product Catalog
  getCategories(): Promise<Category[]>
  getProducts(filters: ProductFilters): Promise<Product[]>
  getServices(filters: ServiceFilters): Promise<Service[]>
  
  // Shopping Cart
  getCartItems(userId: string): Promise<CartItem[]>
  addToCart(userId: string, item: CartItemData): Promise<CartItem>
  
  // Order Management
  createOrder(orderData: CreateOrder): Promise<Order>
  getOrders(userId: string): Promise<Order[]>
  updateOrderStatus(orderId: string, status: string): Promise<void>
}
```

**Database Integration**:
- Drizzle ORM for type-safe queries
- Automatic relationship handling
- Transaction support for complex operations
- Connection pooling via Neon

---

### 3. Product Catalog Module

#### Categories System (`shared/schema.ts` - categories table)
```sql
categories: {
  id: UUID PRIMARY KEY,
  name: VARCHAR NOT NULL,
  description: TEXT,
  image_url: VARCHAR,
  is_active: BOOLEAN DEFAULT true
}
```

#### Products Management
```sql
products: {
  id: UUID PRIMARY KEY,
  vendor_id: VARCHAR REFERENCES users(id),
  category_id: UUID REFERENCES categories(id),
  name: VARCHAR NOT NULL,
  price: DECIMAL(10,2) NOT NULL,
  currency: VARCHAR DEFAULT 'KES',
  stock_quantity: INTEGER DEFAULT 0,
  images: TEXT[] DEFAULT '{}',
  is_featured: BOOLEAN DEFAULT false,
  is_active: BOOLEAN DEFAULT true
}
```

#### Services Management
```sql
services: {
  id: UUID PRIMARY KEY,
  vendor_id: VARCHAR REFERENCES users(id),
  category_id: UUID REFERENCES categories(id),
  duration_minutes: INTEGER,
  -- Similar fields to products
}
```

**API Endpoints**:
- `GET /api/categories` - List all active categories
- `GET /api/products` - List products with filtering
- `GET /api/services` - List services with filtering
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create new product (vendor)
- `PUT /api/products/:id` - Update product (vendor)

---

### 4. Shopping Cart Module (`client/src/pages/cart.tsx`)

**Purpose**: Manages user shopping cart functionality

**Features**:
- Add/remove items from cart
- Quantity adjustment with real-time updates
- Price calculations with KES currency formatting
- Vendor grouping for multi-vendor orders
- Delivery cost integration
- Checkout flow initiation

**Key Components**:
```typescript
// Cart state management
const { data: cartItems, isLoading } = useQuery({
  queryKey: ['/api/cart'],
});

// Add to cart mutation
const addToCartMutation = useMutation({
  mutationFn: async (data) => apiRequest('/api/cart', 'POST', data),
  onSuccess: () => queryClient.invalidateQueries(['/api/cart']),
});
```

**API Integration**:
- `GET /api/cart` - Fetch user's cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:id` - Update item quantity
- `DELETE /api/cart/:id` - Remove item from cart

---

### 5. Order Management Module

#### Order Processing (`server/routes.ts` - Order endpoints)
**Purpose**: Handles the complete order lifecycle from creation to completion

**Order Status Flow**:
```
pending → confirmed → processing → packed → shipped → delivered → completed
```

**Key Features**:
- Multi-vendor order splitting
- Payment integration with Paystack
- Delivery assignment and tracking
- Real-time status updates
- Order history management

#### Order Schema
```sql
orders: {
  id: UUID PRIMARY KEY,
  user_id: VARCHAR REFERENCES users(id),
  vendor_id: VARCHAR REFERENCES users(id),
  total_amount: DECIMAL(10,2) NOT NULL,
  status: VARCHAR DEFAULT 'pending',
  delivery_address: TEXT,
  courier_id: VARCHAR,
  internal_tracking_id: VARCHAR,
  payment_reference: VARCHAR
}

order_items: {
  id: UUID PRIMARY KEY,
  order_id: UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id: UUID REFERENCES products(id),
  service_id: UUID REFERENCES services(id),
  quantity: INTEGER NOT NULL,
  price: DECIMAL(10,2) NOT NULL -- Price snapshot
}
```

**API Endpoints**:
- `POST /api/orders` - Create new order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/admin/orders` - Admin order management

---

### 6. Payment Processing Module

#### Paystack Integration (`server/routes.ts` - Payment endpoints)
**Purpose**: Secure payment processing for orders

**Payment Flow**:
```
Cart → Checkout → Payment Initialization → Paystack → Verification → Order Creation
```

**Key Features**:
- Payment initialization with order metadata
- Webhook verification for payment confirmation
- Automatic order creation on successful payment
- Payment reference tracking
- KES currency standardization

**API Endpoints**:
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/verify` - Verify payment status
- `POST /api/webhooks/paystack` - Handle payment webhooks

**Security Measures**:
- Webhook signature verification
- Payment amount validation
- Duplicate payment prevention
- Secure API key handling

---

### 7. Delivery Management Module (`server/deliveryService.ts`)

#### Courier System
**Purpose**: Manages delivery providers and shipping calculations

**Supported Couriers**:
- G4S Courier Services
- Speed AF
- Pickup Mtaani  
- Modern Minds Couriers
- Fargo Courier

#### Delivery Schema
```sql
delivery_providers: {
  id: VARCHAR PRIMARY KEY,
  name: VARCHAR NOT NULL,
  type: VARCHAR NOT NULL, -- 'courier', 'logistics', 'self'
  base_rate: DECIMAL(10,2),
  per_km_rate: DECIMAL(10,2),
  max_weight_kg: DECIMAL(5,2),
  estimated_time: VARCHAR,
  coverage_areas: TEXT[],
  contact_phone: VARCHAR,
  contact_email: VARCHAR,
  is_active: BOOLEAN DEFAULT true
}

deliveries: {
  id: UUID PRIMARY KEY,
  order_id: UUID REFERENCES orders(id),
  courier_id: VARCHAR REFERENCES delivery_providers(id),
  pickup_address: TEXT,
  delivery_address: TEXT NOT NULL,
  estimated_cost: DECIMAL(10,2),
  actual_cost: DECIMAL(10,2),
  status: VARCHAR DEFAULT 'pending',
  courier_tracking_id: VARCHAR,
  pickup_scheduled_at: TIMESTAMP,
  picked_up_at: TIMESTAMP,
  delivered_at: TIMESTAMP
}
```

**Cost Calculation Logic**:
```typescript
totalCost = (baseRate + (perKmRate * distance)) * weightMultiplier
```

**Location-Based Pricing**:
- Nairobi CBD: 3km base distance
- Westlands/Karen/Runda: 12km
- Thika/Kiambu/Machakos: 25km
- Nakuru/Mombasa: 150km

**API Endpoints**:
- `GET /api/couriers` - List active couriers
- `POST /api/couriers/calculate` - Calculate delivery cost
- `POST /api/deliveries` - Create delivery record

---

### 8. Notification System Module (`server/notificationService.ts`)

#### Email Notifications
**Purpose**: Automated email notifications for various platform events

**Gmail SMTP Configuration**:
```typescript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // buylockplatform@gmail.com
    pass: process.env.GMAIL_APP_PASSWORD
  }
});
```

**Notification Types**:
1. **Courier Pickup Notifications**
   - Sent to courier companies for order pickup
   - Professional BuyLock branding
   - Order details and customer information
   - Pickup address and contact details

2. **Order Status Updates**
   - Customer notifications for order progress
   - Vendor notifications for new orders
   - Admin alerts for system events

**Email Templates**:
- Professional HTML formatting
- BuyLock branding (#FF4605 primary color)
- Responsive design for mobile devices
- Clear call-to-action buttons

**API Integration**:
- `POST /api/notifications/courier` - Notify courier for pickup
- `POST /api/notifications/customer` - Send customer updates
- `POST /api/notifications/vendor` - Vendor notifications

---

### 9. Admin Portal Module

#### Dashboard (`client/src/pages/admin-portal/`)
**Purpose**: Platform administration and management interface

**Key Features**:
- Platform statistics and analytics
- User and vendor management
- Order oversight and intervention
- Courier configuration and monitoring
- System health monitoring

#### Sub-Modules:

##### User Management (`components/UserManagement.tsx`)
- List all platform users
- User role assignment
- Account status management
- User activity monitoring

##### Vendor Management (`components/VendorManagement.tsx`) 
- Vendor application approval
- Vendor performance metrics
- Product/service oversight
- Revenue tracking

##### Order Management (`components/OrderManagement.tsx`)
- Real-time order monitoring
- Status intervention capabilities
- Dispute resolution tools
- Refund processing

##### Delivery Portal (`components/DeliveryPortalContent.tsx`)
**Purpose**: Courier coordination and delivery management

**Features**:
- Order-courier assignment
- Pickup scheduling and notifications
- Delivery tracking and updates
- Courier performance monitoring
- Email notification triggers

**Workflow**:
```
Order Placed → Vendor Confirms → Admin Assigns Courier → Notify Courier → Pickup → Delivery
```

##### Courier Configuration (`components/CourierConfiguration.tsx`)
- Courier profile management
- Rate configuration
- Coverage area updates
- Status management (active/inactive)
- Notification method preferences

**API Endpoints**:
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/orders` - Order oversight
- `POST /api/admin/notify-courier` - Courier notifications

---

### 10. Vendor Dashboard Module (`vendor-dashboard/`)

**Purpose**: Dedicated interface for vendor business management

**Key Features**:
- Product and service management
- Order processing and fulfillment
- Inventory tracking
- Sales analytics
- Customer communication

**Sub-Modules**:
- Product catalog management
- Order fulfillment workflow  
- Sales reporting and analytics
- Customer relationship management

---

### 11. Frontend Component System

#### UI Components (`client/src/components/ui/`)
**Based on shadcn/ui + Radix UI primitives**

**Core Components**:
- `Button` - Consistent button styling
- `Card` - Content containers
- `Dialog` - Modal interfaces
- `Form` - Form handling with validation
- `Input` - Text input fields
- `Select` - Dropdown selections
- `Table` - Data presentation
- `Toast` - Notification system

#### Custom Components (`client/src/components/`)
- `ProductCard` - Product display component
- `ServiceCard` - Service presentation
- `CartItem` - Shopping cart item display
- `OrderSummary` - Order details presentation
- `CourierOption` - Delivery selection interface

#### Hooks (`client/src/hooks/`)
- `useAuth()` - Authentication state management
- `useToast()` - Notification system
- `useDebounce()` - Search optimization

---

## API Documentation

### Authentication Endpoints
```typescript
GET    /api/login              // Initiate OAuth login
GET    /api/callback           // OAuth callback handler
GET    /api/logout             // User logout
GET    /api/auth/user          // Current user info
```

### Product Catalog Endpoints
```typescript
GET    /api/categories         // List categories
GET    /api/products           // List products (with filters)
GET    /api/services           // List services (with filters)
GET    /api/products/:id       // Product details
POST   /api/products           // Create product (vendor)
PUT    /api/products/:id       // Update product (vendor)
DELETE /api/products/:id       // Delete product (vendor)
```

### Shopping & Orders Endpoints
```typescript
GET    /api/cart               // User's cart items
POST   /api/cart               // Add to cart
PUT    /api/cart/:id           // Update cart item
DELETE /api/cart/:id           // Remove from cart

POST   /api/orders             // Create order
GET    /api/orders             // User's orders
GET    /api/orders/:id         // Order details
PUT    /api/orders/:id/status  // Update order status
```

### Payment Endpoints
```typescript
POST   /api/payments/initialize  // Initialize payment
POST   /api/payments/verify      // Verify payment
POST   /api/webhooks/paystack    // Payment webhook
```

### Delivery Endpoints
```typescript
GET    /api/couriers             // List couriers
POST   /api/couriers/calculate   // Calculate delivery cost
POST   /api/deliveries           // Create delivery
GET    /api/deliveries/:id       // Delivery status
```

### Admin Endpoints
```typescript
GET    /api/admin/stats          // Platform statistics
GET    /api/admin/users          // User management
GET    /api/admin/orders         // Order management
POST   /api/admin/notify-courier // Courier notifications
```

---

## Development Guidelines

### Code Organization
```
client/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route-based page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── App.tsx           # Main application component

server/
├── db.ts                 # Database connection
├── routes.ts             # API route definitions
├── storage.ts            # Data persistence layer
├── replitAuth.ts         # Authentication middleware
├── deliveryService.ts    # Delivery management
├── notificationService.ts # Email notifications
└── index.ts              # Server entry point

shared/
└── schema.ts             # Database schema & types
```

### Naming Conventions
- **Files**: camelCase for components, kebab-case for utilities
- **Components**: PascalCase (ProductCard, UserManagement)
- **Functions**: camelCase (getUserOrders, calculateDelivery)
- **Constants**: UPPER_SNAKE_CASE (API_ENDPOINTS, DEFAULT_CURRENCY)
- **Database**: snake_case (user_id, created_at)

### TypeScript Integration
- Shared types between frontend and backend
- Strict type checking enabled
- Zod schemas for runtime validation
- Drizzle ORM for database type safety

### Error Handling
- Consistent error response format
- Frontend error boundaries
- API error logging
- User-friendly error messages

---

## Deployment & Operations

### Environment Configuration
```bash
# Core Database
DATABASE_URL=postgresql://[connection]

# Authentication
SESSION_SECRET=[secure_key]

# Email Services  
GMAIL_USER=buylockplatform@gmail.com
GMAIL_APP_PASSWORD=[app_password]

# Payment Processing
PAYSTACK_SECRET_KEY=[api_key]
PAYSTACK_PUBLIC_KEY=[public_key]

# Platform Configuration
REPLIT_DOMAINS=[deployment_domains]
```

### Monitoring & Health Checks
- Database connection monitoring
- API endpoint health checks
- Payment gateway status
- Email service connectivity
- Courier API integrations

### Performance Optimization
- Database connection pooling
- API response caching
- Image optimization
- Bundle size management
- Database query optimization

---

## Security Considerations

### Authentication Security
- OpenID Connect with PKCE
- Secure session storage in PostgreSQL  
- HTTP-only cookies with secure flags
- Automatic session cleanup

### API Security
- Request validation with Zod schemas
- SQL injection prevention via ORM
- CORS configuration for cross-origin requests
- Rate limiting on sensitive endpoints

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure payment processing via Paystack
- Personal data handling compliance
- Audit logging for sensitive operations

---

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- API endpoint testing with Jest
- Database query testing
- Utility function validation

### Integration Testing
- End-to-end order flow testing
- Payment processing validation
- Email notification verification
- Courier integration testing

### Performance Testing
- Database query performance
- API response time monitoring
- Frontend rendering optimization
- Mobile device compatibility

---

*Last Updated: January 2025*  
*Platform Version: 1.0*  
*Documentation Status: Complete*