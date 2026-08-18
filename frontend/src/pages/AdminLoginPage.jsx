import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(username, password);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", justifyContent: "flex-end", padding: "1.25rem 2rem" }}>
        <ThemeToggle />
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
        <form onSubmit={handleSubmit} style={{
          width: "100%", maxWidth: 360, background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "2rem 1.75rem", display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: "#0C1A2E", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 10px" }}>🛡️</div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Admin Panel</h1>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>Platform operator access</p>
          </div>

          {error && (
            <div style={{ background: "var(--red-pale)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--red)" }}>
              ⚠️ {error}
            </div>
          )}

          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
            Username
            <input
              value={username} onChange={(e) => setUsername(e.target.value)} autoFocus
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
            Password
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>

          <button type="submit" disabled={loading} style={{
            height: 42, marginTop: 8, background: "#0C1A2E", border: "none", borderRadius: 8,
            color: "#E6F1FB", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block", width: "100%", height: 40, marginTop: 6, padding: "0 12px",
  border: "1px solid var(--border)", borderRadius: 8, fontSize: 14,
  background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "inherit",
};
