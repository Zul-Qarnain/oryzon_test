ALTER TABLE "orders" ALTER COLUMN "shipping_address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "billing_address";