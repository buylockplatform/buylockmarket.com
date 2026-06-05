# BuyLock TypeScript Fix Progress

_Last updated: 2026-06-03_

---

## Overview

Fixing TypeScript compilation errors in `server/storage.ts` and `server/routes.ts` after the Drizzle ORM migration. The goal is zero `tsc --noEmit` errors so the project compiles cleanly.

---

## ✅ Completed Work (Previous Sessions)

### Storage Layer (`server/storage.ts`)
- [x] Standardised `getOrderById` (replaced legacy `getOrder` everywhere)
- [x] Fixed `getOrdersByUser`, `getOrdersByVendor`, `getVendorDeliveredOrders`, `getAllOrders`, `getOrders` — replaced spread-destructured queries with explicit column selection
- [x] Updated `getOrderItems` to select `vendorConfirmedQuantity`, `vendorConfirmedAt`, `vendorNotes`
- [x] Changed `deleteCategory` return type to `Promise<boolean>` and updated implementation + IStorage interface
- [x] Fixed `services.providerId` reference in `getVendorStats`
- [x] Added `InsertUser` to import list from `@shared/schema`
- [x] Typed `getAllVendors`, `getVendorApplications`, `getAllUsers` query variables as `any` to avoid Drizzle dynamic query builder type errors

### Routes (`server/routes.ts`)
- [x] Replaced all `storage.getOrder()` calls with `storage.getOrderById()`

---

## 🔧 In Progress — Current Session

### Errors Being Fixed Right Now

#### `server/storage.ts`

| Line(s) | Error | Fix |
|---------|-------|-----|
| 315 | `DatabaseStorage` missing `getAllCategories`, `getAllSubcategories`, `getSubcategoriesByCategory` from `IStorage` | Add aliases pointing to existing `getCategories`, `getSubcategories`, `getSubcategoriesByCategoryId` OR remove missing methods from IStorage |
| 876 | `quantity` possibly `null` in `addToCart` | Add null coalescing: `existingItem[0].quantity ?? 0` |
| 1082–1083 | `parseFloat()` returns `number`, but `totalAmount`/`deliveryFee` expect `string` in `Order` | Remove `parseFloat()`, keep values as strings |
| 1124–1125 | Same as above (in `getOrderByPaymentReference` fallback) | Remove `parseFloat()` |
| 1149–1150 | Same as above (in `getOrderByPublicToken`) | Remove `parseFloat()` |
| 1208 | Same as above (in `updateOrder`) | Remove `parseFloat()` |
| 1222–1223 | Same as above (in `createOrder`) | Remove `parseFloat()` |
| 1249 | Same as above (in `createOrderItem`) | Remove `parseFloat()` |

#### `server/routes.ts`

