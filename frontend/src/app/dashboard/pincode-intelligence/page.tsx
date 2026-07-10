"use client";

import DashboardModuleShell from "@/components/DashboardModuleShell";
import { MapPin } from "lucide-react";

export default function PincodeIntelligencePage() {
  return (
    <DashboardModuleShell
      title="Pincode Intelligence"
      description="Explore pincode-level RTO rates, risk zones, and delivery performance across India."
      icon={MapPin}
    />
  );
}
