require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const FROM = `"GateKeeper" <${process.env.GMAIL_USER}>`;
const APP_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Verify email on signup ────────────────────────────────────────────────────
async function sendVerificationEmail(to, companyName, token) {
  const link = `${APP_URL}/company/verify?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Verify your GateKeeper account",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <div style="background:#0C1A2E;padding:24px 32px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:28px;">🛡️</span>
          <span style="font-size:18px;font-weight:700;color:#E6F1FB;">GateKeeper</span>
        </div>
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px;">Verify your email address</h2>
          <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Hi <strong>${companyName}</strong>, thanks for signing up!<br/>
            Click the button below to verify your email and activate your account.
          </p>
          <a href="${link}" style="display:inline-block;background:#0C1A2E;color:#E6F1FB;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
            Verify email address
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;line-height:1.6;">
            This link expires in <strong>24 hours</strong>. If you didn't sign up for GateKeeper, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}

// ── Password reset ─────────────────────────────────────────────────────────────
async function sendPasswordResetEmail(to, companyName, token) {
  const link = `${APP_URL}/company/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your GateKeeper password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <div style="background:#0C1A2E;padding:24px 32px;">
          <span style="font-size:28px;">🛡️</span>
          <span style="font-size:18px;font-weight:700;color:#E6F1FB;margin-left:12px;">GateKeeper</span>
        </div>
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px;">Reset your password</h2>
          <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Hi <strong>${companyName}</strong>,<br/>
            We received a request to reset your password. Click the button below to set a new one.
          </p>
          <a href="${link}" style="display:inline-block;background:#0C1A2E;color:#E6F1FB;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
            Reset password
          </a>
          <p style="color:#9CA3AF;font-size:12px;margin:24px 0 0;line-height:1.6;">
            This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  });
}



// ── Pre-registration guest invite ─────────────────────────────────────────────
async function sendPreregEmail(to, data) {
  const date = new Date(data.expected_date).toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `You're expected at ${data.company_name} on ${date}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <div style="background:#0C1A2E;padding:24px 32px;">
          <span style="font-size:28px;">🛡️</span>
          <span style="font-size:18px;font-weight:700;color:#E6F1FB;margin-left:12px;">GateKeeper</span>
        </div>
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px;">You have a visit scheduled</h2>
          <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Hi <strong>${data.first_name}</strong>, you've been pre-registered as a visitor at <strong>${data.company_name}</strong>.
          </p>
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#6B7280;padding:4px 0;width:120px;">Date</td><td style="color:#111;font-weight:500;">${date}</td></tr>
              <tr><td style="color:#6B7280;padding:4px 0;">Host</td><td style="color:#111;font-weight:500;">${data.host}</td></tr>
              ${data.floor ? `<tr><td style="color:#6B7280;padding:4px 0;">Floor</td><td style="color:#111;font-weight:500;">Floor ${data.floor}</td></tr>` : ""}
              ${data.notes ? `<tr><td style="color:#6B7280;padding:4px 0;">Notes</td><td style="color:#111;">${data.notes}</td></tr>` : ""}
            </table>
          </div>
          <p style="color:#9CA3AF;font-size:12px;line-height:1.6;">
            Please present this email or your ID at the reception desk when you arrive.
          </p>
        </div>
      </div>
    `,
  });
}

// ── Analytics report ──────────────────────────────────────────────────────────
async function sendAnalyticsReport(to, companyName, data) {
  const { period, days, since, total, checkedOut, byType, byDay, topFloors, avgDurationMins, busiestDay } = data;
  const title = period === "monthly" ? "Monthly" : "Weekly";

  const typeRows = byType.map(t => {
    const labels = { work: "Work", family: "Family", delivery: "Delivery", contractor: "Contractor" };
    return `<tr><td style="padding:4px 0;color:#6B7280;">${labels[t.visitor_type] || t.visitor_type}</td><td style="padding:4px 0;font-weight:600;color:#111;text-align:right;">${t.count}</td></tr>`;
  }).join("");

  const floorRows = topFloors.map(f =>
    `<tr><td style="padding:4px 0;color:#6B7280;">Floor ${f.floor}</td><td style="padding:4px 0;font-weight:600;color:#111;text-align:right;">${f.count}</td></tr>`
  ).join("");

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${companyName} — ${title} Visitor Report`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <div style="background:#0C1A2E;padding:24px 32px;">
          <span style="font-size:28px;">🛡️</span>
          <span style="font-size:18px;font-weight:700;color:#E6F1FB;margin-left:12px;">GateKeeper</span>
        </div>
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:700;color:#111;margin:0 0 4px;">${title} Visitor Report</h2>
          <p style="color:#6B7280;font-size:13px;margin:0 0 24px;">Last ${days} days · ${companyName}</p>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">
            ${[
              { label: "Total visitors", value: total, color: "#378ADD" },
              { label: "Checked out", value: checkedOut, color: "#1D9E75" },
              { label: "Avg. duration", value: avgDurationMins > 0 ? avgDurationMins + " min" : "—", color: "#5B4FCF" },
            ].map(s => `
              <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;border-top:3px solid ${s.color};">
                <div style="font-size:24px;font-weight:700;color:#111;">${s.value}</div>
                <div style="font-size:12px;color:#6B7280;margin-top:4px;">${s.label}</div>
              </div>`).join("")}
          </div>

          ${busiestDay ? `<p style="font-size:14px;color:#111;margin-bottom:20px;">📅 Busiest day: <strong>${new Date(busiestDay.date).toLocaleDateString("en-KE", { weekday: "long", month: "short", day: "numeric" })}</strong> with <strong>${busiestDay.count} visitors</strong></p>` : ""}

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div>
              <h3 style="font-size:13px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">By visitor type</h3>
              <table style="width:100%;font-size:14px;border-collapse:collapse;">${typeRows || "<tr><td style='color:#9CA3AF;'>No data</td></tr>"}</table>
            </div>
            <div>
              <h3 style="font-size:13px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 12px;">Top floors</h3>
              <table style="width:100%;font-size:14px;border-collapse:collapse;">${floorRows || "<tr><td style='color:#9CA3AF;'>No data</td></tr>"}</table>
            </div>
          </div>

          <p style="color:#9CA3AF;font-size:12px;margin-top:24px;border-top:1px solid #E5E7EB;padding-top:16px;">
            This report was generated by GateKeeper. Log in to your dashboard for full details.
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendPreregEmail, sendAnalyticsReport };
