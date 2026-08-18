import { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { api } from "../api/client";
import BadgePrint from "../components/BadgePrint";

const VISITOR_TYPES = [
  { id: "work",       label: "Work",       icon: "💼" },
  { id: "family",     label: "Family",     icon: "🏠" },
  { id: "delivery",   label: "Delivery",   icon: "📦" },
  { id: "contractor", label: "Contractor", icon: "🔧" },
];

const FLOORS = Array.from({ length: 20 }, (_, i) => `${i + 1}`);

const TYPE_PILLS = {
  work:       { background: "var(--blue-pale)",   color: "var(--blue-dark)" },
  family:     { background: "var(--green-pale)",  color: "var(--green-dark)" },
  delivery:   { background: "var(--amber-pale)",  color: "var(--amber)" },
  contractor: { background: "var(--purple-pale)", color: "var(--purple)" },
};

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "1rem 1.25rem",
      display: "flex", alignItems: "center", gap: 12, flex: 1,
      borderTop: "3px solid " + accent, boxShadow: "var(--shadow)",
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: error ? "var(--red)" : "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

export default function CheckInPage() {
  const { company } = useAuth();
  const [form, setForm] = useState({
    first_name: "", last_name: "", id_number: "",
    phone: "", host: "", floor: "", notes: "",
  });
  const [visitorType, setVisitorType] = useState("work");
  const [errors, setErrors]           = useState({});
  const [log, setLog]                 = useState([]);
  const [stats, setStats]             = useState({ total: 0, inside: 0, checkedOut: 0 });
  const [flash, setFlash]             = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [blacklisted, setBlacklisted] = useState(null);
  const [badgeVisitor, setBadgeVisitor] = useState(null);

  const load = async () => {
    try { const d = await api.getStats(); setStats(d.today || d); } catch {}
    try {
      const today = new Date().toISOString().slice(0, 10);
      const d = await api.getVisitors({ date: today });
      setLog(d.visitors.slice(0, 20));
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const checkBlacklist = async (id_number) => {
    if (!id_number) { setBlacklisted(null); return; }
    try {
      const d = await api.checkBlacklist({ id_number });
      setBlacklisted(d.blocked ? d.entry : null);
    } catch {}
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: false }));

    // Blacklist matching is ID-number-only (names aren't unique), so only
    // re-check when the ID number itself changes.
    if (field === "id_number") {
      checkBlacklist(val);
    }
  };

  const clearForm = () => {
    setForm({ first_name: "", last_name: "", id_number: "", phone: "", host: "", floor: "", notes: "" });
    setVisitorType("work");
    setErrors({});
    setFlash(null);
    setBlacklisted(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.first_name.trim()) newErrors.first_name = true;
    if (!form.last_name.trim())  newErrors.last_name  = true;
    if (!form.id_number.trim())  newErrors.id_number  = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    if (blacklisted) return; // block submission if on blacklist

    setSubmitting(true);
    try {
      const data = await api.logVisitor({ ...form, visitor_type: visitorType });
      const t = new Date().toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
      setFlash({ ok: true, msg: `${data.visitor.first_name} ${data.visitor.last_name} logged at ${t}.` });
      setBadgeVisitor(data.visitor);
      setTimeout(() => setFlash(null), 4000);
      clearForm();
      load();
    } catch (err) {
      setFlash({ ok: false, msg: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (err) => ({
    width: "100%", height: 38,
    border: "1px solid " + (err ? "var(--red)" : "var(--border)"),
    borderRadius: 8, padding: "0 10px", fontSize: 13,
    background: "var(--bg-input)", color: "var(--text-primary)",
    outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
  });

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: 1100, margin: "0 auto" }}>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: "1.75rem" }}>
        <StatCard icon="👥" label="Visitors today"   value={stats.total}      accent="var(--blue)" />
        <StatCard icon="🏢" label="Currently inside" value={stats.inside}     accent="var(--green)" />
        <StatCard icon="✅" label="Checked out"       value={stats.checkedOut} accent="var(--amber)" />
      </div>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>

        {/* Form */}
        <div style={{ flex: 1, background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: "1.75rem", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4, color: "var(--text-primary)" }}>Log a visitor</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Fill in the details of the person entering the building.</p>

          {/* Blacklist warning */}
          {blacklisted && (
            <div style={{ padding: "12px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1.25rem", background: "var(--red-pale)", border: "2px solid var(--red)", color: "var(--red)" }}>
              🚫 <strong>BLOCKED VISITOR</strong> — {blacklisted.reason || "This person is on the blacklist."} Remove from blacklist to allow entry.
            </div>
          )}

          {/* Flash */}
          {flash && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1.25rem",
              background: flash.ok ? "var(--green-pale)" : "var(--red-pale)",
              border: "1px solid " + (flash.ok ? "var(--green)" : "var(--red-border)"),
              color: flash.ok ? "var(--green-dark)" : "var(--red)",
            }}>
              {flash.ok ? "✅" : "⚠️"} {flash.msg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="First name *" error={errors.first_name}>
                <input style={inp(errors.first_name)} value={form.first_name} onChange={handleChange("first_name")} placeholder="e.g. Amina" />
              </Field>
              <Field label="Last name *" error={errors.last_name}>
                <input style={inp(errors.last_name)} value={form.last_name} onChange={handleChange("last_name")} placeholder="e.g. Wanjiku" />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="ID / Passport no. *" error={errors.id_number}>
                <input style={inp(errors.id_number)} value={form.id_number} onChange={handleChange("id_number")} placeholder="National ID or passport" />
              </Field>
              <Field label="Phone number">
                <input style={inp(false)} value={form.phone} onChange={handleChange("phone")} placeholder="+254 7xx xxx xxx" />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="Visiting / reporting to">
                <input style={inp(false)} value={form.host} onChange={handleChange("host")} placeholder="Host name or department" />
              </Field>
              <Field label="Floor">
                <select value={form.floor} onChange={handleChange("floor")} style={{ ...inp(false), cursor: "pointer" }}>
                  <option value="">Select floor</option>
                  {FLOORS.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
            </div>

            {/* Visitor type */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>Visitor type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {VISITOR_TYPES.map(t => {
                  const active = visitorType === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setVisitorType(t.id)} style={{
                      flex: 1, border: active ? "2px solid var(--blue)" : "1px solid var(--border)",
                      borderRadius: 8, padding: "8px 4px", fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      color: active ? "var(--blue-dark)" : "var(--text-secondary)",
                      background: active ? "var(--blue-pale)" : "var(--bg-input)",
                      cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      fontFamily: "inherit",
                    }}>
                      <span style={{ fontSize: 18 }}>{t.icon}</span>{t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label="Notes (optional)">
              <input style={inp(false)} value={form.notes} onChange={handleChange("notes")} placeholder="Vehicle plate, badge, purpose…" />
            </Field>

            <div style={{ display: "flex", gap: 10, marginTop: "1.5rem" }}>
              <button type="submit" disabled={submitting || !!blacklisted} style={{
                flex: 1, height: 42,
                background: blacklisted ? "#888" : submitting ? "#4a6fa0" : "#0C1A2E",
                color: "#E6F1FB", border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 500,
                cursor: submitting || blacklisted ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}>
                {submitting ? "Logging…" : blacklisted ? "🚫 Visitor blocked" : "👤 Log entry"}
              </button>
              <button type="button" onClick={clearForm} style={{
                height: 42, padding: "0 16px",
                background: "var(--bg-subtle)", border: "1px solid var(--border)",
                borderRadius: 8, fontSize: 13, color: "var(--text-secondary)",
                cursor: "pointer", fontFamily: "inherit",
              }}>Clear</button>
            </div>
          </form>
        </div>

        {/* Recent log sidebar */}
        <div style={{ width: 240, background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: "1.25rem", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Recent entries</h3>
            <span style={{ background: "#0C1A2E", color: "#85B7EB", fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>{log.length}</span>
          </div>
          {log.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>No entries yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflowY: "auto" }}>
              {log.map(v => {
                const pill = TYPE_PILLS[v.visitor_type] || TYPE_PILLS.work;
                const time = new Date(v.checked_in_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
                const label = VISITOR_TYPES.find(t => t.id === v.visitor_type)?.label;
                return (
                  <div key={v.id} style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 11px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 4 }}>{v.first_name} {v.last_name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--text-secondary)" }}>
                      <span style={{ ...pill, fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 500 }}>{label}</span>
                      <span>{time}</span>
                      {v.checked_out_at && <span style={{ color: "var(--green-dark)" }}>· out</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Badge print modal */}
      {badgeVisitor && (
        <BadgePrint
          visitor={badgeVisitor}
          company={company}
          onClose={() => setBadgeVisitor(null)}
        />
      )}
    </div>
  );
}
