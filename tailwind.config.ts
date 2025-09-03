import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Paleta BS27 Garage - Tema Oscuro Premium
        gold: {
          DEFAULT: "#D4AF37", // Oro principal del logo
          light: "#F4E4BC",   // Oro claro para fondos
          dark: "#B8941F",    // Oro oscuro para hover
          foreground: "#1A1A1A" // Negro para texto sobre oro
        },
        success: {
          DEFAULT: "#10B981", // Verde esmeralda elegante
          light: "#1F2937",   // Fondo oscuro con tinte verde
          foreground: "#10B981" // Verde para texto
        },
        warning: {
          DEFAULT: "#F59E0B", // Ámbar elegante
          light: "#1F2937",   // Fondo oscuro con tinte ámbar
          foreground: "#F59E0B" // Ámbar para texto
        },
        danger: {
          DEFAULT: "#EF4444", // Rojo elegante
          light: "#1F2937",   // Fondo oscuro con tinte rojo
          foreground: "#EF4444" // Rojo para texto
        },
        info: {
          DEFAULT: "#3B82F6", // Azul elegante
          light: "#1F2937",   // Fondo oscuro con tinte azul
          foreground: "#3B82F6" // Azul para texto
        },
        dark: {
          DEFAULT: "#0F0F0F", // Negro principal del logo
          light: "#1A1A1A",   // Negro claro para cards
          lighter: "#2D2D2D", // Gris oscuro para elementos
          foreground: "#FFFFFF" // Blanco para texto
        }
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
        'gradient-success': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-warning': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
        'gradient-info': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%)',
        'gradient-card': 'linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 25px -3px rgba(212, 175, 55, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'gold': '0 4px 14px 0 rgba(212, 175, 55, 0.4)',
        'success': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
        'warning': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
        'danger': '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.4)" 
          },
          "50%": { 
            boxShadow: "0 0 0 8px rgba(220, 38, 38, 0)" 
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
