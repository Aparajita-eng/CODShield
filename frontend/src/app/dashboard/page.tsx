"use client";

import { useState, useEffect } from "react";
import { Copy, Eye, EyeOff, Clock, PlusCircle } from "lucide-react";
import confetti from "canvas-confetti";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";

/** Matches the Prisma Merchant model returned by GET /api/dashboard/data */
interface Merchant {
  id: string;
  name: string;
  apiKey: string;
  tier: string;
  claimRatio: number;
  createdAt: string;
}

/** Matches the Prisma Order model returned by GET /api/dashboard/data */
interface Order {
  id: string;
  merchantId: string;
  phone: string;
  pincode: string;
  value: number;
  riskScore: number;
  protectionStatus: string;
  statusReason: string;
  createdAt: string;
}

/** Matches the Prisma Claim model (with nested order) returned by GET /api/dashboard/data */
interface Claim {
  id: string;
  orderId: string;
  order: Order;
  proofUrl: string;
  status: string;
  step: number;
  createdAt: string;
}

/** Aggregated metrics returned by GET /api/dashboard/data */
interface DashboardMetrics {
  totalOrders: number;
  protectedOrders: number;
  heldOrders: number;
  failedOrders: number;
  holdRatio: number;
  protectionRatio: number;
  claimRatio: number;
}

