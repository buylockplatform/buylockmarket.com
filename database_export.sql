-- PostgreSQL Database Export
-- Generated on: 2025-09-17T14:44:26.389Z
-- 

SET session_replication_role = replica;

-- Table: admins (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "admins" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "email" CHARACTER VARYING NOT NULL,
  "password" CHARACTER VARYING NOT NULL,
  "name" CHARACTER VARYING NOT NULL,
  "role" CHARACTER VARYING NOT NULL DEFAULT 'admin'::character varying,
  "is_active" BOOLEAN DEFAULT true,
  "last_login" TIMESTAMP WITHOUT TIME ZONE,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "admins" ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");


-- Table: appointments (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "appointments" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "customer_id" CHARACTER VARYING NOT NULL,
  "vendor_id" CHARACTER VARYING NOT NULL,
  "service_id" CHARACTER VARYING NOT NULL,
  "service_name" CHARACTER VARYING NOT NULL,
  "customer_name" CHARACTER VARYING NOT NULL,
  "customer_email" CHARACTER VARYING NOT NULL,
  "customer_phone" CHARACTER VARYING NOT NULL,
  "appointment_date" CHARACTER VARYING NOT NULL,
  "appointment_time" CHARACTER VARYING NOT NULL,
  "address" CHARACTER VARYING NOT NULL,
  "city" CHARACTER VARYING NOT NULL,
  "state" CHARACTER VARYING NOT NULL,
  "notes" CHARACTER VARYING,
  "total_amount" CHARACTER VARYING NOT NULL,
  "status" CHARACTER VARYING NOT NULL DEFAULT 'pending'::character varying,
  "vendor_notes" CHARACTER VARYING,
  "order_id" UUID,
  "booking_date" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");


-- Table: brands (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "brands" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING(100) NOT NULL,
  "slug" CHARACTER VARYING(100) NOT NULL,
  "description" TEXT,
  "logo_url" CHARACTER VARYING,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "brands" ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");


-- Table: cart_items (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" CHARACTER VARYING NOT NULL,
  "product_id" UUID,
  "service_id" UUID,
  "quantity" INTEGER DEFAULT 1,
  "price" NUMERIC(10,2) DEFAULT '0'::numeric,
  "appointment_date" TIMESTAMP WITHOUT TIME ZONE,
  "appointment_time" CHARACTER VARYING(10),
  "duration" INTEGER DEFAULT 1,
  "notes" TEXT,
  "service_location" TEXT,
  "location_coordinates" CHARACTER VARYING,
  "detailed_instructions" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "cart_items" ("id", "user_id", "product_id", "service_id", "quantity", "price", "appointment_date", "appointment_time", "duration", "notes", "service_location", "location_coordinates", "detailed_instructions", "created_at") VALUES
  ('34392585-19da-47db-a2ec-576a3bab7c8e', '44263266', '63236c3d-03a3-460b-9b9f-e1107ff43a77', NULL, 1, '299999.00', NULL, NULL, 1, NULL, NULL, NULL, NULL, '2025-09-17T08:14:35.579Z');

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");


-- Table: categories (7 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "categories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING(100) NOT NULL,
  "slug" CHARACTER VARYING(100) NOT NULL,
  "description" TEXT,
  "image_url" CHARACTER VARYING,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "categories" ("id", "name", "slug", "description", "image_url", "is_active", "created_at") VALUES
  ('93a04f80-fe58-4070-a3fb-868192d0db23', 'Electronics', 'electronics', 'Electronic devices, gadgets, and accessories', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500', TRUE, '2025-09-10T15:05:05.482Z'),
  ('a0f13e79-e58a-4717-ad89-dab02017183c', 'Fashion', 'fashion', 'Clothing, accessories, and fashion items', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500', TRUE, '2025-09-10T15:05:05.482Z'),
  ('2d9a8a3c-00fd-4e39-874b-6216189e563c', 'Home & Kitchen', 'home-kitchen', 'Home appliances, furniture, and kitchen items', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', TRUE, '2025-09-10T15:05:05.482Z'),
  ('22ecd9cd-fde3-4b18-a382-5c8fd477700a', 'Health & Beauty', 'health-beauty', 'Personal care, health, and beauty products', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', TRUE, '2025-09-10T15:05:05.482Z'),
  ('cfbe5cb4-0f77-4580-a6b5-1199a9a69338', 'Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', TRUE, '2025-09-10T15:05:05.482Z'),
  ('e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', 'Professional Services', 'professional-services', 'Expert professional services for your business needs', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', TRUE, '2025-09-10T15:05:05.482Z'),
  ('96636d15-b1f5-4f42-af74-0eee521d8f1a', 'Books', 'books', 'Educational, business, fiction, and self-help books', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', TRUE, '2025-09-10T18:02:54.169Z');

ALTER TABLE "categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");


-- Table: couriers (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "couriers" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING NOT NULL,
  "logo" CHARACTER VARYING,
  "base_rate" CHARACTER VARYING NOT NULL,
  "per_km_rate" CHARACTER VARYING NOT NULL,
  "max_weight" CHARACTER VARYING NOT NULL,
  "estimated_time" CHARACTER VARYING NOT NULL,
  "coverage" CHARACTER VARYING NOT NULL,
  "phone" CHARACTER VARYING,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "couriers" ADD CONSTRAINT "couriers_pkey" PRIMARY KEY ("id");


-- Table: deliveries (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "provider_id" CHARACTER VARYING NOT NULL,
  "external_tracking_id" CHARACTER VARYING,
  "courier_tracking_id" CHARACTER VARYING,
  "status" CHARACTER VARYING(30) DEFAULT 'pending'::character varying,
  "pickup_address" TEXT NOT NULL,
  "delivery_address" TEXT NOT NULL,
  "estimated_pickup_time" TIMESTAMP WITHOUT TIME ZONE,
  "actual_pickup_time" TIMESTAMP WITHOUT TIME ZONE,
  "estimated_delivery_time" TIMESTAMP WITHOUT TIME ZONE,
  "actual_delivery_time" TIMESTAMP WITHOUT TIME ZONE,
  "delivery_fee" NUMERIC(10,2) NOT NULL,
  "distance" NUMERIC(5,2),
  "weight" NUMERIC(5,2),
  "package_description" TEXT,
  "special_instructions" TEXT,
  "customer_phone" CHARACTER VARYING,
  "vendor_phone" CHARACTER VARYING,
  "courier_phone" CHARACTER VARYING,
  "courier_name" CHARACTER VARYING,
  "failure_reason" TEXT,
  "proof_of_delivery" CHARACTER VARYING,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");


-- Table: delivery_analytics (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "delivery_analytics" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider_id" CHARACTER VARYING NOT NULL,
  "date" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  "total_deliveries" INTEGER DEFAULT 0,
  "successful_deliveries" INTEGER DEFAULT 0,
  "failed_deliveries" INTEGER DEFAULT 0,
  "average_delivery_time" INTEGER,
  "average_distance" NUMERIC(5,2),
  "total_revenue" NUMERIC(10,2) DEFAULT '0'::numeric
);

ALTER TABLE "delivery_analytics" ADD CONSTRAINT "delivery_analytics_pkey" PRIMARY KEY ("id");


-- Table: delivery_providers (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "delivery_providers" (
  "id" CHARACTER VARYING NOT NULL,
  "name" CHARACTER VARYING(100) NOT NULL,
  "type" CHARACTER VARYING NOT NULL DEFAULT 'courier'::character varying,
  "logo" CHARACTER VARYING,
  "api_endpoint" CHARACTER VARYING,
  "api_key" CHARACTER VARYING,
  "is_active" BOOLEAN DEFAULT true,
  "notification_method" CHARACTER VARYING DEFAULT 'email'::character varying,
  "webhook_notification_url" CHARACTER VARYING,
  "contact_email" CHARACTER VARYING,
  "contact_phone" CHARACTER VARYING,
  "supported_regions" ARRAY,
  "base_rate" NUMERIC(10,2) DEFAULT '0'::numeric,
  "distance_rate" NUMERIC(10,2) DEFAULT '0'::numeric,
  "weight_multiplier" NUMERIC(3,2) DEFAULT '1'::numeric,
  "estimated_delivery_time" CHARACTER VARYING DEFAULT '24-48 hours'::character varying,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "delivery_providers" ADD CONSTRAINT "delivery_providers_pkey" PRIMARY KEY ("id");


-- Table: delivery_requests (13 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "delivery_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "status" CHARACTER VARYING(20) NOT NULL DEFAULT 'pending'::character varying,
  "assigned_courier_id" CHARACTER VARYING,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "delivery_requests" ("id", "order_id", "status", "assigned_courier_id", "created_at", "updated_at") VALUES
  ('0d304162-fc7e-41ff-a8fa-8e783ecf94d4', '6fb9e2a7-33b1-49bc-af64-1b9a9c7a72d4', 'pending', NULL, '2025-09-10T18:33:31.800Z', '2025-09-10T18:33:31.800Z'),
  ('f102d362-40cb-44c0-b0d0-57d9231e73b4', '20aff308-f71f-4874-8bc3-31b357e34827', 'pending', NULL, '2025-09-11T10:19:12.753Z', '2025-09-11T10:19:12.753Z'),
  ('23f15744-bf57-4b67-ab9b-7765c88043c7', '585b371c-098a-4dcf-9f6f-e2fdf289e79d', 'pending', NULL, '2025-09-11T10:25:34.355Z', '2025-09-11T10:25:34.355Z'),
  ('661439e1-958f-4968-87d1-6347d5305807', 'cec19ba1-4413-4b0a-a74f-f531e0e4166f', 'pending', NULL, '2025-09-11T10:25:48.899Z', '2025-09-11T10:25:48.899Z'),
  ('23c248d5-19fe-40e2-8997-eb179ba398c6', '803fc801-8c37-4b8f-bc31-13cb047af40d', 'pending', NULL, '2025-09-11T10:36:19.978Z', '2025-09-11T10:36:19.978Z'),
  ('15a7aeda-2819-425c-bb56-a0bee50ffe6f', 'f5151805-452c-4cd8-9f88-5a6fba9f3e69', 'pending', NULL, '2025-09-11T10:36:29.465Z', '2025-09-11T10:36:29.465Z'),
  ('5bfe2e94-3e31-4f46-8324-fe7c72352e3f', 'dad9e4f4-fcf9-4411-b495-1e32267218e4', 'pending', NULL, '2025-09-11T10:42:45.012Z', '2025-09-11T10:42:45.012Z'),
  ('ef93245b-9e15-4a45-8807-4f56a266dbc0', '1110060d-8391-4bc5-a8b7-c9071d15ec3b', 'pending', NULL, '2025-09-11T10:47:18.937Z', '2025-09-11T10:47:18.937Z'),
  ('a16940e7-cf4d-4a6b-a70b-b2136ed14c4e', '56043dd8-c66d-4b75-b434-9d701337e10b', 'pending', NULL, '2025-09-11T10:52:10.874Z', '2025-09-11T10:52:10.874Z'),
  ('2f702100-7527-4750-ad79-8809c43012fa', 'a40ec023-0f37-4533-ada7-31b10ba79cd8', 'pending', NULL, '2025-09-11T11:48:21.753Z', '2025-09-11T11:48:21.753Z'),
  ('a086c4f1-0ecc-4d74-b0eb-7e07550c2fee', '6af683b1-d64b-4e76-990e-912343c5f24e', 'pending', NULL, '2025-09-12T13:42:34.980Z', '2025-09-12T13:42:34.980Z'),
  ('e625bb6f-8579-42bb-b89f-17d6b0ea59b2', '16834f14-302a-42de-b0f1-6b35011b5137', 'pending', NULL, '2025-09-12T13:49:36.617Z', '2025-09-12T13:49:36.617Z'),
  ('92554ffb-a47d-4ec3-921b-dd2618d67fc6', '53c0e097-f825-4c74-9385-3eb2c80354cf', 'pending', NULL, '2025-09-12T13:49:46.620Z', '2025-09-12T13:49:46.620Z');

ALTER TABLE "delivery_requests" ADD CONSTRAINT "delivery_requests_pkey" PRIMARY KEY ("id");


-- Table: delivery_updates (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "delivery_updates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "delivery_id" UUID NOT NULL,
  "status" CHARACTER VARYING(30) NOT NULL,
  "description" TEXT NOT NULL,
  "location" CHARACTER VARYING,
  "coordinates" CHARACTER VARYING,
  "timestamp" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "source" CHARACTER VARYING(20) DEFAULT 'api'::character varying,
  "external_event_id" CHARACTER VARYING
);

ALTER TABLE "delivery_updates" ADD CONSTRAINT "delivery_updates_pkey" PRIMARY KEY ("id");


-- Table: email_notifications (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "email_notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "recipient_email" CHARACTER VARYING NOT NULL,
  "recipient_type" CHARACTER VARYING(20) NOT NULL,
  "recipient_id" CHARACTER VARYING,
  "email_type" CHARACTER VARYING(50) NOT NULL,
  "subject" CHARACTER VARYING NOT NULL,
  "status" CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  "sent_at" TIMESTAMP WITHOUT TIME ZONE,
  "failure_reason" TEXT,
  "related_entity_type" CHARACTER VARYING(20),
  "related_entity_id" CHARACTER VARYING,
  "template_data" JSONB,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id");


-- Table: order_items (16 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "product_id" UUID,
  "service_id" UUID,
  "quantity" INTEGER NOT NULL,
  "price" NUMERIC(10,2) NOT NULL,
  "name" CHARACTER VARYING(200) NOT NULL,
  "appointment_date" TIMESTAMP WITHOUT TIME ZONE,
  "appointment_time" CHARACTER VARYING(10),
  "duration" INTEGER DEFAULT 1,
  "notes" TEXT,
  "service_location" TEXT,
  "location_coordinates" CHARACTER VARYING,
  "detailed_instructions" TEXT
);

INSERT INTO "order_items" ("id", "order_id", "product_id", "service_id", "quantity", "price", "name", "appointment_date", "appointment_time", "duration", "notes", "service_location", "location_coordinates", "detailed_instructions") VALUES
  ('cd371de4-4a45-495b-82e8-2f64943df342', '145496ed-a905-43fc-b08f-6e5106b49751', '4d02dd88-a7cb-4905-8300-773068109619', NULL, 1, '0.00', 'LG 65-inch OLED C3 TV', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('7df34a16-9523-47f1-bdb3-ff7dff2bbdec', '6fb9e2a7-33b1-49bc-af64-1b9a9c7a72d4', '4d02dd88-a7cb-4905-8300-773068109619', NULL, 1, '0.00', 'LG 65-inch OLED C3 TV', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('5c2d6500-1693-4e1f-9d44-739c8909e5e8', '20aff308-f71f-4874-8bc3-31b357e34827', 'da2f4801-7eeb-4d51-9c8e-925dd6e746c2', NULL, 1, '149999.00', 'Dell XPS 13 Plus', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('e34a695a-8765-4457-9de9-84a62bd94587', 'cec19ba1-4413-4b0a-a74f-f531e0e4166f', '8aa21ef0-4fcc-44c0-83ff-722e1537cd25', NULL, 1, '189999.00', 'iPhone 15 Pro Max', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('11507705-14bb-4f5c-9806-7fc52c28cf73', '585b371c-098a-4dcf-9f6f-e2fdf289e79d', '4d02dd88-a7cb-4905-8300-773068109619', NULL, 1, '119999.00', 'LG 65-inch OLED C3 TV', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('2f08af40-defd-4a18-b0cf-50c485d542c3', 'f5151805-452c-4cd8-9f88-5a6fba9f3e69', '14734506-2542-4e48-b4c7-bd57e7e559e9', NULL, 1, '124999.00', 'Sony A7 IV Mirrorless Camera', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('df543d2e-a132-4c4e-8b29-51d17d2b3c73', '803fc801-8c37-4b8f-bc31-13cb047af40d', '14734506-2542-4e48-b4c7-bd57e7e559e9', NULL, 1, '124999.00', 'Sony A7 IV Mirrorless Camera', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('9912e50f-732f-4eab-8b75-ec2f69b9dcaf', 'dad9e4f4-fcf9-4411-b495-1e32267218e4', '63236c3d-03a3-460b-9b9f-e1107ff43a77', NULL, 1, '299999.00', 'MacBook Air M3 15-inch', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('0763d3a9-75b9-4544-b63f-050f56e4fcbc', '1110060d-8391-4bc5-a8b7-c9071d15ec3b', '4d02dd88-a7cb-4905-8300-773068109619', NULL, 1, '119999.00', 'LG 65-inch OLED C3 TV', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('149dae8f-19f8-4e14-960e-d8bd789d453e', '56043dd8-c66d-4b75-b434-9d701337e10b', 'da2f4801-7eeb-4d51-9c8e-925dd6e746c2', NULL, 1, '149999.00', 'Dell XPS 13 Plus', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('2874bbcc-2d1a-4f61-8e7c-fdb419c4bd57', 'a40ec023-0f37-4533-ada7-31b10ba79cd8', '63236c3d-03a3-460b-9b9f-e1107ff43a77', NULL, 1, '299999.00', 'MacBook Air M3 15-inch', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('b197f198-d067-4cd8-b3f2-a3f7dfd747dd', '6af683b1-d64b-4e76-990e-912343c5f24e', '8aa21ef0-4fcc-44c0-83ff-722e1537cd25', NULL, 1, '189999.00', 'iPhone 15 Pro Max', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('069f6499-7c1a-4941-9d5b-0952d074afb2', '53c0e097-f825-4c74-9385-3eb2c80354cf', '4d02dd88-a7cb-4905-8300-773068109619', NULL, 1, '119999.00', 'LG 65-inch OLED C3 TV', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('de99796d-1052-4c8c-b0cf-a9fadab41e5e', '53c0e097-f825-4c74-9385-3eb2c80354cf', '14734506-2542-4e48-b4c7-bd57e7e559e9', NULL, 1, '124999.00', 'Sony A7 IV Mirrorless Camera', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('3db73c55-2611-4fbb-961c-8894ae2fb6e3', '16834f14-302a-42de-b0f1-6b35011b5137', '14734506-2542-4e48-b4c7-bd57e7e559e9', NULL, 1, '124999.00', 'Sony A7 IV Mirrorless Camera', NULL, NULL, 1, NULL, NULL, NULL, NULL),
  ('9e39caf9-e69c-4c82-9ec9-663cf8123d80', '16834f14-302a-42de-b0f1-6b35011b5137', 'da2f4801-7eeb-4d51-9c8e-925dd6e746c2', NULL, 1, '149999.00', 'Dell XPS 13 Plus', NULL, NULL, 1, NULL, NULL, NULL, NULL);

ALTER TABLE "order_items" ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");


-- Table: order_tracking (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "order_tracking" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "delivery_id" UUID,
  "status" CHARACTER VARYING(30) NOT NULL,
  "description" TEXT NOT NULL,
  "location" CHARACTER VARYING,
  "timestamp" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "is_delivered" BOOLEAN DEFAULT false,
  "source" CHARACTER VARYING(20) DEFAULT 'internal'::character varying
);

INSERT INTO "order_tracking" ("id", "order_id", "delivery_id", "status", "description", "location", "timestamp", "is_delivered", "source") VALUES
  ('02f3003e-156d-4502-abaf-f33d63ef3a00', '145496ed-a905-43fc-b08f-6e5106b49751', NULL, 'Cancelled', 'Order has been cancelled by customer request.', 'Customer Service', '2025-09-10T18:32:56.890Z', FALSE, 'internal');

ALTER TABLE "order_tracking" ADD CONSTRAINT "order_tracking_pkey" PRIMARY KEY ("id");


-- Table: orders (14 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" CHARACTER VARYING NOT NULL,
  "vendor_id" CHARACTER VARYING NOT NULL,
  "status" CHARACTER VARYING NOT NULL,
  "total_amount" NUMERIC(10,2) NOT NULL,
  "delivery_address" TEXT NOT NULL,
  "delivery_fee" NUMERIC(10,2),
  "courier_id" CHARACTER VARYING,
  "courier_name" CHARACTER VARYING,
  "estimated_delivery_time" CHARACTER VARYING,
  "payment_status" CHARACTER VARYING,
  "payment_method" CHARACTER VARYING,
  "notes" TEXT,
  "vendor_notes" TEXT,
  "tracking_number" CHARACTER VARYING,
  "internal_tracking_id" CHARACTER VARYING,
  "estimated_delivery" TIMESTAMP WITHOUT TIME ZONE,
  "vendor_accepted_at" TIMESTAMP WITHOUT TIME ZONE,
  "delivery_pickup_at" TIMESTAMP WITHOUT TIME ZONE,
  "order_type" CHARACTER VARYING,
  "confirmation_token" CHARACTER VARYING,
  "confirmation_status" CHARACTER VARYING,
  "customer_confirmed_at" TIMESTAMP WITHOUT TIME ZONE,
  "dispute_reason" TEXT,
  "payment_reference" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "public_token" CHARACTER VARYING,
  "public_token_created_at" TIMESTAMP WITHOUT TIME ZONE,
  "public_token_expires_at" TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO "orders" ("id", "user_id", "vendor_id", "status", "total_amount", "delivery_address", "delivery_fee", "courier_id", "courier_name", "estimated_delivery_time", "payment_status", "payment_method", "notes", "vendor_notes", "tracking_number", "internal_tracking_id", "estimated_delivery", "vendor_accepted_at", "delivery_pickup_at", "order_type", "confirmation_token", "confirmation_status", "customer_confirmed_at", "dispute_reason", "payment_reference", "created_at", "updated_at", "public_token", "public_token_created_at", "public_token_expires_at") VALUES
  ('145496ed-a905-43fc-b08f-6e5106b49751', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'cancelled', '0.00', 'Riara center ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757528028094_tsnmp0i6m', '2025-09-10T18:15:16.689Z', '2025-09-10T18:32:56.795Z', NULL, NULL, NULL),
  ('20aff308-f71f-4874-8bc3-31b357e34827', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '149999.00', 'riara center', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757584761706_xg2wwnxq5', '2025-09-11T09:59:47.449Z', '2025-09-11T10:19:12.655Z', NULL, NULL, NULL),
  ('585b371c-098a-4dcf-9f6f-e2fdf289e79d', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '119999.00', 'Riara', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757586106681_5y21zb46k', '2025-09-11T10:22:36.332Z', '2025-09-11T10:25:34.263Z', NULL, NULL, NULL),
  ('cec19ba1-4413-4b0a-a74f-f531e0e4166f', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '189999.00', 'Riara center ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757586018634_dnppnm3s2', '2025-09-11T10:20:47.024Z', '2025-09-11T10:25:48.807Z', NULL, NULL, NULL),
  ('803fc801-8c37-4b8f-bc31-13cb047af40d', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '124999.00', 'riara center', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757586900898_4x9riu4fz', '2025-09-11T10:35:34.940Z', '2025-09-11T10:36:19.886Z', NULL, NULL, NULL),
  ('f5151805-452c-4cd8-9f88-5a6fba9f3e69', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '124999.00', 'Riara center ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757586388147_xq41dgige', '2025-09-11T10:27:13.628Z', '2025-09-11T10:36:29.372Z', NULL, NULL, NULL),
  ('dad9e4f4-fcf9-4411-b495-1e32267218e4', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '299999.00', 'Riara center ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757587302710_bu6tcl2jk', '2025-09-11T10:42:12.814Z', '2025-09-11T10:42:44.917Z', NULL, NULL, NULL),
  ('1110060d-8391-4bc5-a8b7-c9071d15ec3b', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '119999.00', 'Riara Center ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757587596233_npeojp296', '2025-09-11T10:47:02.548Z', '2025-09-11T10:47:18.845Z', NULL, NULL, NULL),
  ('56043dd8-c66d-4b75-b434-9d701337e10b', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '149999.00', 'riara center', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757587882291_y1vmlm6m3', '2025-09-11T10:51:53.113Z', '2025-09-11T10:52:10.777Z', NULL, NULL, NULL),
  ('a40ec023-0f37-4533-ada7-31b10ba79cd8', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '299999.00', 'riara', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757590712323_d9p0h9zlb', '2025-09-11T11:44:50.031Z', '2025-09-11T11:48:21.663Z', '3PXVrUumDEczXrbvVk4EPw', '2025-09-11T11:44:50.374Z', '2025-12-10T11:44:50.374Z'),
  ('6af683b1-d64b-4e76-990e-912343c5f24e', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '189999.00', 'riara center ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757601913261_rqn6816ls', '2025-09-11T14:45:44.201Z', '2025-09-12T13:42:34.888Z', 'N7thgiTntpZ6sinKdtDbaw', '2025-09-11T14:45:44.538Z', '2025-12-10T14:45:44.538Z'),
  ('16834f14-302a-42de-b0f1-6b35011b5137', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'ready_for_pickup', '274998.00', 'Ngong road ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757684881847_rb4fgzsue', '2025-09-12T13:48:31.323Z', '2025-09-12T13:49:36.527Z', '7FXK6_5FyV3VzALfd_jp0A', '2025-09-12T13:48:31.721Z', '2025-12-11T13:48:31.720Z'),
  ('6fb9e2a7-33b1-49bc-af64-1b9a9c7a72d4', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'fulfilled', '0.00', 'Riara center offices ', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757514200973_p95veqfsr', '2025-09-10T18:21:51.124Z', '2025-09-12T14:33:30.647Z', NULL, NULL, NULL),
  ('53c0e097-f825-4c74-9385-3eb2c80354cf', '44263266', '74bf6c33-7f09-4844-903d-72bff3849c95', 'fulfilled', '244998.00', 'riara', NULL, NULL, NULL, NULL, 'paid', 'Paystack', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'BL_1757684486348_6soi0ebzn', '2025-09-12T13:41:56.643Z', '2025-09-12T14:36:28.162Z', 'ep_c8Q6ZXtVpDMSZR2HaKQ', '2025-09-12T13:41:57.041Z', '2025-12-11T13:41:57.040Z');

ALTER TABLE "orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");


-- Table: payout_history (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "payout_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendor_id" CHARACTER VARYING NOT NULL,
  "payout_request_id" UUID NOT NULL,
  "amount" NUMERIC(10,2) NOT NULL,
  "paystack_transfer_id" CHARACTER VARYING,
  "status" CHARACTER VARYING(20) NOT NULL,
  "transaction_fee" NUMERIC(10,2) DEFAULT '0'::numeric,
  "net_amount" NUMERIC(10,2) NOT NULL,
  "failure_reason" TEXT,
  "paystack_reference" CHARACTER VARYING,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "payout_history" ADD CONSTRAINT "payout_history_pkey" PRIMARY KEY ("id");


-- Table: payout_requests (5 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "payout_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendor_id" CHARACTER VARYING NOT NULL,
  "requested_amount" NUMERIC(10,2) NOT NULL,
  "available_balance" NUMERIC(10,2) NOT NULL,
  "status" CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  "request_reason" TEXT,
  "reviewed_by" CHARACTER VARYING,
  "reviewed_at" TIMESTAMP WITHOUT TIME ZONE,
  "admin_notes" TEXT,
  "paystack_transfer_id" CHARACTER VARYING,
  "paystack_transfer_code" CHARACTER VARYING,
  "transfer_status" CHARACTER VARYING(20),
  "transfer_failure_reason" TEXT,
  "actual_paid_amount" NUMERIC(10,2),
  "completed_at" TIMESTAMP WITHOUT TIME ZONE,
  "failed_at" TIMESTAMP WITHOUT TIME ZONE,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "order_id" UUID
);

INSERT INTO "payout_requests" ("id", "vendor_id", "requested_amount", "available_balance", "status", "request_reason", "reviewed_by", "reviewed_at", "admin_notes", "paystack_transfer_id", "paystack_transfer_code", "transfer_status", "transfer_failure_reason", "actual_paid_amount", "completed_at", "failed_at", "created_at", "updated_at", "order_id") VALUES
  ('7cac07a9-f1df-4f35-b774-f9a2aa823051', '74bf6c33-7f09-4844-903d-72bff3849c95', '244998.00', '0.00', 'failed', NULL, 'admin', '2025-09-17T09:16:08.040Z', 'undefined - Transfer failed: You cannot initiate third party payouts at this time', NULL, NULL, NULL, 'You cannot initiate third party payouts at this time', NULL, NULL, '2025-09-17T09:16:08.040Z', '2025-09-17T08:52:03.546Z', '2025-09-17T09:16:08.040Z', '53c0e097-f825-4c74-9385-3eb2c80354cf'),
  ('ca3c7475-6f1f-4cca-aa15-c2cb9a55e1eb', '74bf6c33-7f09-4844-903d-72bff3849c95', '244998.00', '0.00', 'approved', NULL, 'admin', '2025-09-17T09:23:29.691Z', NULL, 'mock_1758101008691_q6znjblu8', 'TRF_9u746zmuv8t', 'pending', NULL, NULL, NULL, NULL, '2025-09-17T09:23:01.703Z', '2025-09-17T09:23:29.691Z', '53c0e097-f825-4c74-9385-3eb2c80354cf'),
  ('e2886b6d-de03-4543-9b46-3b7d022c38b4', '74bf6c33-7f09-4844-903d-72bff3849c95', '244998.00', '0.00', 'approved', NULL, 'admin', '2025-09-17T09:29:55.863Z', NULL, 'mock_1758101394862_s4k1obmhz', 'TRF_sjw4nc9tgjn', 'pending', NULL, NULL, NULL, NULL, '2025-09-17T09:29:10.303Z', '2025-09-17T09:29:55.863Z', '53c0e097-f825-4c74-9385-3eb2c80354cf'),
  ('f334cb8d-0959-41aa-853d-667baa623fc9', '74bf6c33-7f09-4844-903d-72bff3849c95', '244998.00', '0.00', 'approved', NULL, 'admin', '2025-09-17T09:34:31.334Z', NULL, 'mock_1758101670334_7tajgzd0d', 'TRF_wmdf5vztrs', 'pending', NULL, NULL, NULL, NULL, '2025-09-17T09:33:57.131Z', '2025-09-17T09:34:31.335Z', '53c0e097-f825-4c74-9385-3eb2c80354cf'),
  ('d3ba5e04-095a-41fa-a440-3ad2089210f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '244998.00', '0.00', 'approved', NULL, 'admin', '2025-09-17T09:43:10.682Z', NULL, 'mock_1758102189681_cos1nb9qb', 'TRF_9k0g8ex5m7u', 'pending', NULL, NULL, NULL, NULL, '2025-09-17T09:42:35.418Z', '2025-09-17T09:43:10.682Z', '53c0e097-f825-4c74-9385-3eb2c80354cf');

ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id");


-- Table: platform_settings (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "setting_key" CHARACTER VARYING(100) NOT NULL,
  "setting_value" TEXT NOT NULL,
  "description" TEXT,
  "setting_type" CHARACTER VARYING(20) DEFAULT 'string'::character varying,
  "is_public" BOOLEAN DEFAULT false,
  "updated_by" CHARACTER VARYING,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");


-- Table: product_attributes (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "product_attributes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING(100) NOT NULL,
  "type" CHARACTER VARYING(20) NOT NULL,
  "options" JSONB,
  "category_id" UUID,
  "subcategory_id" UUID,
  "is_required" BOOLEAN DEFAULT false,
  "is_filterable" BOOLEAN DEFAULT false,
  "display_order" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id");


-- Table: products (92 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING(200) NOT NULL,
  "slug" CHARACTER VARYING(200) NOT NULL,
  "description" TEXT,
  "short_description" CHARACTER VARYING(500),
  "price" NUMERIC(10,2) NOT NULL,
  "original_price" NUMERIC(10,2),
  "image_url" CHARACTER VARYING,
  "image_urls" ARRAY,
  "category_id" UUID,
  "subcategory_id" UUID,
  "brand_id" UUID,
  "vendor_id" CHARACTER VARYING,
  "stock" INTEGER DEFAULT 0,
  "rating" NUMERIC(3,2) DEFAULT '0'::numeric,
  "review_count" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "is_featured" BOOLEAN DEFAULT false,
  "admin_approved" BOOLEAN DEFAULT false,
  "tags" ARRAY,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "products" ("id", "name", "slug", "description", "short_description", "price", "original_price", "image_url", "image_urls", "category_id", "subcategory_id", "brand_id", "vendor_id", "stock", "rating", "review_count", "is_active", "is_featured", "admin_approved", "tags", "created_at", "updated_at") VALUES
  ('024cd072-cc59-45b4-ba7c-d63d48492ee8', 'Camping Tent 4-Person', 'camping-tent-4-person', 'Waterproof 4-person camping tent with easy setup and excellent ventilation. Perfect for family camping adventures and outdoor activities.', 'Waterproof 4-person camping tent', '14999.00', '16999.00', 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 19, '4.60', 89, TRUE, TRUE, TRUE, '["camping","tent","waterproof"]', '2025-08-17T11:44:35.084Z', '2025-08-17T11:44:35.084Z'),
  ('30430dc7-692e-4dbe-99c0-fa6f9e888bc3', 'Electric Toothbrush Pro', 'electric-toothbrush-pro', 'Advanced electric toothbrush with multiple cleaning modes, pressure sensor, and long battery life for superior oral care.', 'Advanced electric toothbrush with smart features', '4500.00', '5999.00', 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 45, '4.80', 234, TRUE, TRUE, TRUE, '["electric","toothbrush","oral-care"]', '2025-08-15T14:22:10.120Z', '2025-08-15T14:22:10.120Z'),
  ('522e551e-20f5-4f88-8822-d6b1700b4c6c', 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Latest Samsung flagship with S Pen, 200MP camera, and powerful performance. Experience the future of mobile technology.', 'Samsung flagship with S Pen and 200MP camera', '85000.00', '95000.00', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 25, '4.70', 156, TRUE, TRUE, TRUE, '["samsung","smartphone","flagship"]', '2025-09-10T17:50:01.663Z', '2025-09-10T17:50:01.663Z'),
  ('ff3f4784-f550-4bc4-b788-927b26a137f5', 'Smart Coffee Maker Pro', 'smart-coffee-maker-pro', 'WiFi-enabled coffee maker with programmable brewing, multiple cup sizes, and smartphone app control.', 'Smart WiFi coffee maker with app control', '12999.00', '15999.00', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 30, '4.50', 89, TRUE, FALSE, TRUE, '["smart","coffee","kitchen"]', '2025-09-10T17:50:01.663Z', '2025-09-10T17:50:01.663Z'),
  ('63236c3d-03a3-460b-9b9f-e1107ff43a77', 'MacBook Air M3 15-inch', 'macbook-air-m3-15-inch', 'Latest Apple MacBook Air with M3 chip, 15-inch Liquid Retina display, and all-day battery life. Perfect for professionals and creatives.', 'Apple MacBook Air with M3 chip and 15-inch display', '299999.00', '329999.00', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 12, '4.90', 67, TRUE, TRUE, TRUE, '["apple","macbook","laptop","m3-chip"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('8aa21ef0-4fcc-44c0-83ff-722e1537cd25', 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'Apple iPhone 15 Pro Max with titanium design, A17 Pro chip, advanced camera system, and USB-C connectivity.', 'Apple iPhone 15 Pro Max with titanium design', '189999.00', '209999.00', 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 28, '4.85', 234, TRUE, TRUE, TRUE, '["apple","iphone","smartphone","pro-max"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('da2f4801-7eeb-4d51-9c8e-925dd6e746c2', 'Dell XPS 13 Plus', 'dell-xps-13-plus', 'Premium ultrabook with 13.4-inch InfinityEdge display, Intel Core i7 processor, and sleek carbon fiber design.', 'Premium Dell ultrabook with InfinityEdge display', '149999.00', '164999.00', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 18, '4.70', 89, TRUE, TRUE, TRUE, '["dell","laptop","ultrabook","intel"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('5beb5a10-e769-447d-9313-8604b5e5fbc6', 'iPad Pro 12.9-inch M2', 'ipad-pro-12-9-inch-m2', 'Powerful iPad Pro with M2 chip, 12.9-inch Liquid Retina XDR display, and Apple Pencil compatibility.', 'iPad Pro with M2 chip and XDR display', '139999.00', '154999.00', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 22, '4.75', 142, TRUE, FALSE, TRUE, '["apple","ipad","tablet","m2-chip"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('14734506-2542-4e48-b4c7-bd57e7e559e9', 'Sony A7 IV Mirrorless Camera', 'sony-a7-iv-mirrorless-camera', 'Professional full-frame mirrorless camera with 33MP sensor, 4K video recording, and advanced autofocus system.', 'Sony full-frame mirrorless camera with 33MP sensor', '124999.00', '139999.00', 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 8, '4.85', 76, TRUE, TRUE, TRUE, '["sony","camera","mirrorless","photography"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('4d02dd88-a7cb-4905-8300-773068109619', 'LG 65-inch OLED C3 TV', 'lg-65-inch-oled-c3-tv', 'Premium OLED smart TV with perfect blacks, vibrant colors, and advanced gaming features including VRR and ALLM.', 'LG 65-inch OLED smart TV with gaming features', '119999.00', '134999.00', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 15, '4.80', 134, TRUE, TRUE, TRUE, '["lg","tv","oled","smart-tv","gaming"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('6a3c5efe-8aec-4f3f-931c-464f1c5bc8f6', 'Nintendo Switch OLED Console', 'nintendo-switch-oled-console', 'Nintendo Switch OLED model with vibrant 7-inch screen, enhanced audio, and 64GB internal storage.', 'Nintendo Switch with OLED display', '89999.00', '99999.00', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 45, '4.75', 189, TRUE, TRUE, TRUE, '["nintendo","gaming","console","portable"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('2492bc19-511c-41cc-ac4b-a142736a8131', 'Apple Watch Series 9', 'apple-watch-series-9', 'Advanced smartwatch with S9 chip, Always-On Retina display, comprehensive health tracking, and cellular connectivity.', 'Apple Watch with S9 chip and health tracking', '78999.00', '87999.00', 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 38, '4.70', 201, TRUE, FALSE, TRUE, '["apple","smartwatch","health","fitness"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('c7b5359b-d3ce-4c1a-8736-c007c788dd4d', 'Sony WH-1000XM5 Headphones', 'sony-wh-1000xm5-headphones', 'Industry-leading noise canceling wireless headphones with exceptional sound quality and 30-hour battery life.', 'Sony noise canceling wireless headphones', '67999.00', '74999.00', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 52, '4.85', 298, TRUE, TRUE, TRUE, '["sony","headphones","noise-canceling","wireless"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('894c68e6-9c98-4b6c-8c78-aaaf19acca82', 'AirPods Pro 2nd Generation', 'airpods-pro-2nd-generation', 'Apple AirPods Pro with H2 chip, adaptive transparency, personalized spatial audio, and USB-C charging case.', 'Apple AirPods Pro with H2 chip', '56999.00', '62999.00', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.75', 345, TRUE, TRUE, TRUE, '["apple","airpods","wireless","noise-canceling"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('c03e1e4b-fa3d-4e41-af26-4fda11929bb0', 'Samsung Galaxy Tab S9 Ultra', 'samsung-galaxy-tab-s9-ultra', 'Premium Android tablet with 14.6-inch display, S Pen included, and powerful performance for productivity and creativity.', 'Samsung premium tablet with S Pen', '54999.00', '59999.00', 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 29, '4.65', 87, TRUE, FALSE, TRUE, '["samsung","tablet","android","s-pen"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('28828efd-0b2d-4737-ab7b-4783296bc75b', 'Canon EOS R6 Mark II', 'canon-eos-r6-mark-ii', 'Advanced mirrorless camera with 24.2MP full-frame sensor, 8K video recording, and exceptional low-light performance.', 'Canon full-frame mirrorless camera', '48999.00', '53999.00', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 16, '4.80', 64, TRUE, FALSE, TRUE, '["canon","camera","mirrorless","video"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('0523c680-fbc1-4c53-9493-6a21b6138ac3', 'Microsoft Surface Pro 9', 'microsoft-surface-pro-9', 'Versatile 2-in-1 laptop tablet with Intel Core i7 processor, 13-inch touchscreen, and all-day battery life.', 'Microsoft 2-in-1 laptop tablet', '42999.00', '47999.00', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 33, '4.60', 112, TRUE, FALSE, TRUE, '["microsoft","surface","2-in-1","tablet"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('028ed50a-9930-445d-a7f9-9103bdc765e6', 'Google Pixel 8 Pro', 'google-pixel-8-pro', 'Google''s flagship smartphone with Tensor G3 chip, advanced AI photography features, and pure Android experience.', 'Google flagship with AI photography', '28999.00', '32999.00', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500', NULL, '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 41, '4.65', 178, TRUE, FALSE, TRUE, '["google","pixel","android","ai-photography"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('bd95a3cc-0827-4738-a602-9a515a5349c2', 'Gucci GG Belt Leather', 'gucci-gg-belt-leather', 'Authentic Gucci leather belt with iconic GG buckle. Premium Italian craftsmanship and timeless luxury design.', 'Gucci leather belt with GG buckle', '45000.00', '49999.00', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 8, '4.85', 34, TRUE, TRUE, TRUE, '["gucci","belt","luxury","leather"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('17ebde86-f6a3-41cf-bf05-2e3a659d95e5', 'Michael Kors Hamilton Handbag', 'michael-kors-hamilton-handbag', 'Premium leather handbag with gold-tone hardware, multiple compartments, and classic Michael Kors styling.', 'Michael Kors premium leather handbag', '38500.00', '42999.00', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 15, '4.70', 89, TRUE, TRUE, TRUE, '["michael-kors","handbag","leather","luxury"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('20a3d3db-c81b-492d-83b3-00f6a7112df2', 'Ray-Ban Aviator Classic Sunglasses', 'ray-ban-aviator-classic-sunglasses', 'Iconic aviator sunglasses with crystal lenses, metal frame, and 100% UV protection. Timeless style and superior quality.', 'Ray-Ban classic aviator sunglasses', '32000.00', '36000.00', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 45, '4.80', 156, TRUE, TRUE, TRUE, '["ray-ban","sunglasses","aviator","classic"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('89c4c1e9-99aa-4bc7-aab7-893b3cdb15be', 'Diesel Sleenker Slim Jeans', 'diesel-sleenker-slim-jeans', 'Premium slim-fit jeans with stretch denim fabric, modern cut, and authentic Diesel styling for contemporary fashion.', 'Diesel slim-fit stretch denim jeans', '28500.00', '32000.00', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 32, '4.65', 78, TRUE, FALSE, TRUE, '["diesel","jeans","denim","slim-fit"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('4ca05e95-a758-49a9-92a0-0c309501cfe3', 'Adidas Ultraboost 22 Running Shoes', 'adidas-ultraboost-22-running-shoes', 'High-performance running shoes with Boost cushioning, Primeknit upper, and Continental rubber outsole for superior comfort.', 'Adidas Ultraboost running shoes with Boost tech', '24999.00', '28999.00', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.75', 234, TRUE, TRUE, TRUE, '["adidas","running-shoes","ultraboost","athletic"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('61b77fd7-ab60-4679-ac69-3c2b6630115f', 'Nike Air Max 270 Sneakers', 'nike-air-max-270-sneakers', 'Lifestyle sneakers with large Air Max unit in heel, breathable mesh upper, and modern athletic design for all-day comfort.', 'Nike Air Max lifestyle sneakers', '21500.00', '24999.00', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.70', 189, TRUE, TRUE, TRUE, '["nike","sneakers","air-max","lifestyle"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('245d2618-2695-40fd-bd90-61f05429b808', 'Levi''s 501 Original Jeans', 'levis-501-original-jeans', 'Classic straight-leg jeans with original fit, button fly, and iconic Levi''s styling. A timeless wardrobe essential.', 'Levi''s classic 501 straight-leg jeans', '18999.00', '21999.00', 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 56, '4.60', 145, TRUE, FALSE, TRUE, '["levis","jeans","501","classic"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('bb3edd0c-03af-41af-b801-640784c5856f', 'H&M Summer Dress Collection', 'hm-summer-dress-collection', 'Stylish summer dress with flowing fabric, flattering cut, and versatile design perfect for casual or semi-formal occasions.', 'H&M stylish summer dress', '16500.00', '19999.00', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 43, '4.55', 67, TRUE, FALSE, TRUE, '["hm","dress","summer","casual"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('049b8ab6-3a15-4d4b-bfcc-4f25fd89246b', 'Converse Chuck Taylor All Star', 'converse-chuck-taylor-all-star', 'Iconic canvas sneakers with rubber toe cap, high-top design, and classic Converse styling. A timeless fashion statement.', 'Converse classic Chuck Taylor sneakers', '14999.00', '17999.00', 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 78, '4.65', 201, TRUE, TRUE, TRUE, '["converse","sneakers","chuck-taylor","canvas"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('0d91d774-5669-44cf-968f-8ffd4f3a7915', 'Zara Wool Blazer', 'zara-wool-blazer', 'Professional wool blazer with tailored fit, notched lapels, and modern styling perfect for business or formal occasions.', 'Zara tailored wool blazer', '12999.00', '15999.00', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 28, '4.60', 89, TRUE, FALSE, TRUE, '["zara","blazer","wool","professional"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('8b59420f-ea41-4238-987a-92990aef26a3', 'Calvin Klein Cotton T-Shirt', 'calvin-klein-cotton-t-shirt', 'Premium cotton t-shirt with comfortable fit, soft fabric, and classic Calvin Klein logo. Essential wardrobe basic.', 'Calvin Klein premium cotton t-shirt', '9999.00', '12999.00', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 125, '4.50', 178, TRUE, FALSE, TRUE, '["calvin-klein","t-shirt","cotton","basic"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('a82a36c9-3e9b-452e-85f3-5114a15410c2', 'Adidas Track Pants', 'adidas-track-pants', 'Comfortable athletic track pants with three stripes design, elasticated waist, and breathable fabric for active lifestyle.', 'Adidas athletic track pants', '8500.00', '10999.00', 'https://images.unsplash.com/photo-1506629905607-d8b36cfe4c4c?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.55', 134, TRUE, FALSE, TRUE, '["adidas","track-pants","athletic","sportswear"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('ee49f19c-bbb7-4df7-aaf5-64e2638bd0ea', 'Uniqlo Polo Shirt', 'uniqlo-polo-shirt', 'Classic polo shirt with moisture-wicking fabric, comfortable collar, and versatile design suitable for casual or smart-casual wear.', 'Uniqlo classic polo shirt', '6999.00', '8999.00', 'https://images.unsplash.com/photo-1503341338655-b814c5d61949?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.45', 156, TRUE, FALSE, TRUE, '["uniqlo","polo","shirt","casual"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('56432400-f24a-49da-8b1e-c7c5e97b6e00', 'H&M Basic Hoodie', 'hm-basic-hoodie', 'Comfortable cotton hoodie with kangaroo pocket, adjustable hood, and relaxed fit perfect for casual everyday wear.', 'H&M comfortable cotton hoodie', '5500.00', '7999.00', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 145, '4.40', 223, TRUE, FALSE, TRUE, '["hm","hoodie","cotton","casual"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('20f54447-987f-4c7d-8a3b-07881879cdef', 'Cotton Socks Pack of 5', 'cotton-socks-pack-of-5', 'Comfortable cotton socks pack with reinforced heel and toe, breathable fabric, and variety of colors for everyday wear.', 'Cotton socks 5-pack for everyday wear', '3500.00', '4999.00', 'https://images.unsplash.com/photo-1586350977415-bfb24977eb8e?w=500', NULL, 'a0f13e79-e58a-4717-ad89-dab02017183c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 234, '4.35', 189, TRUE, FALSE, TRUE, '["socks","cotton","pack","everyday"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('4f719000-ab29-4628-9f30-6102d61baa7f', 'KitchenAid Stand Mixer Pro', 'kitchenaid-stand-mixer-pro', 'Professional-grade stand mixer with 6-quart bowl, 10-speed settings, and powerful motor for all baking and cooking needs.', 'KitchenAid professional stand mixer', '89999.00', '99999.00', 'https://images.unsplash.com/photo-1578237281639-eba9bc13e71a?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 12, '4.90', 145, TRUE, TRUE, TRUE, '["kitchenaid","mixer","baking","professional"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('74db0b3e-2e73-40d1-aa40-2ccaa8aceb56', 'Dyson V15 Detect Cordless Vacuum', 'dyson-v15-detect-cordless-vacuum', 'Advanced cordless vacuum with laser dust detection, powerful suction, and intelligent cleaning technology for every surface.', 'Dyson cordless vacuum with laser detection', '78999.00', '87999.00', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 18, '4.85', 234, TRUE, TRUE, TRUE, '["dyson","vacuum","cordless","cleaning"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('c6159a52-f209-4585-a239-38a22bc18738', 'IKEA L-Shaped Sectional Sofa', 'ikea-l-shaped-sectional-sofa', 'Comfortable L-shaped sectional sofa with removable covers, durable frame, and modern Scandinavian design for living room.', 'IKEA L-shaped sectional sofa', '65999.00', '74999.00', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 8, '4.70', 89, TRUE, TRUE, TRUE, '["ikea","sofa","sectional","furniture"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('deda3a3b-2188-4c14-b007-00beda0fb38a', 'Instant Pot Pressure Cooker 8Qt', 'instant-pot-pressure-cooker-8qt', 'Multi-functional electric pressure cooker with 7-in-1 capabilities including slow cooking, rice cooking, and steaming.', 'Instant Pot 8-quart pressure cooker', '52999.00', '59999.00', 'https://images.unsplash.com/photo-1585515656676-3a4d1f8f3b9c?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 28, '4.80', 345, TRUE, TRUE, TRUE, '["instant-pot","pressure-cooker","kitchen","cooking"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('4df48353-3c00-47ef-8bc7-d3545088edd3', 'Memory Foam Mattress Queen Size', 'memory-foam-mattress-queen-size', 'Premium memory foam mattress with cooling gel layer, medium firmness, and superior support for comfortable sleep.', 'Queen size memory foam mattress with cooling gel', '47999.00', '54999.00', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 15, '4.75', 156, TRUE, FALSE, TRUE, '["mattress","memory-foam","queen","sleep"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('7a9dee43-154d-42e9-8447-81d649c4206e', 'Smart Robot Vacuum Cleaner', 'smart-robot-vacuum-cleaner', 'Intelligent robot vacuum with mapping technology, app control, automatic charging, and powerful suction for effortless cleaning.', 'Smart robot vacuum with mapping technology', '42999.00', '49999.00', 'https://images.unsplash.com/photo-1625869016774-b5ee2b1b5b4c?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 22, '4.65', 178, TRUE, TRUE, TRUE, '["robot","vacuum","smart","cleaning"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('ce934e06-21f4-4f66-a890-c95b5de3b8f2', 'Air Fryer XL Digital 8L', 'air-fryer-xl-digital-8l', 'Large capacity digital air fryer with touchscreen controls, multiple cooking presets, and healthy oil-free cooking technology.', 'Digital air fryer 8L with touchscreen controls', '38999.00', '44999.00', 'https://images.unsplash.com/photo-1586511925558-a4c6376fe65f?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 35, '4.70', 267, TRUE, TRUE, TRUE, '["air-fryer","kitchen","healthy-cooking","digital"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('5ad85df4-f1e6-4fdb-8639-7e063b554f38', 'Coffee Maker Machine Pro', 'coffee-maker-machine-pro', 'Professional coffee maker with programmable brewing, thermal carafe, built-in grinder, and smartphone app control.', 'Professional coffee maker with built-in grinder', '34999.00', '39999.00', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 42, '4.60', 198, TRUE, FALSE, TRUE, '["coffee-maker","kitchen","grinder","programmable"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('bcb4af29-449d-44f6-a5d9-18a2a6e14163', 'Multi-Storage Ottoman Bench', 'multi-storage-ottoman-bench', 'Versatile storage ottoman with padded top, spacious interior compartment, and modern design perfect for any room.', 'Storage ottoman bench with padded top', '29999.00', '34999.00', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 18, '4.55', 134, TRUE, FALSE, TRUE, '["ottoman","storage","furniture","bench"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('0c0bbf84-17c5-4603-bec0-79ea18d3a014', 'Ninja Blender Pro with Cups', 'ninja-blender-pro-with-cups', 'High-performance blender with powerful motor, multiple blending cups, and nutrient extraction technology for smoothies.', 'Ninja high-performance blender with cups', '24999.00', '29999.00', 'https://images.unsplash.com/photo-1610432256852-51e16c250b19?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 56, '4.65', 289, TRUE, FALSE, TRUE, '["ninja","blender","smoothies","kitchen"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('f133791f-32f4-4945-a7cb-694135e064bf', 'Ceramic Non-Stick Cookware Set', 'ceramic-non-stick-cookware-set', 'Complete 12-piece ceramic non-stick cookware set with pots, pans, and utensils for healthy cooking and easy cleanup.', '12-piece ceramic non-stick cookware set', '19999.00', '24999.00', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 34, '4.60', 167, TRUE, FALSE, TRUE, '["cookware","ceramic","non-stick","kitchen"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('b282d244-a53d-489a-9559-413be5ad6f66', 'LED Desk Lamp with Wireless Charging', 'led-desk-lamp-with-wireless-charging', 'Modern LED desk lamp with adjustable brightness, wireless charging base, and sleek design for home office setup.', 'LED desk lamp with wireless charging base', '14999.00', '18999.00', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.50', 145, TRUE, FALSE, TRUE, '["led","desk-lamp","wireless-charging","office"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('793e4630-2ac2-430e-b7d6-7573becfdb22', 'Bamboo Cutting Board Set', 'bamboo-cutting-board-set', 'Eco-friendly bamboo cutting board set with different sizes, knife-friendly surface, and antimicrobial properties.', 'Eco-friendly bamboo cutting board set', '9999.00', '12999.00', 'https://images.unsplash.com/photo-1556909000-f391d45e4d7d?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.45', 234, TRUE, FALSE, TRUE, '["bamboo","cutting-board","eco-friendly","kitchen"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('aac22683-5f58-4489-82cc-5cbf62edc2ce', 'Microfiber Towel Set', 'microfiber-towel-set', 'Soft microfiber towel set with high absorbency, quick-dry technology, and variety of sizes for bathroom essentials.', 'Microfiber towel set with quick-dry technology', '7999.00', '9999.00', 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 145, '4.40', 178, TRUE, FALSE, TRUE, '["microfiber","towels","bathroom","quick-dry"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('949500b0-9441-496e-9dc4-af3981760630', 'Glass Food Storage Containers', 'glass-food-storage-containers', 'BPA-free glass food storage containers with airtight lids, microwave-safe design, and stackable organization system.', 'Glass food storage containers with airtight lids', '4500.00', '5999.00', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', NULL, '2d9a8a3c-00fd-4e39-874b-6216189e563c', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 234, '4.35', 345, TRUE, FALSE, TRUE, '["glass","storage","food-containers","kitchen"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('c640b431-7a2a-4fd0-8166-780f3ee7a4a5', 'MAC Lipstick Ruby Woo', 'mac-lipstick-ruby-woo', 'Iconic MAC lipstick in Ruby Woo shade with matte finish, long-lasting formula, and vibrant red color.', 'MAC Ruby Woo matte lipstick', '3800.00', '4200.00', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.75', 345, TRUE, TRUE, TRUE, '["mac","lipstick","makeup","matte"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('c5e1340a-de48-482c-b69c-08bc6360e41d', 'Neutrogena Sunscreen SPF 50', 'neutrogena-sunscreen-spf-50', 'Broad spectrum sunscreen with SPF 50 protection, water-resistant formula, and lightweight texture for daily use.', 'Neutrogena SPF 50 broad spectrum sunscreen', '3200.00', '3800.00', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.70', 234, TRUE, TRUE, TRUE, '["neutrogena","sunscreen","spf-50","skincare"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('44946130-082f-4509-be3b-9984f1eb4cca', 'L''Oreal Paris Professional Shampoo', 'loreal-paris-professional-shampoo', 'Professional-grade shampoo with nourishing formula, sulfate-free ingredients, and salon-quality results for all hair types.', 'L''Oreal professional sulfate-free shampoo', '2800.00', '3200.00', 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 125, '4.65', 189, TRUE, FALSE, TRUE, '["loreal","shampoo","haircare","professional"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('abe31ef8-3927-4de9-bb84-9ef9b02636d9', 'Gillette Fusion5 Razor with Blades', 'gillette-fusion5-razor-with-blades', 'Premium men''s razor with 5-blade technology, precision trimmer, and comfortable grip for smooth shaving experience.', 'Gillette Fusion5 5-blade razor system', '2500.00', '2999.00', 'https://images.unsplash.com/photo-1503341338655-b814c5d61949?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 78, '4.60', 156, TRUE, FALSE, TRUE, '["gillette","razor","shaving","mens-care"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('767e59e0-777f-425d-b7b0-ef28770ee91b', 'Nivea Body Lotion Intensive Care', 'nivea-body-lotion-intensive-care', 'Deep moisturizing body lotion with 48-hour hydration, aloe vera extracts, and gentle formula for soft skin.', 'Nivea intensive care body lotion', '2200.00', '2600.00', 'https://images.unsplash.com/photo-1629710419680-77acda3f1fbc?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 156, '4.55', 278, TRUE, FALSE, TRUE, '["nivea","body-lotion","moisturizer","skincare"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('5d5d7c4f-2313-455d-bd99-6182cc735a0f', 'Maybelline Great Lash Mascara', 'maybelline-great-lash-mascara', 'Classic mascara with lengthening and volumizing formula, easy-to-use wand, and long-lasting wear for beautiful lashes.', 'Maybelline Great Lash volumizing mascara', '1999.00', '2400.00', 'https://images.unsplash.com/photo-1583064313642-a7c149480c7e?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 234, '4.50', 345, TRUE, TRUE, TRUE, '["maybelline","mascara","makeup","volumizing"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('80d35574-1e1b-43b6-9b22-d49b663eadd1', 'Head & Shoulders Anti-Dandruff Shampoo', 'head-shoulders-anti-dandruff-shampoo', 'Effective anti-dandruff shampoo with zinc pyrithione formula, gentle cleansing action, and 24-hour protection.', 'Head & Shoulders anti-dandruff shampoo', '1800.00', '2200.00', 'https://images.unsplash.com/photo-1556228578-dd0f4ba23d8b?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 167, '4.45', 234, TRUE, FALSE, TRUE, '["head-shoulders","shampoo","anti-dandruff","haircare"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('b1d0374a-ba99-4668-b3fe-ca082d1f734d', 'CeraVe Foaming Facial Cleanser', 'cerave-foaming-facial-cleanser', 'Gentle foaming cleanser with ceramides and hyaluronic acid, suitable for normal to oily skin, and dermatologist-recommended.', 'CeraVe foaming cleanser with ceramides', '1600.00', '1999.00', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 123, '4.65', 189, TRUE, TRUE, TRUE, '["cerave","cleanser","skincare","ceramides"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('991aef38-3c10-4d8f-a306-1dfaa42e195d', 'Johnson''s Baby Oil Pure', 'johnsons-baby-oil-pure', 'Pure mineral baby oil with hypoallergenic formula, gentle moisturizing properties, and clinically proven mildness.', 'Johnson''s pure mineral baby oil', '1400.00', '1700.00', 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 189, '4.40', 267, TRUE, FALSE, TRUE, '["johnsons","baby-oil","moisturizer","gentle"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('227986dc-e1cd-4e72-8886-834eacb5ad65', 'Colgate Total Toothpaste', 'colgate-total-toothpaste', 'Advanced toothpaste with 12-hour antibacterial protection, fluoride formula, and comprehensive oral health benefits.', 'Colgate Total antibacterial toothpaste', '1200.00', '1500.00', 'https://images.unsplash.com/photo-1609873814058-19f14040e60e?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 345, '4.35', 456, TRUE, FALSE, TRUE, '["colgate","toothpaste","oral-care","antibacterial"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('b9ff3923-1c4e-4524-b013-4699c53c148f', 'Vaseline Pure Petroleum Jelly', 'vaseline-pure-petroleum-jelly', 'Pure petroleum jelly with healing properties, versatile moisturizing uses, and gentle formula for sensitive skin.', 'Vaseline pure petroleum jelly', '999.00', '1200.00', 'https://images.unsplash.com/photo-1559566114-db01fb22b73b?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 289, '4.30', 345, TRUE, FALSE, TRUE, '["vaseline","petroleum-jelly","moisturizer","healing"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('1a65d864-c87c-4f29-8af6-a49ae427e73f', 'Dove Beauty Bar Soap', 'dove-beauty-bar-soap', 'Moisturizing beauty bar with 1/4 moisturizing cream, gentle cleansing formula, and suitable for daily use on face and body.', 'Dove moisturizing beauty bar soap', '800.00', '999.00', 'https://images.unsplash.com/photo-1585565804923-3c4982dbf3c8?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 456, '4.25', 567, TRUE, FALSE, TRUE, '["dove","soap","moisturizing","gentle"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('4af188f5-ff1d-4c3d-ace3-7d72dac1194b', 'Band-Aid Adhesive Bandages', 'band-aid-adhesive-bandages', 'Sterile adhesive bandages with flexible fabric, secure adhesion, and protective covering for minor cuts and wounds.', 'Band-Aid sterile adhesive bandages', '600.00', '800.00', 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 678, '4.20', 234, TRUE, FALSE, TRUE, '["band-aid","bandages","first-aid","adhesive"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('1c23f696-e6e6-4692-925c-c28968edd1de', 'Cotton Swabs Pack', 'cotton-swabs-pack', 'Soft cotton swabs with plastic stems, hygienic packaging, and versatile use for personal care and cleaning applications.', 'Cotton swabs pack for personal care', '300.00', '450.00', 'https://images.unsplash.com/photo-1559762474-c2d18db76b7a?w=500', NULL, '22ecd9cd-fde3-4b18-a382-5c8fd477700a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 789, '4.15', 456, TRUE, FALSE, TRUE, '["cotton-swabs","personal-care","hygiene","cleaning"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('16f69eb5-ac68-4daf-94d8-9ffd4b3bdffc', 'Running Watch Garmin Forerunner', 'running-watch-garmin-forerunner', 'Advanced GPS running watch with heart rate monitoring, training metrics, and long battery life for serious athletes.', 'Garmin GPS running watch with heart rate monitor', '25000.00', '28999.00', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 23, '4.85', 156, TRUE, TRUE, TRUE, '["garmin","running-watch","gps","fitness"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('158ea00f-ad90-44cf-a342-ccbebfb40b67', 'Golf Club Set Complete', 'golf-club-set-complete', 'Complete golf club set with driver, irons, wedges, putter, and golf bag. Perfect for beginners and intermediate players.', 'Complete golf club set with bag', '22000.00', '25999.00', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 12, '4.70', 89, TRUE, TRUE, TRUE, '["golf","clubs","complete-set","sports"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('3f4ec628-2a6f-459d-ad78-d0261f07d429', 'Dumbbells Set 20kg Adjustable', 'dumbbells-set-20kg-adjustable', 'Adjustable dumbbell set with 20kg total weight, secure locking mechanism, and space-saving design for home workouts.', '20kg adjustable dumbbell set', '18999.00', '22999.00', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 34, '4.75', 234, TRUE, TRUE, TRUE, '["dumbbells","weights","adjustable","home-gym"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('ad8b0ec3-1052-4915-b899-55cfb8f15c51', 'Camping Tent 4-Person Waterproof', 'camping-tent-4-person-waterproof', 'Waterproof 4-person camping tent with easy setup and excellent ventilation. Perfect for family camping adventures and outdoor activities.', 'Waterproof 4-person camping tent', '16500.00', '19999.00', 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 19, '4.60', 145, TRUE, TRUE, TRUE, '["camping","tent","waterproof","outdoor"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('22261cef-d52f-4ce2-99a8-a763ea3f0d2b', 'Boxing Gloves Everlast Professional', 'boxing-gloves-everlast-professional', 'Professional boxing gloves with premium leather construction, secure wrist support, and comfortable padding for training.', 'Everlast professional boxing gloves', '14999.00', '17999.00', 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 45, '4.65', 178, TRUE, FALSE, TRUE, '["boxing","gloves","everlast","training"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('bbcc2be8-4f17-47b4-9cad-bf6b8d4087e8', 'Nike Air Zoom Pegasus 40', 'nike-air-zoom-pegasus-40', 'Premium running shoes with Air Zoom cushioning, breathable mesh upper, and responsive performance for daily training.', 'Nike Air Zoom running shoes', '12999.00', '15999.00', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.70', 234, TRUE, TRUE, TRUE, '["nike","running-shoes","air-zoom","pegasus"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('a0079e8a-1085-4a27-9a4a-f1558631bde8', 'Cricket Bat Kookaburra Willow', 'cricket-bat-kookaburra-willow', 'Professional cricket bat made from English willow, balanced design, and superior performance for serious cricket players.', 'Kookaburra English willow cricket bat', '11500.00', '13999.00', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 28, '4.65', 89, TRUE, FALSE, TRUE, '["cricket","bat","kookaburra","willow"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('983c5d42-6822-4648-a989-5e3d911e477c', 'Basketball Spalding Official Size', 'basketball-spalding-official-size', 'Official size basketball with composite leather construction, excellent grip, and professional-grade performance.', 'Spalding official size basketball', '9999.00', '12999.00', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 78, '4.60', 156, TRUE, FALSE, TRUE, '["basketball","spalding","official","sports"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('a3cccc4d-7939-46de-88ba-3eb0efcb2f29', 'Bicycle Helmet Safety Certified', 'bicycle-helmet-safety-certified', 'Safety-certified bicycle helmet with adjustable fit, ventilation system, and impact-resistant construction for cycling protection.', 'Safety-certified bicycle helmet', '8500.00', '10999.00', 'https://images.unsplash.com/photo-1544966503-7cc1efe200b0?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.55', 234, TRUE, FALSE, TRUE, '["bicycle","helmet","safety","cycling"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('682eb19c-198f-4103-8ae6-8938ae82a013', 'Adidas Football Soccer Ball', 'adidas-football-soccer-ball', 'Professional soccer ball with FIFA-approved quality, durable construction, and excellent flight characteristics for training and matches.', 'Adidas FIFA-approved soccer ball', '7500.00', '9999.00', 'https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 125, '4.70', 289, TRUE, TRUE, TRUE, '["adidas","football","soccer","fifa"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('92f1d8d5-97af-4e98-9c71-05c114bebd44', 'Yoga Mat Premium Non-Slip', 'yoga-mat-premium-non-slip', 'Premium yoga mat with non-slip surface, extra cushioning, and eco-friendly materials for comfortable practice sessions.', 'Premium non-slip yoga mat', '6500.00', '8999.00', 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 156, '4.50', 345, TRUE, FALSE, TRUE, '["yoga","mat","non-slip","fitness"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('63c0ee94-97f8-4d8c-88ea-a12ba746359d', 'Protein Shaker Bottle BPA-Free', 'protein-shaker-bottle-bpa-free', 'BPA-free protein shaker bottle with mixing ball, leak-proof lid, and measurement markings for fitness supplements.', 'BPA-free protein shaker bottle', '4999.00', '6999.00', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 234, '4.45', 456, TRUE, FALSE, TRUE, '["protein","shaker","bottle","fitness"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('b42fc56a-693b-48ee-b148-eda882a97a7d', 'Swimming Goggles Anti-Fog', 'swimming-goggles-anti-fog', 'Professional swimming goggles with anti-fog coating, UV protection, and comfortable adjustable straps for pool and open water.', 'Anti-fog swimming goggles with UV protection', '3500.00', '4999.00', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 189, '4.40', 234, TRUE, FALSE, TRUE, '["swimming","goggles","anti-fog","water-sports"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('07721ae1-6681-4709-a91f-b932cf565961', 'Resistance Bands Set', 'resistance-bands-set', 'Complete resistance bands set with multiple resistance levels, door anchor, and exercise guide for full-body workouts.', 'Complete resistance bands workout set', '2500.00', '3999.00', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 345, '4.35', 567, TRUE, FALSE, TRUE, '["resistance-bands","exercise","home-workout","fitness"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('d4cb7197-89f2-407a-868b-3d750370581f', 'Skipping Rope Speed', 'skipping-rope-speed', 'Speed skipping rope with ball bearing system, adjustable length, and comfortable handles for cardio fitness training.', 'Speed skipping rope with ball bearings', '800.00', '1200.00', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', NULL, 'cfbe5cb4-0f77-4580-a6b5-1199a9a69338', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 456, '4.30', 234, TRUE, FALSE, TRUE, '["skipping-rope","cardio","fitness","exercise"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('0f94906e-a0ea-425a-99bb-166cbe12d736', 'Atomic Habits by James Clear', 'atomic-habits-james-clear', 'Transformative guide to building good habits and breaking bad ones through the power of small, incremental changes.', 'Transform your life with small habit changes', '2500.00', '2999.00', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 45, '4.85', 567, TRUE, TRUE, TRUE, '["habits","self-improvement","psychology","productivity"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('80f32c0a-98ce-4f3e-ae04-361aa3978c4a', 'The Psychology of Money', 'the-psychology-of-money', 'Insightful exploration of how psychology affects our financial decisions and the true nature of wealth and happiness.', 'Understanding the psychology behind money decisions', '2400.00', '2799.00', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.80', 345, TRUE, TRUE, TRUE, '["finance","psychology","wealth","investment"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('8370558c-ca1d-4574-aca8-ba34df297be2', 'Sapiens: A Brief History of Humankind', 'sapiens-brief-history-humankind', 'Fascinating journey through human history, exploring how we became the dominant species and shaped the modern world.', 'A captivating journey through human history', '2300.00', '2699.00', 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 34, '4.75', 234, TRUE, TRUE, TRUE, '["history","anthropology","science","evolution"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('1705f873-8e98-4157-82fe-c725df0cfae2', 'Rich Dad Poor Dad', 'rich-dad-poor-dad', 'Revolutionary approach to money and investing that challenges conventional wisdom about wealth building and financial education.', 'Revolutionary approach to wealth building', '2200.00', '2599.00', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.70', 456, TRUE, TRUE, TRUE, '["finance","investing","wealth","education"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('5f9c0206-4346-4dce-bf60-0eab09cd8f2a', 'The 7 Habits of Highly Effective People', '7-habits-highly-effective-people', 'Timeless principles for personal and professional effectiveness, focusing on character-based leadership and success.', 'Timeless principles for personal effectiveness', '2100.00', '2499.00', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 78, '4.65', 345, TRUE, FALSE, TRUE, '["leadership","self-improvement","habits","success"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('38c4f502-8a47-4331-add8-7593797a2221', 'Good to Great by Jim Collins', 'good-to-great-jim-collins', 'Research-driven insights into what makes companies transition from good performance to sustained greatness over time.', 'What makes companies achieve sustained greatness', '2000.00', '2399.00', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 56, '4.70', 234, TRUE, FALSE, TRUE, '["business","leadership","management","strategy"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('6c254351-60a0-40ca-80e0-d6cc280aff63', 'How to Win Friends and Influence People', 'how-to-win-friends-influence-people', 'Classic guide to interpersonal skills, communication, and building meaningful relationships in personal and professional life.', 'Master the art of interpersonal relationships', '1900.00', '2299.00', 'https://images.unsplash.com/photo-1544716278-e513176f20b5?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 123, '4.60', 567, TRUE, TRUE, TRUE, '["communication","relationships","influence","social-skills"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('f167a5bf-14c8-418d-a766-ba4121cd8888', 'The Alchemist by Paulo Coelho', 'the-alchemist-paulo-coelho', 'Inspiring tale of a young shepherd''s journey to find treasure, discovering life''s most important lessons along the way.', 'An inspiring journey of self-discovery', '1800.00', '2199.00', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 145, '4.55', 789, TRUE, TRUE, TRUE, '["fiction","inspiration","philosophy","adventure"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('64ac8b24-05ea-44db-b34c-ea207a850e5e', '1984 by George Orwell', '1984-george-orwell', 'Dystopian masterpiece exploring themes of totalitarianism, surveillance, and the power of language in controlling thought.', 'Orwell''s dystopian masterpiece about totalitarianism', '1700.00', '2099.00', 'https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.80', 456, TRUE, TRUE, TRUE, '["fiction","dystopian","classic","politics"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('2e4e474b-f78c-44bf-8060-59e414d2fa36', 'Harry Potter and the Sorcerer''s Stone', 'harry-potter-sorcerers-stone', 'Magical beginning of Harry Potter''s journey at Hogwarts School of Witchcraft and Wizardry in this beloved fantasy classic.', 'The magical beginning of Harry Potter''s journey', '1600.00', '1999.00', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 234, '4.90', 1234, TRUE, TRUE, TRUE, '["fantasy","magic","adventure","young-adult"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('1e223449-0ba6-4d6f-8456-cf04ee9a1120', 'Think and Grow Rich', 'think-and-grow-rich', 'Napoleon Hill''s timeless principles of success and wealth creation based on interviews with the most successful people of his era.', 'Timeless principles of success and wealth', '1500.00', '1899.00', 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 67, '4.65', 345, TRUE, FALSE, TRUE, '["success","wealth","mindset","achievement"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('22cdc9b8-31ed-4647-9b2f-76358e44dd01', 'The Lean Startup', 'the-lean-startup', 'Revolutionary approach to creating and managing successful startups through validated learning and continuous innovation.', 'Revolutionary approach to startup success', '1400.00', '1799.00', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 45, '4.60', 234, TRUE, FALSE, TRUE, '["startup","entrepreneurship","innovation","business"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('d3076ee9-7345-4ffb-b2a5-147382c36ab0', 'The Power of Now', 'the-power-of-now', 'Spiritual guide to living in the present moment and finding peace, happiness, and enlightenment in everyday life.', 'Guide to living in the present moment', '1300.00', '1699.00', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 78, '4.55', 456, TRUE, FALSE, TRUE, '["spirituality","mindfulness","meditation","self-help"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('818ae7c7-585f-4149-b8c3-0ee38a23a4e4', 'The Catcher in the Rye', 'the-catcher-in-the-rye', 'J.D. Salinger''s iconic coming-of-age novel following Holden Caulfield''s journey through adolescence and alienation.', 'Salinger''s iconic coming-of-age novel', '1200.00', '1599.00', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 89, '4.50', 234, TRUE, FALSE, TRUE, '["fiction","coming-of-age","classic","literature"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z'),
  ('0683b8b7-3a80-4da3-9624-76d85fd8f883', 'The 4-Hour Workweek', 'the-4-hour-workweek', 'Tim Ferriss''s guide to escaping the 9-to-5 grind, living anywhere, and achieving the new rich lifestyle through automation.', 'Escape the 9-to-5 and live anywhere', '1100.00', '1499.00', 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=500', NULL, '96636d15-b1f5-4f42-af74-0eee521d8f1a', NULL, NULL, '74bf6c33-7f09-4844-903d-72bff3849c95', 123, '4.45', 345, TRUE, FALSE, TRUE, '["productivity","lifestyle","entrepreneurship","automation"]', '2025-09-10T18:02:54.696Z', '2025-09-10T18:02:54.696Z');

ALTER TABLE "products" ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");


-- Table: services (35 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "services" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING(200) NOT NULL,
  "slug" CHARACTER VARYING(200) NOT NULL,
  "description" TEXT,
  "short_description" CHARACTER VARYING(500),
  "price" NUMERIC(10,2) NOT NULL,
  "price_type" CHARACTER VARYING(20) DEFAULT 'fixed'::character varying,
  "image_url" CHARACTER VARYING,
  "image_urls" ARRAY,
  "category_id" UUID,
  "provider_id" CHARACTER VARYING,
  "rating" NUMERIC(3,2) DEFAULT '0'::numeric,
  "review_count" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "is_featured" BOOLEAN DEFAULT false,
  "admin_approved" BOOLEAN DEFAULT false,
  "tags" ARRAY,
  "location" CHARACTER VARYING,
  "is_available_today" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "services" ("id", "name", "slug", "description", "short_description", "price", "price_type", "image_url", "image_urls", "category_id", "provider_id", "rating", "review_count", "is_active", "is_featured", "admin_approved", "tags", "location", "is_available_today", "created_at", "updated_at") VALUES
  ('7e560be4-8852-4289-870e-3e62e0e3ae79', 'Carpentry & Furniture Repair', 'carpentry-furniture-repair', 'Skilled carpenter for custom furniture, cabinet installation, door hanging, window repairs, and general woodworking projects.', 'Custom furniture, cabinets, door repairs', '2200.00', 'hourly', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '0.00', 0, TRUE, TRUE, TRUE, '["carpentry","furniture","woodworking","hourly"]', 'Nairobi & Surrounding Areas', TRUE, '2025-08-13T09:19:27.572Z', '2025-08-13T09:19:27.572Z'),
  ('72db38e3-5796-4620-b209-6983ec0cefd8', 'Home Cleaning Service', 'home-cleaning-service', 'Professional home cleaning service including deep cleaning, regular maintenance, and specialized cleaning for all room types.', 'Professional deep cleaning and maintenance', '1800.00', 'hourly', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '0.00', 0, TRUE, TRUE, TRUE, '["cleaning","home-service","hourly"]', 'Nairobi Metro', TRUE, '2025-09-10T17:50:01.730Z', '2025-09-10T17:50:01.730Z'),
  ('40c91edf-0404-4053-8269-d1bc4e6092cc', 'Electrical Installation & Repair', 'electrical-installation-repair', 'Licensed electrician for home electrical work, wiring, fixture installation, troubleshooting, and safety inspections.', 'Licensed electrical work and repairs', '2500.00', 'hourly', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '0.00', 0, TRUE, TRUE, TRUE, '["electrical","wiring","home-service","hourly"]', 'Nairobi Metro', FALSE, '2025-09-10T17:50:01.730Z', '2025-09-10T17:50:01.730Z'),
  ('46918a3c-44a6-4ceb-841a-b3ef28dfc30e', 'Web Development & Design', 'web-development-design', 'Full-stack web development services including responsive design, e-commerce solutions, and modern web applications using latest technologies.', 'Full-stack web development and responsive design', '75000.00', 'fixed', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.85', 34, TRUE, TRUE, TRUE, '["web-development","design","programming","technology"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('3ade7ab9-c383-4164-8dfe-872c35c73962', 'Graphic Design & Branding', 'graphic-design-branding', 'Professional graphic design services including logo creation, brand identity, marketing materials, and visual communication solutions.', 'Logo design, branding, and marketing materials', '45000.00', 'fixed', 'https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.80', 67, TRUE, TRUE, TRUE, '["graphic-design","branding","logo","creative"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('f2d1b610-67ac-41c0-9c2a-538d81fd5ee9', 'Digital Marketing & SEO', 'digital-marketing-seo', 'Comprehensive digital marketing services including SEO optimization, social media management, content strategy, and online advertising campaigns.', 'SEO, social media, and digital advertising', '35000.00', 'fixed', 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.75', 45, TRUE, TRUE, TRUE, '["digital-marketing","seo","social-media","advertising"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('be60d3eb-8087-43ba-ac1c-fb29e5f1e880', 'Accounting & Bookkeeping', 'accounting-bookkeeping', 'Professional accounting services including bookkeeping, tax preparation, financial statements, and business financial management.', 'Bookkeeping, tax prep, and financial management', '28000.00', 'fixed', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.70', 89, TRUE, FALSE, TRUE, '["accounting","bookkeeping","tax","financial"]', 'Nairobi & Remote', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('6e8831b5-2db7-4085-acb6-607717973262', 'Legal Consultation & Advisory', 'legal-consultation-advisory', 'Professional legal services including business law, contract drafting, legal advisory, and document review by qualified attorneys.', 'Business law, contracts, and legal advisory', '25000.00', 'hourly', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.90', 23, TRUE, TRUE, TRUE, '["legal","law","contracts","advisory"]', 'Nairobi CBD', FALSE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('e98f198e-c2e7-45ba-b76d-ea55ad425ad2', 'Content Writing & Copywriting', 'content-writing-copywriting', 'Professional writing services including blog posts, website copy, marketing content, technical writing, and editorial services.', 'Blog posts, website copy, and marketing content', '18000.00', 'fixed', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.65', 156, TRUE, FALSE, TRUE, '["writing","content","copywriting","marketing"]', 'Remote', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('1765dc99-a670-4aa3-b57c-f9642cb2ac88', 'Translation & Language Services', 'translation-language-services', 'Professional translation services for English, Swahili, and other languages including document translation and interpretation.', 'Document translation and interpretation services', '15000.00', 'fixed', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.60', 78, TRUE, FALSE, TRUE, '["translation","language","interpretation","documents"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('9047a20f-8759-4ec1-b45e-bb5a3227a5e2', 'Business Consulting & Strategy', 'business-consulting-strategy', 'Strategic business consulting including market analysis, business planning, operational improvement, and growth strategies.', 'Business planning and strategic consulting', '12000.00', 'hourly', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.75', 45, TRUE, FALSE, TRUE, '["business","consulting","strategy","planning"]', 'Nairobi & Remote', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('1744686c-5fbc-4cc1-9566-0c109e83fd2d', 'IT Support & Computer Repair', 'it-support-computer-repair', 'Comprehensive IT support including computer repair, network setup, software installation, and technical troubleshooting.', 'Computer repair and IT technical support', '8000.00', 'hourly', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.55', 234, TRUE, FALSE, TRUE, '["it-support","computer-repair","technical","troubleshooting"]', 'Nairobi Metro', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('9a4bcdf5-7795-4a66-849c-2586bc4841f4', 'Professional Photography', 'professional-photography', 'Professional photography services for events, portraits, products, and commercial photography with high-quality editing.', 'Event, portrait, and commercial photography', '6000.00', 'hourly', 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.80', 167, TRUE, TRUE, TRUE, '["photography","events","portraits","commercial"]', 'Nairobi & Surrounding Areas', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('35f0faa4-b67a-47dd-9eaf-6be09b64865f', 'Plumbing Services & Repairs', 'plumbing-services-repairs', 'Professional plumbing services including pipe repairs, fixture installation, drain cleaning, and emergency plumbing solutions.', 'Pipe repairs, installations, and drain cleaning', '2000.00', 'hourly', 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.60', 156, TRUE, FALSE, TRUE, '["plumbing","repairs","installation","home-service"]', 'Nairobi Metro', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('6dee7b28-b95b-4f19-80ad-5e511aec327c', 'Social Media Management', 'social-media-management', 'Complete social media management including content creation, scheduling, engagement, and analytics for business growth.', 'Social media management and content creation', '22000.00', 'fixed', 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.70', 134, TRUE, FALSE, TRUE, '["social-media","content","management","marketing"]', 'Remote', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('3ff9aa9f-83bb-4f64-b0a9-9d21ae1e95b4', 'House Painting & Interior Design', 'house-painting-interior-design', 'Professional painting services and interior design consultation including color selection, room planning, and decorating advice.', 'House painting and interior design consultation', '1500.00', 'hourly', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.55', 123, TRUE, FALSE, TRUE, '["painting","interior-design","decoration","home-improvement"]', 'Nairobi & Surrounding Areas', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('b2883c95-50ab-4373-a59f-a259fecd90ec', 'Landscaping & Garden Design', 'landscaping-garden-design', 'Professional landscaping services including garden design, lawn maintenance, tree trimming, and outdoor space planning.', 'Garden design, lawn care, and landscaping', '1200.00', 'hourly', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.50', 89, TRUE, FALSE, TRUE, '["landscaping","gardening","lawn-care","outdoor"]', 'Nairobi Metro', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('60afc581-70b3-4e04-a9a6-90b4ba3445f0', 'HVAC Installation & Repair', 'hvac-installation-repair', 'Heating, ventilation, and air conditioning services including installation, maintenance, and repair of HVAC systems.', 'HVAC installation, maintenance, and repairs', '3000.00', 'hourly', 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.65', 67, TRUE, FALSE, TRUE, '["hvac","air-conditioning","heating","installation"]', 'Nairobi Metro', FALSE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('f966287c-5907-474d-944f-278cca7572d3', 'Personal Training & Fitness Coaching', 'personal-training-fitness-coaching', 'Certified personal trainer offering customized workout plans, fitness coaching, and nutrition guidance for all fitness levels.', 'Personal training and fitness coaching', '3500.00', 'hourly', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.80', 145, TRUE, TRUE, TRUE, '["fitness","training","coaching","health"]', 'Nairobi Gyms & Home', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('ceeaad34-f624-4259-b754-b47154c90c65', 'Academic Tutoring & Exam Prep', 'academic-tutoring-exam-prep', 'Professional tutoring services for all academic levels including KCSE, university prep, and subject-specific tutoring.', 'Academic tutoring and exam preparation', '2500.00', 'hourly', 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.85', 234, TRUE, TRUE, TRUE, '["tutoring","education","exam-prep","academic"]', 'Nairobi & Online', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('7199d237-ef22-48c4-aa20-58f7a8bfb86b', 'Life Coaching & Career Counseling', 'life-coaching-career-counseling', 'Professional life coaching and career counseling services to help you achieve personal and professional goals.', 'Life coaching and career guidance', '4000.00', 'hourly', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.75', 89, TRUE, FALSE, TRUE, '["life-coaching","career","counseling","personal-development"]', 'Nairobi & Online', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('07f6f9f3-52f4-4ec6-9625-3434a9dd9f28', 'Pet Grooming & Care Services', 'pet-grooming-care-services', 'Professional pet grooming services including bathing, nail trimming, hair cutting, and basic pet care for dogs and cats.', 'Professional pet grooming and care', '2000.00', 'per_service', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.70', 167, TRUE, FALSE, TRUE, '["pet-grooming","pet-care","animals","grooming"]', 'Nairobi Pet Centers', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('a611d621-ce99-4e39-bc15-f4d0654c6dba', 'Hair Styling & Beauty Services', 'hair-styling-beauty-services', 'Professional hair styling, cutting, coloring, and beauty services for special occasions and regular maintenance.', 'Hair styling, cutting, and beauty services', '1500.00', 'per_service', 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.65', 234, TRUE, TRUE, TRUE, '["hair-styling","beauty","salon","grooming"]', 'Nairobi Salons', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('409c9bef-d967-4365-8bf6-da2c70633c65', 'Massage Therapy & Wellness', 'massage-therapy-wellness', 'Professional massage therapy services including relaxation massage, deep tissue therapy, and wellness consultation.', 'Massage therapy and wellness services', '3000.00', 'hourly', 'https://images.unsplash.com/photo-1544161513-0bbddc2aff6f?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.60', 123, TRUE, FALSE, TRUE, '["massage","therapy","wellness","relaxation"]', 'Nairobi Spas & Home', FALSE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('2e2b5e8e-fde5-4047-9755-f702c7c684b0', 'Event Planning & Management', 'event-planning-management', 'Full-service event planning including weddings, corporate events, parties, and conferences with complete event management.', 'Complete event planning and management', '50000.00', 'fixed', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.85', 67, TRUE, TRUE, TRUE, '["event-planning","weddings","corporate","management"]', 'Nairobi & Kenya', FALSE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('d23ddacf-6d16-4e8d-8a6b-f1be8300da4a', 'Catering & Food Services', 'catering-food-services', 'Professional catering services for events, parties, and corporate functions with diverse menu options and quality service.', 'Event catering and professional food services', '25000.00', 'fixed', 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.75', 145, TRUE, TRUE, TRUE, '["catering","food","events","parties"]', 'Nairobi & Surrounding Areas', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('63e85939-31f6-4465-b4fb-b46d418f840e', 'DJ Services & Entertainment', 'dj-services-entertainment', 'Professional DJ services with quality sound equipment, lighting, and entertainment for weddings, parties, and corporate events.', 'Professional DJ and entertainment services', '15000.00', 'per_service', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.70', 189, TRUE, FALSE, TRUE, '["dj","entertainment","music","events"]', 'Nairobi & Central Kenya', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('d394af17-eaa9-4f46-8065-19ed7921619e', 'Event Transportation Services', 'event-transportation-services', 'Reliable transportation services for events including guest shuttles, VIP transport, and group transportation coordination.', 'Event shuttles and VIP transportation', '20000.00', 'fixed', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.65', 78, TRUE, FALSE, TRUE, '["transportation","events","shuttles","vip"]', 'Nairobi & Kenya', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('b6b3c1a7-96fd-458d-bf09-1722a9a183b0', 'Video Editing & Production', 'video-editing-production', 'Professional video editing and production services including promotional videos, documentaries, and social media content.', 'Video editing and production services', '30000.00', 'fixed', 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.80', 89, TRUE, TRUE, TRUE, '["video-editing","production","media","content"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('48275f50-2bf4-4af8-bad2-70395d733e6b', 'Mobile App Development', 'mobile-app-development', 'Custom mobile app development for iOS and Android platforms including UI/UX design and deployment support.', 'iOS and Android app development', '150000.00', 'fixed', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.85', 23, TRUE, TRUE, TRUE, '["app-development","mobile","ios","android"]', 'Remote', FALSE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('1baf9fac-426c-4be8-a7ac-1ca12361ffc6', 'Data Analysis & Reporting', 'data-analysis-reporting', 'Professional data analysis services including business intelligence, data visualization, and comprehensive reporting solutions.', 'Data analysis and business intelligence', '40000.00', 'fixed', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.75', 45, TRUE, FALSE, TRUE, '["data-analysis","reporting","business-intelligence","analytics"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('57a87415-3e96-4ec4-ac93-4363c42c944b', 'Virtual Assistant Services', 'virtual-assistant-services', 'Professional virtual assistant services including administrative support, email management, scheduling, and research assistance.', 'Administrative support and virtual assistance', '18000.00', 'fixed', 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.60', 167, TRUE, FALSE, TRUE, '["virtual-assistant","administrative","support","remote"]', 'Remote', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('c4b7fcf8-18a8-4a7e-9184-5a405168051e', 'E-commerce Setup & Management', 'ecommerce-setup-management', 'Complete e-commerce solution including online store setup, product management, payment integration, and ongoing support.', 'E-commerce store setup and management', '55000.00', 'fixed', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.70', 56, TRUE, FALSE, TRUE, '["ecommerce","online-store","setup","management"]', 'Remote & Nairobi', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('075e96ed-06fb-4b08-92e4-c8178e06e09e', 'Online Course Creation', 'online-course-creation', 'Professional online course development including curriculum design, video production, and platform setup for educational content.', 'Online course development and production', '45000.00', 'fixed', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.65', 34, TRUE, FALSE, TRUE, '["course-creation","education","online-learning","content"]', 'Remote', FALSE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z'),
  ('77433a4c-114e-429f-a700-a3580b4809a5', 'Podcast Production & Editing', 'podcast-production-editing', 'Professional podcast production services including recording, editing, post-production, and publishing support for quality audio content.', 'Podcast recording, editing, and production', '12000.00', 'per_service', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500', NULL, 'e931dfe5-d69a-4a73-b06c-0d3ed6efe8f8', '74bf6c33-7f09-4844-903d-72bff3849c95', '4.55', 78, TRUE, FALSE, TRUE, '["podcast","audio","production","editing"]', 'Remote & Nairobi Studios', TRUE, '2025-09-10T18:02:54.892Z', '2025-09-10T18:02:54.892Z');

ALTER TABLE "services" ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");


-- Table: sessions (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" CHARACTER VARYING NOT NULL,
  "sess" JSONB NOT NULL,
  "expire" TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid");


-- Table: subcategories (2 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "subcategories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" CHARACTER VARYING(100) NOT NULL,
  "slug" CHARACTER VARYING(100) NOT NULL,
  "description" TEXT,
  "category_id" UUID NOT NULL,
  "image_url" CHARACTER VARYING,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "subcategories" ("id", "name", "slug", "description", "category_id", "image_url", "is_active", "created_at") VALUES
  ('a1be0d79-96ed-49c9-a166-80738df28076', 'Smartphones', 'smartphones', 'Mobile phones and smartphones', '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, TRUE, '2025-09-10T15:05:05.654Z'),
  ('3d439581-e073-4c15-aafe-12c8dbe1f2e4', 'Laptops & Computers', 'laptops-computers', 'Laptops, desktops, and computer accessories', '93a04f80-fe58-4070-a3fb-868192d0db23', NULL, TRUE, '2025-09-10T15:05:05.654Z');

ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id");


-- Table: users (2 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "users" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "email" CHARACTER VARYING,
  "first_name" CHARACTER VARYING,
  "last_name" CHARACTER VARYING,
  "profile_image_url" CHARACTER VARYING,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "users" ("id", "email", "first_name", "last_name", "profile_image_url", "created_at", "updated_at") VALUES
  ('74bf6c33-7f09-4844-903d-72bff3849c95', 'vendor@buylock.com', 'John', 'Vendor', NULL, '2025-09-10T15:05:05.698Z', '2025-09-17T13:10:06.139Z'),
  ('44263266', 'buylockplatform@gmail.com', 'Martin', 'Muriithi', NULL, '2025-09-10T15:56:25.356Z', '2025-09-17T08:14:13.681Z');

ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


-- Table: vendor_earnings (2 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "vendor_earnings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "vendor_id" CHARACTER VARYING NOT NULL,
  "order_id" UUID NOT NULL,
  "order_item_id" UUID,
  "gross_amount" NUMERIC(10,2) NOT NULL,
  "platform_fee_percentage" NUMERIC(5,2) DEFAULT 20.00,
  "platform_fee" NUMERIC(10,2) NOT NULL,
  "net_earnings" NUMERIC(10,2) NOT NULL,
  "status" CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  "earning_date" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "available_date" TIMESTAMP WITHOUT TIME ZONE,
  "paid_out_at" TIMESTAMP WITHOUT TIME ZONE,
  "payout_request_id" UUID,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "vendor_earnings" ("id", "vendor_id", "order_id", "order_item_id", "gross_amount", "platform_fee_percentage", "platform_fee", "net_earnings", "status", "earning_date", "available_date", "paid_out_at", "payout_request_id", "created_at") VALUES
  ('e5bc3f55-36de-41d6-ab54-f1677bb3e46c', '74bf6c33-7f09-4844-903d-72bff3849c95', '53c0e097-f825-4c74-9385-3eb2c80354cf', NULL, '306247.50', '20.00', '61249.50', '244998.00', 'paid', '2025-09-17T09:34:31.484Z', NULL, NULL, NULL, '2025-09-17T09:34:31.484Z'),
  ('9faddfff-a02d-4cee-a8d2-3afbb5e1e499', '74bf6c33-7f09-4844-903d-72bff3849c95', '53c0e097-f825-4c74-9385-3eb2c80354cf', NULL, '306247.50', '20.00', '61249.50', '244998.00', 'paid', '2025-09-17T09:43:10.834Z', NULL, NULL, NULL, '2025-09-17T09:43:10.834Z');

ALTER TABLE "vendor_earnings" ADD CONSTRAINT "vendor_earnings_pkey" PRIMARY KEY ("id");


-- Table: vendors (4 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "vendors" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "email" CHARACTER VARYING NOT NULL,
  "password_hash" CHARACTER VARYING NOT NULL,
  "business_name" CHARACTER VARYING NOT NULL,
  "contact_email" CHARACTER VARYING NOT NULL,
  "contact_name" CHARACTER VARYING NOT NULL,
  "phone" CHARACTER VARYING,
  "address" CHARACTER VARYING,
  "business_category" CHARACTER VARYING NOT NULL,
  "description" TEXT,
  "vendor_type" CHARACTER VARYING(20) NOT NULL DEFAULT 'registered'::character varying,
  "national_id_number" CHARACTER VARYING NOT NULL,
  "tax_pin_number" CHARACTER VARYING,
  "national_id_url" CHARACTER VARYING,
  "tax_certificate_url" CHARACTER VARYING,
  "business_latitude" NUMERIC(10,8) NOT NULL,
  "business_longitude" NUMERIC(11,8) NOT NULL,
  "location_description" TEXT NOT NULL,
  "bank_name" CHARACTER VARYING,
  "bank_code" CHARACTER VARYING,
  "account_number" CHARACTER VARYING,
  "account_name" CHARACTER VARYING,
  "paystack_subaccount_id" CHARACTER VARYING,
  "paystack_subaccount_code" CHARACTER VARYING,
  "subaccount_active" BOOLEAN DEFAULT false,
  "total_earnings" NUMERIC(12,2) DEFAULT '0'::numeric,
  "available_balance" NUMERIC(12,2) DEFAULT '0'::numeric,
  "pending_balance" NUMERIC(12,2) DEFAULT '0'::numeric,
  "total_paid_out" NUMERIC(12,2) DEFAULT '0'::numeric,
  "verification_status" CHARACTER VARYING(20) DEFAULT 'pending'::character varying,
  "verification_notes" TEXT,
  "verified_at" TIMESTAMP WITHOUT TIME ZONE,
  "verified_by" CHARACTER VARYING,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "vendors" ("id", "email", "password_hash", "business_name", "contact_email", "contact_name", "phone", "address", "business_category", "description", "vendor_type", "national_id_number", "tax_pin_number", "national_id_url", "tax_certificate_url", "business_latitude", "business_longitude", "location_description", "bank_name", "bank_code", "account_number", "account_name", "paystack_subaccount_id", "paystack_subaccount_code", "subaccount_active", "total_earnings", "available_balance", "pending_balance", "total_paid_out", "verification_status", "verification_notes", "verified_at", "verified_by", "created_at", "updated_at") VALUES
  ('fd97b05e-d973-4560-9e41-384b8c6a6ee0', 'joemaina180@gmail.com', '$2b$10$pnwgR.JD5ZNOyzj0tl6X5O1KBI9o3IQNKKCmqIQtd.9pK4a48KLCa', 'Pointer Services', 'joemaina180@gmail.com', 'Josiah', '+254740406442', 'Spur Mall , Ruiru', 'Electronics & Technology', 'Laptop sale and repair', 'registered', '12345678', 'A000000000X', 'https://storage.googleapis.com/replit-objstore-abcc9cdb-0ca3-4e5b-810c-597df591617c/.private/uploads/09d36792-609b-4dae-81b9-9f4ad7bc364e', 'https://storage.googleapis.com/replit-objstore-abcc9cdb-0ca3-4e5b-810c-597df591617c/.private/uploads/dfb737f3-e72f-42e0-a20c-5be20df2bdb8', '-1.13710330', '36.96981270', 'Spur Mall, Thika Road, Murera ward, Juja, Kiambu, 01001, Kenya', NULL, NULL, NULL, NULL, NULL, NULL, FALSE, '0.00', '0.00', '0.00', '0.00', 'verified', NULL, '2025-09-17T10:39:49.961Z', 'admin', '2025-09-17T10:14:24.947Z', '2025-09-17T10:39:49.961Z'),
  ('d7bdf30e-cced-40a6-8dea-58250737fae1', 'buylockplatform@gmail.com', '$2b$10$oY094EknPPJJNCqjMJ74/.Y7L5Pn/zPHhbcAGgo/bERLdcnY8Deei', 'Test Email Business', 'buylockplatform@gmail.com', 'Test User', '+254700000000', 'Nairobi, Kenya', 'retail', NULL, 'registered', '12345678', 'A000000000A', 'test-national-id-url', 'test-tax-cert-url', '-1.29210000', '36.82190000', 'Central Nairobi', NULL, NULL, NULL, NULL, NULL, NULL, FALSE, '0.00', '0.00', '0.00', '0.00', 'verified', NULL, '2025-09-17T10:59:49.105Z', 'admin', '2025-09-17T10:57:44.651Z', '2025-09-17T10:59:49.105Z'),
  ('b2a3ac90-1154-421a-b5c8-cc7eeb65c820', 'testemail@example.com', '$2b$10$3oZELuGV.T1qzR14j9G.Ve7HMZoiCBAUMItQHA4t7PrgAx49Dke4e', 'Test Email Business 2', 'testemail@example.com', 'Test User 2', '+254700000001', 'Nairobi, Kenya', 'retail', NULL, 'registered', '12345679', 'A000000000B', 'test-national-id-url-2', 'test-tax-cert-url-2', '-1.29210000', '36.82190000', 'Central Nairobi', NULL, NULL, NULL, NULL, NULL, NULL, FALSE, '0.00', '0.00', '0.00', '0.00', 'verified', NULL, '2025-09-17T11:11:56.444Z', 'admin', '2025-09-17T11:11:35.936Z', '2025-09-17T11:11:56.444Z'),
  ('74bf6c33-7f09-4844-903d-72bff3849c95', 'vendor@buylock.com', '$2b$10$BtTUNLXaCGGoninI30REee7P2SgJyyCZ3mTJOO2cBD5TwQYSn9lNi', 'BuyLock Premier Store', 'vendor@buylock.com', 'John Vendor', '+254740717201', 'Nairobi CBD, Kenya', 'General Merchandise', 'Premium products and services retailer with nationwide delivery', 'registered', '12345678', NULL, NULL, NULL, '-1.28638900', '36.81722300', 'Located in the heart of Nairobi Central Business District, easily accessible from all major roads and transport hubs', 'kcb', '01', '1316677133', 'Josiah Kamau Maina', '1464840', 'ACCT_7bd4qg6mwkuthf7', TRUE, '0.00', '0.00', '0.00', '0.00', 'verified', NULL, NULL, NULL, '2025-09-10T17:50:01.566Z', '2025-09-17T13:10:06.265Z');

ALTER TABLE "vendors" ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");


SET session_replication_role = DEFAULT;

-- Export completed
