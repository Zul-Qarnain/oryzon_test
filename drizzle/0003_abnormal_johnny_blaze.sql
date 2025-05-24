ALTER TABLE "chats" DROP CONSTRAINT "chats_customer_id_customers_customer_id_fk";
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "platform_customer_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "customer_id";