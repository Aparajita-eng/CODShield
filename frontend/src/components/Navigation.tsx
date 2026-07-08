"use client";
import Link from "next/navigation";
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
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border-subtle glass">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 shrink-0 select-none">
          {/* SVG Shield Emblem */}
          <svg width="34" height="34" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path
              d="M13 1.5L23.5 6V13C23.5 19.2 19.2 23.8 13 24.9C6.8 23.8 2.5 19.2 2.5 13V6L13 1.5Z"
              stroke="var(--accent)"
              strokeWidth="2"
              fill="var(--accent-muted)"
            />
            <path
              d="M8.5 13.2L11.4 16.1L17.6 9.6"
              stroke="var(--ink-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Brand Text Stack in the style of Veriton AI logo text */}
          <div className="flex flex-col justify-center gap-[3px]">
            <span className="font-sans font-extrabold text-[14px] tracking-[0.12em] leading-none uppercase">
              <span className="text-ink-primary">COD</span>
              <span className="text-accent">Shield</span>
            </span>
            <span className="text-[7.5px] font-bold tracking-[0.2em] text-ink-primary leading-none uppercase">
              — TRUST INFRASTRUCTURE —
            </span>
            <span className="text-[7.5px] font-semibold tracking-wider text-ink-secondary leading-none">
              Verify. Trust. <span className="text-accent">Deliver.</span>
            </span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-ink-secondary tracking-wide">
          <a
            href="/#infrastructure"
            onClick={(e) => handleScroll(e, "infrastructure")}
            className="hover:text-accent transition-colors"
          >
            INFRASTRUCTURE
          </a>
          <a
            href="/#modules"
            onClick={(e) => handleScroll(e, "modules")}
            className="hover:text-accent transition-colors"
          >
            MODULES
          </a>
          <a href="/sandbox" className="hover:text-accent transition-colors">
            SANDBOX CONSOLE
          </a>
          <a href="/dashboard" className="hover:text-accent transition-colors">
            DASHBOARD
          </a>
          <a
            href="/#pricing"
            onClick={(e) => handleScroll(e, "pricing")}
            className="hover:text-accent transition-colors"
          >
            PRICING
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="hidden sm:inline-block text-xs font-semibold text-ink-secondary hover:text-accent transition-colors"
          >
            DASHBOARD
          </a>
          <a
            href="/sandbox"
            className="inline-flex items-center border border-accent bg-bg-raised text-accent hover:bg-accent hover:text-bg-base text-[10px] font-bold px-3.5 py-1.5 rounded transition-all"
          >
            TRY SANDBOX
          </a>
        </div>
      </div>
    </header>
  );
}
