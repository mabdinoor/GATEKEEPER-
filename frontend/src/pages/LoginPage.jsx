import ThemeToggle from "../components/ThemeToggle";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { apiRequest } from "../api/client";

export default function LoginPage() {
  const { officerLogin } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch company list for the selector
  useEffect(() => {
    apiRequest("/companies/list")
      .then(d => setCompanies(d.companies || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!companyId) { setError("Please select your company."); return; }
    if (!badgeId || !password) { setError("Please enter your Badge ID and PIN."); return; }
    setLoading(true);
    try {
      await officerLogin(badgeId, password, companyId);
      navigate("/checkin");
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (err) => ({
    width: "100%", height: 42,
    border: `1px solid ${err ? "#E24B4A" : "#d0d5dd"}`,
    borderRadius: 8, padding: "0 12px",
    fontSize: 14, outline: "none",
    background: "var(--bg-card)", color: "var(--text-primary)",
    fontFamily: "inherit",
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-page)" }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
        <ThemeToggle />
      </div>
      {/* Left panel */}
      <div style={{
        width: 300, background: "#0C1A2E",
        display: "flex", flexDirection: "column",
        padding: "2.5rem 2rem", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "3rem" }}>
          <div style={{ width: 36, height: 36, background: "#1B3A6B", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#E6F1FB" }}>GateKeeper</div>
            <div style={{ fontSize: 10, color: "#378ADD", letterSpacing: "0.08em", textTransform: "uppercase" }}>Officer Portal</div>
          </div>
        </div>

        <InfoRow icon="🏢" label="Facility" value="Building Access Control" />
        <InfoRow icon="📅" label="Date" value={new Date().toLocaleDateString("en-KE", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} />
        <InfoRow icon="🕐" label="Timezone" value="East Africa Time (EAT)" />

        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5DCAA5", marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#1D9E75", display: "inline-block" }}></span>
            System operational
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{
          background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
          padding: "2.5rem", width: "100%", maxWidth: 420,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Officer sign-in</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: "2rem" }}>
            Select your company and enter your credentials.
          </p>

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 8, padding: "10px 14px",
              fontSize: 13, color: "#B91C1C", marginBottom: "1.25rem",
            }}>⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Company selector */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 6 }}>
                Company
              </label>
              <select
                value={companyId}
                onChange={e => { setCompanyId(e.target.value); setError(""); }}
                style={{ ...inputStyle(!companyId && !!error), cursor: "pointer" }}
              >
                <option value="">Select your company…</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 6 }}>Badge ID</label>
              <input type="text" value={badgeId}
                onChange={e => { setBadgeId(e.target.value); setError(""); }}
                placeholder="e.g. KE-0001" style={inputStyle(!!error)} autoFocus />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 6 }}>PIN</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your PIN"
                  style={{ ...inputStyle(!!error), paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#aaa",
                }}>{showPw ? "🙈" : "👁️"}</button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", height: 44, background: loading ? "#4a6fa0" : "#0C1A2E",
              color: "#E6F1FB", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginTop: 4,
            }}>
              {loading ? "Signing in…" : "🔐 Sign in to shift"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginTop: "1.5rem" }}>
            Company admin?{" "}
            <a href="/company" style={{ color: "#378ADD", textDecoration: "none", fontWeight: 500 }}>
              Sign in here →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem" }}>
      <span style={{ fontSize: 16, width: 20 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#B5D4F4", lineHeight: 1.4 }}>{value}</div>
      </div>
    </div>
  );
}
