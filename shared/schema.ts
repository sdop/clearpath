import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Leads / unconverted patient inquiries
export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  insuranceId: text("insurance_id"),
  insuranceProvider: text("insurance_provider"),
  callReason: text("call_reason"), // "addiction", "mental_health", etc.
  nonConversionReason: text("non_conversion_reason"), // "insurance_pending", "not_ready", "no_beds", "cost", "competitor"
  status: text("status").notNull().default("new"), // new | insurance_pending | following_up | re_engaged | admitted | cold
  followUpCount: integer("follow_up_count").notNull().default(0),
  lastContactAt: text("last_contact_at"),
  createdAt: text("created_at").notNull(),
  centerId: integer("center_id"),
  bdoId: text("bdo_id"),
  notes: text("notes"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({ id: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Insurance verifications
export const verifications = sqliteTable("verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  leadId: integer("lead_id").notNull(),
  insuranceProvider: text("insurance_provider").notNull(),
  insuranceId: text("insurance_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | verified | pre_auth_required | denied | error
  coverageLevel: text("coverage_level"), // "full" | "partial" | "none"
  deductibleMet: integer("deductible_met", { mode: "boolean" }),
  preAuthRequired: integer("pre_auth_required", { mode: "boolean" }),
  preAuthStatus: text("pre_auth_status"), // pending | approved | denied
  estimatedCopay: real("estimated_copay"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull(),
  notes: text("notes"),
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({ id: true });
export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verifications.$inferSelect;

// Referrals from BDO portal
export const referrals = sqliteTable("referrals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referralSource: text("referral_source").notNull(), // "ER", "physician", "therapist", "court", "self"
  sourceName: text("source_name").notNull(), // Hospital or doctor name
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email"),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  insuranceProvider: text("insurance_provider"),
  urgency: text("urgency").notNull().default("standard"), // "urgent" | "standard" | "low"
  status: text("status").notNull().default("received"), // received | in_review | verification | admitted | rejected
  bdoAssigned: text("bdo_assigned"),
  trackingToken: text("tracking_token").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  notes: text("notes"),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// Virtual care enrollments
export const virtualEnrollments = sqliteTable("virtual_enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  patientName: text("patient_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  programType: text("program_type").notNull(), // "telehealth_intake" | "virtual_iop" | "remote_support"
  status: text("status").notNull().default("enrolled"), // enrolled | active | completed | stepped_up
  enrolledAt: text("enrolled_at").notNull(),
  steppedUpAt: text("stepped_up_at"),
  centerId: integer("center_id"),
  notes: text("notes"),
});

export const insertVirtualEnrollmentSchema = createInsertSchema(virtualEnrollments).omit({ id: true });
export type InsertVirtualEnrollment = z.infer<typeof insertVirtualEnrollmentSchema>;
export type VirtualEnrollment = typeof virtualEnrollments.$inferSelect;

// Centers
export const centers = sqliteTable("centers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  bedsTotal: integer("beds_total").notNull(),
  bedsAvailable: integer("beds_available").notNull(),
  hasVirtual: integer("has_virtual", { mode: "boolean" }).notNull().default(false),
});

export const insertCenterSchema = createInsertSchema(centers).omit({ id: true });
export type InsertCenter = z.infer<typeof insertCenterSchema>;
export type Center = typeof centers.$inferSelect;
