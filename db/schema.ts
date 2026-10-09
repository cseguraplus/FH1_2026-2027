import { sqliteTable, text, integer, primaryKey, index, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(), publicId: text("public_id").notNull().unique(),
  name: text("name").notNull(), city: text("city").notNull().default(""),
  referralCode: text("referral_code").notNull().unique(),
  sponsorId: text("sponsor_id").references((): AnySQLiteColumn => profiles.userId),
  wantsFounder: integer("wants_founder").notNull().default(0), founder: integer("founder").notNull().default(0),
  consentVersion: text("consent_version").notNull(), createdAt: text("created_at").notNull(),
}, t => [index("profiles_sponsor_idx").on(t.sponsorId)]);
export const progress = sqliteTable("progress", {
  userId: text("user_id").notNull().references(() => profiles.userId),
  lessonId: text("lesson_id").notNull(), completedAt: text("completed_at").notNull(),
}, t => [primaryKey({columns:[t.userId,t.lessonId]})]);
export const audit = sqliteTable("audit", {
  id: text("id").primaryKey(), actorId: text("actor_id").notNull(),
  subjectId: text("subject_id").notNull(), action: text("action").notNull(), createdAt: text("created_at").notNull(),
});
export const siteAdmin = sqliteTable("site_admin", {
  role: text("role").primaryKey(),
  userId: text("user_id").notNull(),
  boundAt: text("bound_at").notNull(),
});
export const requestLimits = sqliteTable("request_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetsAt: integer("resets_at").notNull(),
}, t => [index("request_limits_expiry_idx").on(t.resetsAt)]);

export const authLinks = sqliteTable("auth_links", {
  providerSubject: text("provider_subject").primaryKey(),
  userId: text("user_id").notNull().unique().references(() => profiles.userId),
  createdAt: text("created_at").notNull(),
});
