import { db } from "./db";
import { leads, verifications, referrals, virtualEnrollments, centers } from "@shared/schema";
import type { InsertLead, Lead, InsertVerification, Verification, InsertReferral, Referral, InsertVirtualEnrollment, VirtualEnrollment, InsertCenter, Center } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Leads
  getLeads(): Lead[];
  getLead(id: number): Lead | undefined;
  createLead(lead: InsertLead): Lead;
  updateLead(id: number, updates: Partial<InsertLead>): Lead | undefined;

  // Verifications
  getVerifications(): Verification[];
  getVerificationByLeadId(leadId: number): Verification | undefined;
  createVerification(v: InsertVerification): Verification;
  updateVerification(id: number, updates: Partial<InsertVerification>): Verification | undefined;

  // Referrals
  getReferrals(): Referral[];
  getReferral(id: number): Referral | undefined;
  getReferralByToken(token: string): Referral | undefined;
  createReferral(r: InsertReferral): Referral;
  updateReferral(id: number, updates: Partial<InsertReferral>): Referral | undefined;

  // Virtual Enrollments
  getVirtualEnrollments(): VirtualEnrollment[];
  createVirtualEnrollment(e: InsertVirtualEnrollment): VirtualEnrollment;
  updateVirtualEnrollment(id: number, updates: Partial<InsertVirtualEnrollment>): VirtualEnrollment | undefined;

  // Centers
  getCenters(): Center[];
  updateCenter(id: number, updates: Partial<InsertCenter>): Center | undefined;
}

export class DatabaseStorage implements IStorage {
  getLeads(): Lead[] {
    return db.select().from(leads).orderBy(desc(leads.id)).all();
  }
  getLead(id: number): Lead | undefined {
    return db.select().from(leads).where(eq(leads.id, id)).get();
  }
  createLead(lead: InsertLead): Lead {
    return db.insert(leads).values(lead).returning().get();
  }
  updateLead(id: number, updates: Partial<InsertLead>): Lead | undefined {
    return db.update(leads).set(updates).where(eq(leads.id, id)).returning().get();
  }

  getVerifications(): Verification[] {
    return db.select().from(verifications).orderBy(desc(verifications.id)).all();
  }
  getVerificationByLeadId(leadId: number): Verification | undefined {
    return db.select().from(verifications).where(eq(verifications.leadId, leadId)).get();
  }
  createVerification(v: InsertVerification): Verification {
    return db.insert(verifications).values(v).returning().get();
  }
  updateVerification(id: number, updates: Partial<InsertVerification>): Verification | undefined {
    return db.update(verifications).set(updates).where(eq(verifications.id, id)).returning().get();
  }

  getReferrals(): Referral[] {
    return db.select().from(referrals).orderBy(desc(referrals.id)).all();
  }
  getReferral(id: number): Referral | undefined {
    return db.select().from(referrals).where(eq(referrals.id, id)).get();
  }
  getReferralByToken(token: string): Referral | undefined {
    return db.select().from(referrals).where(eq(referrals.trackingToken, token)).get();
  }
  createReferral(r: InsertReferral): Referral {
    return db.insert(referrals).values(r).returning().get();
  }
  updateReferral(id: number, updates: Partial<InsertReferral>): Referral | undefined {
    return db.update(referrals).set(updates).where(eq(referrals.id, id)).returning().get();
  }

  getVirtualEnrollments(): VirtualEnrollment[] {
    return db.select().from(virtualEnrollments).orderBy(desc(virtualEnrollments.id)).all();
  }
  createVirtualEnrollment(e: InsertVirtualEnrollment): VirtualEnrollment {
    return db.insert(virtualEnrollments).values(e).returning().get();
  }
  updateVirtualEnrollment(id: number, updates: Partial<InsertVirtualEnrollment>): VirtualEnrollment | undefined {
    return db.update(virtualEnrollments).set(updates).where(eq(virtualEnrollments.id, id)).returning().get();
  }

  getCenters(): Center[] {
    return db.select().from(centers).all();
  }
  updateCenter(id: number, updates: Partial<InsertCenter>): Center | undefined {
    return db.update(centers).set(updates).where(eq(centers.id, id)).returning().get();
  }
}

export const storage = new DatabaseStorage();
