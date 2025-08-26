# BuyLock Marketplace

## Overview
BuyLock is a multi-vendor e-commerce marketplace facilitating transactions for both products and services. It provides a seamless shopping experience with features like location-based discovery, integrated delivery, and real-time order tracking. Designed as the customer-facing component of a microservice ecosystem, it supports browsing, cart management, user authentication, advanced search, and a responsive design. The platform focuses on the Kenyan market, managing transactions from checkout to vendor fulfillment and integrated courier delivery.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 (TypeScript)
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **UI Components**: Radix UI with shadcn/ui
- **Styling**: Tailwind CSS (custom design tokens)
- **Build System**: Vite

### Backend
- **Runtime**: Node.js with Express.js (TypeScript)
- **Database ORM**: Drizzle ORM
- **API Design**: RESTful endpoints
- **Authentication**: Replit Auth with PostgreSQL-based session management

### Database
- **Provider**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle Kit
- **Key Tables**: Users, categories, products, services, cart items, orders, order items, sessions
- **Type Safety**: Generated TypeScript types from schema

### Authentication & Authorization
- **Provider**: Replit's OpenID Connect (OIDC)
- **Session Management**: Server-side sessions in PostgreSQL
- **Security**: HTTP-only cookies, secure flags, CSRF protection

### API
- **Structure**: RESTful API (JSON)
- **Validation**: Zod schemas
- **Error Handling**: Consistent format

### Feature Specifications
- **Search & Filtering**: Advanced search with instant filtering, category, price range, ratings, brand, and availability.
- **Cart & Checkout**: Integrated cart with vendor assignment during checkout.
- **Vendor Dashboard**: In-application management for products/services, orders (acceptance, status, tracking), and business overview.
- **Admin Portal**: Dedicated sub-application for platform overview, user/vendor management, analytics, and settings.
- **Order Fulfillment Workflow**: End-to-end process from checkout to delivery, with real-time status updates.
- **Payment Integration**: Paystack SDK for payments, including webhooks and fallback.
- **Localization**: Full platform localization to Kenyan Shillings (KES) and Kenyan geographical contexts.
- **Delivery Module**: Comprehensive delivery management with integration for multiple Kenyan couriers, real-time pricing, tracking, and automatic vendor-courier handoff.
- **UI/UX**: Unified design system with consistent layout, optimized filter positioning, and responsive design.
- **Service Booking**: Appointment-based booking system with hourly pricing, calendar date picker, time slots, and duration selection.
- **Geo-Location Based Prioritization**: Customer location-aware product/service discovery using Leaflet map and OpenStreetMap Nominatim API for proximity-based filtering and sorting.
- **Vendor Management**: Comprehensive registration and approval workflow including document uploads (national ID, tax certificate) and status verification.
- **Configurable Commission**: Admin-configurable platform commission percentage (default 20%).
- **Centralized Admin Content Control**: Admin oversight for content visibility with approval workflows for products and services.
- **Paystack Subaccount Management**: Automated Paystack subaccount creation for vendors, comprehensive earnings tracking, and payout request workflow with automated transfers and email notifications.
- **Category & Subcategory System**: Structured taxonomy for products and services with main categories and detailed subcategories.

## External Dependencies
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit Infrastructure**: Application hosting
- **Replit Auth**: OpenID Connect authentication
- **Radix UI**: Accessible UI primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Iconography
- **Google Fonts**: Inter font family
- **Paystack**: Payment gateway
- **Gmail SMTP**: Email notifications (via Nodemailer)
- **Unsplash**: Placeholder images
- **OpenStreetMap Nominatim API**: Geocoding services for location search