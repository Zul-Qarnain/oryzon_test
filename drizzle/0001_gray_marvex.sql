CREATE TABLE "businesses" (
	"business_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_user_id" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_channel_id_connected_channels_channel_id_fk";
--> statement-breakpoint
ALTER TABLE "connected_channels" ALTER COLUMN "provider_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "channel_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "provider_user_id" text;--> statement-breakpoint
ALTER TABLE "connected_channels" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "provider_user_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "provider_user_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "provider_user_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_provider_user_id_users_provider_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("provider_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_provider_user_id_users_provider_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("provider_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_channels" ADD CONSTRAINT "connected_channels_business_id_businesses_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("business_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_business_id_businesses_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("business_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_provider_user_id_users_provider_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("provider_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("business_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_user_id_users_provider_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("provider_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_business_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("business_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_provider_user_id_users_provider_user_id_fk" FOREIGN KEY ("provider_user_id") REFERENCES "public"."users"("provider_user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "channel_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "business_name";