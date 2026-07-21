import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const lora = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CODShield — COD Trust Infrastructure for E-Commerce | Veriton AI",
  description: "Verify intent, score risk, detect fraud, and protect revenue before every shipment with CODShield, a full-stack COD Trust Infrastructure layer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable} scroll-smooth h-full`}
    >
      <body className="font-sans antialiased bg-bg-base text-ink-primary min-h-full flex flex-col selection:bg-accent selection:text-bg-base relative">
        {/* SVG Fractal Noise Grain Texture Overlay */}
        <div 
          className="fixed inset-0 pointer-events-none z-10"
          style={{
            mixBlendMode: "overlay",
            opacity: 0.035,
          }}
        >
          <svg width="100%" height="100%" className="w-full h-full">
            <filter id="grain">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.9"
                numOctaves="2"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain)" />
          </svg>
        </div>

        {children}
      </body>
    </html>
  );
}
