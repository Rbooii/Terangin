import {
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const assessmentCategory = pgEnum("assessment_category", [
  "MINAT",
  "BAKAT",
  "KEPRIBADIAN",
  "GAYA_BELAJAR",
]);

export const universityType = pgEnum("university_type", [
  "PTN",
  "PTS",
  "KEDINASAN",
  "PTLN",
]);

export const senderType = pgEnum("sender_type", ["USER", "AI"]);

export const actionPlanStatus = pgEnum("action_plan_status", [
  "DRAFT",
  "FINALIZED",
]);

export const transactionStatus = pgEnum("transaction_status", [
  "PENDING",
  "PAID",
  "EXPIRED",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  schoolOrigin: varchar("school_origin", { length: 150 }),
  gradeLevel: integer("grade_level"),
  initialInterests: text("initial_interests").array(),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  assessmentCompletedAt: timestamp("assessment_completed_at"),
  gradesCompletedAt: timestamp("grades_completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: assessmentCategory("category").notNull(),
  questionText: text("question_text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  dimension: varchar("dimension", { length: 30 }),
});

export const userAssessmentAnswers = pgTable(
  "user_assessment_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
  },
  (table) => [
    unique("user_assessment_answers_user_question_unique").on(
      table.userId,
      table.questionId,
    ),
  ],
);

export const academicRecords = pgTable(
  "academic_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: varchar("subject", { length: 50 }).notNull(),
    semester: integer("semester").notNull(),
    score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  },
  (table) => [
    unique("academic_records_user_subject_semester_unique").on(
      table.userId,
      table.subject,
      table.semester,
    ),
  ],
);

export const majors = pgTable("majors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  careerProspects: text("career_prospects"),
  profile: jsonb("profile"),
});

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  type: universityType("type").notNull(),
  location: varchar("location", { length: 100 }),
});

export const universityMajors = pgTable(
  "university_majors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    universityId: uuid("university_id")
      .notNull()
      .references(() => universities.id, { onDelete: "cascade" }),
    majorId: uuid("major_id")
      .notNull()
      .references(() => majors.id, { onDelete: "cascade" }),
    capacity: integer("capacity"),
    estimatedTuition: decimal("estimated_tuition", {
      precision: 15,
      scale: 2,
    }),
  },
  (table) => [
    unique("university_majors_university_major_unique").on(
      table.universityId,
      table.majorId,
    ),
  ],
);

export const analysisResults = pgTable("analysis_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  personalityType: varchar("personality_type", { length: 50 }),
  analysisSummary: text("analysis_summary"),
  details: jsonb("details"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const analysisRecommendations = pgTable("analysis_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  majorId: uuid("major_id")
    .notNull()
    .references(() => majors.id, { onDelete: "cascade" }),
  matchPercentage: decimal("match_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(),
  rankOrder: integer("rank_order").notNull(),
  reason: text("reason"),
  factors: jsonb("factors"),
});

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  senderType: senderType("sender_type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actionPlans = pgTable("action_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  finalUnivMajorId: uuid("final_univ_major_id").references(
    () => universityMajors.id,
  ),
  roadmapJson: jsonb("roadmap_json"),
  confidenceScore: integer("confidence_score"),
  status: actionPlanStatus("status").notNull().default("DRAFT"),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  reference: varchar("reference", { length: 30 }).notNull().unique(),
  description: varchar("description", { length: 100 })
    .notNull()
    .default("Sesi analisis jurusan"),
  amount: integer("amount").notNull(),
  method: varchar("method", { length: 20 }).notNull().default("QRIS"),
  status: transactionStatus("status").notNull().default("PENDING"),
  qrisPayload: text("qris_payload").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
  expiresAt: timestamp("expires_at"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
