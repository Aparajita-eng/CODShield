"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plug,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
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
    color: string;
    gradient: string;
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
    color: "#96BF48",
    gradient: "linear-gradient(135deg, #96BF48 0%, #5E9E1B 100%)",
    fields: [
      {
        key: "storeUrl",
        label: "Store URL",
        placeholder: "mystore.myshopify.com",
        required: true,
      },
      {
        key: "apiKey",
        label: "Admin API Access Token",
        placeholder: "shpat_xxxxxxxxxxxx",
        type: "password",
        required: true,
      },
    ],
  },
  WOOCOMMERCE: {
    label: "WooCommerce",
    description: "Connect your WooCommerce store via REST API",
    icon: Globe,
    color: "#7F54B3",
    gradient: "linear-gradient(135deg, #7F54B3 0%, #5B3C8A 100%)",
    fields: [
      {
        key: "storeUrl",
        label: "WordPress Site URL",
        placeholder: "https://mystore.com",
        required: true,
      },
      {
        key: "apiKey",
        label: "Consumer Key",
        placeholder: "ck_xxxxxxxxxxxx",
        required: true,
      },
      {
        key: "accessToken",
        label: "Consumer Secret",
        placeholder: "cs_xxxxxxxxxxxx",
        type: "password",
        required: true,
      },
    ],
  },
  MAGENTO: {
    label: "Magento",
    description: "Integrate with Magento 2 REST API for order ingestion",
    icon: Package,
    color: "#F26322",
    gradient: "linear-gradient(135deg, #F26322 0%, #C14A10 100%)",
    fields: [
      {
        key: "storeUrl",
        label: "Magento Base URL",
        placeholder: "https://mystore.com",
        required: true,
      },
      {
        key: "accessToken",
        label: "Access Token",
        placeholder: "Bearer token from Magento",
        type: "password",
        required: true,
      },
    ],
  },
  CUSTOM_API: {
    label: "Custom API",
    description: "Push orders from your own backend using our webhook endpoint",
    icon: Code2,
    color: "#6C5CE7",
    gradient: "linear-gradient(135deg, #6C5CE7 0%, #4B3CC8 100%)",
    fields: [
      {
        key: "apiKey",
        label: "Webhook Secret",
        placeholder: "A secret key to authenticate payloads",
        type: "password",
        required: false,
      },
    ],
  },
  DEMO: {
    label: "Demo Mode",
    description: "Pre-loaded demo orders from Acme Apparel for testing",
    icon: Zap,
    color: "#00B894",
    gradient: "linear-gradient(135deg, #00B894 0%, #00796B 100%)",
    fields: [],
  },
};

const SYNC_MODES: Record<
  IntegrationSyncMode,
  { label: string; description: string }
