ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_suspended" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspended_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspension_reason" text;
