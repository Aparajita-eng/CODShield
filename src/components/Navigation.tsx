"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
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
    <header className="fixed top-0 inset-x-0 z-50 border-b border-[#E2E8F0] glass">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 select-none">
          {/* SVG Shield Emblem */}
          <svg width="34" height="34" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
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
          <div className="flex flex-col justify-center gap-[3px]">
            <span className="font-sans font-extrabold text-[14px] tracking-[0.12em] leading-none uppercase">
              <span className="text-[#0A2540]">COD</span>
              <span className="text-[#0055D4]">Shield</span>
            </span>
            <span className="text-[7.5px] font-bold tracking-[0.2em] text-[#0A2540] leading-none uppercase">
              — TRUST INFRASTRUCTURE —
            </span>
            <span className="text-[7.5px] font-semibold tracking-wider text-[#64748B] leading-none">
              Verify. Trust. <span className="text-[#0055D4]">Deliver.</span>
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#64748B] tracking-wide">
          <Link
            href="/#infrastructure"
            onClick={(e) => handleScroll(e, "infrastructure")}
            className="hover:text-[#0055D4] transition-colors"
          >
            INFRASTRUCTURE
          </Link>
          <Link
            href="/#modules"
            onClick={(e) => handleScroll(e, "modules")}
            className="hover:text-[#0055D4] transition-colors"
          >
            MODULES
          </Link>
          <Link href="/sandbox" className="hover:text-[#0055D4] transition-colors">
            SANDBOX CONSOLE
          </Link>
          <Link href="/dashboard" className="hover:text-[#0055D4] transition-colors">
            DASHBOARD
          </Link>
          <Link
            href="/#pricing"
            onClick={(e) => handleScroll(e, "pricing")}
            className="hover:text-[#0055D4] transition-colors"
          >
            PRICING
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden sm:inline-block text-xs font-semibold text-[#64748B] hover:text-[#0055D4] transition-colors"
          >
            DASHBOARD
          </Link>
          <Link
            href="/sandbox"
            className="inline-flex items-center border border-[#0055D4] bg-white text-[#0055D4] hover:bg-[#0055D4] hover:text-white text-[10px] font-bold px-3.5 py-1.5 rounded transition-all"
          >
            TRY SANDBOX
          </Link>
        </div>
      </div>
    </header>
  );
}
