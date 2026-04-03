import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

type ProgramType = "telehealth_intake" | "virtual_iop" | "remote_support";
type EnrollStatus = "enrolled" | "active" | "completed" | "stepped_up";

const PROGRAMS: { type: ProgramType; label: string; desc: string; icon: JSX.Element; color: string }[] = [
  {
    type: "telehealth_intake",
    label: "Telehealth Intake",
    desc: "Video-based initial assessment for patients unable to travel",
    icon: <VideoCallIcon />,
    color: "hsl(var(--color-info))",
  },
  {
    type: "virtual_iop",
    label: "Virtual IOP",
    desc: "Intensive Outpatient Program via secure video — 3x/week group therapy",
    icon: <GroupIcon />,
    color: "hsl(var(--primary))",
  },
  {
    type: "remote_support",
    label: "Remote Support",
    desc: "Ongoing check-ins + app-based mood tracking between in-person visits",
    icon: <HeartbeatIcon />,
    color: "hsl(var(--color-success))",
  },
];

const STATUS_MAP: Record<EnrollStatus, { label: string; cls: string }> = {
  enrolled: { label: "Enrolled", cls: "info" },
  active: { label: "Active", cls: "success" },
  completed: { label: "Completed", cls: "muted" },
  stepped_up: { label: "Stepped Up", cls: "warning" },
};

