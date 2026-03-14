--> statement-breakpoint
-- Create enums
CREATE TYPE "tier" AS ENUM ('free', 'unlimited');
--> statement-breakpoint
CREATE TYPE "membership_status" AS ENUM ('active', 'cancelled', 'expired');
--> statement-breakpoint

-- Create memberships table
CREATE TABLE "memberships" (
	"user_id" text PRIMARY KEY NOT NULL,
	"tier" "tier" DEFAULT 'free' NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"kofi_transaction_id" text,
	"kofi_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Add foreign key
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

-- Drop old user_supporter table
DROP TABLE "user_supporter";
