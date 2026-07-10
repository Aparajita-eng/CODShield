"use client";

import DashboardModuleShell from "@/components/DashboardModuleShell";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardModuleShell
      title="Settings"
      description="Manage API keys, notification preferences, and merchant account configuration."
      icon={Settings}
    />
  );
}
