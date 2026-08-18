import ThemeToggle from "../components/ThemeToggle";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const C = {
  navy: "#0C1A2E", navyMid: "#1B3A6B", blue: "#378ADD",
  bluePale: "#E6F1FB", border: "#E5E7EB", muted: "#6B7280",
  red: "#E24B4A", green: "#1D9E75", greenPale: "#E1F5EE",
};

const INDUSTRIES = [
  "Technology", "Finance & Banking", "Healthcare", "Education",
  "Retail & Commerce", "Manufacturing", "Real Estate", "Government",
  "Hospitality", "Legal", "Media & Entertainment", "Logistics",
  "Construction", "Energy", "Other",
];

function Field({ label, required, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: error ? C.red : C.muted }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 12, color: C.red }}>{error}</span>}
    </div>
  );
}

const inputStyle = (error) => ({
  height: 42, border: `1px solid ${error ? C.red : C.border}`,
  borderRadius: 8, padding: "0 12px", fontSize: 14,
  fontFamily: "inherit", outline: "none", color: "var(--text-primary)",
  background: "var(--bg-card)", width: "100%", boxSizing: "border-box",
});

export default function CompanyRegisterPage() {
  const { completeRegistration, company } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    industry: "", address: "", contact_person: "", logo_url: "",
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = company info, 2 = done

  const set = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors(p => ({ ...p, logo: "Logo must be under 2MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setLogoPreview(base64);
      setForm(p => ({ ...p, logo_url: base64 }));
      setErrors(p => ({ ...p, logo: "" }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.industry) e.industry = "Please select an industry";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.contact_person.trim()) e.contact_person = "Contact person is required";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await completeRegistration(form);
      setStep(2);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--bg-page)", padding: "2rem",
      }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 200 }}>
        <ThemeToggle />
      </div>
        <div style={{
          background: "var(--bg-card)", borderRadius: 16, border: `1px solid ${C.border}`,
          padding: "3rem 2.5rem", maxWidth: 480, width: "100%",
          textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{
            width: 64, height: 64, background: C.greenPale, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 1.25rem",
          }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're all set!</h2>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: "2rem" }}>
            <strong>{company?.name}</strong> is now registered on GateKeeper.
            Head to your company dashboard to add security officers and start managing building access.
          </p>
          <button onClick={() => navigate("/company/dashboard")} style={{
            width: "100%", height: 44, background: C.navy, color: "#E6F1FB",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Go to dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", background: "var(--bg-page)",
      alignItems: "flex-start", justifyContent: "center", padding: "2rem",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: 46, height: 46, background: C.navy, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, margin: "0 auto 10px",
          }}>🛡️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Complete your company profile</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Tell us about <strong>{company?.name}</strong> to finish setting up your account.
          </p>
        </div>

        <div style={{
          background: "var(--bg-card)", borderRadius: 16, border: `1px solid ${C.border}`,
          padding: "2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          {serverError && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, color: "#B91C1C", marginBottom: "1.25rem",
            }}>⚠️ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Logo upload */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: C.muted, display: "block", marginBottom: 8 }}>
                Company logo <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 12,
                  border: `2px dashed ${errors.logo ? C.red : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", background: "var(--bg-subtle)", flexShrink: 0,
                }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 28 }}>🏢</span>
                  }
                </div>
                <div>
                  <label htmlFor="logo-upload" style={{
                    display: "inline-block", padding: "7px 14px",
                    border: `1px solid ${C.border}`, borderRadius: 8,
                    fontSize: 13, color: "#555", cursor: "pointer",
                    background: "var(--bg-subtle)",
                  }}>
                    {logoPreview ? "Change logo" : "Upload logo"}
                  </label>
                  <input id="logo-upload" type="file" accept="image/*"
                    onChange={handleLogoUpload} style={{ display: "none" }} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    PNG, JPG up to 2MB
                  </div>
                  {errors.logo && <div style={{ fontSize: 12, color: C.red }}>{errors.logo}</div>}
                </div>
              </div>
            </div>

            {/* Industry */}
            <Field label="Industry" required error={errors.industry}>
              <select value={form.industry} onChange={set("industry")} style={{ ...inputStyle(errors.industry), cursor: "pointer" }}>
                <option value="">Select your industry</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </Field>

            {/* Address */}
            <Field label="Company address" required error={errors.address}>
              <textarea
                value={form.address} onChange={set("address")}
                placeholder="Street, City, Country"
                rows={3}
                style={{
                  ...inputStyle(errors.address),
                  height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5,
                }}
              />
            </Field>

            {/* Contact person */}
            <Field label="Primary contact person" required error={errors.contact_person}>
              <input value={form.contact_person} onChange={set("contact_person")}
                placeholder="Full name of main contact" style={inputStyle(errors.contact_person)} />
            </Field>

            <button type="submit" disabled={loading} style={{
              height: 44, background: loading ? "#4a6fa0" : C.navy,
              color: "#E6F1FB", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", marginTop: 4,
            }}>
              {loading ? "Saving…" : "Complete registration →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
