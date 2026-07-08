"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="border-t border-[#E2E8F0] bg-[#F8F9FC] py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 select-none">
              {/* SVG Shield Emblem */}
              <svg width="30" height="30" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path
                  d="M13 1.5L23.5 6V13C23.5 19.2 19.2 23.8 13 24.9C6.8 23.8 2.5 19.2 2.5 13V6L13 1.5Z"
                  stroke="#0055D4"
                  strokeWidth="2"
                  fill="rgba(0, 85, 212, 0.04)"
                />
                <path
                  d="M8.5 13.2L11.4 16.1L17.6 9.6"
                  stroke="#0A2540"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Brand Text Stack in the style of Veriton AI logo text */}
              <div className="flex flex-col justify-center gap-[2.5px]">
                <span className="font-sans font-extrabold text-[12.5px] tracking-[0.12em] leading-none uppercase">
                  <span className="text-[#0A2540]">COD</span>
                  <span className="text-[#0055D4]">Shield</span>
                </span>
                <span className="text-[6.8px] font-bold tracking-[0.2em] text-[#0A2540] leading-none uppercase">
                  — TRUST INFRASTRUCTURE —
                </span>
                <span className="text-[6.8px] font-semibold tracking-wider text-[#64748B] leading-none">
                  Verify. Trust. <span className="text-[#0055D4]">Deliver.</span>
                </span>
              </div>
            </div>
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed font-sans">
              A product of Veriton AI Technologies. Full-stack COD trust infrastructure layers for high-volume enterprise e-commerce merchants.
            </p>
          </div>

          <div>
            <span className="block text-[9px] font-mono font-semibold tracking-wider text-slate-500 uppercase mb-3">
              Infrastructure
            </span>
            <ul className="space-y-2 text-xs text-[#64748B] font-medium font-sans">
              <li>
                <Link
                  href="/#modules"
                  onClick={(e) => handleScroll(e, "modules")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  Verification Engine
                </Link>
              </li>
              <li>
                <Link
                  href="/#modules"
                  onClick={(e) => handleScroll(e, "modules")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  Trust Graph
                </Link>
              </li>
              <li>
                <Link
                  href="/#modules"
                  onClick={(e) => handleScroll(e, "modules")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  Risk Engine
                </Link>
              </li>
              <li>
                <Link
                  href="/#modules"
                  onClick={(e) => handleScroll(e, "modules")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  Claim Coverage
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="block text-[9px] font-mono font-semibold tracking-wider text-slate-500 uppercase mb-3">
              Developer
            </span>
            <ul className="space-y-2 text-xs text-[#64748B] font-medium font-sans">
              <li>
                <Link href="/sandbox" className="hover:text-[#0055D4] transition-colors">
                  Sandbox Console
                </Link>
              </li>
              <li>
                <Link
                  href="/#integrations"
                  onClick={(e) => handleScroll(e, "integrations")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  API Credentials
                </Link>
              </li>
              <li>
                <Link
                  href="/#integrations"
                  onClick={(e) => handleScroll(e, "integrations")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  Shopify Plugin
                </Link>
              </li>
              <li>
                <Link
                  href="/#integrations"
                  onClick={(e) => handleScroll(e, "integrations")}
                  className="hover:text-[#0055D4] transition-colors"
                >
                  Webhooks
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="block text-[9px] font-mono font-semibold tracking-wider text-slate-500 uppercase mb-3">
              Compliance
            </span>
            <ul className="space-y-2 text-xs text-[#64748B] font-medium font-sans">
              <li>
                <a href="#" className="hover:text-[#0055D4] transition-colors">
                  Merchant Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0055D4] transition-colors">
                  RTO Protection Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0055D4] transition-colors">
                  Fraud Detection Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0055D4] transition-colors">
                  Claim Process SLA
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-mono text-[#64748B]">
          <span>&copy; {new Date().getFullYear()} Veriton AI Technologies. All rights reserved.</span>
          <span>Trust Core · Risk Engine · Fraud Moat · Payout Guarantee</span>
        </div>
      </div>
    </footer>
  );
}
