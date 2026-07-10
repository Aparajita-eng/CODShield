"use client";

import Link from "next/link";
import DashboardModuleShell from "@/components/DashboardModuleShell";
import { ShieldAlert, Network, ArrowRight } from "lucide-react";

export default function FraudCenterPage() {
  return (
    <DashboardModuleShell
      title="Fraud Center"
      description="Monitor flagged identities, repeat offenders, and active fraud investigations."
      icon={ShieldAlert}
    >
      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <Link
          href="/dashboard/fraud-center/events"
          className="group flex items-start gap-4 p-5 rounded-xl border border-border-default bg-bg-raised hover:bg-bg-sunken transition-colors"
        >
          <div className="w-10 h-10 rounded-lg border border-negative/20 bg-negative/8 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-negative" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-ink-primary group-hover:text-accent transition-colors">
              Fraud Events
            </h2>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              Review detected patterns, linked orders, and investigation status for active fraud signals.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-tertiary group-hover:text-accent shrink-0 mt-1" />
        </Link>
        <Link
          href="/dashboard/fraud-center/trust-graph"
          className="group flex items-start gap-4 p-5 rounded-xl border border-border-default bg-bg-raised hover:bg-bg-sunken transition-colors"
        >
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
            <Network className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-ink-primary group-hover:text-accent transition-colors">
              Trust Graph
            </h2>
            <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
              Visualize linked phones, delivery pincodes, and checkout session clusters to surface coordinated fraud rings.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-tertiary group-hover:text-accent shrink-0 mt-1" />
        </Link>
      </div>
    </DashboardModuleShell>
  );
}
