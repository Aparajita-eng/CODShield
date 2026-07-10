"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Phone, MapPin, Clock } from "lucide-react";
import type { TrustGraphNodeData } from "@/lib/trust-graph-api";
import { getRiskColor, maskPhone } from "@/lib/dashboard-ui";

const ICONS = {
  phone: Phone,
  pincode: MapPin,
  session: Clock,
};

const TYPE_LABELS: Record<TrustGraphNodeData["nodeType"], string> = {
  phone: "Phone",
  pincode: "Pincode",
  session: "Session cluster",
};

function displayValue(data: TrustGraphNodeData, revealed: boolean): string {
  switch (data.nodeType) {
    case "phone":
      return maskPhone(data.rawValue, revealed);
    case "pincode":
      return data.rawValue;
    case "session":
      return data.label;
    default:
      return data.label;
  }
}

function TrustGraphNodeComponent({
  data,
  selected,
}: NodeProps<TrustGraphNodeData & { dimmed?: boolean; revealed?: boolean }>) {
  const Icon = ICONS[data.nodeType];
  const riskColor = getRiskColor(data.riskLevel);
  const dimmed = data.dimmed;

  return (
    <div
      className={`relative min-w-[168px] max-w-[200px] rounded-lg border bg-bg-raised px-3 py-2.5 shadow-sm transition-opacity ${
        selected ? "ring-2 ring-accent/40" : ""
      } ${dimmed ? "opacity-35" : "opacity-100"}`}
      style={{ borderColor: `${riskColor}55` }}
      title={data.nodeSubtitle}
    >
      <Handle type="target" position={Position.Top} className="!bg-border-default !w-2 !h-2" />
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-md border flex items-center justify-center shrink-0"
          style={{ borderColor: `${riskColor}40`, backgroundColor: `${riskColor}12` }}
        >
          <Icon className="w-4 h-4" style={{ color: riskColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-ink-tertiary font-semibold">
            {TYPE_LABELS[data.nodeType]}
          </p>
          <p className="text-xs font-mono text-ink-primary truncate" title={data.label}>
            {displayValue(data, Boolean(data.revealed))}
          </p>
          {data.nodeSubtitle && (
            <p className="text-[9px] leading-tight text-ink-tertiary mt-0.5 line-clamp-2">
              {data.nodeSubtitle}
            </p>
          )}
        </div>
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: riskColor }}
          title={`${data.riskLevel} risk · ${data.fraudSignalCount} signal(s)`}
        />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border-default !w-2 !h-2" />
    </div>
  );
}

export default memo(TrustGraphNodeComponent);
