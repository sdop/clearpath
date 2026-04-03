import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

const navItems = [
  {
    section: "Overview",
    items: [
      { path: "/", label: "Dashboard", icon: <GridIcon /> },
    ]
  },
  {
    section: "Core Modules",
    items: [
      { path: "/insurance", label: "Insurance Verify", icon: <ShieldIcon /> },
      { path: "/reengagement", label: "Lead Re-engagement", icon: <RefreshIcon /> },
      { path: "/referrals", label: "BDO Referral Portal", icon: <NetworkIcon /> },
      { path: "/virtual", label: "Hybrid Care", icon: <VideoIcon /> },
    ]
  },
  {
    section: "Operations",
    items: [
      { path: "/centers", label: "Center Network", icon: <MapIcon /> },
    ]
  }
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useHashLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav className="sidebar">
        {/* Logo */}
        <div className="clearpath-logo">
          <svg className="logo-mark" viewBox="0 0 32 32" fill="none" aria-label="ClearPath logo">
            <rect width="32" height="32" rx="8" fill="hsl(186 72% 28%)" />
            <path d="M8 16C8 11.58 11.58 8 16 8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M16 8C20.42 8 24 11.58 24 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
            <path d="M10 20L14 16L17 19L22 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="13" r="2" fill="hsl(186 90% 65%)"/>
          </svg>
          <div>
            <div className="logo-text">ClearPath</div>
            <div className="logo-sub">Admissions Platform</div>
          </div>
        </div>

        <div style={{ height: "1px", background: "hsl(220 25% 22%)", margin: "0 16px 8px" }} />

        {navItems.map(section => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map(item => (
              <Link key={item.path} href={item.path}>
                <a className={`sidebar-nav-item ${location === item.path ? "active" : ""}`}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
        ))}

        {/* Bottom indicator */}
        <div style={{ marginTop: "auto", padding: "16px", borderTop: "1px solid hsl(220 25% 22%)" }}>
          <div style={{ fontSize: "0.7rem", color: "hsl(var(--sidebar-fg-muted))", marginBottom: 4 }}>Network Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--color-success))" }} />
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--sidebar-fg))" }}>All systems operational</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", background: "hsl(var(--background))" }}>
        {children}
      </main>
    </div>
  );
}

function GridIcon() {
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="11" y="1" width="6" height="6" rx="1.5"/>
    <rect x="1" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/>
  </svg>;
}
function ShieldIcon() {
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 1.5L2.25 4.5v4.5C2.25 12.9 5.2 16.3 9 17.25c3.8-.95 6.75-4.35 6.75-8.25V4.5L9 1.5z"/>
    <path d="M6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function RefreshIcon() {
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9a6 6 0 1 1 1.5 3.9" strokeLinecap="round"/>
    <path d="M3 13.5V9H7.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}
function NetworkIcon() {
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="9" cy="3" r="2"/><circle cx="3" cy="15" r="2"/><circle cx="15" cy="15" r="2"/>
    <path d="M9 5v3M9 8L3 13M9 8l6 5" strokeLinecap="round"/>
  </svg>;
}
function VideoIcon() {
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="1" y="4" width="11" height="10" rx="1.5"/>
    <path d="M12 7l5-3v10l-5-3V7z" strokeLinejoin="round"/>
  </svg>;
}
function MapIcon() {
  return <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6.75 1.5L1.5 4.5v12l5.25-3 4.5 3 5.25-3v-12l-5.25 3-4.5-3z"/>
    <path d="M6.75 1.5v12M11.25 4.5v12" strokeLinecap="round"/>
  </svg>;
}
