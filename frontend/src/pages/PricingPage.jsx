import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { api } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";

export default function PricingPage() {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getPlans().then(d => setPlans(d.plans)).catch(() => {});
    if (company) {
      api.getBillingStatus().then(d => setCurrentPlan(d.plan.key)).catch(() => {});
    }
  }, [company]);

  const handleChoose = async (planKey) => {
    setError("");
    if (planKey === "free") {
      navigate(company ? "/company/dashboard" : "/company");
      return;
    }
    if (!company) {
      navigate("/company");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const { url } = await api.createCheckout(planKey);
      window.location.href = url;
    } catch (err) {
      setError(err.message || "Could not start checkout");
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "#0C1A2E", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>GateKeeper</span>
        </div>
        <ThemeToggle />
      </header>

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "1rem 1.5rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Simple, transparent pricing</h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Pick the plan that fits your building. Upgrade or cancel any time.</p>
        </div>

        {error && (
          <div style={{ maxWidth: 480, margin: "0 auto 1.5rem", background: "var(--red-pale, #FEE2E2)", border: "1px solid var(--red)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--red)", textAlign: "center" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isPopular = plan.key === "pro";
            return (
              <div key={plan.key} style={{
                background: "var(--bg-card)", borderRadius: 14,
                border: isPopular ? "2px solid #378ADD" : "1px solid var(--border)",
                padding: "1.75rem 1.5rem", position: "relative", display: "flex", flexDirection: "column",
              }}>
                {isPopular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#378ADD", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 20 }}>
                    MOST POPULAR
                  </div>
                )}
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{plan.name}</h2>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>{plan.priceLabel}</span>
                  {plan.interval && <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>/{plan.interval}</span>}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginBottom: 10, alignItems: "flex-start" }}>
                      <span style={{ color: "#0F6E56" }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleChoose(plan.key)}
                  disabled={isCurrent || loadingPlan === plan.key}
                  style={{
                    height: 42, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: isCurrent ? "default" : "pointer",
                    fontFamily: "inherit", border: isPopular ? "none" : "1px solid var(--border)",
                    background: isCurrent ? "var(--bg-subtle)" : isPopular ? "#0C1A2E" : "var(--bg-card)",
                    color: isCurrent ? "var(--text-muted)" : isPopular ? "#E6F1FB" : "var(--text-primary)",
                  }}
                >
                  {isCurrent ? "Current plan" : loadingPlan === plan.key ? "Redirecting…" : plan.key === "free" ? "Get started" : "Choose " + plan.name}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
