import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  insurance_pending: "warning", following_up: "info", re_engaged: "success",
  admitted: "success", cold: "muted", new: "muted",
};
const STATUS_LABELS: Record<string, string> = {
  insurance_pending: "Insurance Pending", following_up: "Following Up",
  re_engaged: "Re-engaged", admitted: "Admitted", cold: "Cold", new: "New",
};
const REASON_LABELS: Record<string, string> = {
  insurance_pending: "Insurance Pending", not_ready: "Not Ready",
  no_beds: "No Beds", cost: "Cost Concern", competitor: "Chose Competitor",
};
const SEQUENCES: Record<string, { day: number; action: string; message: string }[]> = {
  insurance_pending: [
    { day: 0, action: "SMS", message: "Hi {name}, your insurance verification is in progress. We'll update you within 2 hours. — ClearPath Team" },
    { day: 1, action: "SMS", message: "Hi {name}, your insurance verification is complete. Call us at 1-800-CLEARPATH to discuss your options and start your journey." },
    { day: 3, action: "Call", message: "Follow-up call: check patient intent, answer questions, schedule admission." },
    { day: 7, action: "Email", message: "Re-engagement email with FAQ about coverage, program overview, and testimonials." },
  ],
  not_ready: [
    { day: 0, action: "SMS", message: "Hi {name}, no pressure — we're here when you're ready. Here's a guide on what to expect: [link]" },
    { day: 3, action: "Call", message: "Warm check-in call: empathetic, not pushy. Ask how they're doing." },
    { day: 7, action: "SMS", message: "Hi {name}, we saved your spot. Many patients feel nervous at first. Our team would love to answer any questions." },
    { day: 14, action: "Email", message: "Success story email: patient testimonial about making the first call." },
    { day: 30, action: "Call", message: "Final outreach: let them know the door is always open." },
  ],
  cost: [
    { day: 0, action: "SMS", message: "Hi {name}, we have financial counselors who can help explore your options — including payment plans and scholarships." },
    { day: 1, action: "Call", message: "Financial counseling call: walk through coverage, payment plans, and assistance programs." },
    { day: 5, action: "Email", message: "Email with financing options, scholarship programs, and Medicaid qualification guide." },
  ],
  no_beds: [
    { day: 0, action: "SMS", message: "Hi {name}, we're monitoring availability at our network centers. We'll notify you the moment a bed opens." },
    { day: 1, action: "Call", message: "Offer transfer to alternate center. Discuss virtual IOP as bridge option." },
    { day: 3, action: "SMS", message: "Hi {name}, a bed just opened at [Center]. Are you ready to start?" },
  ],
  competitor: [
    { day: 14, action: "SMS", message: "Hi {name}, we hope you're doing well on your recovery journey. Our doors are always open if you need support." },
    { day: 30, action: "Email", message: "Gentle re-engagement: program updates, new virtual options, alumni success stories." },
  ],
};

