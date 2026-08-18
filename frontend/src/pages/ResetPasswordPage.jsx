import ThemeToggle from "../components/ThemeToggle";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const inputStyle = (err) => ({
  width: "100%", height: 42,
  border: `1px solid ${err ? "#E24B4A" : "#E5E7EB"}`,
  borderRadius: 8, padding: "0 12px", fontSize: 14,
  fontFamily: "inherit", outline: "none", color: "var(--text-primary)", background: "var(--bg-card)",
  boxSizing: "border-box",
});

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/companies/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess(true);
      setTimeout(() => navigate("/company"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)" }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
        <ThemeToggle />
      </div>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "3rem", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 42, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Password reset!</h2>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Redirecting you to sign in…</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", padding: "2rem" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "2.5rem", maxWidth: 420, width: "100%", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔑</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Set a new password</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Enter your new password below.</p>
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: "1.25rem" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 5 }}>New password</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              placeholder="Minimum 6 characters" style={inputStyle(!!error)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 5 }}>Confirm password</label>
            <input type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }}
              placeholder="Repeat your password" style={inputStyle(!!error)} />
          </div>
          <button type="submit" disabled={loading} style={{
            height: 44, background: loading ? "#4a6fa0" : "#0C1A2E",
            color: "#E6F1FB", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", marginTop: 4,
          }}>
            {loading ? "Saving…" : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
}
