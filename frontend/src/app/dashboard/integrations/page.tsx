"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plug,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Plus,
  X,
  ShoppingBag,
  Globe,
  Code2,
  Zap,
  ChevronRight,
  ArrowRight,
  Package,
  Clock,
  Wifi,
  WifiOff,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntegrationProvider =
  | "SHOPIFY"
  | "WOOCOMMERCE"
  | "MAGENTO"
  | "CUSTOM_API"
  | "DEMO";
type IntegrationStatus = "CONNECTED" | "DISCONNECTED" | "ERROR" | "PENDING";
type IntegrationSyncMode = "REALTIME" | "SCHEDULED" | "MANUAL";

interface Integration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  syncMode: IntegrationSyncMode;
  storeUrl: string | null;
  lastSync: string | null;
  orderCount: number;
  createdAt: string;
}

// ─── Provider Metadata ────────────────────────────────────────────────────────

const PROVIDERS: Record<
  IntegrationProvider,
  {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    fields: {
      key: string;
      label: string;
      placeholder: string;
      type?: string;
      required?: boolean;
    }[];
  }
> = {
  SHOPIFY: {
    label: "Shopify",
    description: "Import COD orders from your Shopify store automatically",
    icon: ShoppingBag,
    iconBg: "rgba(5, 150, 105, 0.10)",
    iconColor: "#059669",
    fields: [
      { key: "storeUrl", label: "Store URL", placeholder: "mystore.myshopify.com", required: true },
      { key: "apiKey", label: "Admin API Access Token", placeholder: "shpat_xxxxxxxxxxxx", type: "password", required: true },
    ],
  },
  WOOCOMMERCE: {
    label: "WooCommerce",
    description: "Connect your WooCommerce store via REST API",
    icon: Globe,
    iconBg: "rgba(5, 150, 105, 0.10)",
    iconColor: "#059669",
    fields: [
      { key: "storeUrl", label: "WordPress Site URL", placeholder: "https://mystore.com", required: true },
      { key: "apiKey", label: "Consumer Key", placeholder: "ck_xxxxxxxxxxxx", required: true },
      { key: "accessToken", label: "Consumer Secret", placeholder: "cs_xxxxxxxxxxxx", type: "password", required: true },
    ],
  },
  MAGENTO: {
    label: "Magento",
    description: "Integrate with Magento 2 REST API for order ingestion",
    icon: Package,
    iconBg: "rgba(5, 150, 105, 0.10)",
    iconColor: "#059669",
    fields: [
      { key: "storeUrl", label: "Magento Base URL", placeholder: "https://mystore.com", required: true },
      { key: "accessToken", label: "Access Token", placeholder: "Bearer token from Magento", type: "password", required: true },
    ],
  },
  CUSTOM_API: {
    label: "Custom API",
    description: "Push orders from your own backend using our webhook endpoint",
    icon: Code2,
    iconBg: "rgba(5, 150, 105, 0.10)",
    iconColor: "#059669",
    fields: [
      { key: "apiKey", label: "Webhook Secret", placeholder: "A secret key to authenticate payloads", type: "password", required: false },
    ],
  },
  DEMO: {
    label: "Demo Mode",
    description: "Pre-loaded demo orders from Acme Apparel for testing",
    icon: Zap,
    iconBg: "rgba(5, 150, 105, 0.10)",
    iconColor: "#059669",
    fields: [],
  },
};

const SYNC_MODES: Record<IntegrationSyncMode, { label: string; description: string }> = {
  REALTIME: { label: "Real-time", description: "Orders sync as they arrive" },
  SCHEDULED: { label: "Scheduled", description: "Sync every 15 minutes" },
  MANUAL: { label: "Manual", description: "Trigger sync yourself" },
};

const FLOW_STEPS = [
  "Integrate Platform",
  "Import Orders",
  "Pincode Intelligence",
  "Buyer Trust Score",
  "WhatsApp Verification",
  "AI Voice Call",
  "Fraud Detection",
  "Merchant Decision",
];

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Connect Modal ────────────────────────────────────────────────────────────

function ConnectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"choose" | "configure">("choose");
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [syncMode, setSyncMode] = useState<IntegrationSyncMode>("REALTIME");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const meta = selectedProvider ? PROVIDERS[selectedProvider] : null;

  const handleConnect = async () => {
    if (!selectedProvider) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, syncMode, ...formValues }),
      });
      const data = await res.json();
      if (data.success) { onSuccess(); onClose(); }
      else setError(data.message || "Failed to connect integration");
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cs-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        className="cs-modal"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18 }}
      >
        <div className="cs-modal-header">
          <div>
            <h2 className="cs-modal-title">
              {step === "choose" ? "Connect Integration" : `Connect ${meta?.label}`}
            </h2>
            <p className="cs-modal-subtitle">
              {step === "choose" ? "Choose your ecommerce platform" : meta?.description}
            </p>
          </div>
          <button className="cs-icon-btn" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="cs-modal-body">
          {step === "choose" ? (
            <div className="cs-provider-list">
              {(Object.entries(PROVIDERS) as [IntegrationProvider, typeof PROVIDERS[IntegrationProvider]][]).map(([key, p]) => {
                const Icon = p.icon;
                return (
                  <button key={key} className="cs-provider-row" onClick={() => { setSelectedProvider(key); setStep("configure"); setError(""); }}>
                    <div className="cs-provider-icon-wrap" style={{ background: p.iconBg, color: p.iconColor }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="cs-provider-text">
                      <span className="cs-provider-name">{p.label}</span>
                      <span className="cs-provider-desc">{p.description}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 cs-chevron" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <button className="cs-back-link" onClick={() => { setStep("choose"); setSelectedProvider(null); setError(""); }}>
                ← Back to providers
              </button>

              {meta && meta.fields.length > 0 && (
                <div className="cs-form-fields">
                  {meta.fields.map((field) => (
                    <div key={field.key} className="cs-field">
                      <label className="cs-label">
                        {field.label}{field.required && <span className="cs-required"> *</span>}
                      </label>
                      <input
                        type={field.type || "text"}
                        className="cs-input"
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ""}
                        onChange={(e) => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="cs-field" style={{ marginBottom: 24 }}>
                <label className="cs-label">Sync Mode</label>
                <div className="cs-sync-grid">
                  {(Object.entries(SYNC_MODES) as [IntegrationSyncMode, typeof SYNC_MODES[IntegrationSyncMode]][]).map(([key, mode]) => (
                    <button
                      key={key}
                      className={`cs-sync-card ${syncMode === key ? "cs-sync-active" : ""}`}
                      onClick={() => setSyncMode(key)}
                    >
                      {syncMode === key && <CheckCircle2 className="w-3 h-3 cs-sync-check" />}
                      <span className="cs-sync-label">{mode.label}</span>
                      <span className="cs-sync-desc">{mode.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="cs-error-box">
                  <AlertTriangle className="w-4 h-4" />{error}
                </div>
              )}

              <button className="cs-primary-btn" onClick={handleConnect} disabled={loading}>
                {loading ? <><RefreshCw className="w-4 h-4 cs-spin" /> Connecting…</> : <><Plug className="w-4 h-4" /> Connect {meta?.label}</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({ integration, onSync, onDisconnect, syncing }: {
  integration: Integration;
  onSync: () => void;
  onDisconnect: () => void;
  syncing: boolean;
}) {
  const meta = PROVIDERS[integration.provider];
  const Icon = meta.icon;
  const isConnected = integration.status === "CONNECTED";
  const [copied, setCopied] = useState(false);

  const webhookEndpoint = `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001"}/api/sandbox/orders/risk-check`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className={`cs-card ${isConnected ? "cs-card-connected" : "cs-card-disconnected"}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="cs-card-top">
        <div className="cs-card-provider">
          <div className="cs-card-icon" style={{ background: meta.iconBg, color: meta.iconColor }}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="cs-card-name">{meta.label}</h3>
            {integration.storeUrl && <p className="cs-card-url">{integration.storeUrl}</p>}
          </div>
        </div>
        <span className={`cs-badge ${isConnected ? "cs-badge-connected" : "cs-badge-disconnected"}`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="cs-stats-row">
        <div className="cs-stat">
          <Package className="w-3.5 h-3.5 cs-stat-icon" />
          <span className="cs-stat-val">{integration.orderCount}</span>
          <span className="cs-stat-lbl">Orders Imported</span>
        </div>
        <div className="cs-stat-div" />
        <div className="cs-stat">
          <Clock className="w-3.5 h-3.5 cs-stat-icon" />
          <span className="cs-stat-val">{formatRelativeTime(integration.lastSync)}</span>
          <span className="cs-stat-lbl">Last Sync</span>
        </div>
        <div className="cs-stat-div" />
        <div className="cs-stat">
          <Zap className="w-3.5 h-3.5 cs-stat-icon" />
          <span className="cs-stat-val">{SYNC_MODES[integration.syncMode]?.label}</span>
          <span className="cs-stat-lbl">Sync Mode</span>
        </div>
      </div>

      {integration.provider === "CUSTOM_API" && (
        <div className="cs-webhook-box">
          <p className="cs-webhook-label">Webhook Endpoint</p>
          <div className="cs-webhook-row">
            <code className="cs-webhook-url">{webhookEndpoint}</code>
            <button className="cs-copy-btn" onClick={() => handleCopy(webhookEndpoint)}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="cs-webhook-hint">
            Pass your API key as <code>X-Api-Key</code> header. Demo key:{" "}
            <code className="cs-key-inline">codshield_live_acme_growth_9843</code>
          </p>
        </div>
      )}

      <div className="cs-card-actions">
        {isConnected && integration.syncMode !== "REALTIME" && (
          <button className="cs-action-sync" onClick={onSync} disabled={syncing}>
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "cs-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        )}
        <button
          className="cs-action-del"
          onClick={onDisconnect}
          disabled={integration.provider === "DEMO"}
          title={integration.provider === "DEMO" ? "Cannot disconnect demo integration" : ""}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="cs-empty">
      <div className="cs-empty-icon"><Plug className="w-6 h-6" /></div>
      <h3 className="cs-empty-title">No integrations connected</h3>
      <p className="cs-empty-desc">
        Connect your ecommerce platform to automatically import COD orders and start the verification workflow.
      </p>
      <button className="cs-primary-btn cs-empty-btn" onClick={onAdd}>
        <Plus className="w-4 h-4" /> Connect Your First Integration
      </button>
      <div className="cs-platform-row">
        {(Object.entries(PROVIDERS) as [IntegrationProvider, typeof PROVIDERS[IntegrationProvider]][]).map(([key, p]) => {
          const Icon = p.icon;
          return (
            <div key={key} className="cs-platform-dot" style={{ background: p.iconBg, color: p.iconColor }}>
              <Icon className="w-4 h-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (data.success) setIntegrations(data.integrations || []);
      else setError(data.message || "Failed to load integrations");
    } catch { setError("Failed to load integrations"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try { await fetch(`/api/integrations/${id}`, { method: "POST" }); await load(); }
    finally { setSyncingId(null); }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Disconnect this integration?")) return;
    await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    await load();
  };

  const connectedCount = integrations.filter(i => i.status === "CONNECTED").length;
  const totalOrders = integrations.reduce((s, i) => s + i.orderCount, 0);
  const realtimeCount = integrations.filter(i => i.syncMode === "REALTIME").length;

  return (
    <>
      <style>{`
        /* ── Layout ─────────── */
        .cs-page { padding: 32px; max-width: 960px; margin: 0 auto; }

        /* ── Header ─────────── */
        .cs-page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 28px; }
        .cs-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .cs-page-title { font-size: 22px; font-weight: 700; color: var(--ink-primary); margin: 0 0 4px; letter-spacing: -0.02em; }
        .cs-page-sub { font-size: 13px; color: var(--ink-secondary); margin: 0; }

        /* ── Buttons ─────────── */
        .cs-primary-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 18px; border-radius: 8px;
          font-size: 13px; font-weight: 600; color: #fff;
          background: var(--accent); border: none; cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          box-shadow: 0 1px 4px rgba(5,150,105,0.25);
        }
        .cs-primary-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .cs-primary-btn:active { transform: none; }
        .cs-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .cs-icon-btn { width: 30px; height: 30px; border-radius: 6px; border: 1px solid var(--border-default); background: transparent; color: var(--ink-tertiary); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .cs-icon-btn:hover { background: var(--bg-sunken); }

        /* ── Summary ─────────── */
        .cs-summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
        .cs-summary-card { background: #fff; border: 1px solid var(--border-default); border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; }
        .cs-summary-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: rgba(5,150,105,0.08); color: var(--accent); flex-shrink: 0; }
        .cs-summary-val { font-size: 22px; font-weight: 700; color: var(--ink-primary); line-height: 1; }
        .cs-summary-lbl { font-size: 12px; color: var(--ink-secondary); margin-top: 2px; }

        /* ── Flow bar ─────────── */
        .cs-flow { background: #fff; border: 1px solid var(--border-default); border-radius: 12px; padding: 16px 20px; margin-bottom: 28px; display: flex; align-items: center; gap: 0; overflow-x: auto; }
        .cs-flow-step { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .cs-flow-dot { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .cs-flow-dot-active { background: var(--accent); color: #fff; }
        .cs-flow-dot-inactive { background: var(--bg-sunken); color: var(--ink-tertiary); }
        .cs-flow-lbl { font-size: 11px; font-weight: 500; color: var(--ink-tertiary); }
        .cs-flow-lbl-active { color: var(--ink-primary); font-weight: 600; }
        .cs-flow-arrow { color: var(--border-strong); padding: 0 10px; flex-shrink: 0; }

        /* ── Section header ─────────── */
        .cs-section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .cs-section-title { font-size: 14px; font-weight: 600; color: var(--ink-primary); }
        .cs-section-count { font-size: 12px; color: var(--ink-tertiary); }

        /* ── Integration Card ─────────── */
        .cs-card { background: #fff; border: 1px solid var(--border-default); border-radius: 12px; padding: 20px; margin-bottom: 14px; }
        .cs-card-connected { border-color: rgba(5,150,105,0.25); }
        .cs-card-connected:hover { box-shadow: 0 2px 16px rgba(5,150,105,0.07); }
        .cs-card-disconnected { opacity: 0.65; }

        .cs-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
        .cs-card-provider { display: flex; align-items: center; gap: 12px; }
        .cs-card-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cs-card-name { font-size: 15px; font-weight: 700; color: var(--ink-primary); margin: 0 0 2px; }
        .cs-card-url { font-size: 11px; color: var(--ink-tertiary); margin: 0; }

        .cs-badge { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
        .cs-badge-connected { background: rgba(5,150,105,0.08); color: var(--accent); }
        .cs-badge-disconnected { background: rgba(220,38,38,0.08); color: var(--negative); }

        .cs-stats-row { display: flex; align-items: center; background: var(--bg-raised); border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
        .cs-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 12px 10px; }
        .cs-stat-div { width: 1px; height: 36px; background: var(--border-default); flex-shrink: 0; }
        .cs-stat-icon { color: var(--ink-tertiary); }
        .cs-stat-val { font-size: 16px; font-weight: 700; color: var(--ink-primary); }
        .cs-stat-lbl { font-size: 10px; color: var(--ink-tertiary); text-align: center; }

        .cs-webhook-box { background: var(--bg-sunken); border: 1px solid var(--border-default); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
        .cs-webhook-label { font-size: 10px; font-weight: 700; color: var(--ink-tertiary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 7px; }
        .cs-webhook-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .cs-webhook-url { font-size: 11px; font-family: monospace; color: var(--accent); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cs-copy-btn { padding: 4px 6px; border-radius: 5px; border: 1px solid var(--border-default); background: #fff; color: var(--ink-tertiary); cursor: pointer; display: flex; align-items: center; transition: all 0.15s; }
        .cs-copy-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
        .cs-webhook-hint { font-size: 11px; color: var(--ink-tertiary); margin: 0; }
        .cs-key-inline { font-family: monospace; font-size: 11px; background: #fff; border: 1px solid var(--border-default); border-radius: 4px; padding: 1px 5px; color: var(--ink-primary); }

        .cs-card-actions { display: flex; gap: 8px; }
        .cs-action-sync { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; color: var(--accent); background: rgba(5,150,105,0.06); border: 1px solid rgba(5,150,105,0.2); cursor: pointer; transition: all 0.15s; }
        .cs-action-sync:hover { background: rgba(5,150,105,0.12); }
        .cs-action-sync:disabled { opacity: 0.4; cursor: not-allowed; }
        .cs-action-del { display: flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; color: var(--ink-tertiary); background: transparent; border: 1px solid var(--border-default); cursor: pointer; transition: all 0.15s; }
        .cs-action-del:hover { color: var(--negative); background: rgba(220,38,38,0.06); border-color: rgba(220,38,38,0.2); }
        .cs-action-del:disabled { opacity: 0.3; cursor: not-allowed; }

        /* ── Empty State ─────────── */
        .cs-empty { text-align: center; padding: 56px 32px; background: #fff; border: 1px dashed var(--border-strong); border-radius: 12px; }
        .cs-empty-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(5,150,105,0.08); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
        .cs-empty-title { font-size: 16px; font-weight: 700; color: var(--ink-primary); margin: 0 0 8px; }
        .cs-empty-desc { font-size: 13px; color: var(--ink-secondary); max-width: 360px; margin: 0 auto 20px; line-height: 1.6; }
        .cs-empty-btn { margin-bottom: 24px; }
        .cs-platform-row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .cs-platform-dot { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }

        /* ── Modal ─────────── */
        .cs-modal-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.45); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .cs-modal { background: #fff; border: 1px solid var(--border-default); border-radius: 14px; width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; box-shadow: 0 16px 48px rgba(17,24,39,0.14); }
        .cs-modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 22px 22px 0; }
        .cs-modal-title { font-size: 16px; font-weight: 700; color: var(--ink-primary); margin: 0 0 3px; }
        .cs-modal-subtitle { font-size: 12px; color: var(--ink-secondary); margin: 0; }
        .cs-modal-body { padding: 20px 22px 22px; }

        .cs-provider-list { display: flex; flex-direction: column; gap: 8px; }
        .cs-provider-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--border-default); background: #fff; cursor: pointer; text-align: left; transition: all 0.15s; }
        .cs-provider-row:hover { border-color: var(--accent); background: rgba(5,150,105,0.03); }
        .cs-provider-icon-wrap { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cs-provider-text { flex: 1; min-width: 0; }
        .cs-provider-name { display: block; font-size: 13px; font-weight: 600; color: var(--ink-primary); margin-bottom: 1px; }
        .cs-provider-desc { display: block; font-size: 11px; color: var(--ink-tertiary); }
        .cs-chevron { color: var(--ink-tertiary); flex-shrink: 0; }

        .cs-back-link { font-size: 12px; color: var(--accent); background: none; border: none; cursor: pointer; padding: 0; margin-bottom: 18px; font-weight: 500; display: block; }
        .cs-back-link:hover { text-decoration: underline; }

        .cs-form-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
        .cs-field {}
        .cs-label { display: block; font-size: 12px; font-weight: 600; color: var(--ink-secondary); margin-bottom: 5px; }
        .cs-required { color: var(--negative); }
        .cs-input { width: 100%; padding: 9px 12px; border-radius: 7px; border: 1px solid var(--border-default); background: #fff; color: var(--ink-primary); font-size: 13px; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
        .cs-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(5,150,105,0.08); }

        .cs-sync-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 7px; }
        .cs-sync-card { position: relative; padding: 10px 8px; border-radius: 8px; border: 1px solid var(--border-default); background: #fff; cursor: pointer; text-align: center; transition: all 0.15s; }
        .cs-sync-active { border-color: var(--accent); background: rgba(5,150,105,0.05); }
        .cs-sync-check { position: absolute; top: 6px; right: 6px; color: var(--accent); }
        .cs-sync-label { display: block; font-size: 12px; font-weight: 600; color: var(--ink-primary); margin-bottom: 2px; }
        .cs-sync-desc { display: block; font-size: 10px; color: var(--ink-tertiary); line-height: 1.4; }

        .cs-error-box { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 7px; background: rgba(220,38,38,0.06); color: var(--negative); font-size: 12px; margin-bottom: 14px; border: 1px solid rgba(220,38,38,0.15); }

        /* ── Utility ─────────── */
        .cs-spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .cs-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 64px 0; color: var(--ink-tertiary); font-size: 13px; }

        @media (max-width: 768px) {
          .cs-page { padding: 20px 16px; }
          .cs-page-header { flex-direction: column; }
          .cs-summary-row { grid-template-columns: 1fr; }
          .cs-flow { display: none; }
          .cs-sync-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cs-page">
        {/* Header */}
        <div className="cs-page-header">
          <div>
            <div className="cs-eyebrow"><Plug className="w-3 h-3" />Integrations</div>
            <h1 className="cs-page-title">Platform Integrations</h1>
            <p className="cs-page-sub">Connect your ecommerce platform to automatically import COD orders</p>
          </div>
          <button className="cs-primary-btn" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Connect Integration
          </button>
        </div>

        {/* Summary */}
        <div className="cs-summary-row">
          <div className="cs-summary-card">
            <div className="cs-summary-icon"><CheckCircle2 className="w-5 h-5" /></div>
            <div><div className="cs-summary-val">{connectedCount}</div><div className="cs-summary-lbl">Active Connections</div></div>
          </div>
          <div className="cs-summary-card">
            <div className="cs-summary-icon"><Package className="w-5 h-5" /></div>
            <div><div className="cs-summary-val">{totalOrders}</div><div className="cs-summary-lbl">Orders Imported</div></div>
          </div>
          <div className="cs-summary-card">
            <div className="cs-summary-icon"><Zap className="w-5 h-5" /></div>
            <div><div className="cs-summary-val">{realtimeCount}</div><div className="cs-summary-lbl">Real-time Syncs</div></div>
          </div>
        </div>

        {/* Flow Bar */}
        <div className="cs-flow">
          {FLOW_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="cs-flow-step">
                <div className={`cs-flow-dot ${i === 0 ? "cs-flow-dot-active" : "cs-flow-dot-inactive"}`}>{i + 1}</div>
                <span className={`cs-flow-lbl ${i === 0 ? "cs-flow-lbl-active" : ""}`}>{step}</span>
              </div>
              {i < FLOW_STEPS.length - 1 && <ArrowRight className="cs-flow-arrow w-3 h-3" />}
            </React.Fragment>
          ))}
        </div>

        {/* List */}
        <div className="cs-section-hdr">
          <h2 className="cs-section-title">Your Integrations</h2>
          <span className="cs-section-count">{integrations.length} integration{integrations.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <div className="cs-loading"><RefreshCw className="w-4 h-4 cs-spin" />Loading integrations…</div>
        ) : error ? (
          <div className="cs-error-box"><AlertTriangle className="w-4 h-4" />{error}</div>
        ) : integrations.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} />
        ) : (
          <AnimatePresence>
            {integrations.map(integration => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onSync={() => handleSync(integration.id)}
                onDisconnect={() => handleDisconnect(integration.id)}
                syncing={syncingId === integration.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {showModal && <ConnectModal onClose={() => setShowModal(false)} onSuccess={load} />}
      </AnimatePresence>
    </>
  );
}
