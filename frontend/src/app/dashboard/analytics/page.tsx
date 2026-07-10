"use client";

import DashboardModuleShell from "@/components/DashboardModuleShell";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <DashboardModuleShell
      title="Analytics"
      description="Review RTO trends, verification pass rates, and regional risk breakdowns."
      icon={BarChart3}
    />
  );
}
