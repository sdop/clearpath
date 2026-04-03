import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const REFERRAL_SOURCES = ["ER", "physician", "therapist", "court", "self"];
const STATUS_STEPS = ["received", "in_review", "verification", "admitted"];

export default function ReferralPortal() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "submit" | "track">("dashboard");
  const [trackToken, setTrackToken] = useState("");
  const [trackedReferral, setTrackedReferral] = useState<any>(null);
  const [trackError, setTrackError] = useState(false);
  const [form, setForm] = useState({ referralSource: "", sourceName: "", contactName: "", contactEmail: "", patientName: "", patientPhone: "", insuranceProvider: "", urgency: "standard", notes: "" });
  const [submitted, setSubmitted] = useState<any>(null);

  const { data: referrals, isLoading } = useQuery({ queryKey: ["/api/referrals"] });

  const submitReferral = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/referrals", data),
    onSuccess: (data) => { setSubmitted(data); qc.invalidateQueries({ queryKey: ["/api/referrals"] }); qc.invalidateQueries({ queryKey: ["/api/stats"] }); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/referrals/${id}`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/referrals"] }); toast({ title: "Status updated" }); },
  });

  const handleTrack = async () => {
    setTrackError(false);
    setTrackedReferral(null);
    try {
      const r = await apiRequest("GET", `/api/referrals/track/${trackToken.trim().toUpperCase()}`);
      setTrackedReferral(r);
    } catch { setTrackError(true); }
  };

  const handleSubmit = () => {
    if (!form.referralSource || !form.sourceName || !form.contactName || !form.patientName || !form.patientPhone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    submitReferral.mutate(form);
  };

  const allReferrals = (referrals as any[]) ?? [];
  const urgentCount = allReferrals.filter(r => r.urgency === "urgent" && r.status !== "admitted").length;
  const admittedToday = allReferrals.filter(r => r.status === "admitted").length;

  const getUrgencyBadge = (u: string) => (
    <span className={`status-badge ${u === "urgent" ? "error" : u === "standard" ? "info" : "muted"}`}>
      {u === "urgent" ? "🔴 Urgent" : u === "standard" ? "Standard" : "Low"}
    </span>
  );

  const getStatusStep = (status: string) => STATUS_STEPS.indexOf(status);

  const tabStyle = (t: string) => ({
    padding: "8px 18px", borderRadius: 6, fontWeight: 500, fontSize: "0.85rem", cursor: "pointer", border: "none",
    background: tab === t ? "hsl(var(--primary))" : "transparent",
    color: tab === t ? "white" : "hsl(var(--muted-foreground))",
    transition: "all 150ms",
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(186 72% 40%)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Module 5</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>BDO Referral Portal</h1>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
          Zero-friction digital referral intake for hospitals, physicians, and therapists. Magic-link tracking — no account required.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "hsl(var(--muted))", borderRadius: 8, padding: 4, width: "fit-content" }}>
        <button style={tabStyle("dashboard")} onClick={() => setTab("dashboard")}>Referral Dashboard</button>
        <button style={tabStyle("submit")} onClick={() => setTab("submit")}>Submit Referral</button>
        <button style={tabStyle("track")} onClick={() => setTab("track")}>Track Status</button>
      </div>

      {/* Dashboard tab */}
      {tab === "dashboard" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 22 }}>
            {[
              { label: "Total Referrals", value: allReferrals.length, color: "hsl(var(--primary))" },
              { label: "Urgent Pending", value: urgentCount, color: "hsl(var(--color-error))" },
              { label: "Admitted", value: admittedToday, color: "hsl(var(--color-success))" },
            ].map(k => (
              <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
                <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
                <div className="kpi-label" style={{ marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Source</th>
                  <th>Sender</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Tracking</th>
                  <th>Advance</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "hsl(var(--muted-foreground))" }}>Loading...</td></tr>}
                {allReferrals.map((ref: any) => {
                  const stepIdx = getStatusStep(ref.status);
                  const nextStatus = STATUS_STEPS[stepIdx + 1];
                  return (
                    <tr key={ref.id}>
                      <td style={{ fontWeight: 500 }}>{ref.patientName}</td>
                      <td><span style={{ fontSize: "0.78rem", background: "hsl(var(--muted))", padding: "2px 8px", borderRadius: 4 }}>{ref.referralSource.toUpperCase()}</span></td>
                      <td style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{ref.contactName}</td>
                      <td>{getUrgencyBadge(ref.urgency)}</td>
                      <td>
                        <div>
                          <span className={`status-badge ${ref.status === "admitted" ? "success" : ref.status === "verification" ? "warning" : ref.status === "rejected" ? "error" : "info"}`}>
                            {ref.status === "received" ? "Received" : ref.status === "in_review" ? "In Review" : ref.status === "verification" ? "Verifying" : ref.status === "admitted" ? "Admitted ✓" : "Rejected"}
                          </span>
                          {/* Progress dots */}
                          <div style={{ display: "flex", gap: 3, marginTop: 5 }}>
                            {STATUS_STEPS.map((s, i) => (
                              <div key={s} style={{ width: 6, height: 6, borderRadius: "50%", background: i <= stepIdx ? "hsl(var(--primary))" : "hsl(var(--border))" }} />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "hsl(var(--primary))" }}>{ref.trackingToken}</span></td>
                      <td>
                        {nextStatus && (
                          <button onClick={() => updateStatus.mutate({ id: ref.id, status: nextStatus })}
                            style={{ fontSize: "0.72rem", padding: "3px 10px", background: "hsl(var(--primary))", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>
                            → {nextStatus === "in_review" ? "Review" : nextStatus === "verification" ? "Verify" : "Admit"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit tab */}
      {tab === "submit" && (
        <div style={{ maxWidth: 600 }}>
          {submitted ? (
            <div className="animate-in" style={{ background: "hsl(var(--card))", border: "2px solid hsl(var(--color-success))", borderRadius: 12, padding: 32, textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>✓</div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Referral Submitted</div>
              <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem", marginBottom: 20 }}>
                {submitted.patientName} has been referred successfully. Share the tracking token with your team.
              </div>
              <div style={{ background: "hsl(var(--muted))", borderRadius: 10, padding: "16px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 4 }}>TRACKING TOKEN</div>
                <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: 700, color: "hsl(var(--primary))", letterSpacing: "0.1em" }}>{submitted.trackingToken}</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: 4 }}>Use this to track status in real time. No account required.</div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => { setSubmitted(null); setForm({ referralSource: "", sourceName: "", contactName: "", contactEmail: "", patientName: "", patientPhone: "", insuranceProvider: "", urgency: "standard", notes: "" }); }}
                  style={{ padding: "9px 20px", background: "hsl(var(--primary))", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Submit Another</button>
                <button onClick={() => { setTab("track"); setTrackToken(submitted.trackingToken); }}
                  style={{ padding: "9px 20px", background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Track This Referral</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 28 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: 20 }}>New Patient Referral</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Referral Source *", field: "referralSource", type: "select", options: REFERRAL_SOURCES.map(s => ({ value: s, label: s.toUpperCase() })) },
                  { label: "Organization Name *", field: "sourceName", type: "text", placeholder: "e.g. Phoenix General Hospital" },
                  { label: "Your Name *", field: "contactName", type: "text", placeholder: "Dr. / Nurse / Case Worker" },
                  { label: "Your Email", field: "contactEmail", type: "email", placeholder: "you@hospital.org" },
                  { label: "Patient Name *", field: "patientName", type: "text", placeholder: "Full name" },
                  { label: "Patient Phone *", field: "patientPhone", type: "tel", placeholder: "555-0000" },
                  { label: "Insurance Provider", field: "insuranceProvider", type: "text", placeholder: "e.g. Blue Cross, Medicaid" },
                  { label: "Urgency", field: "urgency", type: "select", options: [{ value: "urgent", label: "🔴 Urgent — same-day needed" }, { value: "standard", label: "Standard" }, { value: "low", label: "Low priority" }] },
                  { label: "Notes", field: "notes", type: "textarea", placeholder: "Anything the admissions team should know..." },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 4 }}>{f.label}</label>
                    {f.type === "select" ? (
                      <select value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
                        <option value="">Select...</option>
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : f.type === "textarea" ? (
                      <textarea value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))", minHeight: 80, resize: "vertical" }}
                        placeholder={f.placeholder} />
                    ) : (
                      <input type={f.type} value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
                        placeholder={f.placeholder} />
                    )}
                  </div>
                ))}
                <button onClick={handleSubmit} disabled={submitReferral.isPending}
                  style={{ padding: "10px 20px", background: "hsl(var(--primary))", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>
                  {submitReferral.isPending ? "Submitting..." : "Submit Referral — Get Tracking Token"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Track tab */}
      {tab === "track" && (
        <div style={{ maxWidth: 520 }}>
          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Track Referral Status</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={trackToken} onChange={e => setTrackToken(e.target.value)} placeholder="Enter tracking token (e.g. TRK-001)"
                style={{ flex: 1, padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontFamily: "monospace" }} />
              <button onClick={handleTrack} style={{ padding: "8px 18px", background: "hsl(var(--primary))", color: "white", border: "none", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>Track</button>
            </div>
            {trackError && <div style={{ fontSize: "0.8rem", color: "hsl(var(--color-error))", marginTop: 8 }}>Token not found. Try: TRK-001, TRK-002, TRK-003, TRK-004, or TRK-005</div>}
          </div>

          {trackedReferral && (
            <div className="animate-in" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem" }}>{trackedReferral.patientName}</div>
                  <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>Referred by {trackedReferral.contactName} · {trackedReferral.sourceName}</div>
                </div>
                {getUrgencyBadge(trackedReferral.urgency)}
              </div>

              {/* Status pipeline */}
              <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
                {STATUS_STEPS.map((step, i) => {
                  const current = getStatusStep(trackedReferral.status);
                  const done = i < current;
                  const active = i === current;
                  return (
                    <div key={step} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: 4, background: done || active ? "hsl(var(--primary))" : "hsl(var(--border))", marginBottom: 8, borderRadius: i === 0 ? "4px 0 0 4px" : i === STATUS_STEPS.length - 1 ? "0 4px 4px 0" : 0 }} />
                      <div style={{ fontSize: "0.68rem", fontWeight: active ? 700 : 500, color: active ? "hsl(var(--primary))" : done ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>
                        {step === "received" ? "Received" : step === "in_review" ? "In Review" : step === "verification" ? "Insurance" : "Admitted"}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: "0.8rem" }}>
                <div style={{ background: "hsl(var(--muted))", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.7rem", marginBottom: 2 }}>BDO ASSIGNED</div>
                  <div style={{ fontWeight: 500 }}>{trackedReferral.bdoAssigned || "Pending"}</div>
                </div>
                <div style={{ background: "hsl(var(--muted))", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.7rem", marginBottom: 2 }}>INSURANCE</div>
                  <div style={{ fontWeight: 500 }}>{trackedReferral.insuranceProvider || "Not provided"}</div>
                </div>
                <div style={{ background: "hsl(var(--muted))", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.7rem", marginBottom: 2 }}>SUBMITTED</div>
                  <div style={{ fontWeight: 500 }}>{new Date(trackedReferral.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ background: "hsl(var(--muted))", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.7rem", marginBottom: 2 }}>LAST UPDATE</div>
                  <div style={{ fontWeight: 500 }}>{new Date(trackedReferral.updatedAt).toLocaleString()}</div>
                </div>
              </div>
              {trackedReferral.notes && <div style={{ marginTop: 12, fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted))", borderRadius: 6, padding: "8px 12px" }}>{trackedReferral.notes}</div>}
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", textAlign: "center" }}>
            No account needed. Share this page with your referral sources — they can track any referral with their token.
          </div>
        </div>
      )}
    </div>
  );

}
