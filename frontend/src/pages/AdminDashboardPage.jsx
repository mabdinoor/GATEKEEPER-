import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";

export default function AdminDashboardPage() {
  const { admin, adminLogout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setError("");
    try {
      const [s, c] = await Promise.all([api.adminStats(), api.adminListCompanies()]);
      setStats(s);
      setCompanies(c.companies);
    } catch (err) {
      if (err.message?.match(/unauthorized|invalid|expired/i)) {
        adminLogout();
        navigate("/admin");
      } else {
        setError(err.message || "Failed to load");
      }
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.adminDeleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      setConfirmingId(null);
    } catch (err) {
      setError(err.message || "Failed to delete company");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#0C1A2E", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Admin Panel</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{admin?.username}</span>
          <button onClick={() => { adminLogout(); navigate("/admin"); }} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--text-primary)", cursor: "pointer" }}>Log out</button>
          <ThemeToggle />
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
        {error && (
          <div style={{ background: "var(--red-pale)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--red)", marginBottom: "1.25rem" }}>⚠️ {error}</div>
        )}

        {/* Platform stats */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
            <StatCard label="Companies" value={stats.totalCompanies} />
            <StatCard label="Officers" value={stats.totalOfficers} />
            <StatCard label="Check-ins today" value={stats.visitorsToday} />
            <StatCard label="Check-ins all-time" value={stats.visitorsAllTime} />
          </div>
        )}

        {stats?.byPlan && (
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {stats.byPlan.map((p) => (
              <span key={p.plan} style={{ fontSize: 12, background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 20, padding: "4px 12px", color: "var(--text-secondary)" }}>
                {p.plan}: <strong style={{ color: "var(--text-primary)" }}>{p.count}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Companies table */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", textAlign: "left" }}>
                <Th>Company</Th>
                <Th>Plan</Th>
                <Th>Status</Th>
                <Th>Officers</Th>
                <Th>Visitors</Th>
                <Th>Signed up</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {companies === null && (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Loading…</td></tr>
              )}
              {companies?.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>No companies yet</td></tr>
              )}
              {companies?.map((c) => (
                <tr key={c.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <Td>
                    <button onClick={() => navigate(`/admin/companies/${c.id}`)} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", color: "var(--text-primary)", fontWeight: 500, fontSize: 13, fontFamily: "inherit" }}>
                      {c.name}
                    </button>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{c.email}</div>
                  </Td>
                  <Td><PlanBadge plan={c.plan} /></Td>
                  <Td>
                    {!c.email_verified ? <Badge color="amber">Unverified</Badge> : !c.is_registered ? <Badge color="blue">Incomplete</Badge> : <Badge color="green">Active</Badge>}
                  </Td>
                  <Td>{c.officer_count}</Td>
                  <Td>{c.visitor_count}</Td>
                  <Td>{new Date(c.created_at).toLocaleDateString()}</Td>
                  <Td>
                    {confirmingId === c.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} style={{ fontSize: 11, background: "var(--red)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                          {deletingId === c.id ? "Deleting…" : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmingId(null)} style={{ fontSize: 11, background: "none", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "var(--text-primary)" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmingId(c.id)} style={{ fontSize: 11, background: "none", border: "1px solid var(--red-border)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "var(--red)" }}>
                        Delete
                      </button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "1rem 1.25rem" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}

function Th({ children }) {
  return <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.4 }}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: "10px 14px", color: "var(--text-primary)", verticalAlign: "top" }}>{children}</td>;
}

const badgeColors = {
  green: { bg: "var(--green-pale)", text: "var(--green-dark)" },
  amber: { bg: "var(--amber-pale)", text: "#92400E" },
  blue: { bg: "var(--blue-pale)", text: "var(--blue-dark)" },
};
function Badge({ color, children }) {
  const c = badgeColors[color] || badgeColors.blue;
  return <span style={{ fontSize: 11, fontWeight: 600, background: c.bg, color: c.text, padding: "2px 8px", borderRadius: 12 }}>{children}</span>;
}

function PlanBadge({ plan }) {
  const labels = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
  return <Badge color={plan === "free" ? "blue" : "green"}>{labels[plan] || plan}</Badge>;
}
