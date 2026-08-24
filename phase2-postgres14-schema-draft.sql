-- Touchstone Properties: Phase 2 PostgreSQL 14 schema migration draft
-- Generated from live Supabase catalog metadata. Review before execution.
-- This script intentionally replaces Supabase auth/storage/RLS with app-owned tables and server-side authorization.

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','moderator','customer','staff'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Replaces Supabase auth.users. For passwords, either import compatible hashes into password_hash or force reset.
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  email_confirmed_at timestamp with time zone,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_app_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public."activity_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid,
  "action" text NOT NULL,
  "entity" text,
  "entity_id" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."amenities" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "icon" text,
  "category" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."banners" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "subtitle" text,
  "image_url" text,
  "cta_text" text,
  "cta_link" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."builders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "logo_url" text,
  "website" text,
  "rera_prefix" text,
  "description" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "contact_type" text DEFAULT 'builder'::text NOT NULL,
  "display_name" text,
  "primary_phone" text,
  "whatsapp_number" text,
  "alternative_phone" text,
  "email" text,
  "alternative_email" text,
  "office_address" text,
  "city" text,
  "locality" text,
  "preferred_contact_method" text,
  "contact_person_name" text,
  "designation" text,
  "show_on_website" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "updated_by" uuid
);
CREATE TABLE IF NOT EXISTS public."contact_info" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "phone" text,
  "whatsapp" text,
  "email" text,
  "address" text,
  "map_url" text,
  "facebook" text,
  "instagram" text,
  "twitter" text,
  "linkedin" text,
  "youtube" text,
  "business_hours" text,
  "copyright" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."contact_notes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "contact_id" uuid NOT NULL,
  "property_id" uuid,
  "note_title" text,
  "note_description" text NOT NULL,
  "note_type" text,
  "follow_up_date" date,
  "follow_up_time" time without time zone,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "status" text DEFAULT 'open'::text NOT NULL,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."content_sections" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "title" text,
  "subtitle" text,
  "body" text,
  "image_url" text,
  "cta_text" text,
  "cta_link" text,
  "extra" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."enquiries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text NOT NULL,
  "requirement_type" text DEFAULT 'General Enquiry'::text NOT NULL,
  "location" text DEFAULT ''::text,
  "budget" text DEFAULT ''::text,
  "message" text DEFAULT ''::text,
  "source" text DEFAULT ''::text,
  "property_id" uuid,
  "property_title" text DEFAULT ''::text,
  "page_url" text DEFAULT ''::text,
  "user_agent" text DEFAULT ''::text,
  "status" text DEFAULT 'New'::text NOT NULL,
  "notes" text DEFAULT ''::text,
  "user_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "assigned_staff_id" uuid,
  "assigned_staff_name" text
);
CREATE TABLE IF NOT EXISTS public."faqs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "question" text NOT NULL,
  "answer" text NOT NULL,
  "category" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."form_options" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "form_key" text NOT NULL,
  "field_key" text NOT NULL,
  "label" text NOT NULL,
  "value" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."hot_property_settings" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "property_id" uuid,
  "badge_text" text DEFAULT 'Hot Deal'::text NOT NULL,
  "highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "cta_view_url" text,
  "cta_contact_url" text,
  "override_image" text,
  "override_title" text,
  "override_location" text,
  "override_price" text,
  "override_property_type" text,
  "override_bedrooms" integer,
  "override_bathrooms" integer,
  "override_area" text,
  "override_description" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."locations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "city" text DEFAULT 'Bangalore'::text NOT NULL,
  "zone" text NOT NULL,
  "locality" text NOT NULL,
  "slug" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."navigation_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "label" text NOT NULL,
  "href" text NOT NULL,
  "parent_id" uuid,
  "location" text DEFAULT 'header'::text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "image_url" text,
  "is_read" boolean DEFAULT false,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES public."properties"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public."partners" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "logo_url" text,
  "website" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."profiles" (
  "id" uuid NOT NULL,
  "full_name" text,
  "email" text,
  "phone" text,
  "city" text,
  "avatar_url" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."properties" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "project_name" text NOT NULL,
  "builder_id" uuid,
  "rera_number" text,
  "property_type" text NOT NULL,
  "property_category" text,
  "listing_type" text DEFAULT 'Buy'::text NOT NULL,
  "location_id" uuid,
  "address" text,
  "map_link" text,
  "directions_link" text,
  "price_min" numeric,
  "price_max" numeric,
  "starting_price" numeric,
  "price_per_sqft" numeric,
  "bhk_options" text[] DEFAULT '{}'::text[],
  "unit_sizes" text,
  "carpet_area" text,
  "land_parcel" text,
  "towers" integer,
  "floors" integer,
  "total_units" integer,
  "open_space_pct" numeric,
  "clubhouse_size" text,
  "amenities_count" integer,
  "possession_date" text,
  "project_status" text,
  "highlights" text,
  "overview" text,
  "location_advantages" text,
  "hero_image" text,
  "brochure_url" text,
  "contact_phone" text,
  "whatsapp" text,
  "seo_title" text,
  "seo_description" text,
  "seo_keywords" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_featured" boolean DEFAULT false NOT NULL,
  "is_top_featured" boolean DEFAULT false NOT NULL,
  "is_hot" boolean DEFAULT false NOT NULL,
  "is_trending" boolean DEFAULT false NOT NULL,
  "is_new_launch" boolean DEFAULT false NOT NULL,
  "is_pre_launch" boolean DEFAULT false NOT NULL,
  "is_ready_to_move" boolean DEFAULT false NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "top_featured_rank" smallint,
  "assigned_staff_id" uuid,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "agent_id" uuid,
  "owner_id" uuid,
  "channel_partner_id" uuid
);
CREATE TABLE IF NOT EXISTS public."property_amenities" (
  "property_id" uuid NOT NULL,
  "amenity_id" uuid NOT NULL
);
CREATE TABLE IF NOT EXISTS public."property_assignments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "staff_name" text NOT NULL,
  "role" text,
  "phone" text NOT NULL,
  "whatsapp" text,
  "email" text,
  "assigned_area" text,
  "notes" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "show_publicly" boolean DEFAULT false NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "photo_url" text,
  "signature_url" text,
  "id_url" text,
  "qr_code_url" text,
  "experience_years" integer,
  "languages" text[] DEFAULT '{}'::text[] NOT NULL
);
CREATE TABLE IF NOT EXISTS public."property_configurations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "bhk" text,
  "carpet_area" text,
  "super_area" text,
  "price" numeric,
  "display_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS public."property_images" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "url" text NOT NULL,
  "image_type" text DEFAULT 'gallery'::text NOT NULL,
  "caption" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."property_nearby" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "name" text NOT NULL,
  "distance" text,
  "category" text,
  "display_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS public."property_prices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "property_id" uuid NOT NULL,
  "unit_type" text,
  "price_from" numeric,
  "price_to" numeric,
  "display_order" integer DEFAULT 0 NOT NULL
);
CREATE TABLE IF NOT EXISTS public."sell_property_enquiries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "seller_name" text NOT NULL,
  "seller_phone" text NOT NULL,
  "seller_email" text,
  "city" text,
  "zone" text,
  "locality" text,
  "full_address" text,
  "property_type" text,
  "asking_price" numeric,
  "built_up_area" numeric,
  "configuration" text,
  "furnishing" text,
  "possession" text,
  "amenities" text[] DEFAULT '{}'::text[],
  "photos" text[] DEFAULT '{}'::text[],
  "description" text,
  "coordinates" jsonb,
  "google_map_link" text,
  "status" text DEFAULT 'New'::text NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."seo_metadata" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "route" text NOT NULL,
  "title" text,
  "description" text,
  "og_image" text,
  "canonical" text,
  "keywords" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."site_settings" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."staff_permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "staff_user_id" uuid NOT NULL,
  "module_name" text NOT NULL,
  "can_view" boolean DEFAULT false NOT NULL,
  "can_add" boolean DEFAULT false NOT NULL,
  "can_edit" boolean DEFAULT false NOT NULL,
  "can_delete" boolean DEFAULT false NOT NULL,
  "can_publish" boolean DEFAULT false NOT NULL,
  "can_export" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."staff_tasks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "related_module" text,
  "assigned_to" uuid,
  "priority" text DEFAULT 'medium'::text NOT NULL,
  "due_date" date,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "admin_remarks" text,
  "staff_notes" text,
  "attachment_url" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."staff_users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "auth_user_id" uuid NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "mobile" text,
  "designation" text,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "employee_code" text,
  "username" text,
  "department" text,
  "branch" text,
  "territory" text,
  "joining_date" date,
  "deactivated_at" timestamp with time zone
);
CREATE TABLE IF NOT EXISTS public."success_stories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "client" text,
  "image_url" text,
  "summary" text,
  "body" text,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "category" text DEFAULT ''::text,
  "story_type" text DEFAULT 'Buy'::text NOT NULL,
  "location" text DEFAULT ''::text,
  "cta_text" text DEFAULT 'View Story'::text,
  "images" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "slug" text,
  "badge_text" text,
  "client_label" text,
  "services_provided" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "button_text" text,
  "contact_button_link" text,
  "whatsapp_number" text,
  "whatsapp_link" text
);
CREATE TABLE IF NOT EXISTS public."testimonials" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "role" text,
  "avatar_url" text,
  "quote" text NOT NULL,
  "rating" integer DEFAULT 5,
  "display_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "category" text DEFAULT 'Buyer'::text NOT NULL,
  "location" text DEFAULT ''::text
);
CREATE TABLE IF NOT EXISTS public."user_roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "role" public.app_role NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public."wishlists" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "property_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Primary keys, unique constraints, and checks.
ALTER TABLE public."activity_logs" ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY (id);
ALTER TABLE public."amenities" ADD CONSTRAINT "amenities_name_key" UNIQUE (name);
ALTER TABLE public."amenities" ADD CONSTRAINT "amenities_pkey" PRIMARY KEY (id);
ALTER TABLE public."banners" ADD CONSTRAINT "banners_pkey" PRIMARY KEY (id);
ALTER TABLE public."builders" ADD CONSTRAINT "builders_contact_type_check" CHECK ((contact_type = ANY (ARRAY['builder'::text, 'developer'::text, 'agent'::text, 'owner'::text, 'channel_partner'::text, 'land_owner'::text, 'individual_seller'::text])));
ALTER TABLE public."builders" ADD CONSTRAINT "builders_pkey" PRIMARY KEY (id);
ALTER TABLE public."builders" ADD CONSTRAINT "builders_slug_key" UNIQUE (slug);
ALTER TABLE public."contact_info" ADD CONSTRAINT "contact_info_pkey" PRIMARY KEY (id);
ALTER TABLE public."contact_notes" ADD CONSTRAINT "contact_notes_pkey" PRIMARY KEY (id);
ALTER TABLE public."content_sections" ADD CONSTRAINT "content_sections_key_key" UNIQUE (key);
ALTER TABLE public."content_sections" ADD CONSTRAINT "content_sections_pkey" PRIMARY KEY (id);
ALTER TABLE public."enquiries" ADD CONSTRAINT "enquiries_pkey" PRIMARY KEY (id);
ALTER TABLE public."faqs" ADD CONSTRAINT "faqs_pkey" PRIMARY KEY (id);
ALTER TABLE public."form_options" ADD CONSTRAINT "form_options_pkey" PRIMARY KEY (id);
ALTER TABLE public."hot_property_settings" ADD CONSTRAINT "hot_property_settings_id_check" CHECK ((id = 'default'::text));
ALTER TABLE public."hot_property_settings" ADD CONSTRAINT "hot_property_settings_pkey" PRIMARY KEY (id);
ALTER TABLE public."locations" ADD CONSTRAINT "locations_pkey" PRIMARY KEY (id);
ALTER TABLE public."locations" ADD CONSTRAINT "locations_slug_key" UNIQUE (slug);
ALTER TABLE public."locations" ADD CONSTRAINT "locations_zone_check" CHECK ((zone = ANY (ARRAY['East'::text, 'West'::text, 'North'::text, 'South'::text, 'Central'::text])));
ALTER TABLE public."navigation_items" ADD CONSTRAINT "navigation_items_location_check" CHECK ((location = ANY (ARRAY['header'::text, 'footer'::text])));
ALTER TABLE public."navigation_items" ADD CONSTRAINT "navigation_items_pkey" PRIMARY KEY (id);
ALTER TABLE public."partners" ADD CONSTRAINT "partners_pkey" PRIMARY KEY (id);
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);
ALTER TABLE public."properties" ADD CONSTRAINT "properties_listing_type_check" CHECK ((listing_type = ANY (ARRAY['Buy'::text, 'Rent'::text, 'Sell'::text])));
ALTER TABLE public."properties" ADD CONSTRAINT "properties_pkey" PRIMARY KEY (id);
ALTER TABLE public."properties" ADD CONSTRAINT "properties_property_type_check" CHECK ((property_type = ANY (ARRAY['Apartment'::text, 'Villa'::text, 'Plot'::text, 'Commercial'::text, 'Residential'::text])));
ALTER TABLE public."properties" ADD CONSTRAINT "properties_slug_key" UNIQUE (slug);
ALTER TABLE public."property_amenities" ADD CONSTRAINT "property_amenities_pkey" PRIMARY KEY (property_id, amenity_id);
ALTER TABLE public."property_assignments" ADD CONSTRAINT "property_assignments_pkey" PRIMARY KEY (id);
ALTER TABLE public."property_configurations" ADD CONSTRAINT "property_configurations_pkey" PRIMARY KEY (id);
ALTER TABLE public."property_images" ADD CONSTRAINT "property_images_image_type_check" CHECK ((image_type = ANY (ARRAY['gallery'::text, 'floor_plan'::text, 'hero'::text])));
ALTER TABLE public."property_images" ADD CONSTRAINT "property_images_pkey" PRIMARY KEY (id);
ALTER TABLE public."property_nearby" ADD CONSTRAINT "property_nearby_pkey" PRIMARY KEY (id);
ALTER TABLE public."property_prices" ADD CONSTRAINT "property_prices_pkey" PRIMARY KEY (id);
ALTER TABLE public."sell_property_enquiries" ADD CONSTRAINT "sell_property_enquiries_pkey" PRIMARY KEY (id);
ALTER TABLE public."sell_property_enquiries" ADD CONSTRAINT "sell_property_enquiries_status_check" CHECK ((status = ANY (ARRAY['New'::text, 'Contacted'::text, 'Site Visit Scheduled'::text, 'Verified'::text, 'Listed'::text, 'Rejected'::text])));
ALTER TABLE public."seo_metadata" ADD CONSTRAINT "seo_metadata_pkey" PRIMARY KEY (id);
ALTER TABLE public."seo_metadata" ADD CONSTRAINT "seo_metadata_route_key" UNIQUE (route);
ALTER TABLE public."site_settings" ADD CONSTRAINT "site_settings_key_key" UNIQUE (key);
ALTER TABLE public."site_settings" ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY (id);
ALTER TABLE public."staff_permissions" ADD CONSTRAINT "staff_permissions_pkey" PRIMARY KEY (id);
ALTER TABLE public."staff_permissions" ADD CONSTRAINT "staff_permissions_staff_user_id_module_name_key" UNIQUE (staff_user_id, module_name);
ALTER TABLE public."staff_tasks" ADD CONSTRAINT "staff_tasks_pkey" PRIMARY KEY (id);
ALTER TABLE public."staff_tasks" ADD CONSTRAINT "staff_tasks_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text])));
ALTER TABLE public."staff_tasks" ADD CONSTRAINT "staff_tasks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'rejected'::text])));
ALTER TABLE public."staff_users" ADD CONSTRAINT "staff_users_auth_user_id_key" UNIQUE (auth_user_id);
ALTER TABLE public."staff_users" ADD CONSTRAINT "staff_users_employee_code_key" UNIQUE (employee_code);
ALTER TABLE public."staff_users" ADD CONSTRAINT "staff_users_pkey" PRIMARY KEY (id);
ALTER TABLE public."staff_users" ADD CONSTRAINT "staff_users_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])));
ALTER TABLE public."staff_users" ADD CONSTRAINT "staff_users_username_key" UNIQUE (username);
ALTER TABLE public."success_stories" ADD CONSTRAINT "success_stories_pkey" PRIMARY KEY (id);
ALTER TABLE public."testimonials" ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY (id);
ALTER TABLE public."testimonials" ADD CONSTRAINT "testimonials_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (id);
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE (user_id, role);
ALTER TABLE public."wishlists" ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY (id);
ALTER TABLE public."wishlists" ADD CONSTRAINT "wishlists_user_id_property_id_key" UNIQUE (user_id, property_id);