export default function VirtualCare() {
  const [showEnroll, setShowEnroll] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramType>("telehealth_intake");
  const [simulationStep, setSimulationStep] = useState<null | number>(null);

  const { data: enrollments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/virtual-enrollments"],
  });

  const [form, setForm] = useState({ patientName: "", phone: "", email: "", programType: "telehealth_intake" as ProgramType });

  const enrollMutation = useMutation({
    mutationFn: (data: typeof form) => apiRequest("POST", "/api/virtual-enrollments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/virtual-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowEnroll(false);
      setForm({ patientName: "", phone: "", email: "", programType: "telehealth_intake" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    enrollMutation.mutate(form);
  };

  // Program metrics derived from seed data
  const intakeCount = enrollments?.filter(e => e.programType === "telehealth_intake").length ?? 0;
  const iopCount = enrollments?.filter(e => e.programType === "virtual_iop").length ?? 0;
  const supportCount = enrollments?.filter(e => e.programType === "remote_support").length ?? 0;
  const stepUpCount = enrollments?.filter(e => e.status === "stepped_up").length ?? 0;
  const activeCount = enrollments?.filter(e => e.status === "active" || e.status === "enrolled").length ?? 0;

  const runSimulation = () => {
    setSimulationStep(0);
    const steps = [0, 1, 2, 3, 4];
    steps.forEach((_, i) => {
      setTimeout(() => setSimulationStep(i + 1), i * 900);
    });
    setTimeout(() => setSimulationStep(null), steps.length * 900 + 400);
  };

  const SIM_STEPS = [
    "Patient calls in — cannot travel due to work schedule",
    "BDO proposes Virtual IOP via Kipu Health integration",
    "Secure session link sent via SMS instantly",
    "Insurance pre-auth submitted in parallel (avg 2h vs. 48h)",
    "Patient admitted to Virtual IOP same day ✓",
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Hybrid Care Gateway</h1>
            <span className="status-badge info" style={{ fontSize: "0.7rem" }}>Module 4</span>
          </div>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
            Standardized virtual + telehealth offering across all 11 centers — powered by Kipu Health
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            data-testid="button-run-simulation"
            onClick={runSimulation}
            style={{
              padding: "8px 16px", borderRadius: 7, border: "1px solid hsl(var(--border))",
              background: "hsl(var(--card))", cursor: "pointer", fontSize: "0.8rem",
              color: "hsl(var(--foreground))", fontWeight: 500,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <PlayIcon /> Run Patient Journey
          </button>
          <button
            data-testid="button-enroll-patient"
            onClick={() => setShowEnroll(true)}
            className="btn-primary"
          >
            + Enroll Patient
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Active / Enrolled", value: activeCount, color: "hsl(var(--primary))" },
          { label: "Telehealth Intakes", value: intakeCount, color: "hsl(var(--color-info))" },
          { label: "Virtual IOP", value: iopCount, color: "hsl(var(--primary))" },
          { label: "Stepped Up to Residential", value: stepUpCount, color: "hsl(var(--color-warning))" },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
            <div style={{ fontWeight: 600, fontSize: "0.8rem", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Program Cards + Simulation */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Program Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 2, color: "hsl(var(--foreground))" }}>
            Virtual Care Programs
          </div>
          {PROGRAMS.map(p => (
            <div
              key={p.type}
              data-testid={`card-program-${p.type}`}
              onClick={() => setSelectedProgram(p.type)}
              style={{
                background: "hsl(var(--card))", border: `1.5px solid ${selectedProgram === p.type ? p.color : "hsl(var(--border))"}`,
                borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                transition: "border-color 200ms",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${p.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: p.color, flexShrink: 0 }}>
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
                  {p.label}
                  {selectedProgram === p.type && <span style={{ fontSize: "0.65rem", background: p.color, color: "white", borderRadius: 4, padding: "1px 6px" }}>Selected</span>}
                </div>
                <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            </div>
          ))}

          {/* Vendor Tag */}
          <div style={{ background: "hsl(220 30% 11%)", borderRadius: 8, padding: "12px 14px", color: "hsl(var(--sidebar-fg))", fontSize: "0.78rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <KipuIcon />
              <span style={{ fontWeight: 600, color: "hsl(var(--sidebar-fg))" }}>Kipu Health Integration</span>
              <span style={{ fontSize: "0.65rem", background: "hsl(var(--color-success))", borderRadius: 4, padding: "1px 6px", color: "white" }}>Recommended</span>
            </div>
            <div style={{ color: "hsl(var(--sidebar-fg-muted))", lineHeight: 1.5 }}>
              Behavioral-health-specific EHR with native Salesforce connector. Supports telehealth, scheduling, and insurance pre-auth in one platform.
            </div>
          </div>
        </div>

        {/* Patient Journey Simulation */}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "18px 20px" }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: 4 }}>Patient Journey Simulation</div>
          <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginBottom: 16 }}>
            How a patient who can't travel gets admitted via Virtual IOP same day
          </div>

          {simulationStep === null ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "hsl(var(--muted-foreground))" }}>
              <div style={{ marginBottom: 12, opacity: 0.6 }}><PlayIcon /></div>
              <div style={{ fontSize: "0.8rem" }}>Click "Run Patient Journey" to simulate</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SIM_STEPS.map((step, i) => (
                <div
                  key={i}
                  data-testid={`sim-step-${i}`}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    opacity: simulationStep > i ? 1 : 0.25,
                    transition: "opacity 400ms ease",
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    background: simulationStep > i ? "hsl(var(--color-success))" : "hsl(var(--border))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 300ms",
                  }}>
                    {simulationStep > i
                      ? <span style={{ color: "white", fontSize: "0.65rem", fontWeight: 700 }}>✓</span>
                      : <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.65rem" }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{ fontSize: "0.82rem", lineHeight: 1.5, paddingTop: 2 }}>{step}</div>
                </div>
              ))}
              {simulationStep >= SIM_STEPS.length && (
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 7,
                  background: "hsl(var(--color-success) / 0.1)", border: "1px solid hsl(var(--color-success) / 0.3)",
                  fontSize: "0.82rem", color: "hsl(var(--color-success))", fontWeight: 600,
                }}>
                  Time to admission: 4.5 hours vs. 5-day average — 72% faster
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enrollments Table */}
      <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>Enrolled Patients</div>
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{(enrollments ?? []).length} total</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "hsl(var(--muted) / 0.4)" }}>
                {["Patient", "Program", "Status", "Enrolled", "Step-Up Date"].map(h => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "hsl(var(--muted-foreground))", fontSize: "0.82rem" }}>Loading...</td></tr>
              ) : (enrollments ?? []).map((e: any) => {
                const prog = PROGRAMS.find(p => p.type === e.programType);
                const st = STATUS_MAP[e.status as EnrollStatus] ?? { label: e.status, cls: "muted" };
                return (
                  <tr key={e.id} data-testid={`row-enrollment-${e.id}`} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                    <td style={{ padding: "10px 16px", fontSize: "0.85rem", fontWeight: 500 }}>{e.patientName}</td>
                    <td style={{ padding: "10px 16px", fontSize: "0.82rem", color: prog?.color }}>{prog?.label ?? e.programType}</td>
                    <td style={{ padding: "10px 16px" }}><span className={`status-badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ padding: "10px 16px", fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>
                      {new Date(e.enrolledAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>
                      {e.steppedUpAt ? new Date(e.steppedUpAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnroll && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        }}>
          <div style={{ background: "hsl(var(--card))", borderRadius: 12, padding: "28px 28px 24px", width: 440, maxWidth: "94vw", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>Enroll Patient in Virtual Care</h2>
            <p style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", marginBottom: 20 }}>
              Patient will receive a secure Kipu Health session link via SMS
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>Patient Name</label>
                <input
                  data-testid="input-patient-name"
                  required
                  value={form.patientName}
                  onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                  placeholder="Full name"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: "0.85rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>Phone</label>
                <input
                  data-testid="input-phone"
                  required
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(555) 000-0000"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: "0.85rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 4 }}>Email <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>(optional)</span></label>
                <input
                  data-testid="input-email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="patient@email.com"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: "0.85rem", background: "hsl(var(--background))", color: "hsl(var(--foreground))", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: 8 }}>Program Type</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PROGRAMS.map(p => (
                    <label key={p.type} data-testid={`radio-${p.type}`} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 10px", borderRadius: 7, border: `1px solid ${form.programType === p.type ? p.color : "hsl(var(--border))"}`, background: form.programType === p.type ? `${p.color}10` : "transparent" }}>
                      <input type="radio" name="programType" value={p.type} checked={form.programType === p.type} onChange={() => setForm(f => ({ ...f, programType: p.type }))} />
                      <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowEnroll(false)} data-testid="button-cancel-enroll"
                  style={{ flex: 1, padding: "9px", borderRadius: 7, border: "1px solid hsl(var(--border))", background: "transparent", cursor: "pointer", fontSize: "0.85rem", color: "hsl(var(--foreground))" }}>
                  Cancel
                </button>
                <button type="submit" disabled={enrollMutation.isPending} data-testid="button-submit-enroll" className="btn-primary" style={{ flex: 1 }}>
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll & Send Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCallIcon() {
  return <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="4" width="12" height="12" rx="2"/><path d="M13 8.5l6-3.5v10l-6-3.5V8.5z" strokeLinejoin="round"/>
  </svg>;
}
function GroupIcon() {
  return <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="3"/><circle cx="14" cy="9" r="2.5"/>
    <path d="M1 17c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round"/><path d="M14 13c2.2 0 4 1.8 4 4" strokeLinecap="round"/>
  </svg>;
}
function HeartbeatIcon() {
  return <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 10h3l2.5-6 3 10 2.5-7 1.5 3H19" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function PlayIcon() {
  return <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="9" r="8"/><path d="M7 6l6 3-6 3V6z" fill="currentColor" stroke="none"/>
  </svg>;
}
function KipuIcon() {
  return <svg viewBox="0 0 16 16" width="14" height="14" fill="none">
    <rect width="16" height="16" rx="4" fill="hsl(186 72% 28%)"/>
    <path d="M4 4h2v4l4-4h2L8 9l4 3h-2L6 9v3H4V4z" fill="white"/>
  </svg>;
}
