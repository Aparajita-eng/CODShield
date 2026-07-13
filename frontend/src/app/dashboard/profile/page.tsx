"use client";

import { useEffect, useState } from "react";
import DashboardModuleShell from "@/components/DashboardModuleShell";
import { User, Loader2 } from "lucide-react";

interface MerchantProfile {
  name: string;
  tier: string;
  contactEmail?: string;
  businessAddress?: string;
  id: string;
}

export default function ProfilePage() {
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/data")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.selectedMerchant) {
          setMerchant(d.selectedMerchant);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!merchant?.id) return;

    // Get user email from session via auth endpoint
    fetch(`/api/settings/team?merchantId=${merchant.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.team?.length) {
          setUserEmail(d.team[0].email ?? "");
        }
      })
      .catch(() => {});
  }, [merchant?.id]);

  return (
    <DashboardModuleShell
      title="Profile"
      description="Your merchant account details and team membership."
      icon={User}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-ink-secondary text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading profile...
        </div>
      ) : (
        <div className="border border-border-default bg-bg-raised rounded-xl p-6 space-y-4 max-w-lg">
          <div>
            <span className="text-xs text-ink-tertiary uppercase">Company</span>
            <p className="text-sm font-semibold text-ink-primary mt-1">
              {merchant?.name ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-ink-tertiary uppercase">Account tier</span>
            <p className="text-sm font-semibold text-ink-primary mt-1">
              {merchant?.tier ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-ink-tertiary uppercase">Contact email</span>
            <p className="text-sm font-semibold text-ink-primary mt-1">
              {userEmail || merchant?.contactEmail || "—"}
            </p>
          </div>
          {merchant?.businessAddress && (
            <div>
              <span className="text-xs text-ink-tertiary uppercase">Business address</span>
              <p className="text-sm font-semibold text-ink-primary mt-1">
                {merchant.businessAddress}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs text-ink-tertiary uppercase">Merchant ID</span>
            <p className="text-xs font-mono text-ink-tertiary mt-1 break-all">
              {merchant?.id ?? "—"}
            </p>
          </div>
        </div>
      )}
    </DashboardModuleShell>
  );
}