-- Foreign keys. References to auth.users are rewritten to public.app_users(id).
ALTER TABLE public."contact_notes" ADD CONSTRAINT "contact_notes_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES builders(id) ON DELETE CASCADE;
ALTER TABLE public."contact_notes" ADD CONSTRAINT "contact_notes_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE public."enquiries" ADD CONSTRAINT "enquiries_assigned_staff_id_fkey" FOREIGN KEY (assigned_staff_id) REFERENCES property_assignments(id) ON DELETE SET NULL;
ALTER TABLE public."enquiries" ADD CONSTRAINT "enquiries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE SET NULL;
ALTER TABLE public."hot_property_settings" ADD CONSTRAINT "hot_property_settings_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE public."navigation_items" ADD CONSTRAINT "navigation_items_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE CASCADE;
ALTER TABLE public."properties" ADD CONSTRAINT "properties_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES builders(id) ON DELETE SET NULL;
ALTER TABLE public."properties" ADD CONSTRAINT "properties_assigned_staff_id_fkey" FOREIGN KEY (assigned_staff_id) REFERENCES staff_users(id) ON DELETE SET NULL;
ALTER TABLE public."properties" ADD CONSTRAINT "properties_builder_id_fkey" FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE SET NULL;
ALTER TABLE public."properties" ADD CONSTRAINT "properties_channel_partner_id_fkey" FOREIGN KEY (channel_partner_id) REFERENCES builders(id) ON DELETE SET NULL;
ALTER TABLE public."properties" ADD CONSTRAINT "properties_location_id_fkey" FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE public."properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES builders(id) ON DELETE SET NULL;
ALTER TABLE public."property_amenities" ADD CONSTRAINT "property_amenities_amenity_id_fkey" FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE;
ALTER TABLE public."property_amenities" ADD CONSTRAINT "property_amenities_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE public."property_assignments" ADD CONSTRAINT "property_assignments_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE public."property_configurations" ADD CONSTRAINT "property_configurations_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE public."property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE public."property_nearby" ADD CONSTRAINT "property_nearby_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE public."property_prices" ADD CONSTRAINT "property_prices_property_id_fkey" FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE public."wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.app_users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.enforce_top_featured_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  active_count int;
BEGIN
  IF NEW.is_top_featured = true
     AND (TG_OP = 'INSERT' OR COALESCE(OLD.is_top_featured, false) = false) THEN
    SELECT count(*) INTO active_count
    FROM public.properties
    WHERE is_top_featured = true
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    IF active_count >= 10 THEN
      RAISE EXCEPTION 'You can add only 10 properties in the Top 10 Featured Properties section. Please remove or disable one property before adding a new one.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END $function$
