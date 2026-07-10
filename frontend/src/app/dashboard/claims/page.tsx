"use client";

import DashboardModuleShell from "@/components/DashboardModuleShell";
import { FileText } from "lucide-react";

export default function ClaimsPage() {
  return (
    <DashboardModuleShell
      title="Claims"
      description="Track RTO insurance claims, courier disputes, and payout status."
      icon={FileText}
    />
  );
}
