import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Center = {
  id: number;
  name: string;
  state: string;
  city: string;
  bedsTotal: number;
  bedsAvailable: number;
  hasVirtual: boolean;
};

// Deterministically derive bed breakdowns from bedsTotal for realistic demo
function deriveBeakdown(c: Center) {
  const t = c.bedsTotal;
  const detox = Math.round(t * 0.2);
  const residential = Math.round(t * 0.45);
  const php = Math.round(t * 0.2);
  const iopSlots = Math.round(t * 0.15) * 2; // IOP slots ~ 2x the bed count
  const avail = c.bedsAvailable;
  // distribute available proportionally
  const detoxAvail = Math.min(detox, Math.round(avail * 0.2));
  const residentialAvail = Math.min(residential, Math.round(avail * 0.5));
  const phpAvail = Math.min(php, Math.max(0, avail - detoxAvail - residentialAvail));
  return { detox, residential, php, iopSlots, detoxAvail, residentialAvail, phpAvail };
}

function getStatus(c: Center): "open" | "limited" | "full" {
  if (c.bedsAvailable === 0) return "full";
  const pct = (c.bedsTotal - c.bedsAvailable) / c.bedsTotal;
  if (pct >= 0.85) return "limited";
  return "open";
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  open: { bg: "hsl(var(--color-success) / 0.15)", text: "hsl(var(--color-success))", label: "Open" },
  limited: { bg: "hsl(var(--color-warning) / 0.15)", text: "hsl(var(--color-warning))", label: "Limited" },
  full: { bg: "hsl(var(--color-error) / 0.15)", text: "hsl(var(--color-error))", label: "Full" },
};

