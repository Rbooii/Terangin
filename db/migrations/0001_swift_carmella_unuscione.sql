ALTER TABLE "analysis_recommendations" ADD COLUMN "factors" jsonb;--> statement-breakpoint
ALTER TABLE "majors" ADD COLUMN "profile" jsonb;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "dimension" varchar(30);