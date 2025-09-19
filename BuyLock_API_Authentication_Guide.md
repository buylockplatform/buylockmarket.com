# BuyLock API Authentication Guide

## Overview
BuyLock API supports hybrid authentication methods for different types of users and platforms:
- **Customers**: Hybrid authentication (session cookies for browsers OR JWT tokens for mobile/API)
- **Vendors**: Header-based authentication (x-vendor-id)  
- **Admins**: Header-based authentication (x-admin-auth)

## 🔐 Authentication Methods

### 👤 Customer Authentication (Hybrid: Sessions + JWT)

**How it works**: Supports both HTTP sessions (for browsers) and JWT tokens (for mobile/API clients)

#### Option A: Session-Based Authentication (Browsers)
```bash
# Register new customer
POST /api/user/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe", 
  "phone": "+254712345678",
  "password": "password123",
  "confirmPassword": "password123"
}

# OR Login existing customer
POST /api/user/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "password123"
}
```

#### Option B: JWT Token Authentication (Mobile/API)
```bash
# Register new customer (returns JWT tokens)
POST /api/user/register
Content-Type: application/json
X-Auth-Type: token

{
  "email": "mobile@example.com",
  "firstName": "Mobile",
  "lastName": "User", 
  "phone": "+254712345678",
  "password": "password123",
  "confirmPassword": "password123"
}

# Response includes JWT tokens:
{
  "success": true,
  "message": "Account created successfully",
  "user": { ... },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "tokenType": "Bearer"
  }
}

# OR Login existing customer (returns JWT tokens)
POST /api/user/login
Content-Type: application/json
X-Auth-Type: token

{
  "email": "mobile@example.com",
  "password": "password123"
}
```

#### Step 2: Authentication Setup

**For Session Auth (Browsers):**
1. **Enable Cookie Jar**: In Postman, go to Settings → General → Enable "Automatically follow redirects" and "Send cookies with requests"
2. **No Headers Required**: Customer authentication uses cookies automatically
3. **Session Persists**: After login, all subsequent requests in the same Postman session will be authenticated

**For JWT Auth (Mobile/API):**
1. **Get Tokens**: Use login/register with `X-Auth-Type: token` header
2. **Use Bearer Token**: Add `Authorization: Bearer {accessToken}` to all authenticated requests
3. **Token Refresh**: Use `/api/user/refresh-token` endpoint when access token expires

#### Customer Endpoints (Support Both Auth Methods)
- GET `/api/user/me` - Get profile
- PUT `/api/user/profile` - Update profile  
- PUT `/api/user/change-password` - Change password
- GET/POST/PATCH/DELETE `/api/cart/*` - Cart operations
- GET/POST/PATCH `/api/orders/*` - Order operations
- POST `/api/payments/*` - Payment operations
- POST `/api/user/refresh-token` - Refresh JWT access token (JWT only)

---

### 🏪 Vendor Authentication (Header-Based)

**How it works**: Uses `x-vendor-id` header with vendor ID

#### Step 1: Get Vendor ID
```bash
POST /api/vendor/login
Content-Type: application/json

{
  "email": "vendor@buylock.com",
  "password": "password123"
}

# Response includes vendor data:
{
  "id": "74bf6c33-7f09-4844-903d-72bff3849c95",
  "email": "vendor@buylock.com",
  "businessName": "Demo Vendor",
  ...
}
```

#### Step 2: Use Vendor ID in Headers
For all vendor endpoints, include:
```
x-vendor-id: 74bf6c33-7f09-4844-903d-72bff3849c95
```

#### Step 3: Postman Setup for Vendor Auth
1. Set environment variable `vendor_id` to the ID from login response
2. Add header to vendor requests: `x-vendor-id: {{vendor_id}}`

#### Vendor Endpoints (Require x-vendor-id Header)
- GET `/api/auth/vendor` - Check vendor auth
- GET `/api/vendor/{vendorId}/products` - Get vendor products
- POST `/api/vendor/products` - Create product
- PUT/DELETE `/api/vendor/products/{id}` - Update/delete product
- GET `/api/vendor/{vendorId}/orders` - Get vendor orders
- POST `/api/vendor/orders/{orderId}/accept` - Accept order
- All other `/api/vendor/*` endpoints

---

### 👑 Admin Authentication (Header-Based)

**How it works**: Uses `x-admin-auth` header with admin token

