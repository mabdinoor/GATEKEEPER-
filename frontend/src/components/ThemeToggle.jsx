import { useTheme } from "./ThemeContext";

export default function ThemeToggle({ style = {} }) {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        width: 36, height: 36,
        borderRadius: 8,
        border: "1px solid var(--border-strong)",
        background: "var(--bg-input)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
        transition: "all 0.15s",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--bg-input)"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