;
CREATE OR REPLACE FUNCTION public.sync_hot_property_flag()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.property_id IS NOT NULL THEN
    UPDATE public.properties SET is_hot = false WHERE is_hot = true AND id <> NEW.property_id;
    UPDATE public.properties SET is_hot = true WHERE id = NEW.property_id;
  ELSE
    UPDATE public.properties SET is_hot = false WHERE is_hot = true;
  END IF;
  RETURN NEW;
END $function$
;

-- Authorization helper replacements. These read the app user id from current_setting set by server code, not Supabase auth.uid().
CREATE OR REPLACE FUNCTION public.current_app_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.current_staff_user_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.staff_users WHERE auth_user_id = public.current_app_user_id() LIMIT 1
$$;
CREATE OR REPLACE FUNCTION public.has_staff_permission(_module text, _action text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
DECLARE allowed boolean;
BEGIN
  IF public.has_role(public.current_app_user_id(), 'admin') THEN RETURN true; END IF;
  SELECT id INTO sid FROM public.staff_users WHERE auth_user_id = public.current_app_user_id() LIMIT 1;
  IF sid IS NULL THEN RETURN false; END IF;
  SELECT CASE _action
    WHEN 'view' THEN can_view
    WHEN 'add' THEN can_add
    WHEN 'edit' THEN can_edit
    WHEN 'delete' THEN can_delete
    WHEN 'publish' THEN can_publish
    WHEN 'export' THEN can_export
    ELSE false
  END
  INTO allowed
  FROM public.staff_permissions
  WHERE staff_user_id = sid AND module_name = _module;

  RETURN COALESCE(allowed, false);
END;
$$;

CREATE TRIGGER "banners_set_updated_at" BEFORE UPDATE ON public."banners" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "builders_updated_at" BEFORE UPDATE ON public."builders" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_contact_info_updated" BEFORE UPDATE ON public."contact_info" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "contact_notes_set_updated_at" BEFORE UPDATE ON public."contact_notes" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_content_sections_updated" BEFORE UPDATE ON public."content_sections" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_enquiries_updated" BEFORE UPDATE ON public."enquiries" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_faqs_updated" BEFORE UPDATE ON public."faqs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "set_form_options_updated_at" BEFORE UPDATE ON public."form_options" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "hot_property_settings_set_updated_at" BEFORE UPDATE ON public."hot_property_settings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "hot_property_settings_sync_flag" AFTER INSERT OR UPDATE ON public."hot_property_settings" FOR EACH ROW EXECUTE FUNCTION sync_hot_property_flag();
CREATE TRIGGER "locations_updated_at" BEFORE UPDATE ON public."locations" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_nav_updated" BEFORE UPDATE ON public."navigation_items" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_partners_updated" BEFORE UPDATE ON public."partners" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON public."profiles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "enforce_top_featured_limit_trg" BEFORE INSERT OR UPDATE ON public."properties" FOR EACH ROW EXECUTE FUNCTION enforce_top_featured_limit();
CREATE TRIGGER "properties_updated_at" BEFORE UPDATE ON public."properties" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "property_assignments_set_updated_at" BEFORE UPDATE ON public."property_assignments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "sell_property_enquiries_updated_at" BEFORE UPDATE ON public."sell_property_enquiries" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_seo_updated" BEFORE UPDATE ON public."seo_metadata" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_site_settings_updated" BEFORE UPDATE ON public."site_settings" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "staff_permissions_set_updated_at" BEFORE UPDATE ON public."staff_permissions" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "staff_tasks_set_updated_at" BEFORE UPDATE ON public."staff_tasks" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "staff_users_set_updated_at" BEFORE UPDATE ON public."staff_users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_stories_updated" BEFORE UPDATE ON public."success_stories" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER "trg_testimonials_updated" BEFORE UPDATE ON public."testimonials" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes not owned by constraints.
CREATE INDEX IF NOT EXISTS idx_logs_created ON public.activity_logs USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entity ON public.activity_logs USING btree (entity, entity_id);
CREATE INDEX IF NOT EXISTS builders_contact_type_idx ON public.builders USING btree (contact_type);
CREATE INDEX IF NOT EXISTS contact_notes_contact_id_idx ON public.contact_notes USING btree (contact_id);
CREATE INDEX IF NOT EXISTS contact_notes_property_id_idx ON public.contact_notes USING btree (property_id);
CREATE INDEX IF NOT EXISTS contact_notes_status_idx ON public.contact_notes USING btree (status);
CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_staff ON public.enquiries USING btree (assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON public.enquiries USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries USING btree (status);
CREATE INDEX IF NOT EXISTS idx_faqs_order ON public.faqs USING btree (display_order);
CREATE INDEX IF NOT EXISTS form_options_lookup_idx ON public.form_options USING btree (form_key, field_key, display_order);
CREATE INDEX IF NOT EXISTS idx_nav_loc_order ON public.navigation_items USING btree (location, display_order);
CREATE INDEX IF NOT EXISTS idx_partners_order ON public.partners USING btree (display_order);
CREATE INDEX IF NOT EXISTS idx_properties_assigned_staff ON public.properties USING btree (assigned_staff_id);
CREATE INDEX IF NOT EXISTS properties_agent_id_idx ON public.properties USING btree (agent_id);
CREATE INDEX IF NOT EXISTS properties_channel_partner_id_idx ON public.properties USING btree (channel_partner_id);
CREATE INDEX IF NOT EXISTS properties_flags_idx ON public.properties USING btree (is_featured, is_top_featured, is_hot);
CREATE INDEX IF NOT EXISTS properties_listing_type_idx ON public.properties USING btree (listing_type);
CREATE INDEX IF NOT EXISTS properties_location_idx ON public.properties USING btree (location_id);
CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON public.properties USING btree (owner_id);
CREATE INDEX IF NOT EXISTS properties_property_type_idx ON public.properties USING btree (property_type);
CREATE UNIQUE INDEX IF NOT EXISTS properties_top_featured_rank_uniq ON public.properties USING btree (top_featured_rank) WHERE ((is_top_featured = true) AND (top_featured_rank IS NOT NULL));
CREATE UNIQUE INDEX IF NOT EXISTS property_assignments_one_primary ON public.property_assignments USING btree (property_id) WHERE (is_primary = true);
CREATE INDEX IF NOT EXISTS property_assignments_property_idx ON public.property_assignments USING btree (property_id);
CREATE INDEX IF NOT EXISTS sell_property_enquiries_created_at_idx ON public.sell_property_enquiries USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS sell_property_enquiries_status_idx ON public.sell_property_enquiries USING btree (status);
CREATE INDEX IF NOT EXISTS idx_stories_order ON public.success_stories USING btree (display_order);
CREATE UNIQUE INDEX IF NOT EXISTS success_stories_slug_uidx ON public.success_stories USING btree (slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_order ON public.testimonials USING btree (display_order);

-- RLS is disabled in this migration draft. Enforce former policies in app server middleware/services.
ALTER TABLE public."activity_logs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."amenities" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."banners" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."builders" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contact_info" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."contact_notes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."content_sections" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."enquiries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."faqs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."form_options" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."hot_property_settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."locations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."navigation_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."notifications" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."partners" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."properties" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."property_amenities" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."property_assignments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."property_configurations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."property_images" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."property_nearby" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."property_prices" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."sell_property_enquiries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."seo_metadata" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."site_settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."staff_permissions" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."staff_tasks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."staff_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."success_stories" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."testimonials" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."user_roles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."wishlists" DISABLE ROW LEVEL SECURITY;
COMMIT;
