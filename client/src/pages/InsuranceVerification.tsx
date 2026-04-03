import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const PROVIDERS = ["Blue Cross", "Aetna", "Cigna", "UnitedHealth", "Humana", "Medicaid", "Oscar", "Magellan"];

export default function InsuranceVerification() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ patientName: "", phone: "", insuranceProvider: "", insuranceId: "", callReason: "addiction" });
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [newLeadId, setNewLeadId] = useState<number | null>(null);

  const { data: verifications } = useQuery({ queryKey: ["/api/verifications"] });
  const { data: leads } = useQuery({ queryKey: ["/api/leads"] });

  const pendingVerifications = (verifications as any[])?.filter((v: any) => v.status === "pending" || v.status === "pre_auth_required") ?? [];

  const runVerification = async () => {
    if (!form.patientName || !form.insuranceProvider || !form.insuranceId) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setVerifying(true);
    setResult(null);

    // First create the lead
    const now = new Date().toISOString();
    const lead = await apiRequest("POST", "/api/leads", {
      patientName: form.patientName, phone: form.phone,
      insuranceId: form.insuranceId, insuranceProvider: form.insuranceProvider,
      callReason: form.callReason, status: "insurance_pending",
      followUpCount: 0, createdAt: now, notes: "Created via insurance verification module"
    });
    setNewLeadId(lead.id);

    // Simulate slight delay for realism (much faster than 24-48hr!)
    await new Promise(r => setTimeout(r, 2200));

    const verResult = await apiRequest("POST", "/api/verify-insurance", {
      insuranceProvider: form.insuranceProvider,
      insuranceId: form.insuranceId,
      leadId: lead.id,
    });

    setResult(verResult);
    setVerifying(false);
    qc.invalidateQueries({ queryKey: ["/api/verifications"] });
    qc.invalidateQueries({ queryKey: ["/api/leads"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const getStatusColor = (status: string) => {
    if (status === "verified") return "hsl(var(--color-success))";
    if (status === "pre_auth_required") return "hsl(var(--color-warning))";
    if (status === "denied") return "hsl(var(--color-error))";
    return "hsl(var(--muted-foreground))";
  };

  const getCoverageBar = (level: string | null) => {
    const pct = level === "full" ? 100 : level === "partial" ? 60 : 0;
    const color = level === "full" ? "hsl(var(--color-success))" : level === "partial" ? "hsl(var(--color-warning))" : "hsl(var(--color-error))";
    return (
      <div>
        <div className="progress-bar" style={{ marginBottom: 4 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div style={{ fontSize: "0.75rem", color }}>{level === "full" ? "Full coverage" : level === "partial" ? "Partial coverage" : "No coverage"}</div>
      </div>
    );
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(var(--primary))", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Module 1</div>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>Instant Insurance Verification</h1>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
          Real-time eligibility checks during the intake call — results in seconds, not 24-48 hours.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
        {/* Intake Form */}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: "0.95rem" }}>New Patient Intake</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 4 }}>Patient Name *</label>
              <input data-testid="input-patient-name" value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
                placeholder="Full name" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 4 }}>Phone</label>
              <input data-testid="input-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
                placeholder="555-0000" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 4 }}>Insurance Provider *</label>
              <select data-testid="select-provider" value={form.insuranceProvider} onChange={e => setForm(f => ({ ...f, insuranceProvider: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
                <option value="">Select provider...</option>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 4 }}>Insurance ID *</label>
              <input data-testid="input-insurance-id" value={form.insuranceId} onChange={e => setForm(f => ({ ...f, insuranceId: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}
                placeholder="e.g. BC123456" />
            </div>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", display: "block", marginBottom: 4 }}>Call Reason</label>
              <select value={form.callReason} onChange={e => setForm(f => ({ ...f, callReason: e.target.value }))}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: "0.875rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
                <option value="addiction">Substance Use / Addiction</option>
                <option value="mental_health">Mental Health</option>
                <option value="dual_diagnosis">Dual Diagnosis</option>
              </select>
            </div>

            <button data-testid="button-verify" onClick={runVerification} disabled={verifying}
              style={{ padding: "10px 20px", background: verifying ? "hsl(var(--muted))" : "hsl(var(--primary))", color: verifying ? "hsl(var(--muted-foreground))" : "white", border: "none", borderRadius: 8, fontWeight: 600, fontSize: "0.875rem", cursor: verifying ? "not-allowed" : "pointer", transition: "all 150ms", marginTop: 4 }}>
              {verifying ? <span className="verifying">Verifying with insurer...</span> : "▶ Run Instant Verification"}
            </button>
          </div>
        </div>

        {/* Result panel */}
        <div>
          {!result && !verifying && (
            <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "hsl(var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Ready to Verify</div>
              <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>Fill in patient details and run verification. Results appear in seconds — not 24-48 hours.</div>
              <div style={{ marginTop: 20, padding: "10px 16px", background: "hsl(var(--muted))", borderRadius: 8, fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                Old process: <strong>24-48 hours</strong> → ClearPath: <strong style={{ color: "hsl(var(--color-success))" }}>&lt; 30 seconds</strong>
              </div>
            </div>
          )}

          {verifying && (
            <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, padding: 32, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontWeight: 600, marginBottom: 20, fontSize: "0.95rem" }}>Verifying with insurer...</div>
              {[
                { label: "Patient record created", done: true },
                { label: "Querying insurance portal", done: true },
                { label: "Checking benefit coverage", done: false },
                { label: "Pre-auth assessment", done: false },
                { label: "Compiling result", done: false },
              ].map((step, i) => (
                <div key={i} className="ver-step" style={{ marginBottom: 12, width: "100%", maxWidth: 280 }}>
                  <div className={`ver-step-icon ${step.done ? "done" : i === 2 ? "active" : "pending"}`}>
                    {step.done ? "✓" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: step.done ? 500 : 400, color: step.done ? "hsl(var(--foreground))" : i === 2 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>{step.label}</div>
                    {i === 2 && <div style={{ fontSize: "0.72rem", color: "hsl(var(--primary))" }} className="verifying">Processing...</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result && !verifying && (
            <div className="animate-in" style={{ background: "hsl(var(--card))", border: `2px solid ${getStatusColor(result.status)}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", letterSpacing: "0.06em", textTransform: "uppercase" }}>Verification Result</div>
                  <div style={{ fontWeight: 700, fontSize: "1.1rem", marginTop: 2 }}>{form.patientName}</div>
                </div>
                <span className={`status-badge ${result.status === "verified" ? "success" : result.status === "pre_auth_required" ? "warning" : "error"}`} style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
                  {result.status === "verified" ? "✓ Verified" : result.status === "pre_auth_required" ? "⚠ Pre-Auth Required" : "✗ Denied"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "hsl(var(--muted))", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 6 }}>COVERAGE</div>
                  {getCoverageBar(result.coverageLevel)}
                </div>
                <div style={{ background: "hsl(var(--muted))", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: 6 }}>EST. COPAY</div>
                  <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>${result.estimatedCopay?.toFixed(0) ?? "—"}</div>
                  <div style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>per day</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, fontSize: "0.8rem", marginBottom: 16 }}>
                <div style={{ flex: 1, background: result.deductibleMet ? "hsl(var(--color-success-bg))" : "hsl(var(--color-warning-bg))", borderRadius: 6, padding: "8px 12px", color: result.deductibleMet ? "hsl(var(--color-success))" : "hsl(var(--color-warning))" }}>
                  {result.deductibleMet ? "✓ Deductible met" : "⚠ Deductible not met"}
                </div>
                {result.preAuthRequired && (
                  <div style={{ flex: 1, background: "hsl(var(--color-warning-bg))", borderRadius: 6, padding: "8px 12px", color: "hsl(var(--color-warning))" }}>
                    Pre-auth {result.preAuthStatus === "approved" ? "approved ✓" : "pending..."}
                  </div>
                )}
              </div>

              <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", borderTop: "1px solid hsl(var(--border))", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span>Provider: {result.insuranceProvider}</span>
                <span style={{ color: "hsl(var(--color-success))", fontWeight: 500 }}>Verified in ~2s ⚡</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending verifications table */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Pending Verifications</div>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{pendingVerifications.length} verification{pendingVerifications.length !== 1 ? "s" : ""} in queue</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Provider</th>
              <th>Insurance ID</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {pendingVerifications.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", padding: 24 }}>All verifications complete</td></tr>
            )}
            {pendingVerifications.map((v: any) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 500 }}>Lead #{v.leadId}</td>
                <td>{v.insuranceProvider}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{v.insuranceId}</td>
                <td><span className={`status-badge ${v.status === "pre_auth_required" ? "warning" : "info"}`}>{v.status === "pre_auth_required" ? "Pre-Auth Required" : "Pending"}</span></td>
                <td style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{new Date(v.createdAt).toLocaleString()}</td>
                <td style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{v.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
