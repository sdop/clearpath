import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertVerificationSchema, insertReferralSchema, insertVirtualEnrollmentSchema } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { leads, verifications, referrals, virtualEnrollments, centers } from "@shared/schema";

function seed() {
  const existingCenters = storage.getCenters();
  if (existingCenters.length > 0) return;

  // Seed centers
  const centerData = [
    { name: "Phoenix Recovery Center", state: "AZ", city: "Phoenix", bedsTotal: 48, bedsAvailable: 12, hasVirtual: true },
    { name: "Clearview Treatment Atlanta", state: "GA", city: "Atlanta", bedsTotal: 36, bedsAvailable: 3, hasVirtual: false },
    { name: "Sunrise Rehab Nashville", state: "TN", city: "Nashville", bedsTotal: 42, bedsAvailable: 18, hasVirtual: true },
    { name: "Pacific Coast Recovery", state: "CA", city: "San Diego", bedsTotal: 60, bedsAvailable: 7, hasVirtual: true },
    { name: "Lakefront Healing Chicago", state: "IL", city: "Chicago", bedsTotal: 30, bedsAvailable: 0, hasVirtual: false },
    { name: "Blue Ridge Treatment Asheville", state: "NC", city: "Asheville", bedsTotal: 24, bedsAvailable: 9, hasVirtual: false },
    { name: "Desert Hope Las Vegas", state: "NV", city: "Las Vegas", bedsTotal: 54, bedsAvailable: 21, hasVirtual: true },
    { name: "Riverwalk Recovery Houston", state: "TX", city: "Houston", bedsTotal: 40, bedsAvailable: 5, hasVirtual: false },
    { name: "Crossroads Treatment Denver", state: "CO", city: "Denver", bedsTotal: 32, bedsAvailable: 14, hasVirtual: true },
    { name: "Harbor Light Boston", state: "MA", city: "Boston", bedsTotal: 28, bedsAvailable: 2, hasVirtual: false },
    { name: "Keystone Recovery Pittsburgh", state: "PA", city: "Pittsburgh", bedsTotal: 36, bedsAvailable: 11, hasVirtual: false },
  ];
  centerData.forEach(c => db.insert(centers).values(c).run());

  // Seed leads
  const now = new Date();
  const leadData = [
    { patientName: "James R.", phone: "555-0101", insuranceId: "BC123456", insuranceProvider: "Blue Cross", callReason: "addiction", nonConversionReason: "insurance_pending", status: "insurance_pending", followUpCount: 1, lastContactAt: new Date(now.getTime() - 1*24*60*60*1000).toISOString(), createdAt: new Date(now.getTime() - 2*24*60*60*1000).toISOString(), centerId: 1, notes: "Caller motivated, just waiting on verification" },
    { patientName: "Maria T.", phone: "555-0102", insuranceId: "AE789012", insuranceProvider: "Aetna", callReason: "addiction", nonConversionReason: "not_ready", status: "following_up", followUpCount: 2, lastContactAt: new Date(now.getTime() - 3*24*60*60*1000).toISOString(), createdAt: new Date(now.getTime() - 5*24*60*60*1000).toISOString(), centerId: 3, notes: "Has family support, needs more time" },
    { patientName: "Derek W.", phone: "555-0103", insuranceId: "UH345678", insuranceProvider: "UnitedHealth", callReason: "addiction", nonConversionReason: "no_beds", status: "following_up", followUpCount: 1, lastContactAt: new Date(now.getTime() - 1*24*60*60*1000).toISOString(), createdAt: new Date(now.getTime() - 3*24*60*60*1000).toISOString(), centerId: 5, notes: "Atlanta full - offered Chicago transfer" },
    { patientName: "Priya S.", phone: "555-0104", insuranceId: "CI901234", insuranceProvider: "Cigna", callReason: "mental_health", nonConversionReason: "insurance_pending", status: "insurance_pending", followUpCount: 0, lastContactAt: null, createdAt: new Date(now.getTime() - 4*60*60*1000).toISOString(), centerId: 4, notes: "New lead - just submitted insurance" },
    { patientName: "Robert M.", phone: "555-0105", insuranceId: null, insuranceProvider: "Medicaid", callReason: "addiction", nonConversionReason: "cost", status: "following_up", followUpCount: 3, lastContactAt: new Date(now.getTime() - 7*24*60*60*1000).toISOString(), createdAt: new Date(now.getTime() - 14*24*60*60*1000).toISOString(), centerId: 2, notes: "Concerned about out-of-pocket costs" },
    { patientName: "Lisa K.", phone: "555-0106", insuranceId: "MP567890", insuranceProvider: "Magellan", callReason: "addiction", nonConversionReason: "not_ready", status: "following_up", followUpCount: 1, lastContactAt: new Date(now.getTime() - 2*24*60*60*1000).toISOString(), createdAt: new Date(now.getTime() - 4*24*60*60*1000).toISOString(), centerId: 7, notes: "Wants to discuss with spouse first" },
    { patientName: "Carlos B.", phone: "555-0107", insuranceId: "HU234567", insuranceProvider: "Humana", callReason: "addiction", nonConversionReason: "competitor", status: "cold", followUpCount: 4, lastContactAt: new Date(now.getTime() - 10*24*60*60*1000).toISOString(), createdAt: new Date(now.getTime() - 25*24*60*60*1000).toISOString(), centerId: 9, notes: "Went with virtual-only competitor" },
    { patientName: "Angela F.", phone: "555-0108", insuranceId: "OC678901", insuranceProvider: "Oscar", callReason: "mental_health", nonConversionReason: "insurance_pending", status: "insurance_pending", followUpCount: 0, lastContactAt: null, createdAt: new Date(now.getTime() - 6*60*60*1000).toISOString(), centerId: 1, notes: "Pre-auth required for residential" },
  ];
  leadData.forEach(l => db.insert(leads).values(l as any).run());

  // Seed verifications
  const verData = [
    { leadId: 1, insuranceProvider: "Blue Cross", insuranceId: "BC123456", status: "pre_auth_required", coverageLevel: "partial", deductibleMet: false, preAuthRequired: true, preAuthStatus: "pending", estimatedCopay: 450, createdAt: new Date(now.getTime() - 2*24*60*60*1000).toISOString(), notes: "Residential requires pre-auth" },
    { leadId: 4, insuranceProvider: "Cigna", insuranceId: "CI901234", status: "pending", coverageLevel: null, deductibleMet: null, preAuthRequired: null, preAuthStatus: null, estimatedCopay: null, createdAt: new Date(now.getTime() - 4*60*60*1000).toISOString(), notes: "Submitted 4 hours ago" },
    { leadId: 8, insuranceProvider: "Oscar", insuranceId: "OC678901", status: "pending", coverageLevel: null, deductibleMet: null, preAuthRequired: null, preAuthStatus: null, estimatedCopay: null, createdAt: new Date(now.getTime() - 6*60*60*1000).toISOString(), notes: "Submitted 6 hours ago" },
  ];
  verData.forEach(v => db.insert(verifications).values(v as any).run());

  // Seed referrals
  const refData = [
    { referralSource: "ER", sourceName: "Phoenix General Hospital", contactName: "Dr. Sarah Mills", contactEmail: "smills@phoenixgen.org", patientName: "Thomas A.", patientPhone: "555-0201", insuranceProvider: "Blue Cross", urgency: "urgent", status: "verification", bdoAssigned: "BDO B", trackingToken: "TRK-001", createdAt: new Date(now.getTime() - 3*60*60*1000).toISOString(), updatedAt: new Date(now.getTime() - 1*60*60*1000).toISOString(), notes: "Patient in ER now, needs same-day admission" },
    { referralSource: "physician", sourceName: "Greenfield Family Practice", contactName: "Dr. John Park", contactEmail: "jpark@greenfield.com", patientName: "Sandra L.", patientPhone: "555-0202", insuranceProvider: "Aetna", urgency: "standard", status: "received", bdoAssigned: "BDO D", trackingToken: "TRK-002", createdAt: new Date(now.getTime() - 1*24*60*60*1000).toISOString(), updatedAt: new Date(now.getTime() - 1*24*60*60*1000).toISOString(), notes: "PCP referral, patient willing to wait" },
    { referralSource: "therapist", sourceName: "Clarity Mental Health Group", contactName: "Dr. Amanda Chen", contactEmail: "achen@clarity.com", patientName: "Michael R.", patientPhone: "555-0203", insuranceProvider: "Cigna", urgency: "standard", status: "admitted", bdoAssigned: "BDO F", trackingToken: "TRK-003", createdAt: new Date(now.getTime() - 3*24*60*60*1000).toISOString(), updatedAt: new Date(now.getTime() - 12*60*60*1000).toISOString(), notes: "Successfully admitted to Denver" },
    { referralSource: "ER", sourceName: "Atlanta Medical Center", contactName: "Nurse Practitioner Davis", contactEmail: "ndavis@atmc.org", patientName: "Jennifer W.", patientPhone: "555-0204", insuranceProvider: "Humana", urgency: "urgent", status: "in_review", bdoAssigned: "BDO I", trackingToken: "TRK-004", createdAt: new Date(now.getTime() - 5*60*60*1000).toISOString(), updatedAt: new Date(now.getTime() - 2*60*60*1000).toISOString(), notes: "Waiting on bed availability confirmation" },
    { referralSource: "court", sourceName: "Fulton County Court", contactName: "Case Worker Johnson", contactEmail: "cjohnson@fultoncourt.gov", patientName: "Kevin P.", patientPhone: "555-0205", insuranceProvider: "Medicaid", urgency: "standard", status: "received", bdoAssigned: "BDO L", trackingToken: "TRK-005", createdAt: new Date(now.getTime() - 2*24*60*60*1000).toISOString(), updatedAt: new Date(now.getTime() - 2*24*60*60*1000).toISOString(), notes: "Court-mandated treatment" },
  ];
  refData.forEach(r => db.insert(referrals).values(r as any).run());

  // Seed virtual enrollments
  const virtData = [
    { patientName: "Nicole H.", phone: "555-0301", email: "nicole.h@email.com", programType: "virtual_iop", status: "active", enrolledAt: new Date(now.getTime() - 14*24*60*60*1000).toISOString(), centerId: 1 },
    { patientName: "Alex T.", phone: "555-0302", email: "alex.t@email.com", programType: "telehealth_intake", status: "enrolled", enrolledAt: new Date(now.getTime() - 1*24*60*60*1000).toISOString(), centerId: 3 },
    { patientName: "Brianna M.", phone: "555-0303", email: null, programType: "remote_support", status: "active", enrolledAt: new Date(now.getTime() - 7*24*60*60*1000).toISOString(), centerId: 7 },
    { patientName: "David C.", phone: "555-0304", email: "david.c@email.com", programType: "virtual_iop", status: "stepped_up", enrolledAt: new Date(now.getTime() - 21*24*60*60*1000).toISOString(), steppedUpAt: new Date(now.getTime() - 3*24*60*60*1000).toISOString(), centerId: 9 },
    { patientName: "Rachel S.", phone: "555-0305", email: "rachel.s@email.com", programType: "telehealth_intake", status: "active", enrolledAt: new Date(now.getTime() - 3*24*60*60*1000).toISOString(), centerId: 4 },
  ];
  virtData.forEach(v => db.insert(virtualEnrollments).values(v as any).run());
}

