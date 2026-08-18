import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";

const TYPE_META = {
  work:       { label: "Work",       color: "#378ADD" },
  family:     { label: "Family",     color: "#1D9E75" },
  delivery:   { label: "Delivery",   color: "#C97A1A" },
  contractor: { label: "Contractor", color: "#5B4FCF" },
};

function MiniBar({ data }) {
  if (!data || data.length === 0) return (
    <div style={{ height: 60, background: "var(--bg-subtle)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text-muted)" }}>No data</div>
  );
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 72 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: "100%", background: "var(--blue)", borderRadius: "3px 3px 0 0", height: Math.max(4, (d.count / max) * 52) + "px", opacity: 0.85 }} />
          <span style={{ fontSize: 9, color: "var(--text-muted)", whiteSpace: "nowrap", transform: "rotate(-40deg)", transformOrigin: "top right" }}>
            {new Date(d.date).toLocaleDateString("en-KE", { month: "numeric", day: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", boxShadow: "var(--shadow)" }}>
      {title && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>{title}</div>}
      {children}
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem", borderTop: "3px solid " + accent, flex: 1 }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [period, setPeriod]   = useState("weekly");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const d = await api.getAnalytics(period); setData(d); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const handleSend = async () => {
    setSending(true); setSendMsg(null);
    try {
      const d = await api.sendAnalytics(period);
      setSendMsg({ ok: true, msg: d.message });
    } catch (err) {
      setSendMsg({ ok: false, msg: err.message });
    }
    setSending(false);
    setTimeout(() => setSendMsg(null), 5000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      {/* Topbar */}
      <header style={{ background: "#0C1A2E", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#1B3A6B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#E6F1FB" }}>GateKeeper</span>
          <span style={{ color: "#1B3A6B", margin: "0 4px" }}>·</span>
          <span style={{ fontSize: 13, color: "#85B7EB" }}>Analytics</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle style={{ background: "#1B3A6B", border: "none", color: "#85B7EB" }} />
          <button onClick={() => navigate("/company/dashboard")} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>← Admin</button>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>🔐 Officer view</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: "1.75rem 2rem", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>📊 Analytics Report</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Preview and email visitor reports to your company.</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["weekly", "monthly"].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                height: 34, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: period === p ? "2px solid var(--blue)" : "1px solid var(--border)",
                background: period === p ? "var(--blue-pale)" : "var(--bg-input)",
                color: period === p ? "var(--blue-dark)" : "var(--text-secondary)",
                fontFamily: "inherit",
              }}>{p === "weekly" ? "Last 7 days" : "Last 30 days"}</button>
            ))}
            <button onClick={handleSend} disabled={sending} style={{
              height: 34, padding: "0 16px", background: sending ? "#4a6fa0" : "#0C1A2E",
              color: "#E6F1FB", border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 500, cursor: sending ? "not-allowed" : "pointer", fontFamily: "inherit",
            }}>
              {sending ? "Sending…" : "📧 Email report"}
            </button>
          </div>
        </div>

        {sendMsg && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1.25rem",
            background: sendMsg.ok ? "var(--green-pale)" : "var(--red-pale)",
            border: "1px solid " + (sendMsg.ok ? "var(--green)" : "var(--red-border)"),
            color: sendMsg.ok ? "var(--green-dark)" : "var(--red)",
          }}>
            {sendMsg.ok ? "✅" : "⚠️"} {sendMsg.msg}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading…</div>
        ) : !data ? null : (
          <>
            {/* Stat tiles */}
            <div style={{ display: "flex", gap: 12, marginBottom: "1.25rem" }}>
              <StatTile label="Total visitors"    value={data.total}                                                accent="#378ADD" />
              <StatTile label="Checked out"       value={data.checkedOut}                                           accent="#1D9E75" />
              <StatTile label="Avg. visit"        value={data.avgDurationMins > 0 ? data.avgDurationMins + "m" : "—"} accent="#5B4FCF" />
              <StatTile label="Busiest day"       value={data.busiestDay ? new Date(data.busiestDay.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" }) : "—"} accent="#C97A1A" />
            </div>

            {/* Charts row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              <Card title={"Daily traffic — last " + data.days + " days"}>
                <MiniBar data={data.byDay} />
              </Card>
              <Card title="Visitor types">
                {data.byType.length === 0
                  ? <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", paddingTop: "1rem" }}>No data</div>
                  : data.byType.map(t => {
                      const meta = TYPE_META[t.visitor_type] || { label: t.visitor_type, color: "#999" };
                      const total = data.byType.reduce((s, x) => s + x.count, 0);
                      const pct = Math.round((t.count / total) * 100);
                      return (
                        <div key={t.visitor_type} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: meta.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{meta.label}</span>
                          <div style={{ width: 80, height: 5, background: "var(--border)", borderRadius: 99 }}>
                            <div style={{ width: pct + "%", height: "100%", background: meta.color, borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", width: 28, textAlign: "right" }}>{t.count}</span>
                        </div>
                      );
                    })
                }
              </Card>
            </div>

            {/* Top floors */}
            {data.topFloors.length > 0 && (
              <Card title="Busiest floors">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.topFloors.map((f, i) => {
                    const pct = Math.round((f.count / data.topFloors[0].count) * 100);
                    return (
                      <div key={f.floor} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, color: "var(--text-primary)", width: 70 }}>Floor {f.floor}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 99 }}>
                          <div style={{ width: pct + "%", height: "100%", background: i === 0 ? "#0C1A2E" : "var(--blue)", borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", width: 28, textAlign: "right" }}>{f.count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
