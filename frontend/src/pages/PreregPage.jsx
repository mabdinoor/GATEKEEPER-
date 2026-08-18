import { useState, useEffect } from "react";
import { api } from "../api/client";

const FLOORS = Array.from({ length: 20 }, (_, i) => `${i + 1}`);
const TYPES  = [{ id: "work", label: "Work", icon: "💼" }, { id: "family", label: "Family", icon: "🏠" }, { id: "delivery", label: "Delivery", icon: "📦" }, { id: "contractor", label: "Contractor", icon: "🔧" }];

const STATUS_PILL = {
  pending:   { background: "var(--blue-pale)",   color: "var(--blue-dark)",   label: "Expected" },
  arrived:   { background: "var(--green-pale)",  color: "var(--green-dark)",  label: "Arrived" },
  cancelled: { background: "var(--red-pale)",    color: "var(--red)",         label: "Cancelled" },
};

export default function PreregPage() {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ first_name: "", last_name: "", email: "", phone: "", id_number: "", host: "", floor: "", visitor_type: "work", expected_date: new Date().toISOString().slice(0, 10), notes: "" });
  const [errors, setErrors]       = useState({});
  const [flash, setFlash]         = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const d = await api.getPrereg(); setList(d.preregistrations); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); if (errors[f]) setErrors(p => ({ ...p, [f]: false })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = true;
    if (!form.last_name.trim()) errs.last_name = true;
    if (!form.host.trim()) errs.host = true;
    if (!form.expected_date) errs.expected_date = true;
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await api.createPrereg(form);
      setFlash({ ok: true, msg: `${form.first_name} ${form.last_name} pre-registered.${form.email ? " Invite email sent." : ""}` });
      setForm({ first_name: "", last_name: "", email: "", phone: "", id_number: "", host: "", floor: "", visitor_type: "work", expected_date: new Date().toISOString().slice(0, 10), notes: "" });
      setShowForm(false); load();
    } catch (err) {
      setFlash({ ok: false, msg: err.message });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFlash(null), 4000);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this pre-registration?")) return;
    try { await api.cancelPrereg(id); load(); } catch {}
  };

  const inp = (err) => ({ height: 38, border: `1px solid ${err ? "var(--red)" : "var(--border)"}`, borderRadius: 8, padding: "0 10px", fontSize: 13, background: "var(--bg-input)", color: "var(--text-primary)", outline: "none", width: "100%", boxSizing: "border-box" });

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>📋 Pre-registrations</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Register guests in advance so check-in is faster.</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setErrors({}); }} style={{
          height: 38, padding: "0 16px", background: showForm ? "var(--bg-subtle)" : "#0C1A2E",
          color: showForm ? "var(--text-secondary)" : "#E6F1FB",
          border: `1px solid ${showForm ? "var(--border)" : "#0C1A2E"}`,
          borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
        }}>{showForm ? "✕ Cancel" : "+ Pre-register guest"}</button>
      </div>

      {flash && (
        <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1rem", background: flash.ok ? "var(--green-pale)" : "var(--red-pale)", border: `1px solid ${flash.ok ? "var(--green)" : "var(--red-border)"}`, color: flash.ok ? "var(--green-dark)" : "var(--red)" }}>
          {flash.ok ? "✅" : "⚠️"} {flash.msg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.25rem" }}>Guest details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <F label="First name *" error={errors.first_name}><input value={form.first_name} onChange={set("first_name")} placeholder="First name" style={inp(errors.first_name)} /></F>
            <F label="Last name *" error={errors.last_name}><input value={form.last_name} onChange={set("last_name")} placeholder="Last name" style={inp(errors.last_name)} /></F>
            <F label="ID / Passport"><input value={form.id_number} onChange={set("id_number")} placeholder="Optional — speeds up check-in" style={inp(false)} /></F>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <F label="Email"><input type="email" value={form.email} onChange={set("email")} placeholder="Invite email sent if provided" style={inp(false)} /></F>
            <F label="Phone"><input value={form.phone} onChange={set("phone")} placeholder="+254 7xx xxx xxx" style={inp(false)} /></F>
            <F label="Host *" error={errors.host}><input value={form.host} onChange={set("host")} placeholder="Name or department" style={inp(errors.host)} /></F>
            <F label="Expected date *" error={errors.expected_date}><input type="date" value={form.expected_date} onChange={set("expected_date")} style={inp(errors.expected_date)} /></F>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, marginBottom: 12 }}>
            <F label="Floor">
              <select value={form.floor} onChange={set("floor")} style={{ ...inp(false), cursor: "pointer" }}>
                <option value="">Any</option>
                {FLOORS.map(f => <option key={f}>{f}</option>)}
              </select>
            </F>
            <F label="Notes"><input value={form.notes} onChange={set("notes")} placeholder="Any additional instructions for the officer" style={inp(false)} /></F>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>Visitor type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {TYPES.map(t => {
                const active = form.visitor_type === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, visitor_type: t.id }))} style={{
                    flex: 1, border: active ? "2px solid var(--blue)" : "1px solid var(--border)", borderRadius: 8, padding: "7px 4px",
                    fontSize: 12, fontWeight: active ? 600 : 400, color: active ? "var(--blue-dark)" : "var(--text-secondary)",
                    background: active ? "var(--blue-pale)" : "var(--bg-input)", cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>{t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" disabled={submitting} style={{ height: 40, padding: "0 20px", background: submitting ? "#4a6fa0" : "#0C1A2E", color: "#E6F1FB", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            {submitting ? "Saving…" : "Pre-register guest"}
          </button>
        </form>
      )}

      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            No pre-registrations yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                {["Guest", "Host", "Expected date", "Type", "Status", "Registered by", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((p, i) => {
                const pill = STATUS_PILL[p.status] || STATUS_PILL.pending;
                const typeIcon = TYPES.find(t => t.id === p.visitor_type)?.icon || "👤";
                return (
                  <tr key={p.id} style={{ borderBottom: i < list.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-primary)" }}>{p.first_name} {p.last_name}</div>
                      {p.email && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{p.email}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>
                      <div>{p.host}</div>
                      {p.floor && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Floor {p.floor}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                      {new Date(p.expected_date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 16 }}>{typeIcon}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ ...pill, fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 500 }}>{pill.label}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{p.created_by_name || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.status === "pending" && (
                        <button onClick={() => handleCancel(p.id)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", fontSize: 12, color: "var(--red)", cursor: "pointer" }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function F({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: error ? "var(--red)" : "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
