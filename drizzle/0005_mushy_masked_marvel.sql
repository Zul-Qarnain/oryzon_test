CREATE TYPE "public"."chat_type" AS ENUM('real', 'test');--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "chat_type" "chat_type" DEFAULT 'real' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "total_time_taken" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "cost" numeric(10, 2) DEFAULT '0';