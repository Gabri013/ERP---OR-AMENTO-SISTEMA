export const designTokens = {
  colors: {
    primary: "#003D7A",
    primaryHover: "#002B52",
    primaryLight: "#E0E9FF",
    background: "#F9FAFB",
    card: "#FFFFFF",
    border: "#E5E7EB",
    success: "#15803D",
    warning: "#EA580C",
    danger: "#DC2626",
    slate: "#0F172A",
  },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
    denseTable: "12px",
    body: "14px",
    title: "24px",
  },
  spacing: {
    page: "24px",
    card: "16px",
    denseRow: "8px",
  },
  radius: {
    sm: "6px",
    md: "8px",
  },
  shadows: {
    card: "0 1px 2px rgba(15, 23, 42, 0.04)",
    panel: "0 10px 30px rgba(15, 23, 42, 0.08)",
  },
} as const;