#### Step 1: Set Admin Token
Admin authentication is simplified for demo. Set any value as admin token:
```
x-admin-auth: admin_token_here
```

#### Step 2: Postman Setup for Admin Auth
1. Set environment variable `admin_token` to your chosen admin token
2. Add header to admin requests: `x-admin-auth: {{admin_token}}`

#### Admin Endpoints (Require x-admin-auth Header)
- GET `/api/admin/stats` - Platform statistics
- GET `/api/admin/users` - All users
- GET `/api/admin/vendors` - All vendors
- GET `/api/admin/orders` - All orders
- PUT `/api/admin/products/{id}/approval` - Approve products
- PUT `/api/admin/services/{id}/approval` - Approve services
- All other `/api/admin/*` endpoints

---

## 🌍 Public Endpoints (No Authentication)

These endpoints work without any authentication:

### Products & Services
- GET `/api/products` - Browse products
- GET `/api/products/{slug}` - Product details
- GET `/api/services` - Browse services  
- GET `/api/services/{slug}` - Service details
- GET `/api/search` - Search products/services

### Categories & Data
- GET `/api/categories` - All categories
- GET `/api/service-categories` - Service categories
- GET `/api/brands` - All brands
- GET `/api/exchange-rates` - Currency rates
- GET `/api/payments/config` - Payment config (public key)
- GET `/api/couriers` - Available couriers

### System
- GET `/api/debug/db` - Database debug info

---

## 🚀 Quick Setup Guide

### 1. Import Files to Postman
1. Import `BuyLock_API_Collection.postman_collection.json`
2. Import `BuyLock_Environment.postman_environment.json`
3. Set environment to "BuyLock Development Environment"

### 2. Test Authentication

#### For Customer Testing:

**Session Authentication:**
1. Run "Register Customer (Session)" or "Login Customer (Session)"
2. Run "Get Customer Profile" - should work without additional setup
3. All customer endpoints now work automatically with cookies

**JWT Authentication:**
1. Run "Register Customer (JWT Tokens)" or "Login Customer (JWT Tokens)"
2. Copy the `accessToken` from response
3. Set environment variable `access_token` to this value
4. Use "Authorization: Bearer {{access_token}}" header for authenticated requests
5. Use "Refresh JWT Token" when access token expires

#### For Vendor Testing:
1. Run "Login Vendor" 
2. Copy the `id` from response
3. Set environment variable `vendor_id` to this ID
4. Run "Check Vendor Auth" - should return vendor data
5. All vendor endpoints now work with the header

#### For Admin Testing:
1. Set environment variable `admin_token` to any value (e.g., "admin123")
2. Run any admin endpoint - should work with the header

### 3. Environment Variables
Update these in your Postman environment:
- `base_url`: Your API URL (default: http://localhost:5000)
- `vendor_id`: From vendor login response  
- `admin_token`: Your chosen admin token
- `customer_id`, `order_id`, `paystack_reference`: Set as needed for testing

---

## 🔧 Common Issues & Solutions

### Customer Auth Issues
- **Problem**: Getting 401 errors on customer endpoints
- **Solution**: Ensure cookies are enabled in Postman settings and you've logged in first

### Vendor Auth Issues  
- **Problem**: "Vendor authentication required" error
- **Solution**: Check that `x-vendor-id` header is set correctly with valid vendor ID

### Admin Auth Issues
- **Problem**: "Admin authentication required" error  
- **Solution**: Check that `x-admin-auth` header is set with any non-empty value

### Session Persistence
- **Problem**: Customer session expires
- **Solution**: Run login request again to refresh session

---

## 📝 Default Credentials

### Test Customer
- Create via `/api/user/register` or use any valid email/password

### Test Vendor  
- Email: `vendor@buylock.com`
- Password: `password123`
- ID: `74bf6c33-7f09-4844-903d-72bff3849c95`

### Test Admin
- Token: Any non-empty string (e.g., "admin123")

---

## 🔍 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response  
```json
{
  "message": "Error description",
  "error": "Additional error details"
}
```

### Authentication Errors
- `401`: Not authenticated (missing/invalid credentials)
- `403`: Forbidden (account not approved, insufficient permissions)
- `400`: Bad request (missing required fields)

---

This guide covers all authentication methods for the BuyLock API. For specific endpoint documentation, refer to the imported Postman collection.