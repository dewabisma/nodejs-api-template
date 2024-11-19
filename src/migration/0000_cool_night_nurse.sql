CREATE TYPE "public"."oauth_provider" AS ENUM('none', 'google');--> statement-breakpoint
CREATE TYPE "public"."token_type" AS ENUM('account_verification', 'account_password_reset', 'oauth_token');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'customer');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('inactive', 'active');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_tokens" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token" text NOT NULL,
	"type" "token_type" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"username" varchar(255),
	"email" varchar(255),
	"date_of_birth" varchar(10),
	"password" varchar(255),
	"role" "user_role" DEFAULT 'customer',
	"oauth_provider" "oauth_provider" DEFAULT 'none',
	"oauth_uid" text,
	"user_status" "user_status" DEFAULT 'inactive',
	"last_login_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"title" varchar(1000),
	"label" varchar(1000),
	"href" text,
	"cover" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_user_idx" ON "user_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_type_idx" ON "user_tokens" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_name_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_mail_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotion_active_idx" ON "promotions" USING btree ("is_active");