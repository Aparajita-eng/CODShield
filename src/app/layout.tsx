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
      className={`${inter.variable} ${lora.variable} ${jetbrainsMono.variable} scroll-smooth h-full`}
    >
      <body className="font-sans antialiased bg-[#F7F5F1] text-[#1C1B19] min-h-full flex flex-col selection:bg-[#B5563C] selection:text-white">
        {children}
      </body>
    </html>
  );
}