seed();

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Dashboard stats
  app.get("/api/stats", (_req, res) => {
    const allLeads = storage.getLeads();
    const allReferrals = storage.getReferrals();
    const allVirtual = storage.getVirtualEnrollments();
    const allVerifications = storage.getVerifications();
    const allCenters = storage.getCenters();

    const pendingVerifications = allVerifications.filter(v => v.status === "pending" || v.status === "pre_auth_required").length;
    const activeLeads = allLeads.filter(l => l.status !== "admitted" && l.status !== "cold").length;
    const urgentReferrals = allReferrals.filter(r => r.urgency === "urgent" && r.status !== "admitted").length;
    const virtualActive = allVirtual.filter(v => v.status === "active" || v.status === "enrolled").length;
    const totalBeds = allCenters.reduce((sum, c) => sum + c.bedsTotal, 0);
    const availableBeds = allCenters.reduce((sum, c) => sum + c.bedsAvailable, 0);
    const occupancyRate = Math.round(((totalBeds - availableBeds) / totalBeds) * 100);

    res.json({
      activeLeads,
      pendingVerifications,
      urgentReferrals,
      virtualActive,
      availableBeds,
      occupancyRate,
      totalLeads: allLeads.length,
      totalReferrals: allReferrals.length,
    });
  });

  // Leads
  app.get("/api/leads", (_req, res) => res.json(storage.getLeads()));
  app.get("/api/leads/:id", (req, res) => {
    const lead = storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: "Not found" });
    res.json(lead);
  });
  app.post("/api/leads", (req, res) => {
    const parsed = insertLeadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    res.json(storage.createLead(parsed.data));
  });
  app.patch("/api/leads/:id", (req, res) => {
    const updated = storage.updateLead(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // Verifications
  app.get("/api/verifications", (_req, res) => res.json(storage.getVerifications()));
  app.get("/api/verifications/lead/:leadId", (req, res) => {
    const v = storage.getVerificationByLeadId(Number(req.params.leadId));
    if (!v) return res.status(404).json({ message: "Not found" });
    res.json(v);
  });
  app.post("/api/verifications", (req, res) => {
    const parsed = insertVerificationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(storage.createVerification(parsed.data));
  });
  app.patch("/api/verifications/:id", (req, res) => {
    const updated = storage.updateVerification(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // Simulate insurance verification (AI-powered instant check)
  app.post("/api/verify-insurance", (req, res) => {
    const { insuranceProvider, insuranceId, leadId } = req.body;
    if (!insuranceProvider || !insuranceId) return res.status(400).json({ message: "Missing fields" });

    // Simulate realistic outcomes based on provider
    const outcomes: Record<string, any> = {
      "Blue Cross": { status: "pre_auth_required", coverageLevel: "partial", deductibleMet: false, preAuthRequired: true, preAuthStatus: "pending", estimatedCopay: 450 },
      "Aetna": { status: "verified", coverageLevel: "full", deductibleMet: true, preAuthRequired: false, preAuthStatus: null, estimatedCopay: 200 },
      "Cigna": { status: "verified", coverageLevel: "full", deductibleMet: false, preAuthRequired: false, preAuthStatus: null, estimatedCopay: 300 },
      "UnitedHealth": { status: "pre_auth_required", coverageLevel: "partial", deductibleMet: true, preAuthRequired: true, preAuthStatus: "pending", estimatedCopay: 150 },
      "Humana": { status: "verified", coverageLevel: "partial", deductibleMet: false, preAuthRequired: false, preAuthStatus: null, estimatedCopay: 380 },
      "Medicaid": { status: "verified", coverageLevel: "full", deductibleMet: true, preAuthRequired: false, preAuthStatus: null, estimatedCopay: 0 },
      "Oscar": { status: "pre_auth_required", coverageLevel: "partial", deductibleMet: false, preAuthRequired: true, preAuthStatus: "pending", estimatedCopay: 520 },
      "Magellan": { status: "verified", coverageLevel: "full", deductibleMet: true, preAuthRequired: false, preAuthStatus: null, estimatedCopay: 175 },
    };

    const result = outcomes[insuranceProvider] || { status: "verified", coverageLevel: "partial", deductibleMet: false, preAuthRequired: false, preAuthStatus: null, estimatedCopay: 350 };
    const now = new Date().toISOString();

    const verification = storage.createVerification({
      leadId: leadId || 0,
      insuranceProvider,
      insuranceId,
      ...result,
      verifiedAt: result.status !== "pending" ? now : null,
      createdAt: now,
      notes: null,
    });

    // If we have a leadId, update the lead status
    if (leadId) {
      storage.updateLead(leadId, {
        status: result.status === "verified" ? "re_engaged" : "insurance_pending",
        insuranceProvider,
        insuranceId,
      });
    }

    res.json(verification);
  });

  // Referrals
  app.get("/api/referrals", (_req, res) => res.json(storage.getReferrals()));
  app.get("/api/referrals/track/:token", (req, res) => {
    const r = storage.getReferralByToken(req.params.token);
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json(r);
  });
  app.post("/api/referrals", (req, res) => {
    const token = "TRK-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const now = new Date().toISOString();
    const parsed = insertReferralSchema.safeParse({ ...req.body, trackingToken: token, createdAt: now, updatedAt: now });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
    res.json(storage.createReferral(parsed.data));
  });
  app.patch("/api/referrals/:id", (req, res) => {
    const updated = storage.updateReferral(Number(req.params.id), { ...req.body, updatedAt: new Date().toISOString() });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // Virtual enrollments
  app.get("/api/virtual", (_req, res) => res.json(storage.getVirtualEnrollments()));
  app.post("/api/virtual", (req, res) => {
    const now = new Date().toISOString();
    const parsed = insertVirtualEnrollmentSchema.safeParse({ ...req.body, enrolledAt: now });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(storage.createVirtualEnrollment(parsed.data));
  });
  app.patch("/api/virtual/:id", (req, res) => {
    const updated = storage.updateVirtualEnrollment(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // Virtual enrollments — alias
  app.get("/api/virtual-enrollments", (_req, res) => res.json(storage.getVirtualEnrollments()));
  app.post("/api/virtual-enrollments", (req, res) => {
    const now = new Date().toISOString();
    const parsed = insertVirtualEnrollmentSchema.safeParse({ ...req.body, enrolledAt: now });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data" });
    res.json(storage.createVirtualEnrollment(parsed.data));
  });

  // Centers
  app.get("/api/centers", (_req, res) => res.json(storage.getCenters()));
  app.patch("/api/centers/:id", (req, res) => {
    const updated = storage.updateCenter(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });
  // Refresh center — simulate re-sync from EHR (returns current center data)
  app.post("/api/centers/:id/refresh", (req, res) => {
    const center = storage.getCenters().find(c => c.id === Number(req.params.id));
    if (!center) return res.status(404).json({ message: "Not found" });
    res.json(center);
  });

  return httpServer;
}
