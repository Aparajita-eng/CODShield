"use client";

import DashboardModuleShell from "@/components/DashboardModuleShell";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <DashboardModuleShell
      title="Profile"
      description="Your merchant account details and team membership."
      icon={User}
    >
      <div className="border border-border-default bg-bg-raised rounded-xl p-6 space-y-4 max-w-lg">
        <div>
          <span className="text-xs text-ink-tertiary uppercase">Company</span>
          <p className="text-sm font-semibold text-ink-primary mt-1">FastCommerce Inc.</p>
        </div>
        <div>
          <span className="text-xs text-ink-tertiary uppercase">Account tier</span>
          <p className="text-sm font-semibold text-ink-primary mt-1">Enterprise</p>
        </div>
        <div>
          <span className="text-xs text-ink-tertiary uppercase">Contact email</span>
          <p className="text-sm font-semibold text-ink-primary mt-1">demo@codshield.com</p>
        </div>
      </div>
    </DashboardModuleShell>
  );
}
