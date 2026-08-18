import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";

const TABS = ["Officers", "Visitors", "Blacklist", "Preregistrations"];

export default function AdminCompanyDetailPage() {
  const { id } = useParams();
  const { admin, adminLogout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Officers");
  const [planSaving, setPlanSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setError("");
    try {
      const d = await api.adminGetCompany(id);
      setData(d);
    } catch (err) {
      if (err.message?.match(/unauthorized|invalid|expired/i)) {
        adminLogout();
        navigate("/admin");
      } else if (err.message?.match(/not found/i)) {
        setError("Company not found — it may have been deleted.");
      } else {
        setError(err.message || "Failed to load");
      }
    }
  };

  const handlePlanChange = async (plan) => {
    setPlanSaving(true);
    try {
      await api.adminChangePlan(id, plan);
      setData((d) => ({ ...d, company: { ...d.company, plan, planInfo: { ...d.company.planInfo, key: plan } } }));
      load(); // refresh to get the real planInfo object back from the server
    } catch (err) {
      setError(err.message || "Failed to change plan");
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.adminDeleteCompany(id);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Failed to delete company");
      setDeleting(false);
    }
  };

  if (error && !data) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--red)", marginBottom: 12 }}>⚠️ {error}</p>
          <button onClick={() => navigate("/admin/dashboard")} style={{ background: "#0C1A2E", color: "#E6F1FB", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/admin/dashboard")} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: "var(--text-primary)" }}>← Back</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{data?.company.name || "Loading…"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{admin?.username}</span>
          <ThemeToggle />
        </div>
      </header>

      {data && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "1.5rem" }}>
          {error && (
            <div style={{ background: "var(--red-pale)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: "1.25rem" }}>⚠️ {error}</div>
          )}

          {/* Company summary + admin controls */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>{data.company.email}</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: 10, color: "var(--text-secondary)" }}>
                    {data.company.email_verified ? "✅ Verified" : "⚠️ Unverified"}
                  </span>
                  <span style={{ fontSize: 11, background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: 10, color: "var(--text-secondary)" }}>
                    Signed up {new Date(data.company.created_at).toLocaleDateString()}
                  </span>
                  {data.company.subscription_status && (
                    <span style={{ fontSize: 11, background: "var(--bg-subtle)", padding: "2px 8px", borderRadius: 10, color: "var(--text-secondary)" }}>
                      Subscription: {data.company.subscription_status}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <label style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Plan:{" "}
                  <select
                    value={data.company.plan} disabled={planSaving}
                    onChange={(e) => handlePlanChange(e.target.value)}
                    style={{ marginLeft: 6, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 12, padding: "0 8px" }}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>

                {confirmDelete ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={handleDelete} disabled={deleting} style={{ fontSize: 12, background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
                      {deleting ? "Deleting…" : "Confirm delete"}
                    </button>
                    <button onClick={() => setConfirmDelete(false)} style={{ fontSize: 12, background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--text-primary)" }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} style={{ fontSize: 12, background: "none", border: "1px solid var(--red-border)", borderRadius: 6, padding: "6px 12px", cursor: "pointer", color: "var(--red)" }}>
                    Delete company
                  </button>
                )}
              </div>
            </div>
            {confirmDelete && (
              <p style={{ fontSize: 12, color: "var(--red)", marginTop: 10 }}>
                ⚠️ This permanently deletes this company and ALL its officers, visitors, blacklist entries, and preregistrations. This cannot be undone.
              </p>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: "none", border: "none", borderBottom: tab === t ? "2px solid #378ADD" : "2px solid transparent",
                padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
              }}>
                {t} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({data[t.toLowerCase()]?.length ?? 0})</span>
              </button>
            ))}
          </div>

          {tab === "Officers" && (
            <SimpleTable
              rows={data.officers}
              columns={[
                { key: "badge_id", label: "Badge ID" },
                { key: "name", label: "Name" },
                { key: "created_at", label: "Added", format: (v) => new Date(v).toLocaleDateString() },
              ]}
              empty="No officers yet"
            />
          )}

          {tab === "Visitors" && (
            <SimpleTable
              rows={data.visitors}
              columns={[
                { key: "first_name", label: "First name" },
                { key: "last_name", label: "Last name" },
                { key: "host", label: "Host" },
                { key: "visitor_type", label: "Type" },
                { key: "checked_in_at", label: "Checked in", format: (v) => new Date(v).toLocaleString() },
                { key: "checked_out_at", label: "Checked out", format: (v) => (v ? new Date(v).toLocaleString() : "—") },
              ]}
              empty="No visitors yet"
              footnote="Showing the 50 most recent"
            />
          )}

          {tab === "Blacklist" && (
            <SimpleTable
              rows={data.blacklist}
              columns={[
                { key: "id_number", label: "ID number" },
                { key: "first_name", label: "First name" },
                { key: "last_name", label: "Last name" },
                { key: "reason", label: "Reason" },
                { key: "added_by_name", label: "Added by" },
              ]}
              empty="No blacklist entries"
            />
          )}

          {tab === "Preregistrations" && (
            <SimpleTable
              rows={data.preregistrations}
              columns={[
                { key: "first_name", label: "First name" },
                { key: "last_name", label: "Last name" },
                { key: "host", label: "Host" },
                { key: "expected_date", label: "Expected" },
                { key: "status", label: "Status" },
              ]}
              empty="No preregistrations yet"
            />
          )}
        </div>
      )}
    </div>
  );
}

function SimpleTable({ rows, columns, empty, footnote }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
        {empty}
      </div>
    );
  }
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
            {columns.map((c) => (
              <th key={c.key} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4 }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id ?? i} style={{ borderTop: "1px solid var(--border)" }}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "10px 14px", color: "var(--text-primary)" }}>
                  {row[c.key] == null || row[c.key] === "" ? "—" : c.format ? c.format(row[c.key]) : String(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footnote && <div style={{ padding: "8px 14px", fontSize: 11, color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>{footnote}</div>}
    </div>
  );
}
