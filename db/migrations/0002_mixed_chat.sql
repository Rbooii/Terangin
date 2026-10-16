CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'PAID', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reference" varchar(30) NOT NULL,
	"description" varchar(100) DEFAULT 'Sesi analisis jurusan' NOT NULL,
	"amount" integer NOT NULL,
	"method" varchar(20) DEFAULT 'QRIS' NOT NULL,
	"status" "transaction_status" DEFAULT 'PENDING' NOT NULL,
	"qris_payload" text NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"expires_at" timestamp,
	CONSTRAINT "transactions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;