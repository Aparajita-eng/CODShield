import type { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface DashboardModuleShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  breadcrumb?: string;
  children?: ReactNode;
}

export default function DashboardModuleShell({
  title,
  description,
  icon: Icon,
  breadcrumb = "Dashboard",
  children,
}: DashboardModuleShellProps) {
  return (
    <div className="space-y-6">
      <nav className="text-xs text-ink-tertiary">
        <Link href="/dashboard" className="hover:text-accent transition-colors">
          {breadcrumb}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-secondary">{title}</span>
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-primary">{title}</h1>
            <p className="text-sm text-ink-secondary mt-1">{description}</p>
          </div>
        </div>
      </div>

      {children ?? (
        <div className="border border-border-default bg-bg-raised rounded-xl p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-bg-sunken border border-border-default flex items-center justify-center">
            <Icon className="w-6 h-6 text-ink-tertiary" />
          </div>
          <h2 className="text-sm font-semibold text-ink-primary">No data yet</h2>
          <p className="text-sm text-ink-secondary mt-2 max-w-md mx-auto">
            This module is connected to your account but has no records to display. Data will appear here as orders and events flow through CODShield.
          </p>
        </div>
      )}
    </div>
  );
}
