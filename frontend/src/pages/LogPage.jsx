import { useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

const TYPE_PILLS = {
  work:       { background: "var(--blue-pale)",   color: "var(--blue-dark)" },
  family:     { background: "var(--green-pale)",  color: "var(--green-dark)" },
  delivery:   { background: "var(--amber-pale)",  color: "var(--amber)" },
  contractor: { background: "var(--purple-pale)", color: "var(--purple)" },
};
const TYPE_LABELS = { work: "Work", family: "Family", delivery: "Delivery", contractor: "Contractor" };

export default function LogPage() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [checkingOut, setCheckingOut] = useState(null);
  const [flash, setFlash] = useState(null);

  const loadVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;
      const data = await api.getVisitors(params);
      setVisitors(data.visitors);
    } catch {}
    setLoading(false);
  }, [search, typeFilter, statusFilter, dateFilter]);

  useEffect(() => {
    const t = setTimeout(loadVisitors, 300);
    return () => clearTimeout(t);
  }, [loadVisitors]);

  const handleCheckOut = async (visitor) => {
    setCheckingOut(visitor.id);
    try {
      await api.checkOut(visitor.id);
      setFlash({ ok: true, msg: `${visitor.first_name} ${visitor.last_name} checked out.` });
      setTimeout(() => setFlash(null), 3500);
      loadVisitors();
    } catch (err) {
      setFlash({ ok: false, msg: err.message });
    } finally { setCheckingOut(null); }
  };

  const filterBtn = (active) => ({
    padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
    border: active ? "2px solid var(--blue)" : "1px solid var(--border)",
    background: active ? "var(--blue-pale)" : "var(--bg-input)",
    color: active ? "var(--blue-dark)" : "var(--text-secondary)",
    cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>Visitor Log</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{visitors.length} record{visitors.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>

      {flash && (
        <div style={{
          padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1.25rem",
          background: flash.ok ? "var(--green-pale)" : "var(--red-pale)",
          border: `1px solid ${flash.ok ? "var(--green)" : "var(--red-border)"}`,
          color: flash.ok ? "var(--green-dark)" : "var(--red)",
        }}>{flash.ok ? "✅" : "⚠️"} {flash.msg}</div>
      )}

      {/* Filters */}
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: "1rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <input type="text" placeholder="🔍  Search name, ID, host…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ height: 36, border: "1px solid var(--border)", borderRadius: 8, padding: "0 12px", fontSize: 13, outline: "none", width: 220, background: "var(--bg-input)", color: "var(--text-primary)" }} />
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
          style={{ height: 36, border: "1px solid var(--border)", borderRadius: 8, padding: "0 10px", fontSize: 13, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", cursor: "pointer" }} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Type:</span>
          {["all", "work", "family", "delivery", "contractor"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={filterBtn(typeFilter === t)}>
              {t === "all" ? "All" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Status:</span>
          {[{ id: "all", label: "All" }, { id: "in", label: "🏢 Inside" }, { id: "out", label: "✅ Out" }].map(s => (
            <button key={s.id} onClick={() => setStatusFilter(s.id)} style={filterBtn(statusFilter === s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
              {["Visitor", "ID Number", "Type", "Host / Floor", "Check-in", "Check-out", "Logged by", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}>Loading…</td></tr>
              : visitors.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}><div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>No visitors match your filters.</td></tr>
                : visitors.map((v, i) => {
                    const pill = TYPE_PILLS[v.visitor_type] || TYPE_PILLS.work;
                    const inTime = new Date(v.checked_in_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
                    const outTime = v.checked_out_at ? new Date(v.checked_out_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }) : null;
                    return (
                      <tr key={v.id} style={{ borderBottom: i < visitors.length - 1 ? "1px solid var(--border)" : "none" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-primary)" }}>{v.first_name} {v.last_name}</div>
                          {v.phone && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{v.phone}</div>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{v.id_number}</td>
                        <td style={{ padding: "12px 16px" }}><span style={{ ...pill, fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 500 }}>{TYPE_LABELS[v.visitor_type]}</span></td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>
                          <div>{v.host || "—"}</div>
                          {v.floor && <div style={{ color: "var(--text-muted)", marginTop: 1 }}>Floor {v.floor}</div>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{inTime}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12, whiteSpace: "nowrap" }}>
                          {outTime
                            ? <span style={{ color: "var(--green-dark)" }}>{outTime}</span>
                            : <span style={{ background: "var(--green-pale)", color: "var(--green-dark)", fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500 }}>Inside</span>}
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{v.officer_name || "—"}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {!v.checked_out_at && (
                            <button onClick={() => handleCheckOut(v)} disabled={checkingOut === v.id} style={{
                              padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)",
                              background: "var(--bg-input)", fontSize: 12, color: "var(--text-secondary)",
                              cursor: "pointer", whiteSpace: "nowrap", opacity: checkingOut === v.id ? 0.6 : 1,
                            }}>{checkingOut === v.id ? "…" : "Check out"}</button>
                          )}
                        </td>
                      </tr>
                    );
                  })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
