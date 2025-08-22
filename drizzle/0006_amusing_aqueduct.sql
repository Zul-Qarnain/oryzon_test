ALTER TABLE "customers" ADD COLUMN "contact" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_contact" text NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_name" text NOT NULL;