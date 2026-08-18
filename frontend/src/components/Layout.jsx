import { useAuth } from "./AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Layout({ children }) {
  const { officer, logoutOfficer } = useAuth();
  const navigate = useNavigate();

  const navStyle = ({ isActive }) => ({
    padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
    color: isActive ? "#E6F1FB" : "#85B7EB",
    background: isActive ? "#1B3A6B" : "transparent",
    transition: "all 0.15s", textDecoration: "none",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ background: "#0C1A2E", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, background: "#1B3A6B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🛡️</div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#E6F1FB" }}>GateKeeper</span>
          </div>
          <nav style={{ display: "flex", gap: 2 }}>
            <NavLink to="/dashboard" style={navStyle}>Dashboard</NavLink>
            <NavLink to="/checkin"   style={navStyle}>Check In</NavLink>
            <NavLink to="/log"       style={navStyle}>Log</NavLink>
            <NavLink to="/prereg"    style={navStyle}>Pre-reg</NavLink>
            <NavLink to="/blacklist" style={navStyle}>🚫 Blacklist</NavLink>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle style={{ background: "#1B3A6B", border: "none", color: "#85B7EB" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#1B3A6B", borderRadius: 6, padding: "5px 10px" }}>
            <span style={{ fontSize: 12, color: "#E6F1FB", fontWeight: 500 }}>{officer?.name}</span>
            <span style={{ fontSize: 11, color: "#5B7FA6" }}>·</span>
            <span style={{ fontSize: 11, color: "#85B7EB" }}>{officer?.badge_id}</span>
          </div>
          <button onClick={() => logoutOfficer()} style={{ background: "none", border: "1px solid #1B3A6B", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#85B7EB", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </header>
      <main style={{ flex: 1, background: "var(--bg-page)" }}>{children}</main>
    </div>
  );
}
