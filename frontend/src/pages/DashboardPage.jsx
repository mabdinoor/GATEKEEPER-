import { useState, useEffect } from "react";
import { api } from "../api/client";

const TYPE_META = {
  work:       { label: "Work",       color: "#378ADD", icon: "💼" },
  family:     { label: "Family",     color: "#1D9E75", icon: "🏠" },
  delivery:   { label: "Delivery",   color: "#C97A1A", icon: "📦" },
  contractor: { label: "Contractor", color: "#5B4FCF", icon: "🔧" },
};

function BarChart({ data, color, height = 80 }) {
  if (!data || data.length === 0) return <div style={{ height, background: "var(--bg-subtle)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--text-muted)" }}>No data yet</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(280 / data.length) - 3;
  return (
    <svg viewBox={`0 0 280 ${height}`} style={{ width: "100%", height }} xmlns="http://www.w3.org/2000/svg">
      {data.map((d, i) => {
        const barH = Math.max(3, (d.value / max) * (height - 20));
        const x = i * (barW + 3);
        const y = height - barH - 16;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={d.value > 0 ? color : "var(--border)"} opacity={d.value > 0 ? 0.85 : 0.4} />
            <text x={x + barW / 2} y={height - 2} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", flex: 1, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, marginTop: 8 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", boxShadow: "var(--shadow)", ...style }}>
      {title && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>{title}</div>}
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    try { const d = await api.getDashboard(); setData(d); setLastRefresh(new Date()); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, []);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", fontSize: 14, color: "var(--text-muted)" }}>Loading dashboard…</div>;
  if (!data) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", fontSize: 14, color: "var(--red)" }}>Failed to load data.</div>;

  const { today, byType, byHour, last7Days, byFloor, recent, avgDurationMins } = data;

  const hourlyMap = Object.fromEntries((byHour || []).map(h => [h.hour, h.count]));
  const currentHour = new Date().getHours();
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({ label: h % 4 === 0 ? String(h).padStart(2, "0") : "", value: hourlyMap[h] || 0 }));

  const dayMap = Object.fromEntries((last7Days || []).map(d => [d.date, d.count]));
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString("en-KE", { weekday: "short" }), value: dayMap[d.toISOString().slice(0, 10)] || 0 };
  });

  const typeTotal = (byType || []).reduce((s, t) => s + t.count, 0);

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Dashboard</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 3 }}>{new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button onClick={load} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          🔄 Refresh {lastRefresh && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>· {lastRefresh.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: "1.25rem" }}>
        <StatCard icon="👥" label="Total today"         value={today.total}             sub="Since midnight"              accent="#378ADD" />
        <StatCard icon="🏢" label="Currently inside"    value={today.inside}            sub="Not yet checked out"         accent="#1D9E75" />
        <StatCard icon="✅" label="Checked out"          value={today.checkedOut}        sub="Departed today"              accent="#C97A1A" />
        <StatCard icon="⏱️" label="Avg. visit duration" value={avgDurationMins > 0 ? `${avgDurationMins}m` : "—"} sub="Checked-out visitors" accent="#5B4FCF" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        <Card title="Hourly traffic · today"><BarChart data={hourlyData} color="#378ADD" height={90} /><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Visitors by hour</div></Card>
        <Card title="7-day trend"><BarChart data={weekData} color="#1B3A6B" height={90} /><div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>Daily count, last 7 days</div></Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "1.25rem" }}>
        {/* Type breakdown */}
        <Card title="Visitor types · today">
          {typeTotal === 0 ? <div style={{ textAlign: "center", padding: "1.5rem 0", fontSize: 13, color: "var(--text-muted)" }}>No visitors yet today</div> : (
            <>
              <div style={{ display: "flex", height: 20, borderRadius: 99, overflow: "hidden", gap: 2, marginBottom: "1rem" }}>
                {(byType || []).map(t => { const meta = TYPE_META[t.visitor_type] || {}; return <div key={t.visitor_type} style={{ width: `${(t.count / typeTotal) * 100}%`, background: meta.color, minWidth: 4 }} />; })}
              </div>
              {(byType || []).map(t => {
                const meta = TYPE_META[t.visitor_type] || {};
                const pct = Math.round((t.count / typeTotal) * 100);
                return (
                  <div key={t.visitor_type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: meta.color }} />
                      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{meta.icon} {meta.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 5, background: "var(--border)", borderRadius: 99 }}><div style={{ width: `${pct}%`, height: "100%", background: meta.color, borderRadius: 99 }} /></div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", width: 24, textAlign: "right" }}>{t.count}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", width: 32 }}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </Card>

        {/* Top floors */}
        <Card title="Busiest floors · today">
          {(!byFloor || byFloor.length === 0) ? <div style={{ textAlign: "center", padding: "1.5rem 0", fontSize: 13, color: "var(--text-muted)" }}>No floor data yet</div> : (
            byFloor.map((f, i) => {
              const pct = Math.round((f.count / byFloor[0].count) * 100);
              return (
                <div key={f.floor} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--text-primary)" }}>Floor {f.floor}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{f.count}</span>
                  </div>
                  <div style={{ height: 5, background: "var(--border)", borderRadius: 99 }}>
                    <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: i === 0 ? "#0C1A2E" : "#378ADD", opacity: 1 - i * 0.15 }} />
                  </div>
                </div>
              );
            })
          )}
        </Card>

        {/* Recent activity */}
        <Card title="Recent activity">
          {(!recent || recent.length === 0) ? <div style={{ textAlign: "center", padding: "1.5rem 0", fontSize: 13, color: "var(--text-muted)" }}>No activity yet</div> : (
            recent.map((v, i) => {
              const meta = TYPE_META[v.visitor_type] || {};
              const time = new Date(v.checked_in_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
              const isOut = !!v.checked_out_at;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < recent.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.first_name} {v.last_name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{time}</div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 20, background: isOut ? "var(--green-pale)" : "var(--blue-pale)", color: isOut ? "var(--green-dark)" : "var(--blue-dark)", whiteSpace: "nowrap" }}>
                    {isOut ? "Out" : "Inside"}
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
