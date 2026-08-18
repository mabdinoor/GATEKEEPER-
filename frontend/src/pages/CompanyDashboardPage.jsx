import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";

const inputStyle = {
  height: 40, border: "1px solid var(--border)", borderRadius: 8,
  padding: "0 12px", fontSize: 13, fontFamily: "inherit",
  outline: "none", color: "var(--text-primary)", background: "var(--bg-input)",
  width: "100%", boxSizing: "border-box",
};

export default function CompanyDashboardPage() {
  const { company, logoutCompany } = useAuth();
  const navigate = useNavigate();
  const [officers, setOfficers]   = useState([]);
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ badge_id: "", name: "", pin: "" });
  const [formError, setFormError] = useState("");
  const [flash, setFlash]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [billing, setBilling]     = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => { loadOfficers(); loadBilling(); }, []);

  const loadBilling = async () => {
    try { const data = await api.getBillingStatus(); setBilling(data); } catch {}
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { url } = await api.createBillingPortal();
      window.location.href = url;
    } catch (err) {
      setFlash("⚠️ " + (err.message || "Could not open billing portal"));
      setTimeout(() => setFlash(null), 3500);
    } finally {
      setPortalLoading(false);
    }
  };

  const loadOfficers = async () => {
    try { const data = await api.getOfficers(); setOfficers(data.officers); } catch {}
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.badge_id || !form.name || !form.pin) { setFormError("All fields are required"); return; }
    if (form.pin.length < 4) { setFormError("PIN must be at least 4 digits"); return; }
    setLoading(true);
    try {
      await api.addOfficer(form);
      setFlash("✅ Officer added successfully");
      setForm({ badge_id: "", name: "", pin: "" });
      setShowAdd(false); setFormError(""); loadOfficers();
    } catch (err) { setFormError(err.message); }
    finally { setLoading(false); setTimeout(() => setFlash(null), 3500); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove officer ${name}?`)) return;
    setDeleting(id);
    try { await api.deleteOfficer(id); loadOfficers(); } catch {}
    setDeleting(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      {/* Topbar */}
      <header style={{ background: "#0C1A2E", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#1B3A6B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#E6F1FB" }}>GateKeeper</span>
          <span style={{ color: "#1B3A6B", margin: "0 4px" }}>·</span>
          <span style={{ fontSize: 13, color: "#85B7EB" }}>Company Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle style={{ background: "#1B3A6B", border: "none", color: "#85B7EB" }} />
          {company?.logo_url && <img src={company.logo_url} alt="logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />}
          <span style={{ fontSize: 13, color: "#B5D4F4", fontWeight: 500 }}>{company?.name}</span>
          <button onClick={() => navigate("/analytics")} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>📊 Analytics</button>
          <button onClick={() => navigate("/pricing")} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>💳 Plan</button>
          <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>🔐 Officer view</button>
          <button onClick={() => logoutCompany()} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>Sign out</button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem" }}>
        {/* Company info card */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: 12, background: "var(--bg-subtle)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {company?.logo_url ? <img src={company.logo_url} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 32 }}>🏢</span>}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>{company?.name}</h1>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[["🏭", company?.industry], ["📍", company?.address], ["👤", company?.contact_person], ["✉️", company?.email]].map(([icon, val]) => val ? (
                <div key={icon} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)" }}>
                  <span>{icon}</span><span>{val}</span>
                </div>
              ) : null)}
            </div>
          </div>
          <div style={{ background: "var(--green-pale)", color: "var(--green-dark)", fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20 }}>✅ Registered</div>
        </div>

        {flash && (
          <div style={{ background: "var(--green-pale)", border: "1px solid var(--green)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--green-dark)", marginBottom: "1.25rem" }}>{flash}</div>
        )}

        {/* Billing / plan summary */}
        {billing && (
          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{billing.plan.name} plan</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", background: "var(--green-pale)", padding: "2px 8px", borderRadius: 12 }}>
                  {billing.plan.price === 0 ? "Free" : billing.plan.priceLabel + "/" + billing.plan.interval}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Up to {Number.isFinite(billing.plan.maxOfficers) ? billing.plan.maxOfficers : "unlimited"} officers · {Number.isFinite(billing.plan.maxVisitorsPerMonth) ? billing.plan.maxVisitorsPerMonth + " check-ins/month" : "unlimited check-ins"}
                {billing.currentPeriodEnd && billing.plan.key !== "free" && (
                  <> · renews {new Date(billing.currentPeriodEnd).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}</>
                )}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {billing.plan.key !== "free" && (
                <button onClick={handleManageBilling} disabled={portalLoading} style={{ height: 36, padding: "0 14px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "var(--text-primary)", cursor: "pointer" }}>
                  {portalLoading ? "Opening…" : "Manage billing"}
                </button>
              )}
              <button onClick={() => navigate("/pricing")} style={{ height: 36, padding: "0 14px", background: "#0C1A2E", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 500, color: "#E6F1FB", cursor: "pointer" }}>
                {billing.plan.key === "free" ? "Upgrade" : "Change plan"}
              </button>
            </div>
          </div>
        )}

        {/* Officers section */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Security Officers</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{officers.length} officer{officers.length !== 1 ? "s" : ""} registered</p>
            </div>
            <button onClick={() => { setShowAdd(!showAdd); setFormError(""); }} style={{
              height: 38, padding: "0 16px",
              background: showAdd ? "var(--bg-subtle)" : "#0C1A2E",
              color: showAdd ? "var(--text-secondary)" : "#E6F1FB",
              border: `1px solid ${showAdd ? "var(--border)" : "#0C1A2E"}`,
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>{showAdd ? "✕ Cancel" : "+ Add officer"}</button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} style={{ padding: "1.25rem 1.5rem", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr 140px auto", gap: 10, alignItems: "flex-end" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Full name</label>
                <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setFormError(""); }} placeholder="Officer name" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Badge ID</label>
                <input value={form.badge_id} onChange={e => { setForm(p => ({ ...p, badge_id: e.target.value })); setFormError(""); }} placeholder="e.g. KE-0001" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>PIN</label>
                <input type="password" value={form.pin} onChange={e => { setForm(p => ({ ...p, pin: e.target.value })); setFormError(""); }} placeholder="Min 4 digits" style={inputStyle} />
              </div>
              <button type="submit" disabled={loading} style={{ height: 40, padding: "0 16px", background: loading ? "#4a6fa0" : "#0C1A2E", color: "#E6F1FB", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                {loading ? "Adding…" : "Add"}
              </button>
              {formError && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--red)" }}>⚠️ {formError}</div>}
            </form>
          )}

          {officers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)", fontSize: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👮</div>
              No officers yet. Add your first security officer above.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-subtle)" }}>
                  {["Officer", "Badge ID", "Added on", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {officers.map((o, i) => (
                  <tr key={o.id} style={{ borderBottom: i < officers.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--blue-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👮</div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{o.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "var(--text-primary)" }}>{o.badge_id}</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)" }}>
                      {new Date(o.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button onClick={() => handleDelete(o.id, o.name)} disabled={deleting === o.id} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--red)", cursor: "pointer", opacity: deleting === o.id ? 0.5 : 1 }}>
                        {deleting === o.id ? "Removing…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ background: "var(--blue-pale)", border: "1px solid #BDD9F5", borderRadius: 12, padding: "1.25rem 1.5rem", marginTop: "1.5rem" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--blue-dark)", marginBottom: 6 }}>ℹ️ How officers sign in</div>
          <p style={{ fontSize: 13, color: "var(--blue-dark)", lineHeight: 1.6 }}>
            Officers go to <strong>/login</strong>, select your company, then enter their Badge ID and PIN.
          </p>
        </div>
      </div>
    </div>
  );
}
