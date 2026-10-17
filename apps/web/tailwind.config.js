/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        guardian: {
          bg: "#0B0F17",         // Deep navy/charcoal background
          surface: "#121824",    // Card background
          surfaceHover: "#1A2332",
          border: "#1E293B",     // Subtle border
          accent: "#10B981",     // Emerald teal for success / verified
          accentMuted: "rgba(16, 185, 129, 0.15)",
          warning: "#F59E0B",    // Amber for approval required / warning
          warningMuted: "rgba(245, 158, 11, 0.15)",
          danger: "#EF4444",     // Red for blocked / rejection
          dangerMuted: "rgba(239, 68, 68, 0.15)",
          textPrimary: "#F8FAFC",
          textSecondary: "#94A3B8",
          textMuted: "#64748B"
        }
      }
    },
  },
  plugins: [],
}
