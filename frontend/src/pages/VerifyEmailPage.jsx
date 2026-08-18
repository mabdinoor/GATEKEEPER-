import ThemeToggle from "../components/ThemeToggle";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { companyVerify } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) { setStatus("error"); setMessage("No verification token found."); return; }

    fetch(`/api/companies/verify?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setStatus("error"); setMessage(data.error); return; }
        localStorage.setItem("sg_company_token", data.token);
        setStatus("success");
        setTimeout(() => navigate(data.company.is_registered ? "/company/dashboard" : "/company/register"), 2500);
      })
      .catch(() => { setStatus("error"); setMessage("Something went wrong. Please try again."); });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-page)", padding: "2rem",
    }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
        <ThemeToggle />
      </div>
      <div style={{
        background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)",
        padding: "3rem 2.5rem", maxWidth: 440, width: "100%",
        textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}>
        {status === "verifying" && (
          <>
            <div style={{ fontSize: 42, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verifying your email…</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 42, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Email verified!</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Your account is now active. Redirecting you…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 42, marginBottom: 16 }}>❌</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verification failed</h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{message}</p>
            <button onClick={() => navigate("/company")} style={{
              height: 42, padding: "0 24px", background: "#0C1A2E",
              color: "#E6F1FB", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            }}>Back to sign in</button>
          </>
        )}
      </div>
    </div>
  );
}
