import ThemeToggle from "../components/ThemeToggle";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const C = {
  navy: "#0C1A2E", blue: "#378ADD", bluePale: "#E6F1FB", blueDark: "#185FA5",
  border: "#E5E7EB", muted: "#6B7280", red: "#E24B4A",
  amber: "#92400E", amberPale: "#FFFBEB", amberBorder: "#FDE68A",
  greenPale: "#E1F5EE", greenBorder: "#9FE1CB", greenDark: "#0F6E56",
};

function Input({ label, type = "text", value, onChange, placeholder, error }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: error ? C.red : C.muted }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          height: 42, border: `1px solid ${error ? C.red : C.border}`,
          borderRadius: 8, padding: "0 12px", fontSize: 14,
          fontFamily: "inherit", outline: "none", color: "var(--text-primary)", background: "var(--bg-card)",
        }} />
      {error && <span style={{ fontSize: 12, color: C.red }}>{error}</span>}
    </div>
  );
}

// ── Forgot password sub-form ──────────────────────────────────────────────────
function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/companies/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setSent(true);
    } catch { setError("Something went wrong."); }
    setLoading(false);
  };

  if (sent) return (
    <div style={{ textAlign: "center", padding: "1rem 0" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📬</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Check your inbox</h3>
      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: "1.5rem" }}>
        If that email is registered, we've sent a password reset link. Check your spam folder too.
      </p>
      <button onClick={onBack} style={{ fontSize: 13, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
        ← Back to sign in
      </button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack} style={{ fontSize: 13, color: C.muted, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: "1.25rem", padding: 0 }}>
        ← Back
      </button>
      <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Forgot password?</h3>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: "1.5rem" }}>
        Enter your company email and we'll send a reset link.
      </p>
      {error && <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: "1rem" }}>⚠️ {error}</div>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        <button type="submit" disabled={loading} style={{
          height: 42, background: loading ? "#4a6fa0" : C.navy, color: "#E6F1FB",
          border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
        }}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CompanyAuthPage() {
  const { companyLogin, companySignup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [view, setView] = useState("auth"); // auth | forgot | unverified
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [tosAccepted, setTosAccepted] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
    setServerError("");
  };

  const validate = () => {
    const e = {};
    if (mode === "signup" && !form.name.trim()) e.name = "Company name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (mode === "signup" && form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (mode === "signup" && !tosAccepted) e.tos = "You must accept the Terms of Service and Privacy Policy";
    return e;
  };

  const handleResend = async () => {
    try {
      await fetch("/api/companies/resend-verification", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      setResendSent(true);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const company = await companyLogin(form.email, form.password);
        navigate(company.is_registered ? "/company/dashboard" : "/company/register");
      } else {
        await companySignup(form.name, form.email, form.password, tosAccepted);
        setView("signup-success");
      }
    } catch (err) {
      if (err.code === "EMAIL_NOT_VERIFIED" || err.message?.includes("verify your email")) {
        setUnverifiedEmail(form.email);
        setView("unverified");
      } else {
        setServerError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Unverified email notice ──
  if (view === "unverified") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", padding: "2rem" }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
        <ThemeToggle />
      </div>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "2.5rem", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📧</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verify your email</h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: "1.5rem" }}>
          We sent a verification link to <strong>{unverifiedEmail}</strong>.<br />
          Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
        {resendSent
          ? <div style={{ background: C.greenPale, border: `1px solid ${C.greenBorder}`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.greenDark, marginBottom: "1rem" }}>✅ Verification email resent!</div>
          : <button onClick={handleResend} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 18px", fontSize: 13, color: "#555", cursor: "pointer", fontFamily: "inherit", marginBottom: "1rem" }}>
              Resend verification email
            </button>
        }
        <div>
          <button onClick={() => setView("auth")} style={{ fontSize: 13, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );

  // ── Signup success ──
  if (view === "signup-success") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-page)", padding: "2rem" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "2.5rem", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>📬</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Check your inbox!</h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: "1.5rem" }}>
          We sent a verification link to <strong>{form.email}</strong>.<br />
          Click the link in the email to activate your account and complete setup.
        </p>
        <p style={{ fontSize: 12, color: "#aaa" }}>Didn't get it? Check your spam folder.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-page)", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 52, height: 52, background: C.navy, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 12px" }}>🛡️</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>GateKeeper</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Building Access Management</div>
        </div>

        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {view === "forgot" ? (
            <ForgotPassword onBack={() => setView("auth")} />
          ) : (
            <>
              {/* Tabs */}
              <div style={{ display: "flex", background: "var(--bg-page)", borderRadius: 10, padding: 4, marginBottom: "1.75rem" }}>
                {["login", "signup"].map(m => (
                  <button key={m} onClick={() => { setMode(m); setErrors({}); setServerError(""); setTosAccepted(false); }} style={{
                    flex: 1, height: 36, border: "none", borderRadius: 8,
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    background: mode === m ? "#fff" : "transparent",
                    color: mode === m ? "#111" : C.muted,
                    boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s", fontFamily: "inherit",
                  }}>{m === "login" ? "Sign in" : "Create account"}</button>
                ))}
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
                {mode === "login" ? "Welcome back" : "Get started"}
              </h2>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: "1.5rem" }}>
                {mode === "login" ? "Sign in to manage your building access system." : "Create a company account to get started."}
              </p>

              {serverError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: "1.25rem" }}>
                  ⚠️ {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {mode === "signup" && (
                  <Input label="Company name" value={form.name} onChange={set("name")} placeholder="e.g. Acme Corporation" error={errors.name} />
                )}
                <Input label="Email address" type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" error={errors.email} />
                <Input label="Password" type="password" value={form.password} onChange={set("password")}
                  placeholder={mode === "signup" ? "Minimum 6 characters" : "Enter your password"} error={errors.password} />
                {mode === "signup" && (
                  <Input label="Confirm password" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat your password" error={errors.confirmPassword} />
                )}

                {mode === "login" && (
                  <div style={{ textAlign: "right", marginTop: -6 }}>
                    <button type="button" onClick={() => setView("forgot")} style={{ fontSize: 12, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === "signup" && (
                  <>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: errors.tos ? C.red : C.muted, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={tosAccepted}
                        onChange={(e) => { setTosAccepted(e.target.checked); if (errors.tos) setErrors(p => ({ ...p, tos: "" })); }}
                        style={{ marginTop: 2, cursor: "pointer" }}
                      />
                      <span>
                        I agree to the{" "}
                        <a href="/terms" target="_blank" rel="noreferrer" style={{ color: C.blue, textDecoration: "none" }}>Terms of Service</a>
                        {" "}and{" "}
                        <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: C.blue, textDecoration: "none" }}>Privacy Policy</a>
                      </span>
                    </label>
                    {errors.tos && <span style={{ fontSize: 12, color: C.red, marginTop: -8 }}>{errors.tos}</span>}
                  </>
                )}

                <button type="submit" disabled={loading} style={{
                  height: 44, background: loading ? "#4a6fa0" : C.navy, color: "#E6F1FB",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", marginTop: 4,
                }}>
                  {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign in" : "Create account")}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: "1.5rem" }}>
          Security officers?{" "}
          <a href="/login" style={{ color: C.blue, textDecoration: "none", fontWeight: 500 }}>Sign in here →</a>
        </p>
      </div>
    </div>
  );
}