export default function Dashboard() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Simulated Order Form State
  const [simPhone, setSimPhone] = useState<string>("9998887776");
  const [simPincode, setSimPincode] = useState<string>("110044");
  const [simValue, setSimValue] = useState<number>(3500);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simFeedback, setSimFeedback] = useState<string>("");

  // API Key Visibility
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string>("");

  const loadDashboardData = async (merchantId: string = "", showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const url = merchantId ? `${BACKEND_URL}/api/dashboard/data?merchantId=${merchantId}` : `${BACKEND_URL}/api/dashboard/data`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMerchants(data.merchants);
        setSelectedMerchantId(data.selectedMerchant.id);
        setSelectedMerchant(data.selectedMerchant);
        setOrders(data.orders);
        setClaims(data.claims);
        setMetrics(data.metrics);
      }
    } catch {
      console.error("Failed to load dashboard data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/dashboard/data`);
        const data = await res.json();
        if (!active) return;
        if (data.success) {
          setMerchants(data.merchants);
          setSelectedMerchantId(data.selectedMerchant.id);
          setSelectedMerchant(data.selectedMerchant);
          setOrders(data.orders);
          setClaims(data.claims);
          setMetrics(data.metrics);
        }
      } catch {
        console.error("Failed to load dashboard data");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleMerchantChange = (id: string) => {
    setSelectedMerchantId(id);
    void loadDashboardData(id);
  };

  const handleCopyKey = () => {
    if (selectedMerchant) {
      navigator.clipboard.writeText(selectedMerchant.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;
    setSimLoading(true);
    setSimFeedback("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/orders/risk-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": selectedMerchant.apiKey,
        },
        body: JSON.stringify({
          phone: simPhone,
          pincode: simPincode,
          value: simValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimFeedback(`Authorized. Score: ${data.riskAssessment.score} Action: ${data.riskAssessment.action}`);
        void loadDashboardData(selectedMerchantId, false);
        confetti({ particleCount: 30, spread: 20, colors: ["#059669", "#DC2626"] });
      } else {
        setSimFeedback(`Order check failed: ${data.message}`);
      }
    } catch (_err) {
      setSimFeedback("Network error running API simulation");
    } finally {
      setSimLoading(false);
    }
  };

  const handleSubmitClaim = async (orderId: string) => {
    setClaimError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/dashboard/claim-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimError("");
        void loadDashboardData(selectedMerchantId, false);
        confetti({ particleCount: 30, spread: 20, colors: ["#059669"] });
      } else {
        setClaimError(data.message || "Failed to submit claim");
      }
    } catch {
      setClaimError("Network error submitting claim");
    }
  };

  if (loading && merchants.length === 0) {
    return (
      <div className="flex items-center justify-center text-ink-secondary font-mono text-xs h-64">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 animate-spin text-accent" />
          Loading dashboard metrics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
            Management Portal
          </span>
          <div className="flex items-center gap-3">
            <h1 className="font-sans font-bold text-xl text-ink-primary">
              Dashboard
            </h1>
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-accent border border-border-default bg-bg-raised/40 rounded px-2 py-0.5 uppercase font-semibold">
              Connected
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-ink-secondary font-sans">Active Profile:</label>
          <select
            value={selectedMerchantId}
            onChange={(e) => handleMerchantChange(e.target.value)}
            className="bg-bg-raised border border-border-default rounded px-3.5 py-1.5 text-xs text-ink-primary outline-none focus:border-accent font-mono font-semibold cursor-pointer"
          >
            {merchants.map((m) => (
              <option key={m.id} value={m.id} className="bg-bg-raised text-ink-primary">
                {m.name.toUpperCase()} ({m.tier.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* METRICS ROW */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-border-default bg-bg-raised/40 p-5 rounded">
            <span className="text-[9px] font-mono text-ink-secondary block uppercase tracking-wider font-semibold">Total Evaluated</span>
            <div className="text-2xl font-bold font-mono text-ink-primary mt-1">{metrics.totalOrders}</div>
            <div className="text-[10px] text-ink-tertiary mt-1 font-sans">Incoming check logs</div>
          </div>
          <div className="border border-border-default bg-bg-raised/40 p-5 rounded">
            <span className="text-[9px] font-mono text-ink-secondary block uppercase tracking-wider font-semibold">Protected (Approved)</span>
            <div className="text-2xl font-bold font-mono text-accent mt-1">{metrics.protectedOrders}</div>
            <div className="text-[10px] text-ink-tertiary mt-1 font-sans">{metrics.protectionRatio}% automation rate</div>
          </div>
          <div className="border border-border-default bg-bg-raised/40 p-5 rounded">
            <span className="text-[9px] font-mono text-ink-secondary block uppercase tracking-wider font-semibold">Held (Pending OTP)</span>
            <div className="text-2xl font-bold font-mono text-accent/80 mt-1">{metrics.heldOrders}</div>
            <div className="text-[10px] text-ink-tertiary mt-1 font-sans">{metrics.holdRatio}% hold thresholds</div>
          </div>
          <div className="border border-border-default bg-bg-raised/40 p-5 rounded">
            <span className="text-[9px] font-mono text-ink-secondary block uppercase tracking-wider font-semibold">Failed (Prepaid Only)</span>
            <div className="text-2xl font-bold font-mono text-negative mt-1">{metrics.failedOrders}</div>
            <div className="text-[10px] text-ink-tertiary mt-1 font-sans">{metrics.claimRatio}% claim RTO ratio</div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-8 items-start">
        <div className="space-y-8">
          {/* ORDERS LOG TABLE */}
          <div className="border border-border-default bg-bg-raised rounded p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-ink-primary">RECENT TRANSACTION LOGS</span>
              <span className="text-[9px] font-mono text-ink-tertiary uppercase">Updates live on API receipt</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink-primary">
                <thead>
                  <tr className="border-b border-border-subtle text-[9px] font-mono text-ink-tertiary uppercase font-semibold">
                    <th className="py-2.5 px-2">Reference ID</th>
                    <th className="py-2.5 px-2">Phone</th>
                    <th className="py-2.5 px-2">Pincode</th>
                    <th className="py-2.5 px-2">Value</th>
                    <th className="py-2.5 px-2 text-center">Score</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-2 text-right font-sans">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-ink-secondary font-mono text-xs">
                        No order logs recorded. Submit a simulated checkout API request.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const hasClaim = claims.some((c) => c.orderId === o.id);
                      return (
                        <tr key={o.id} className="border-b border-border-subtle/40 hover:bg-bg-base/40 font-mono text-xs">
                          <td className="py-3 px-2 text-ink-secondary">{o.id.substring(0, 8)}</td>
                          <td className="py-3 px-2">{o.phone}</td>
                          <td className="py-3 px-2">{o.pincode}</td>
                          <td className="py-3 px-2 text-ink-secondary">INR {o.value.toFixed(0)}</td>
                          <td className="py-3 px-2 text-center font-bold">
                            <span
                              className={
                                o.riskScore > 70
                                  ? "text-negative"
                                  : o.riskScore > 35
                                  ? "text-accent/80"
                                  : "text-accent"
                              }
                            >
                              {o.riskScore}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-[10px]">
                            <span
                              className={`font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                o.protectionStatus === "Protected"
                                  ? "bg-accent/15 text-accent border-accent/35"
                                  : o.protectionStatus === "Held"
                                  ? "bg-accent/10 text-accent/80 border-accent/25"
                                  : "bg-negative/15 text-negative border-negative/35"
                              }`}
                            >
                              {o.protectionStatus}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {o.protectionStatus === "Failed" && (
                              <button
                                onClick={() => handleSubmitClaim(o.id)}
                                disabled={hasClaim}
                                className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold transition-all cursor-pointer ${
                                  hasClaim
                                    ? "bg-bg-base text-ink-tertiary cursor-not-allowed border border-border-subtle"
                                    : "bg-accent hover:bg-accent/80 text-bg-base"
                                }`}
                              >
                                {hasClaim ? "CLAIMED" : "CLAIM PAYOUT"}
                              </button>
                            )}
                            {o.protectionStatus === "Protected" && (
                              <span className="text-[10px] text-accent font-mono">Guaranteed</span>
                            )}
                            {o.protectionStatus === "Held" && (
                              <span className="text-[10px] text-accent/85 font-mono font-semibold">Awaiting OTP</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIMULATED API TESTER FORM */}
          <div className="border border-border-default bg-bg-raised rounded p-6">
            <span className="text-xs font-mono font-bold text-ink-primary block mb-4 uppercase">
              SIMULATE INCOMING CHECKOUT API REQUEST (POST /api/v1/orders/risk-check)
            </span>

            <form onSubmit={handleSimulateOrder} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-mono text-ink-secondary mb-1 uppercase font-semibold">Customer Phone</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-bg-base border border-border-default rounded px-2.5 py-1.5 text-xs font-mono text-ink-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-ink-secondary mb-1 uppercase font-semibold">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={simPincode}
                    onChange={(e) => setSimPincode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-bg-base border border-border-default rounded px-2.5 py-1.5 text-xs font-mono text-ink-primary outline-none focus:border-accent"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[9px] font-mono text-ink-secondary mb-1 uppercase font-semibold">Order Value (INR)</label>
                  <input
                    type="number"
                    value={simValue}
                    onChange={(e) => setSimValue(parseInt(e.target.value) || 0)}
                    className="w-full bg-bg-base border border-border-default rounded px-2.5 py-1.5 text-xs font-mono text-ink-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  disabled={simLoading || simPhone.length !== 10 || simPincode.length !== 6}
                  className="inline-flex items-center gap-1.5 border border-accent bg-bg-base text-accent hover:bg-accent hover:text-bg-base text-[10px] px-3.5 py-2 rounded font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {simLoading ? "CHECKING..." : "DISPATCH RISK CHECK"}
                </button>
                {simFeedback && (
                  <span className="text-[10px] font-mono text-ink-secondary">{simFeedback}</span>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          {/* CREDENTIALS CARD */}
          {selectedMerchant && (
            <div className="border border-border-default bg-bg-raised/40 rounded p-6 space-y-4">
              <span className="text-xs font-mono font-bold text-ink-primary block border-b border-border-subtle pb-2 font-semibold">
                API CREDENTIALS & SERVICE CONFIG
              </span>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-ink-secondary block uppercase text-[9px]">Merchant Name</span>
                  <span className="text-ink-primary font-bold">{selectedMerchant.name.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-ink-secondary block uppercase text-[9px]">Protection Tier</span>
                  <span className="text-ink-primary font-bold">{selectedMerchant.tier}</span>
                </div>
              </div>

              <div className="space-y-2 font-sans">
                <span className="text-ink-secondary block uppercase text-[9px] font-mono font-semibold">Private Webhook Key</span>
                <div className="flex items-center gap-2 bg-bg-base border border-border-default p-2.5 rounded justify-between font-mono text-xs text-ink-primary">
                  <span className="break-all select-all">
                    {showApiKey ? selectedMerchant.apiKey : "••••••••••••••••••••••••••••••••"}
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-ink-secondary hover:text-accent transition-colors cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleCopyKey}
                      className="text-ink-secondary hover:text-accent transition-colors relative cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied && (
                        <span className="absolute -top-7 right-0 text-[9px] font-mono bg-bg-raised border border-border-default text-ink-primary rounded px-1.5 py-0.5">
                          Copied
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CLAIMS WORKFLOW */}
          <div className="border border-border-default bg-bg-raised/40 rounded">
            <span className="text-xs font-mono font-bold text-ink-primary block p-6 pb-2 border-b border-border-subtle font-semibold">
              ACTIVE PROTECTION CLAIMS
            </span>
            {claimError ? (
              <p className="px-6 pt-3 text-xs text-negative">{claimError}</p>
            ) : null}

            <div className="p-6 pt-4 space-y-4">
              {claims.length === 0 ? (
                <div className="text-xs text-ink-secondary font-mono text-center py-6">
                  No active insurance claims logged.
                </div>
              ) : (
                claims.map((c) => (
                  <div key={c.id} className="border border-border-default bg-bg-base p-3 rounded space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <span className="text-ink-secondary">Order Ref: {c.order.id.substring(0, 8)}</span>
                      <span className="text-ink-primary font-bold">INR {c.order.value.toFixed(0)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.status === "Approved"
                            ? "bg-accent"
                            : c.status === "Pending"
                            ? "bg-accent/80"
                            : "bg-negative"
                        }`}
                      ></span>
                      <span className="font-semibold text-ink-primary">Claim {c.status}</span>
                    </div>

                    {/* Display steps progress bar */}
                    <div className="grid grid-cols-4 gap-1 pt-1 h-1">
                      <div className="h-full rounded bg-accent"></div>
                      <div className={`h-full rounded ${c.step >= 2 ? "bg-accent" : "bg-border-subtle"}`}></div>
                      <div className={`h-full rounded ${c.step >= 3 ? "bg-accent" : "bg-border-subtle"}`}></div>
                      <div className={`h-full rounded ${c.step >= 4 ? "bg-accent" : "bg-border-subtle"}`}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