> = {
  REALTIME: { label: "Real-time", description: "Orders sync as they arrive" },
  SCHEDULED: {
    label: "Scheduled",
    description: "Sync runs every 15 minutes",
  },
  MANUAL: { label: "Manual", description: "Trigger sync yourself" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Connect Modal ────────────────────────────────────────────────────────────

function ConnectModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<"choose" | "configure">("choose");
  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationProvider | null>(null);
  const [syncMode, setSyncMode] = useState<IntegrationSyncMode>("REALTIME");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleProviderSelect = (p: IntegrationProvider) => {
    setSelectedProvider(p);
    setStep("configure");
    setError("");
  };

  const handleConnect = async () => {
    if (!selectedProvider) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          syncMode,
          ...formValues,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to connect integration");
      }
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const meta = selectedProvider ? PROVIDERS[selectedProvider] : null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="connect-modal"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {step === "choose" ? "Connect Integration" : `Connect ${meta?.label}`}
            </h2>
            <p className="modal-subtitle">
              {step === "choose"
                ? "Choose your ecommerce platform to get started"
                : meta?.description}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {step === "choose" ? (
            <div className="provider-grid">
              {(
                Object.entries(PROVIDERS) as [
                  IntegrationProvider,
                  (typeof PROVIDERS)[IntegrationProvider]
                ][]
              ).map(([key, p]) => {
                const Icon = p.icon;
                return (
                  <button
                    key={key}
                    className="provider-card"
                    onClick={() => handleProviderSelect(key)}
                  >
                    <div
                      className="provider-icon"
                      style={{ background: p.gradient }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="provider-info">
                      <span className="provider-name">{p.label}</span>
                      <span className="provider-desc">{p.description}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 provider-arrow" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="configure-form">
              {/* Back */}
              <button
                className="back-btn"
                onClick={() => {
                  setStep("choose");
                  setSelectedProvider(null);
                  setError("");
                }}
              >
                ← Back to providers
              </button>

              {/* Fields */}
              {meta && meta.fields.length > 0 && (
                <div className="form-fields">
                  {meta.fields.map((field) => (
                    <div key={field.key} className="form-field">
                      <label className="field-label">
                        {field.label}
                        {field.required && (
                          <span className="required-star"> *</span>
                        )}
                      </label>
                      <input
                        type={field.type || "text"}
                        className="field-input"
                        placeholder={field.placeholder}
                        value={formValues[field.key] || ""}
                        onChange={(e) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Sync Mode */}
              <div className="sync-mode-section">
                <label className="field-label">Sync Mode</label>
                <div className="sync-mode-grid">
                  {(
                    Object.entries(SYNC_MODES) as [
                      IntegrationSyncMode,
                      (typeof SYNC_MODES)[IntegrationSyncMode]
                    ][]
                  ).map(([key, mode]) => (
                    <button
                      key={key}
                      className={`sync-mode-card ${syncMode === key ? "active" : ""}`}
                      onClick={() => setSyncMode(key)}
                    >
                      <span className="sync-mode-label">{mode.label}</span>
                      <span className="sync-mode-desc">{mode.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="connect-error">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Action */}
              <button
                className="connect-btn"
                onClick={handleConnect}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 spinning" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Plug className="w-4 h-4" />
                    Connect {meta?.label}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
  syncing,
}: {
  integration: Integration;
  onSync: () => void;
  onDisconnect: () => void;
  syncing: boolean;
}) {
  const meta = PROVIDERS[integration.provider];
  const Icon = meta.icon;
  const isConnected = integration.status === "CONNECTED";

  const webhookEndpoint = `${typeof window !== "undefined" ? window.location.origin : ""}/api/sandbox/orders`;
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className={`integration-card ${isConnected ? "connected" : "disconnected"}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-provider">
          <div
            className="card-icon"
            style={{ background: meta.gradient }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="card-title">{meta.label}</h3>
            {integration.storeUrl && (
              <p className="card-url">{integration.storeUrl}</p>
            )}
          </div>
        </div>

        <div className="card-status">
          {isConnected ? (
            <span className="status-badge connected">
              <Wifi className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="status-badge disconnected">
              <WifiOff className="w-3 h-3" />
              Disconnected
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="card-stats">
        <div className="stat">
          <Package className="w-3.5 h-3.5" />
          <span className="stat-value">{integration.orderCount}</span>
          <span className="stat-label">Orders Imported</span>
        </div>
        <div className="stat">
          <Clock className="w-3.5 h-3.5" />
          <span className="stat-value">{formatRelativeTime(integration.lastSync)}</span>
          <span className="stat-label">Last Sync</span>
        </div>
        <div className="stat">
          <Zap className="w-3.5 h-3.5" />
          <span className="stat-value">
            {SYNC_MODES[integration.syncMode]?.label || integration.syncMode}
          </span>
          <span className="stat-label">Sync Mode</span>
        </div>
      </div>

      {/* Custom API webhook info */}
      {integration.provider === "CUSTOM_API" && (
        <div className="webhook-info">
          <p className="webhook-label">Webhook Endpoint</p>
          <div className="webhook-url-row">
            <code className="webhook-url">{webhookEndpoint}</code>
            <button
              className="copy-btn"
              onClick={() => handleCopy(webhookEndpoint)}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card-actions">
        {isConnected && integration.syncMode !== "REALTIME" && (
          <button
            className="action-btn sync"
            onClick={onSync}
            disabled={syncing}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "spinning" : ""}`} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        )}
        <button
          className="action-btn disconnect"
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
    <div className="empty-state">
      <div className="empty-icon">
        <Plug className="w-8 h-8" />
      </div>
      <h3 className="empty-title">No integrations connected</h3>
      <p className="empty-desc">
        Connect your ecommerce platform to automatically import COD orders and
        start the verification workflow.
      </p>
      <button className="empty-cta" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        Connect Your First Integration
      </button>

      {/* Platform logos */}
      <div className="platform-row">
        {(
          Object.entries(PROVIDERS) as [
            IntegrationProvider,
            (typeof PROVIDERS)[IntegrationProvider]
          ][]
        ).map(([key, p]) => {
          const Icon = p.icon;
          return (
            <div
              key={key}
              className="platform-badge"
              style={{ background: p.gradient }}
            >
              <Icon className="w-4 h-4 text-white" />
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

  const loadIntegrations = async () => {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (data.success) {
        setIntegrations(data.integrations || []);
      } else {
        setError(data.message || "Failed to load integrations");
      }
    } catch {
      setError("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await fetch(`/api/integrations/${id}`, { method: "POST" });
      await loadIntegrations();
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;
    await fetch(`/api/integrations/${id}`, { method: "DELETE" });
    await loadIntegrations();
  };

  const connectedCount = integrations.filter(
    (i) => i.status === "CONNECTED"
  ).length;
  const totalOrders = integrations.reduce((sum, i) => sum + i.orderCount, 0);

  return (
    <>
      <style>{`
        /* ── Layout ─────────────────────────────────── */
        .integrations-page {
          padding: 32px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Page Header ─────────────────────────────── */
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 32px;
        }
        .page-title-wrap {}
        .page-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .page-title {
          font-size: 26px;
          font-weight: 700;
          color: var(--ink-primary);
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }
        .page-subtitle {
          font-size: 14px;
          color: var(--ink-secondary);
          margin: 0;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          background: linear-gradient(135deg, var(--accent) 0%, #5a4fcf 100%);
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s, transform 0.15s;
          box-shadow: 0 4px 12px rgba(107, 99, 231, 0.35);
        }
        .add-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .add-btn:active { transform: translateY(0); }

        /* ── Summary Cards ───────────────────────────── */
        .summary-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .summary-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .summary-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .summary-icon.green { background: rgba(0, 184, 148, 0.12); color: #00b894; }
        .summary-icon.purple { background: rgba(108, 92, 231, 0.12); color: #6c5ce7; }
        .summary-icon.blue { background: rgba(9, 132, 227, 0.12); color: #0984e3; }
        .summary-value { font-size: 24px; font-weight: 700; color: var(--ink-primary); line-height: 1; }
        .summary-label { font-size: 12px; color: var(--ink-secondary); margin-top: 3px; }

        /* ── Flow Bar ────────────────────────────────── */
        .flow-bar {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 32px;
          display: flex;
          align-items: center;
          gap: 0;
          overflow-x: auto;
        }
        .flow-step {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }
        .flow-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
        }
        .flow-dot.active { background: linear-gradient(135deg, var(--accent) 0%, #5a4fcf 100%); }
        .flow-dot.inactive { background: var(--surface-2); color: var(--ink-tertiary); }
        .flow-step-label { font-size: 12px; font-weight: 500; color: var(--ink-secondary); }
        .flow-step-label.active { color: var(--ink-primary); font-weight: 600; }
        .flow-arrow { color: var(--border); padding: 0 12px; flex-shrink: 0; }

        /* ── Section Header ──────────────────────────── */
        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink-primary);
        }
        .section-count {
          font-size: 12px;
          color: var(--ink-tertiary);
        }

        /* ── Integration Card ────────────────────────── */
        .integration-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .integration-card.connected {
          border-color: rgba(0, 184, 148, 0.3);
        }
        .integration-card.connected:hover {
          box-shadow: 0 4px 24px rgba(0, 184, 148, 0.08);
        }
        .integration-card.disconnected { opacity: 0.7; }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          gap: 16px;
        }
        .card-provider { display: flex; align-items: center; gap: 14px; }
        .card-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .card-title { font-size: 16px; font-weight: 700; color: var(--ink-primary); margin: 0 0 2px; }
        .card-url { font-size: 12px; color: var(--ink-tertiary); margin: 0; }

        .status-badge {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .status-badge.connected { background: rgba(0,184,148,0.12); color: #00b894; }
        .status-badge.disconnected { background: rgba(214,48,49,0.12); color: #d63031; }

        .card-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 12px;
          background: var(--surface-2, var(--surface));
          color: var(--ink-tertiary);
          font-size: 11px;
        }
        .stat-value { font-size: 18px; font-weight: 700; color: var(--ink-primary); }
        .stat-label { text-align: center; }

        .webhook-info {
          background: var(--surface-2, rgba(108,92,231,0.06));
          border: 1px solid rgba(108,92,231,0.15);
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 16px;
        }
        .webhook-label { font-size: 11px; font-weight: 600; color: var(--ink-tertiary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .webhook-url-row { display: flex; align-items: center; gap: 8px; }
        .webhook-url { font-size: 11px; color: var(--accent); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .copy-btn { padding: 5px; border-radius: 6px; border: none; background: var(--border); color: var(--ink-secondary); cursor: pointer; display: flex; }
        .copy-btn:hover { background: var(--accent); color: white; }

        .card-actions { display: flex; gap: 10px; }
        .action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          border: 1px solid var(--border);
          cursor: pointer; transition: all 0.15s;
        }
        .action-btn.sync { background: rgba(108,92,231,0.08); color: var(--accent); border-color: rgba(108,92,231,0.2); }
        .action-btn.sync:hover { background: rgba(108,92,231,0.16); }
        .action-btn.disconnect { background: transparent; color: var(--ink-tertiary); }
        .action-btn.disconnect:hover { background: rgba(214,48,49,0.08); color: #d63031; border-color: rgba(214,48,49,0.2); }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Empty State ─────────────────────────────── */
        .empty-state {
          text-align: center;
          padding: 64px 32px;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: 20px;
        }
        .empty-icon {
          width: 64px; height: 64px;
          border-radius: 20px;
          background: rgba(108,92,231,0.1);
          color: var(--accent);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .empty-title { font-size: 18px; font-weight: 700; color: var(--ink-primary); margin: 0 0 8px; }
        .empty-desc { font-size: 14px; color: var(--ink-secondary); max-width: 380px; margin: 0 auto 24px; line-height: 1.6; }
        .empty-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 12px;
          font-size: 14px; font-weight: 600; color: white;
          background: linear-gradient(135deg, var(--accent) 0%, #5a4fcf 100%);
          border: none; cursor: pointer;
          box-shadow: 0 4px 12px rgba(107,99,231,0.35);
          margin-bottom: 32px;
          transition: opacity 0.15s;
        }
        .empty-cta:hover { opacity: 0.9; }
        .platform-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .platform-badge {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Modal ───────────────────────────────────── */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100;
          padding: 20px;
        }
        .connect-modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%; max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0,0,0,0.3);
        }
        .modal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; padding: 24px 24px 0;
        }
        .modal-title { font-size: 18px; font-weight: 700; color: var(--ink-primary); margin: 0 0 4px; }
        .modal-subtitle { font-size: 13px; color: var(--ink-secondary); margin: 0; }
        .modal-close {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid var(--border); background: transparent;
          color: var(--ink-secondary); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .modal-close:hover { background: var(--border); }
        .modal-body { padding: 24px; }

        .provider-grid { display: flex; flex-direction: column; gap: 10px; }
        .provider-card {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px; border-radius: 12px;
          border: 1px solid var(--border); background: var(--surface);
          cursor: pointer; text-align: left;
          transition: all 0.15s;
        }
        .provider-card:hover { border-color: var(--accent); background: rgba(108,92,231,0.04); }
        .provider-icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .provider-info { flex: 1; min-width: 0; }
        .provider-name { display: block; font-size: 14px; font-weight: 600; color: var(--ink-primary); margin-bottom: 2px; }
        .provider-desc { display: block; font-size: 12px; color: var(--ink-secondary); }
        .provider-arrow { color: var(--ink-tertiary); flex-shrink: 0; }

        .back-btn {
          font-size: 12px; color: var(--accent); background: none; border: none;
          cursor: pointer; padding: 0; margin-bottom: 20px; font-weight: 500;
        }
        .back-btn:hover { text-decoration: underline; }

        .form-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        .form-field {}
        .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--ink-secondary); margin-bottom: 6px; }
        .required-star { color: #d63031; }
        .field-input {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          border: 1px solid var(--border); background: var(--surface-2, var(--surface));
          color: var(--ink-primary); font-size: 13px;
          outline: none; transition: border-color 0.15s; box-sizing: border-box;
        }
        .field-input:focus { border-color: var(--accent); }

        .sync-mode-section { margin-bottom: 24px; }
        .sync-mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 8px; }
        .sync-mode-card {
          padding: 12px 10px; border-radius: 10px;
          border: 1px solid var(--border); background: var(--surface);
          cursor: pointer; text-align: center;
          transition: all 0.15s;
        }
        .sync-mode-card.active { border-color: var(--accent); background: rgba(108,92,231,0.08); }
        .sync-mode-label { display: block; font-size: 12px; font-weight: 600; color: var(--ink-primary); margin-bottom: 3px; }
        .sync-mode-desc { display: block; font-size: 10px; color: var(--ink-tertiary); line-height: 1.4; }

        .connect-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 8px;
          background: rgba(214,48,49,0.08); color: #d63031;
          font-size: 13px; margin-bottom: 16px;
        }

        .connect-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px;
          border-radius: 10px; border: none; cursor: pointer;
          font-size: 14px; font-weight: 600; color: white;
          background: linear-gradient(135deg, var(--accent) 0%, #5a4fcf 100%);
          transition: opacity 0.15s;
        }
        .connect-btn:hover { opacity: 0.9; }
        .connect-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Animations ──────────────────────────────── */
        .spinning { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Loading ─────────────────────────────────── */
        .loading-state {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; padding: 80px 0;
          color: var(--ink-secondary); font-size: 14px;
        }

        @media (max-width: 768px) {
          .integrations-page { padding: 20px 16px; }
          .page-header { flex-direction: column; }
          .summary-row { grid-template-columns: 1fr; }
          .flow-bar { display: none; }
          .card-stats { grid-template-columns: 1fr 1fr; }
          .sync-mode-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="integrations-page">
        {/* Header */}
        <div className="page-header">
          <div className="page-title-wrap">
            <div className="page-eyebrow">
              <Plug className="w-3 h-3" />
              Integrations
            </div>
            <h1 className="page-title">Platform Integrations</h1>
            <p className="page-subtitle">
              Connect your ecommerce platform to automatically import COD orders
            </p>
          </div>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Connect Integration
          </button>
        </div>

        {/* Summary */}
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-icon green">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="summary-value">{connectedCount}</div>
              <div className="summary-label">Active Connections</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon purple">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="summary-value">{totalOrders}</div>
              <div className="summary-label">Total Orders Imported</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon blue">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="summary-value">
                {integrations.filter((i) => i.syncMode === "REALTIME").length}
              </div>
              <div className="summary-label">Real-time Syncs</div>
            </div>
          </div>
        </div>

        {/* Flow Bar */}
        <div className="flow-bar">
          {[
            "Integrate Platform",
            "Import Orders",
            "Pincode Intelligence",
            "Buyer Trust Score",
            "WhatsApp Verification",
            "AI Voice Call",
            "Fraud Detection",
            "Merchant Decision",
          ].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flow-step">
                <div className={`flow-dot ${i === 0 ? "active" : "inactive"}`}>
                  {i + 1}
                </div>
                <span
                  className={`flow-step-label ${i === 0 ? "active" : ""}`}
                >
                  {step}
                </span>
              </div>
              {i < 7 && (
                <ArrowRight className="flow-arrow w-3.5 h-3.5 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Integrations List */}
        <div className="section-header">
          <h2 className="section-title">Your Integrations</h2>
          <span className="section-count">
            {integrations.length} integration
            {integrations.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw className="w-5 h-5 spinning" />
            Loading integrations…
          </div>
        ) : error ? (
          <div className="connect-error" style={{ marginBottom: 0 }}>
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        ) : integrations.length === 0 ? (
          <EmptyState onAdd={() => setShowModal(true)} />
        ) : (
          <AnimatePresence>
            {integrations.map((integration) => (
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

      {/* Connect Modal */}
      <AnimatePresence>
        {showModal && (
          <ConnectModal
            onClose={() => setShowModal(false)}
            onSuccess={loadIntegrations}
          />
        )}
      </AnimatePresence>
    </>
  );
}
