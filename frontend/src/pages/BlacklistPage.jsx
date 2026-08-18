import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function BlacklistPage() {
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ id_number: "", first_name: "", last_name: "", reason: "" });
  const [formError, setFormError] = useState("");
  const [flash, setFlash]         = useState(null);
  const [removing, setRemoving]   = useState(null);

  const load = async () => {
    setLoading(true);
    try { const d = await api.getBlacklist(); setList(d.blacklist); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.id_number.trim()) { setFormError("An ID number is required — names alone aren't reliable enough to match at check-in"); return; }
    try {
      await api.addBlacklist(form);
      setFlash({ ok: true, msg: "Entry added to blacklist." });
      setForm({ id_number: "", first_name: "", last_name: "", reason: "" });
      setShowAdd(false); load();
    } catch (err) { setFormError(err.message); }
    setTimeout(() => setFlash(null), 3500);
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from blacklist?`)) return;
    setRemoving(id);
    try { await api.removeBlacklist(id); load(); } catch {}
    setRemoving(null);
  };

  const inp = { height: 38, border: "1px solid var(--border)", borderRadius: 8, padding: "0 10px", fontSize: 13, background: "var(--bg-input)", color: "var(--text-primary)", outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ padding: "1.75rem 2rem", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>🚫 Blacklist</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Blocked visitors are matched by ID number at check-in — names alone aren't unique enough to rely on.</p>
        </div>
        <button onClick={() => { setShowAdd(!showAdd); setFormError(""); }} style={{
          height: 38, padding: "0 16px", background: showAdd ? "var(--bg-subtle)" : "#0C1A2E",
          color: showAdd ? "var(--text-secondary)" : "#E6F1FB",
          border: `1px solid ${showAdd ? "var(--border)" : "#0C1A2E"}`,
          borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
        }}>{showAdd ? "✕ Cancel" : "+ Add to blacklist"}</button>
      </div>

      {flash && (
        <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: "1rem", background: flash.ok ? "var(--green-pale)" : "var(--red-pale)", border: `1px solid ${flash.ok ? "var(--green)" : "var(--red-border)"}`, color: flash.ok ? "var(--green-dark)" : "var(--red)" }}>
          {flash.ok ? "✅" : "⚠️"} {flash.msg}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>Add blocked visitor</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr", gap: 10, alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>ID / Passport no. <span style={{ color: "var(--red)" }}>*</span></label>
              <input value={form.id_number} onChange={e => { setForm(p => ({ ...p, id_number: e.target.value })); setFormError(""); }} placeholder="National ID or passport (required)" style={inp} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>First name <span style={{ fontWeight: 400 }}>(optional, for reference)</span></label>
              <input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Last name</label>
              <input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Reason</label>
              <input value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="e.g. Trespassing" style={inp} />
            </div>
          </div>
          {formError && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8 }}>⚠️ {formError}</div>}
          <button type="submit" style={{ marginTop: 12, height: 38, padding: "0 20px", background: "#0C1A2E", color: "#E6F1FB", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Add to blacklist
          </button>
        </form>
      )}

      <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}>Loading…</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🚫</div>
            No blocked visitors. Entries you add will appear here and be flagged at check-in.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
                {["Visitor", "ID Number", "Reason", "Added by", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((entry, i) => (
                <tr key={entry.id} style={{ borderBottom: i < list.length - 1 ? "1px solid var(--border)" : "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>🚫</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                        {[entry.first_name, entry.last_name].filter(Boolean).join(" ") || "—"}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "monospace" }}>{entry.id_number || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--text-secondary)" }}>{entry.reason || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>{entry.added_by_name || "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {new Date(entry.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button onClick={() => handleRemove(entry.id, [entry.first_name, entry.last_name].filter(Boolean).join(" ") || entry.id_number)}
                      disabled={removing === entry.id}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", fontSize: 12, color: "var(--red)", cursor: "pointer", opacity: removing === entry.id ? 0.5 : 1 }}>
                      {removing === entry.id ? "…" : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
