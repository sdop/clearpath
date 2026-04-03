import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["/api/stats"] });
  const { data: leads } = useQuery({ queryKey: ["/api/leads"] });
  const { data: referrals } = useQuery({ queryKey: ["/api/referrals"] });

  const kpis = [
    { label: "Active Leads", value: stats?.activeLeads ?? "—", sub: "Awaiting admission", color: "hsl(var(--color-info))", path: "/reengagement" },
    { label: "Pending Verifications", value: stats?.pendingVerifications ?? "—", sub: "Insurance checks", color: "hsl(var(--color-warning))", path: "/insurance" },
    { label: "Urgent Referrals", value: stats?.urgentReferrals ?? "—", sub: "Need same-day action", color: "hsl(var(--color-error))", path: "/referrals" },
    { label: "Virtual Enrolled", value: stats?.virtualActive ?? "—", sub: "Active hybrid care", color: "hsl(var(--color-success))", path: "/virtual" },
    { label: "Beds Available", value: stats?.availableBeds ?? "—", sub: "Across network", color: "hsl(var(--primary))", path: "/centers" },
    { label: "Occupancy Rate", value: stats?.occupancyRate ? `${stats.occupancyRate}%` : "—", sub: "Network-wide", color: "hsl(220 30% 35%)", path: "/centers" },
  ];

  const recentLeads = (leads as any[])?.slice(0, 5) ?? [];
  const recentReferrals = (referrals as any[])?.slice(0, 4) ?? [];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      insurance_pending: "warning", following_up: "info", re_engaged: "success",
      admitted: "success", cold: "muted", new: "muted", received: "info",
      in_review: "warning", verification: "warning", rejected: "error"
    };
    const labels: Record<string, string> = {
      insurance_pending: "Insurance Pending", following_up: "Following Up",
      re_engaged: "Re-engaged", admitted: "Admitted", cold: "Cold",
      new: "New", received: "Received", in_review: "In Review",
      verification: "Verifying", rejected: "Rejected"
    };
    return <span className={`status-badge ${map[status] || "muted"}`}>{labels[status] || status}</span>;
  };

  const getUrgencyDot = (urgency: string) => (
    <span className={`urgency-dot ${urgency}`} style={{ marginRight: 6 }} />
  );

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "< 1h ago";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>Command Center</h1>
        <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
          Real-time admissions intelligence across 11 centers
        </p>
      </div>


      {/* Module cards */}
      <div style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
        {[
          { path: "/insurance", label: "Module 1", name: "Insurance Verify", desc: "Real-time eligibility checks", color: "#0891b2" },
          { path: "/reengagement", label: "Module 2 & 3", name: "Re-engagement", desc: "Automated lead follow-up", color: "#7c3aed" },
          { path: "/virtual", label: "Module 4", name: "Hybrid Care", desc: "Virtual care gateway", color: "#047857" },
          { path: "/referrals", label: "Module 5", name: "Referral Portal", desc: "BDO digital intake", color: "#b45309" },
          { path: "/centers", label: "Network", name: "Center View", desc: "Bed availability & capacity", color: "#1e40af" },
        ].map(m => (
          <Link key={m.path} href={m.path}>
            <a style={{ textDecoration: "none" }}>
              <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all 150ms" }}
                onMouseOver={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.boxShadow = `0 2px 12px ${m.color}22`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 600, color: m.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 2 }}>{m.name}</div>
                <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{m.desc}</div>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        {kpis.map(kpi => (
          <Link key={kpi.label} href={kpi.path}>
            <a style={{ textDecoration: "none" }}>
              <div className="kpi-card" style={{ cursor: "pointer", transition: "box-shadow 150ms", borderTop: `3px solid ${kpi.color}` }}
                onMouseOver={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                onMouseOut={e => (e.currentTarget.style.boxShadow = "none")}>
                <div className="kpi-number" style={{ color: kpi.color }}>
                  {isLoading ? <span style={{ color: "hsl(var(--muted-foreground))", fontSize: "1.2rem" }}>—</span> : kpi.value}
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem", marginTop: 6 }}>{kpi.label}</div>
                <div className="kpi-label">{kpi.sub}</div>
              </div>
            </a>
          </Link>
        ))}
      </div>

      {/* Two-column content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Warm Lead Pipeline */}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Warm Lead Pipeline</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>Unconverted leads requiring follow-up</div>
            </div>
            <Link href="/reengagement"><a style={{ fontSize: "0.75rem", color: "hsl(var(--primary))", textDecoration: "none", fontWeight: 500 }}>View all →</a></Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map((lead: any) => {
                const reasonLabels: Record<string, string> = { insurance_pending: "Insurance", not_ready: "Not Ready", no_beds: "No Beds", cost: "Cost", competitor: "Competitor" };
                const daysAgo = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
                return (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 500 }}>{lead.patientName}</td>
                    <td><span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{reasonLabels[lead.nonConversionReason] || "—"}</span></td>
                    <td>{getStatusBadge(lead.status)}</td>
                    <td><span style={{ fontSize: "0.78rem", color: daysAgo >= 5 ? "hsl(var(--color-error))" : "hsl(var(--muted-foreground))" }}>{daysAgo}d</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recent Referrals */}
        <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Inbound Referrals</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>From hospitals, physicians, courts</div>
            </div>
            <Link href="/referrals"><a style={{ fontSize: "0.75rem", color: "hsl(var(--primary))", textDecoration: "none", fontWeight: 500 }}>View all →</a></Link>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Source</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {recentReferrals.map((ref: any) => (
                <tr key={ref.id}>
                  <td style={{ display: "flex", alignItems: "center" }}>
                    {getUrgencyDot(ref.urgency)}
                    <span style={{ fontWeight: 500 }}>{ref.patientName}</span>
                  </td>
                  <td><span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{ref.referralSource.toUpperCase()}</span></td>
                  <td>{getStatusBadge(ref.status)}</td>
                  <td><span style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{timeAgo(ref.createdAt)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
