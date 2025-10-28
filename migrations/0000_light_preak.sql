CREATE TABLE "cadets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"battalion" varchar(100) NOT NULL,
	"company" varchar(50) NOT NULL,
	"join_date" timestamp NOT NULL,
	"academy_number" integer,
	"height" integer,
	"weight" integer,
	"age" integer,
	"course" varchar(100),
	"sex" varchar(10),
	"relegated" varchar(1) DEFAULT 'N' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"cadet_id" integer NOT NULL,
	"date_of_reporting" timestamp NOT NULL,
	"medical_problem" text NOT NULL,
	"diagnosis" text,
	"medical_status" varchar(20) DEFAULT 'Active' NOT NULL,
	"attend_c" integer DEFAULT 0 NOT NULL,
	"mi_detained" integer DEFAULT 0 NOT NULL,
	"ex_ppg" integer DEFAULT 0 NOT NULL,
	"attend_b" integer DEFAULT 0 NOT NULL,
	"physiotherapy" integer DEFAULT 0 NOT NULL,
	"total_training_days_missed" integer DEFAULT 0 NOT NULL,
	"monitoring_case" boolean DEFAULT false NOT NULL,
	"contact_no" varchar(20),
	"remarks" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" text NOT NULL,
	"email" varchar(255),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_cadet_id_cadets_id_fk" FOREIGN KEY ("cadet_id") REFERENCES "public"."cadets"("id") ON DELETE no action ON UPDATE no action;