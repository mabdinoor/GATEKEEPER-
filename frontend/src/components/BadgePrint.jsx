import { useEffect, useRef } from "react";

export default function BadgePrint({ visitor, company, onClose }) {
  const now = new Date();
  const time = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const TYPE_COLORS = { work: "#378ADD", family: "#1D9E75", delivery: "#C97A1A", contractor: "#5B4FCF" };
  const TYPE_LABELS = { work: "Work Visit", family: "Family Visit", delivery: "Delivery", contractor: "Contractor" };
  const color = TYPE_COLORS[visitor.visitor_type] || "#378ADD";

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=400,height=560");
    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Visitor Badge</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Inter, sans-serif; background: #fff; }
          .badge {
            width: 340px; margin: 20px auto;
            border: 2px solid #E5E7EB; border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          }
          .top { background: #0C1A2E; padding: 20px 24px; display: flex; align-items: center; gap: 12px; }
          .logo { font-size: 24px; }
          .brand { color: #E6F1FB; font-size: 15px; font-weight: 700; }
          .brand-sub { color: #85B7EB; font-size: 11px; margin-top: 2px; }
          .type-bar { background: ${color}; padding: 8px 24px; color: #fff; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
          .body { padding: 24px; }
          .visitor-name { font-size: 26px; font-weight: 700; color: #111; line-height: 1.1; margin-bottom: 6px; }
          .id-chip { display: inline-block; background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 6px; padding: 3px 10px; font-size: 12px; font-family: monospace; color: #555; margin-bottom: 20px; }
          .info-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px; }
          .info-label { font-size: 11px; color: #9CA3AF; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 60px; flex-shrink: 0; padding-top: 1px; }
          .info-value { font-size: 13px; color: #111; font-weight: 500; }
          .footer { border-top: 1px solid #E5E7EB; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
          .footer-time { font-size: 12px; color: #6B7280; }
          .valid-badge { font-size: 11px; font-weight: 600; color: ${color}; background: ${color}18; padding: 3px 10px; border-radius: 20px; }
          @media print {
            body { margin: 0; } .badge { margin: 0; box-shadow: none; border: 2px solid #000; }
            button { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="badge">
          <div class="top">
            <div class="logo">🛡️</div>
            <div>
              <div class="brand">${company?.name || "GateKeeper"}</div>
              <div class="brand-sub">VISITOR PASS</div>
            </div>
          </div>
          <div class="type-bar">${TYPE_LABELS[visitor.visitor_type] || "Visitor"}</div>
          <div class="body">
            <div class="visitor-name">${visitor.first_name}<br/>${visitor.last_name}</div>
            <div class="id-chip">ID: ${visitor.id_number}</div>
            ${visitor.host ? `<div class="info-row"><div class="info-label">Host</div><div class="info-value">${visitor.host}</div></div>` : ""}
            ${visitor.floor ? `<div class="info-row"><div class="info-label">Floor</div><div class="info-value">${visitor.floor}</div></div>` : ""}
            <div class="info-row"><div class="info-label">Date</div><div class="info-value">${date}</div></div>
            <div class="info-row"><div class="info-label">Time in</div><div class="info-value">${time}</div></div>
          </div>
          <div class="footer">
            <div class="footer-time">Checked in at ${time}</div>
            <div class="valid-badge">✓ VALID TODAY</div>
          </div>
        </div>
        <div style="text-align:center;margin-top:16px;">
          <button onclick="window.print();window.close();" style="padding:10px 24px;background:#0C1A2E;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;">🖨️ Print badge</button>
        </div>
      </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)", padding: "2rem", width: "100%", maxWidth: 400, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>🖨️ Print visitor badge</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--text-muted)" }}>×</button>
        </div>

        {/* Badge preview */}
        <div style={{ border: `2px solid var(--border)`, borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ background: "#0C1A2E", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#E6F1FB" }}>{company?.name || "GateKeeper"}</div>
              <div style={{ fontSize: 10, color: "#85B7EB" }}>VISITOR PASS</div>
            </div>
          </div>
          <div style={{ background: color, padding: "6px 18px", color: "#fff", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {TYPE_LABELS[visitor.visitor_type] || "Visitor"}
          </div>
          <div style={{ padding: "18px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{visitor.first_name} {visitor.last_name}</div>
            <div style={{ fontSize: 11, fontFamily: "monospace", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", display: "inline-block", marginBottom: 12, color: "var(--text-secondary)" }}>ID: {visitor.id_number}</div>
            {visitor.host && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>Host: <strong style={{ color: "var(--text-primary)" }}>{visitor.host}</strong></div>}
            {visitor.floor && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 3 }}>Floor: <strong style={{ color: "var(--text-primary)" }}>{visitor.floor}</strong></div>}
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Time in: <strong style={{ color: "var(--text-primary)" }}>{time}</strong></div>
          </div>
          <div style={{ borderTop: "1px solid var(--border)", padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{date}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color, background: color + "22", padding: "2px 8px", borderRadius: 20 }}>✓ VALID TODAY</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handlePrint} style={{ flex: 1, height: 42, background: "#0C1A2E", color: "#E6F1FB", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
            🖨️ Print badge
          </button>
          <button onClick={onClose} style={{ height: 42, padding: "0 16px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