export default function ReEngagement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: leads, isLoading } = useQuery({ queryKey: ["/api/leads"] });

  const updateLead = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => apiRequest("PATCH", `/api/leads/${id}`, updates),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leads"] }); qc.invalidateQueries({ queryKey: ["/api/stats"] }); toast({ title: "Lead updated" }); },
  });

  const allLeads = (leads as any[]) ?? [];
  const filteredLeads = filterStatus === "all" ? allLeads : allLeads.filter((l: any) => l.status === filterStatus);
  const activeCases = allLeads.filter((l: any) => l.status !== "admitted" && l.status !== "cold").length;
  const pendingInsurance = allLeads.filter((l: any) => l.status === "insurance_pending").length;
  const highRisk = allLeads.filter((l: any) => {
    const days = (Date.now() - new Date(l.createdAt).getTime()) / 86400000;
    return days >= 5 && l.status !== "admitted" && l.status !== "cold";
  }).length;

  const getDaysOpen = (createdAt: string) => Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
  const getDayColor = (days: number) => {
    if (days >= 7) return "hsl(var(--color-error))";
    if (days >= 3) return "hsl(var(--color-warning))";
    return "hsl(var(--color-success))";
  };

  const sequence = selectedLead ? (SEQUENCES[selectedLead.nonConversionReason] || SEQUENCES["not_ready"]) : [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(186 72% 40%)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Modules 2 & 3</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>Lead Re-engagement Engine</h1>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
          Automated follow-up sequences by non-conversion reason. No lead falls through the cracks.
        </p>
      </div>

      {/* Mini KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Active Cases", value: activeCases, color: "hsl(var(--color-info))" },
          { label: "Insurance Pending", value: pendingInsurance, color: "hsl(var(--color-warning))" },
          { label: "High Risk (5+ days)", value: highRisk, color: "hsl(var(--color-error))" },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
            <div className="kpi-label" style={{ marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        {/* Lead table */}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid hsl(var(--border))", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", marginRight: 8 }}>Warm Lead Pipeline</span>
            {["all", "insurance_pending", "following_up", "re_engaged", "cold"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 500, border: "1px solid", cursor: "pointer", transition: "all 120ms",
                  background: filterStatus === s ? "hsl(var(--primary))" : "transparent",
                  color: filterStatus === s ? "white" : "hsl(var(--muted-foreground))",
                  borderColor: filterStatus === s ? "hsl(var(--primary))" : "hsl(var(--border))" }}>
                {s === "all" ? "All" : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Non-Conv. Reason</th>
                <th>Status</th>
                <th>Follow-ups</th>
                <th>Days Open</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", padding: 24 }}>Loading...</td></tr>}
              {filteredLeads.map((lead: any) => {
                const days = getDaysOpen(lead.createdAt);
                return (
                  <tr key={lead.id} style={{ cursor: "pointer", background: selectedLead?.id === lead.id ? "hsl(var(--accent))" : undefined }}
                    onClick={() => setSelectedLead(lead)}>
                    <td style={{ fontWeight: 500 }}>{lead.patientName}</td>
                    <td><span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{REASON_LABELS[lead.nonConversionReason] || "—"}</span></td>
                    <td><span className={`status-badge ${STATUS_COLORS[lead.status] || "muted"}`}>{STATUS_LABELS[lead.status] || lead.status}</span></td>
                    <td><span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{lead.followUpCount}</span></td>
                    <td><span style={{ fontSize: "0.85rem", fontWeight: 600, color: getDayColor(days) }}>{days}d</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {lead.status !== "admitted" && lead.status !== "cold" && (
                          <button onClick={e => { e.stopPropagation(); updateLead.mutate({ id: lead.id, updates: { status: "admitted", followUpCount: lead.followUpCount + 1 } }); }}
                            style={{ fontSize: "0.72rem", padding: "3px 8px", background: "hsl(var(--color-success-bg))", color: "hsl(var(--color-success))", border: "1px solid hsl(var(--color-success))", borderRadius: 4, cursor: "pointer" }}>
                            Admit
                          </button>
                        )}
                        {lead.status !== "cold" && lead.status !== "admitted" && (
                          <button onClick={e => { e.stopPropagation(); updateLead.mutate({ id: lead.id, updates: { followUpCount: lead.followUpCount + 1, lastContactAt: new Date().toISOString(), status: "following_up" } }); }}
                            style={{ fontSize: "0.72rem", padding: "3px 8px", background: "hsl(var(--color-info-bg))", color: "hsl(var(--color-info))", border: "1px solid hsl(var(--color-info))", borderRadius: 4, cursor: "pointer" }}>
                            Log Contact
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sequence panel */}
        <div>
          {!selectedLead ? (
            <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 32, textAlign: "center", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: "hsl(var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Select a Lead</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>Click any row to see the automated re-engagement sequence for that patient's non-conversion reason.</div>
            </div>
          ) : (
            <div className="animate-in" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{selectedLead.patientName}</div>
                <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
                  Reason: {REASON_LABELS[selectedLead.nonConversionReason]} • {selectedLead.followUpCount} contact{selectedLead.followUpCount !== 1 ? "s" : ""} made
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Automated Sequence</div>
              {sequence.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: i < selectedLead.followUpCount ? "hsl(var(--color-success-bg))" : i === selectedLead.followUpCount ? "hsl(var(--primary))" : "hsl(var(--muted))", color: i < selectedLead.followUpCount ? "hsl(var(--color-success))" : i === selectedLead.followUpCount ? "white" : "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 700 }}>
                      {i < selectedLead.followUpCount ? "✓" : i + 1}
                    </div>
                    {i < sequence.length - 1 && <div style={{ width: 1, flex: 1, background: "hsl(var(--border))", marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingBottom: 8 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "1px 7px", borderRadius: 4, background: step.action === "SMS" ? "hsl(186 60% 90%)" : step.action === "Call" ? "hsl(38 80% 90%)" : "hsl(220 60% 90%)", color: step.action === "SMS" ? "hsl(186 72% 25%)" : step.action === "Call" ? "hsl(38 80% 30%)" : "hsl(220 60% 30%)" }}>
                        {step.action}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>Day {step.day}</span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "hsl(var(--foreground))", lineHeight: 1.45, background: "hsl(var(--muted))", padding: "8px 10px", borderRadius: 6 }}>
                      {step.message.replace("{name}", selectedLead.patientName.split(" ")[0])}
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 8, padding: "10px 14px", background: "hsl(var(--muted))", borderRadius: 8, fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                Sequences fire automatically via Salesforce triggers. No manual action required.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
