/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // ─────────────────────────────────────────────
      // COLOR TOKENS
      // ─────────────────────────────────────────────
      colors: {
        // Surface
        surface: {
          base:      "#FFFFFF",   // Page background
          subtle:    "#F8F9FB",   // Cards, sidebars, code blocks
          muted:     "#F1F3F7",   // Hover states, disabled surfaces
          inverse:   "#0F172A",   // Dark surfaces (nav, hero)
        },

        // Border
        border: {
          DEFAULT:   "#E5E7EB",   // Standard divider
          strong:    "#D1D5DB",   // Prominent dividers
          focus:     "#059669",   // Focus ring
        },

        // Text
        text: {
          primary:   "#111827",   // Headlines, body
          secondary: "#4B5563",   // Supporting copy, labels
          muted:     "#9CA3AF",   // Placeholders, disabled
          inverse:   "#F9FAFB",   // Text on dark backgrounds
          accent:    "#059669",   // Brand emphasis text
        },

        // Brand – Deep Navy
        navy: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#4F46E5",
          600: "#1E3A5F",
          700: "#162D4A",
          800: "#0D2137",
          900: "#0F172A",   // Primary brand
          950: "#060D1A",
        },

        // Accent – Emerald
        emerald: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",   // Primary accent
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
        },

        // Semantic
        danger: {
          light: "#FEF2F2",
          DEFAULT: "#DC2626",
          dark:  "#B91C1C",
        },
        warning: {
          light: "#FFFBEB",
          DEFAULT: "#F59E0B",
          dark:  "#D97706",
        },
        success: {
          light: "#F0FDF4",
          DEFAULT: "#16A34A",
          dark:  "#15803D",
        },
        info: {
          light: "#EFF6FF",
          DEFAULT: "#2563EB",
          dark:  "#1D4ED8",
        },
      },

      // ─────────────────────────────────────────────
      // TYPOGRAPHY
      // ─────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        // Display / Hero
        "hero":      ["56px", { lineHeight: "1.07", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display":   ["48px", { lineHeight: "1.1",  letterSpacing: "-0.025em", fontWeight: "700" }],
        "section":   ["40px", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "heading":   ["32px", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
        "subheading":["24px", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        // Body
        "body-xl":   ["20px", { lineHeight: "1.6",  fontWeight: "400" }],
        "body-lg":   ["18px", { lineHeight: "1.65", fontWeight: "400" }],
        "body":      ["16px", { lineHeight: "1.6",  fontWeight: "400" }],
        "body-sm":   ["14px", { lineHeight: "1.55", fontWeight: "400" }],
        // Labels / UI
        "label-lg":  ["14px", { lineHeight: "1.4",  letterSpacing: "0.05em", fontWeight: "600" }],
        "label":     ["12px", { lineHeight: "1.4",  letterSpacing: "0.06em", fontWeight: "600" }],
        "caption":   ["11px", { lineHeight: "1.4",  letterSpacing: "0.04em", fontWeight: "500" }],
        "code":      ["13px", { lineHeight: "1.6",  fontWeight: "400" }],
      },
      fontWeight: {
        regular:   "400",
        medium:    "500",
        semibold:  "600",
        bold:      "700",
        extrabold: "800",
      },

      // ─────────────────────────────────────────────
      // SPACING SCALE (8-pt grid)
      // ─────────────────────────────────────────────
      spacing: {
        "0":    "0px",
        "px":   "1px",
        "0.5":  "2px",
        "1":    "4px",
        "1.5":  "6px",
        "2":    "8px",     // xs
        "2.5":  "10px",
        "3":    "12px",    // sm
        "4":    "16px",    // md
        "5":    "20px",
        "6":    "24px",    // lg
        "7":    "28px",
        "8":    "32px",    // xl
        "9":    "36px",
        "10":   "40px",    // 2xl
        "11":   "44px",
        "12":   "48px",    // 3xl
        "14":   "56px",
        "16":   "64px",
        "18":   "72px",
        "20":   "80px",
        "24":   "96px",
        "28":   "112px",
        "32":   "128px",
        "36":   "144px",
        "40":   "160px",
        "44":   "176px",
        "48":   "192px",
        "56":   "224px",
        "64":   "256px",
        "72":   "288px",
        "80":   "320px",
        "96":   "384px",
        // Semantic layout tokens
        "section":  "120px",   // Vertical section padding
        "container":"80px",    // Horizontal container padding
      },

      // ─────────────────────────────────────────────
      // BORDER RADIUS
      // ─────────────────────────────────────────────
      borderRadius: {
        "none":  "0",
        "xs":    "4px",
        "sm":    "6px",
        "DEFAULT":"8px",
        "md":    "10px",
        "lg":    "12px",    // Primary radius
        "xl":    "16px",
        "2xl":   "20px",
        "3xl":   "24px",
        "full":  "9999px",
      },

      // ─────────────────────────────────────────────
      // SHADOWS – Very subtle
      // ─────────────────────────────────────────────
      boxShadow: {
        "none":   "none",
        "xs":     "0 1px 2px 0 rgba(0,0,0,0.04)",
        "sm":     "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)",
        "DEFAULT":"0 2px 8px 0 rgba(0,0,0,0.06), 0 1px 3px -1px rgba(0,0,0,0.04)",
        "md":     "0 4px 12px 0 rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
        "lg":     "0 8px 24px 0 rgba(0,0,0,0.08), 0 4px 8px -4px rgba(0,0,0,0.05)",
        "xl":     "0 16px 40px 0 rgba(0,0,0,0.09), 0 6px 12px -6px rgba(0,0,0,0.05)",
        "2xl":    "0 24px 64px 0 rgba(0,0,0,0.10), 0 8px 20px -8px rgba(0,0,0,0.06)",
        // Brand shadows
        "navy":   "0 4px 16px 0 rgba(15,23,42,0.16)",
        "emerald":"0 4px 16px 0 rgba(5,150,105,0.18)",
        // Focus ring
        "focus-ring": "0 0 0 3px rgba(5,150,105,0.2)",
        "focus-navy": "0 0 0 3px rgba(15,23,42,0.15)",
        // Inset
        "inset-xs":   "inset 0 1px 2px 0 rgba(0,0,0,0.05)",
        "inset-sm":   "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
      },

      // ─────────────────────────────────────────────
      // BREAKPOINTS
      // ─────────────────────────────────────────────
      screens: {
        "xs":   "375px",
        "sm":   "640px",
        "md":   "768px",
        "lg":   "1024px",
        "xl":   "1280px",
        "2xl":  "1440px",
        "3xl":  "1920px",
      },

      // ─────────────────────────────────────────────
      // TRANSITIONS
      // ─────────────────────────────────────────────
      transitionDuration: {
        "75":  "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
        "700": "700ms",
      },
      transitionTimingFunction: {
        "ease-out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "ease-in-out":   "cubic-bezier(0.4, 0, 0.2, 1)",
        "spring":        "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      // ─────────────────────────────────────────────
      // Z-INDEX
      // ─────────────────────────────────────────────
      zIndex: {
        "below":   "-1",
        "base":    "0",
        "raised":  "10",
        "dropdown":"100",
        "sticky":  "200",
        "overlay": "300",
        "modal":   "400",
        "popover": "500",
        "toast":   "600",
        "tooltip": "700",
      },

      // ─────────────────────────────────────────────
      // ANIMATIONS – Subtle only
      // ─────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%":   { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "spinner": {
          "to": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in":        "fade-in 200ms ease-out",
        "fade-up":        "fade-up 250ms ease-out",
        "fade-down":      "fade-down 250ms ease-out",
        "slide-in-right": "slide-in-right 250ms ease-out",
        "slide-in-left":  "slide-in-left 250ms ease-out",
        "scale-in":       "scale-in 200ms ease-out",
        "pulse-soft":     "pulse-soft 2s ease-in-out infinite",
        "shimmer":        "shimmer 1.8s linear infinite",
        "spinner":        "spinner 700ms linear infinite",
      },

      // ─────────────────────────────────────────────
      // MAX WIDTHS – Layout containers
      // ─────────────────────────────────────────────
      maxWidth: {
        "xs":    "320px",
        "sm":    "480px",
        "md":    "640px",
        "lg":    "768px",
        "xl":    "1024px",
        "2xl":   "1200px",
        "prose": "68ch",
        "site":  "1440px",
      },
    },
  },
  plugins: [],
};