export default function CenterNetwork() {
  const [filterState, setFilterState] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Record<number, string>>({});

  const { data: centers, isLoading } = useQuery<Center[]>({ queryKey: ["/api/centers"] });

  const refreshMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/centers/${id}/refresh`, {}),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/centers"] });
      setLastRefresh(prev => ({ ...prev, [id]: new Date().toISOString() }));
    },
  });

  const states = ["All", ...Array.from(new Set((centers ?? []).map(c => c.state))).sort()];

  const filtered = (centers ?? []).filter(c => {
    const status = getStatus(c);
    if (filterState !== "All" && c.state !== filterState) return false;
    if (filterStatus !== "All" && status !== filterStatus) return false;
    return true;
  });

  const totalBeds = (centers ?? []).reduce((a, c) => a + c.bedsTotal, 0);
  const totalAvail = (centers ?? []).reduce((a, c) => a + c.bedsAvailable, 0);
  const occupancy = totalBeds > 0 ? Math.round(((totalBeds - totalAvail) / totalBeds) * 100) : 0;
  const fullCount = (centers ?? []).filter(c => c.bedsAvailable === 0).length;
  const virtualCount = (centers ?? []).filter(c => c.hasVirtual).length;

  const getRefreshTime = (id: number) => {
    const t = lastRefresh[id];
    if (!t) return "Just now";
    const mins = Math.floor((Date.now() - new Date(t).getTime()) / 60000);
    if (mins < 1) return "Just now";
    return `${mins}m ago`;
  };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1150 }}>
      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Center Network</h1>
            <span className="status-badge success" style={{ fontSize: "0.7rem" }}>Live</span>
          </div>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem" }}>
            Real-time bed availability across all 11 treatment centers
          </p>
        </div>
        <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--color-success))" }} />
          Synced with EHR live system
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total Network Beds", value: totalBeds, color: "hsl(var(--primary))" },
          { label: "Available Now", value: totalAvail, color: "hsl(var(--color-success))" },
          { label: "Network Occupancy", value: `${occupancy}%`, color: occupancy > 90 ? "hsl(var(--color-error))" : "hsl(var(--color-warning))" },
          { label: "Centers at Capacity", value: fullCount, color: "hsl(var(--color-error))" },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="kpi-number" style={{ color: k.color }}>{k.value}</div>
            <div style={{ fontWeight: 600, fontSize: "0.8rem", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <select
          data-testid="select-state-filter"
          value={filterState}
          onChange={e => setFilterState(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: "0.82rem", background: "hsl(var(--card))", color: "hsl(var(--foreground))", cursor: "pointer" }}
        >
          {states.map(s => <option key={s} value={s}>{s === "All" ? "All States" : s}</option>)}
        </select>
        <select
          data-testid="select-status-filter"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: "0.82rem", background: "hsl(var(--card))", color: "hsl(var(--foreground))", cursor: "pointer" }}
        >
          {["All", "open", "limited", "full"].map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : STATUS_COLORS[s].label}</option>)}
        </select>
        <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
          {virtualCount} of {centers?.length ?? 0} centers have virtual capability
        </div>
      </div>

      {/* Centers Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 24 }}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, padding: "18px 20px", minHeight: 140, opacity: 0.4 }} />
          ))
        ) : filtered.map(center => {
          const status = getStatus(center);
          const st = STATUS_COLORS[status];
          const bds = deriveBeakdown(center);
          const occupancyPct = center.bedsTotal > 0 ? ((center.bedsTotal - center.bedsAvailable) / center.bedsTotal) * 100 : 0;
          const barColor = occupancyPct > 90 ? "hsl(var(--color-error))" : occupancyPct > 75 ? "hsl(var(--color-warning))" : "hsl(var(--color-success))";
          const isSelected = selectedCenter?.id === center.id;

          return (
            <div
              key={center.id}
              data-testid={`card-center-${center.id}`}
              onClick={() => setSelectedCenter(isSelected ? null : center)}
              style={{
                background: "hsl(var(--card))",
                border: `1.5px solid ${isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                borderRadius: 10, padding: "16px 18px", cursor: "pointer",
                transition: "border-color 150ms",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 2 }}>{center.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center", gap: 6 }}>
                    {center.city}, {center.state}
                    {center.hasVirtual && (
                      <span style={{ fontSize: "0.65rem", background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))", borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>
                        Virtual
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.text, fontWeight: 600, flexShrink: 0 }}>
                  {st.label}
                </span>
              </div>

              {/* Occupancy bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.72rem", color: "hsl(var(--muted-foreground))" }}>Beds available</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: center.bedsAvailable === 0 ? "hsl(var(--color-error))" : "hsl(var(--foreground))" }}>
                    {center.bedsAvailable} / {center.bedsTotal}
                  </span>
                </div>
                <div style={{ height: 5, background: "hsl(var(--border))", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, occupancyPct)}%`, background: barColor, borderRadius: 3, transition: "width 500ms ease" }} />
                </div>
              </div>

              {/* Bed type breakdown */}
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Detox", avail: bds.detoxAvail, total: bds.detox },
                  { label: "Residential", avail: bds.residentialAvail, total: bds.residential },
                  { label: "PHP", avail: bds.phpAvail, total: bds.php },
                  { label: "IOP Slots", avail: bds.iopSlots, total: bds.iopSlots },
                ].map(bt => (
                  <div key={bt.label} style={{ flex: 1, textAlign: "center", background: "hsl(var(--muted) / 0.4)", borderRadius: 6, padding: "5px 3px" }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: bt.avail === 0 && bt.label !== "IOP Slots" ? "hsl(var(--color-error))" : "hsl(var(--foreground))" }}>
                      {bt.avail}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "hsl(var(--muted-foreground))", lineHeight: 1.2, marginTop: 1 }}>{bt.label}</div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ fontSize: "0.68rem", color: "hsl(var(--muted-foreground))" }}>
                  {lastRefresh[center.id] ? `Refreshed ${getRefreshTime(center.id)}` : "Live from EHR"}
                </div>
                <button
                  data-testid={`button-refresh-${center.id}`}
                  onClick={e => { e.stopPropagation(); refreshMutation.mutate(center.id); }}
                  style={{ fontSize: "0.7rem", color: "hsl(var(--primary))", background: "none", border: "none", cursor: "pointer", padding: "2px 0", fontWeight: 500 }}
                >
                  {refreshMutation.isPending ? "..." : "↻ Sync"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedCenter && (() => {
        const bds = deriveBeakdown(selectedCenter);
        const status = getStatus(selectedCenter);
        const occ = Math.round(((selectedCenter.bedsTotal - selectedCenter.bedsAvailable) / selectedCenter.bedsTotal) * 100);
        return (
          <div style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--primary))", borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>{selectedCenter.name}</div>
                <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
                  {selectedCenter.city}, {selectedCenter.state} · {selectedCenter.hasVirtual ? "Virtual-capable" : "In-person only"}
                </div>
              </div>
              <button onClick={() => setSelectedCenter(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "hsl(var(--muted-foreground))", fontSize: "1.4rem", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {[
                { label: "Total Beds", value: selectedCenter.bedsTotal, sub: `${selectedCenter.bedsAvailable} available` },
                { label: "Detox", value: bds.detoxAvail, sub: `of ${bds.detox} beds` },
                { label: "Residential", value: bds.residentialAvail, sub: `of ${bds.residential} beds` },
                { label: "PHP", value: bds.phpAvail, sub: `of ${bds.php} beds` },
                { label: "IOP Slots", value: bds.iopSlots, sub: "outpatient" },
              ].map(s => (
                <div key={s.label} style={{ background: "hsl(var(--muted) / 0.4)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: s.value === 0 && s.label !== "IOP Slots" ? "hsl(var(--color-error))" : "hsl(var(--primary))" }}>{s.value}</div>
                  <div style={{ fontWeight: 600, fontSize: "0.78rem", marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: "0.68rem", color: "hsl(var(--muted-foreground))", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: "10px 14px", background: `${STATUS_COLORS[status].bg}`, borderRadius: 8, fontSize: "0.8rem", color: STATUS_COLORS[status].text, display: "flex", justifyContent: "space-between" }}>
              <span>Status: <strong>{STATUS_COLORS[status].label}</strong> · Occupancy: {occ}%</span>
              <span>Operational protocol: {occ > 90 ? "Manual bed-list backup active" : "EHR live sync"}</span>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: val.text }} />
            {val.label}
          </div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>
          Bed breakdowns estimated from bed mix ratios · IOP = outpatient slots
        </div>
      </div>
    </div>
  );
}
