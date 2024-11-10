DO $$ BEGIN
 CREATE TYPE "public"."article_status" AS ENUM('draft', 'active');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."article_type" AS ENUM('perfume', 'event', 'guide');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."fragrance_pyramid" AS ENUM('top', 'middle', 'base', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'unisex');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."occasion" AS ENUM('day', 'night', 'all_day');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."perfume_type" AS ENUM('extrait_de_parfum', 'eau_de_parfum', 'eau_de_toilette', 'eau_de_cologne', 'body_mist', 'oil_perfume', 'solid_perfume');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."oauth_provider" AS ENUM('none', 'google');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."token_type" AS ENUM('account_verification', 'account_password_reset');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('admin', 'customer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_status" AS ENUM('inactive', 'active');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
	"id" bigint PRIMARY KEY NOT NULL,
	"brand_id" bigint,
	"meta_keywords" varchar,
	"meta_description" varchar,
	"title" varchar(1000) NOT NULL,
	"slug" varchar(1000) NOT NULL,
	"author" varchar(255) NOT NULL,
	"image_by" varchar(255) NOT NULL,
	"cover" varchar(255),
	"banner" varchar(255),
	"content" text NOT NULL,
	"tags" bigint[] DEFAULT ARRAY[]::bigint[],
	"is_featured" boolean DEFAULT false,
	"type" "article_type" NOT NULL,
	"status" "article_status" DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "articles_id_unique" UNIQUE("id"),
	CONSTRAINT "articles_title_unique" UNIQUE("title"),
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"banner" varchar(255),
	"logo" varchar(255),
	"description" text,
	"website" varchar(255),
	"ig_username" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "brands_id_unique" UNIQUE("id"),
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "note_categories" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"cover" varchar(255) NOT NULL,
	"color" varchar(8) NOT NULL,
	"shade" varchar(8) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "note_categories_id_unique" UNIQUE("id"),
	CONSTRAINT "note_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notes" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"category_id" bigint NOT NULL,
	"icon" varchar(255) NOT NULL,
	"cover" varchar(255) NOT NULL,
	"like_count" bigint DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notes_id_unique" UNIQUE("id"),
	CONSTRAINT "notes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "perfume_note_aliases" (
	"id" bigint PRIMARY KEY NOT NULL,
	"perfume_id" bigint NOT NULL,
	"note_id" bigint NOT NULL,
	"note_alias" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "perfume_note_aliases_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "perfume_reviews" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"perfume_id" bigint NOT NULL,
	"comment" text NOT NULL,
	"rating" smallint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "perfume_reviews_id_unique" UNIQUE("id"),
	CONSTRAINT "pr_unique_review" UNIQUE("user_id","perfume_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "perfumes" (
	"id" bigint PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"gender" "gender" NOT NULL,
	"price" smallint DEFAULT 0,
	"release_date" varchar(10),
	"variants" jsonb NOT NULL,
	"brand_id" bigint,
	"perfume_type" "perfume_type" NOT NULL,
	"base_notes" bigint[],
	"middle_notes" bigint[],
	"top_notes" bigint[],
	"uncategorized_notes" bigint[],
	"occasion" "occasion" NOT NULL,
	"is_halal" boolean DEFAULT false,
	"is_bpom_certified" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"view_count" bigint DEFAULT 0,
	"like_count" bigint DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "perfumes_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_favorited_notes" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"note_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_favorited_notes_id_unique" UNIQUE("id"),
	CONSTRAINT "ufn_unique_favorited" UNIQUE("user_id","note_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_liked_perfumes" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"perfume_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_liked_perfumes_id_unique" UNIQUE("id"),
	CONSTRAINT "ulp_unique_liked" UNIQUE("user_id","perfume_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_tokens" (
	"id" bigint PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token" text NOT NULL,
	"type" "token_type" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_tokens_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"username" varchar(255),
	"email" varchar(255),
	"date_of_birth" varchar(10),
	"password" varchar(255),
	"role" "user_role" DEFAULT 'customer',
	"oauth_provider" "oauth_provider",
	"oauth_uid" text,
	"user_status" "user_status" DEFAULT 'inactive',
	"last_login_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "promotions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"title" varchar(1000) NOT NULL,
	"label" varchar(1000) NOT NULL,
	"href" text NOT NULL,
	"cover" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promotions_id_unique" UNIQUE("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "articles" ADD CONSTRAINT "articles_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notes" ADD CONSTRAINT "notes_category_id_note_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."note_categories"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "perfume_note_aliases" ADD CONSTRAINT "perfume_note_aliases_perfume_id_perfumes_id_fk" FOREIGN KEY ("perfume_id") REFERENCES "public"."perfumes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "perfume_note_aliases" ADD CONSTRAINT "perfume_note_aliases_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "perfume_reviews" ADD CONSTRAINT "perfume_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "perfume_reviews" ADD CONSTRAINT "perfume_reviews_perfume_id_perfumes_id_fk" FOREIGN KEY ("perfume_id") REFERENCES "public"."perfumes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "perfumes" ADD CONSTRAINT "perfumes_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_favorited_notes" ADD CONSTRAINT "user_favorited_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_favorited_notes" ADD CONSTRAINT "user_favorited_notes_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_liked_perfumes" ADD CONSTRAINT "user_liked_perfumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_liked_perfumes" ADD CONSTRAINT "user_liked_perfumes_perfume_id_perfumes_id_fk" FOREIGN KEY ("perfume_id") REFERENCES "public"."perfumes"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "article_brand_idx" ON "articles" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "article_tags_idx" ON "articles" USING gin ("tags");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tag_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brand_name_idx" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_name_idx" ON "note_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_name_idx" ON "notes" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "note_category_idx" ON "notes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pna_perfume_idx" ON "perfume_note_aliases" USING btree ("perfume_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pna_note_idx" ON "perfume_note_aliases" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pna_note_alias_idx" ON "perfume_note_aliases" USING btree ("note_alias");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pr_user_idx" ON "perfume_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pr_perfume_idx" ON "perfume_reviews" USING btree ("perfume_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pr_rating_idx" ON "perfume_reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_name_idx" ON "perfumes" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_gender_idx" ON "perfumes" USING btree ("gender");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_price_idx" ON "perfumes" USING btree ("price");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_brand_idx" ON "perfumes" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_type_idx" ON "perfumes" USING btree ("perfume_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_occasion_idx" ON "perfumes" USING btree ("occasion");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_halal_idx" ON "perfumes" USING btree ("is_halal");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_bpom_idx" ON "perfumes" USING btree ("is_bpom_certified");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_base_notes_idx" ON "perfumes" USING gin ("base_notes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_middle_notes_idx" ON "perfumes" USING gin ("middle_notes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_top_notes_idx" ON "perfumes" USING gin ("top_notes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "perfume_uncategorized_notes_idx" ON "perfumes" USING gin ("uncategorized_notes");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ufn_user_idx" ON "user_favorited_notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ufn_note_idx" ON "user_favorited_notes" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ulp_user_idx" ON "user_liked_perfumes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ulp_perfume_idx" ON "user_liked_perfumes" USING btree ("perfume_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_user_idx" ON "user_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "token_type_idx" ON "user_tokens" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_name_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_mail_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promotion_active_idx" ON "promotions" USING btree ("is_active");