| Line(s) | Error | Fix |
|---------|-------|-----|
| 545, 548 | `error` is `unknown` in catch block | Cast to `any`: `(error as any).name` |
| 582–583 | `string \| null` not assignable to `string` (user.email) | Use non-null assertion or fallback: `user.email!` or `user.email ?? ''` |
| 628, 664 | `req.user` does not exist on `Request` | Already uses `req: any` in most places — add `: any` to handler param |
| 1016 | Unintentional comparison `"ready_for_pickup"` vs `"fulfilled"` | Fix logic or remove dead code |
| 1609 | `paystack` possibly `null` + missing `name` property | Guard with `paystack!` or `if (!paystack) return`, add `name` field |
| 1658, 1825 | `paystack` possibly `null` | Add null guard |
| 1697 | `customer.username` doesn't exist | Use `customer.firstName \|\| customer.lastName \|\| 'Customer'` |
| 1700, 1770 | `order.shippingAddress` doesn't exist | Use `order.deliveryAddress` |
| 1721 | `sendSMS` not exported from uwaziiService | Use `uwaziiService.sendSMS()` instead of `{ sendSMS }` import |
| 1734 | `customer` not defined (used outside scope) | Move reference inside where `customer` is declared |
| 1754–1755 | `orderWithItems` possibly `undefined` | Add null guard: `if (!orderWithItems) return` |
| 1768 | `Date` not assignable to `string` for `appointmentDate` | Convert: `.toISOString()` or pass as string |
| 1901 | `vendorId: string \| null \| undefined` not assignable to `string` | Use `vendorId: primaryVendorId \|\| ''` |
| 2399, 2449, 2551, 2583, 2607, 2627, 2659, 2683, 2715, 2780, 2818 | `req.vendor` doesn't exist on Request | Change handler param to `async (req: any, res)` |
| 2468 | `vendor.password` doesn't exist | Remove the destructuring or use `passwordHash` only |
| 2778 | `sendSMS` not exported from uwaziiService | Use `uwaziiService.sendSMS()` |
| 2781–2782, 2797 | `order` possibly `undefined` | Add null guard after `getOrderById` |
| 2990–2991 | `item.productName` / `item.serviceName` don't exist on `OrderItem` | Use `item.name` instead |
| 3153–3155 | `sum`, `earning` implicitly `any` in reduce | Add types: `(sum: number, earning: any)` |
| 3166 | `new Date(b.updatedAt)` — `updatedAt` is `Date \| null` | Use `new Date(b.updatedAt ?? 0)` |
| 4488 | `item.service` doesn't exist on CartItem type | Already typed as `any` in context — safe to leave or cast |
| 4545 | `confirmedAt` not in `InsertOrder` | Remove the field |
| 4594 | `customer.username` doesn't exist | Use `customer.firstName \|\| 'Customer'` |
| 4616 | `customerPhone: string \| null \| undefined` not assignable | Use `customer?.phone \|\| undefined` (null→undefined via `\|\| undefined`) |
| 4658 | `error.message` — `error` is `unknown` | Cast: `(error as any).message` |
| 4667 | `paystack` possibly `null` | Add null guard |
| 4725 | `courier.supportedRegions` possibly `null` | Add null guard |
| 4953 | `storage.updateOrderStatus` returns `Order`, not array | Remove `[updatedOrder]` destructuring |
| 4964 | `timestamp` not in `InsertDeliveryUpdate` | Remove the field |
| 5130, 5737 | `customer.username` doesn't exist | Use `customer.firstName \|\| 'Customer'` |
| 5134, 5741 | `vendor.phoneNumber` doesn't exist | Use `vendor.phone` |
| 5196 | `string \| null` not assignable to `string` | Add null coalescing |
| 5529 | `id` not in `InsertUser` | Remove the `id` field from createUser call (DB generates UUID) |
| 5593 | `verifiedAt` expects `Date`, got `string` | Use `new Date()` instead of `new Date().toISOString()` |
| 5911 | `vendorId: string \| null` not assignable to `string` | Use `vendorId: service.providerId \|\| ''` |
| 6085–6086 | `error` is `unknown` in catch | Cast to `any` |

#### `server/seedDatabase.ts`
| 153 | `country` not in vendor insert schema | Remove the field |
| 2044 | `id` not in product insert schema | Remove the field |

#### `server/setupFargoTestOrder.ts`
| 5 | Missing `@types/uuid` | Add `declare module 'uuid'` or install types |

---

## ⏳ Pending (Not Yet Started)

- [ ] Fix all the errors listed in the table above
- [ ] Run `tsc --noEmit` after fixes to verify zero errors
- [ ] Verify server starts cleanly with `npm run dev`

---

## 📋 Blueprint Items Status (from BUYLOCK_IMPROVEMENT_BLUEPRINT.md)

> These were the broader product improvements planned. TypeScript compilation is a prerequisite for all of these.

| Blueprint Item | Status |
|----------------|--------|
| Backend stability / TypeScript migration | 🔧 In Progress |
| Drizzle ORM query fixes | ✅ Mostly done |
| Payment flow (Paystack) | ✅ Routes exist, TS errors being fixed |
| Vendor SMS notifications (Uwazii) | 🔧 In Progress (sendSMS import fix needed) |
| Order tracking / public token | ✅ Implemented |
| Vendor earnings & payout | ✅ Implemented |
| Delivery management | ✅ Implemented |
| Customer order confirmation emails | ✅ Implemented |
| Admin product/service approval | ✅ Implemented |
| Category / subcategory management | ✅ Implemented |

---

## 🚀 How to Resume

1. Open `server/storage.ts` and `server/routes.ts`
2. Apply fixes from the **"In Progress"** table above
3. Run: `node node_modules/typescript/bin/tsc --noEmit`
4. Fix any remaining errors
5. Test with `npm run dev`
