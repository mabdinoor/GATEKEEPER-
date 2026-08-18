export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem", lineHeight: 1.7, color: "var(--text-primary)" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: "2rem" }}>Last updated: [add date]</p>

      <p style={{ marginBottom: "1.5rem", padding: "1rem", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 14 }}>
        ⚠️ <strong>Placeholder content.</strong> Replace with a real privacy policy before taking
        production signups. At minimum it should cover: what data is collected (company info,
        officer credentials, visitor names/ID numbers/phone numbers), why it's collected, how
        long it's retained, who it's shared with (e.g. your email provider for verification
        emails), and how someone can request deletion of their data.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>Data we collect</h2>
      <p>Company account details, officer badge/PIN credentials, and visitor check-in records including names and ID numbers.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>How we use it</h2>
      <p>To operate the visitor management system, send verification/reset emails, and generate analytics for the company.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>Third parties</h2>
      <p>List any processors here, e.g. your SMTP provider.</p>

      <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: "1.5rem", marginBottom: 8 }}>Your rights</h2>
      <p>Describe how someone can request access to, correction of, or deletion of their data.</p>
    </div>
  );
}
