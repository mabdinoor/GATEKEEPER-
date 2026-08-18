export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem", lineHeight: 1.7, color: "var(--text-primary)" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: "2rem" }}>Last updated: [add date]</p>

      <p style={{ marginBottom: "1.5rem", padding: "1rem", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 14 }}>
        ⚠️ <strong>Placeholder content.</strong> This page is a stand-in so the signup flow has
        somewhere to link to. Replace this with real Terms of Service reviewed by a lawyer
        before taking real customer signups — GateKeeper handles visitor names and ID numbers,
        which is personal data subject to privacy law in most jurisdictions.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>1. Acceptance of terms</h2>
      <p>By creating an account, you agree to these Terms of Service and our Privacy Policy.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>2. Your data</h2>
      <p>Describe what visitor/officer/company data is collected, how long it's retained, and who can access it.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>3. Acceptable use</h2>
      <p>Describe prohibited uses of the platform.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>4. Termination</h2>
      <p>Describe under what conditions accounts may be suspended or terminated.</p>
    </div>
  );
}
