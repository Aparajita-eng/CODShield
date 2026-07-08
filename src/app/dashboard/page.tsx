"use client";
import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Copy, Eye, EyeOff, Clock, PlusCircle } from "lucide-react";
import confetti from "canvas-confetti";

export default function Dashboard() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>("");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  
  const [orders, setOrders] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
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

  const fetchDashboardData = async (merchantId: string = "") => {
    setLoading(true);
    try {
      const url = merchantId ? `/api/dashboard/data?merchantId=${merchantId}` : "/api/dashboard/data";
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
    } catch (e) {
      console.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleMerchantChange = (id: string) => {
    setSelectedMerchantId(id);
    fetchDashboardData(id);
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
      const res = await fetch("/api/v1/orders/risk-check", {
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
        fetchDashboardData(selectedMerchantId);
        confetti({ particleCount: 30, spread: 20, colors: ["#0055D4", "#15803D"] });
      } else {
        setSimFeedback(`Order check failed: ${data.message}`);
      }
    } catch (err) {
      setSimFeedback("Network error running API simulation");
    } finally {
      setSimLoading(false);
    }
  };

  const handleSubmitClaim = async (orderId: string) => {
    try {
      const res = await fetch("/api/dashboard/claim-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData(selectedMerchantId);
        confetti({ particleCount: 30, spread: 20, colors: ["#0055D4"] });
      } else {
        alert(data.message || "Failed to submit claim");
      }
    } catch (e) {
      console.error("Claim request error");
    }
  };

  if (loading && merchants.length === 0) {
    return (
      <div className="flex-1 bg-[#F8F9FC] flex items-center justify-center text-[#64748B] font-mono text-xs">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 animate-spin text-[#0055D4]" />
          Loading dashboard metrics...
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />

      <main className="flex-1 bg-[#F8F9FC] text-[#0A2540] max-w-7xl mx-auto w-full px-6 lg:px-8 pt-24 pb-16">
        {/* HEADER SELECTOR */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-[#64748B] uppercase">
              Management Portal
            </span>
            <div className="flex items-center gap-3">
              <h1 className="font-serif font-bold text-2xl text-[#0A2540]">
                Merchant Dashboard
              </h1>
              <span className="flex items-center gap-1.5 text-[9px] font-mono text-[#15803D] border border-[#E2E8F0] bg-[#F1F3F7] rounded px-2 py-0.5 uppercase font-semibold">
                Connected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-[#64748B] font-sans">Active Profile:</label>
            <select
              value={selectedMerchantId}
              onChange={(e) => handleMerchantChange(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded px-3.5 py-1.5 text-xs text-[#0A2540] outline-none focus:border-[#0055D4] font-mono font-semibold"
            >
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name.toUpperCase()} ({m.tier.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* METRICS ROW */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 p-5 rounded">
              <span className="text-[9px] font-mono text-[#64748B] block uppercase tracking-wider font-semibold">Total Evaluated</span>
              <div className="text-2xl font-bold font-mono text-[#0A2540] mt-1">{metrics.totalOrders}</div>
              <div className="text-[10px] text-[#64748B] mt-1 font-sans">Incoming check logs</div>
            </div>
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 p-5 rounded">
              <span className="text-[9px] font-mono text-[#64748B] block uppercase tracking-wider font-semibold">Protected (Approved)</span>
              <div className="text-2xl font-bold font-mono text-[#15803D] mt-1">{metrics.protectedOrders}</div>
              <div className="text-[10px] text-[#64748B] mt-1 font-sans">{metrics.protectionRatio}% automation rate</div>
            </div>
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 p-5 rounded">
              <span className="text-[9px] font-mono text-[#64748B] block uppercase tracking-wider font-semibold">Held (Pending OTP)</span>
              <div className="text-2xl font-bold font-mono text-[#B45309] mt-1">{metrics.heldOrders}</div>
              <div className="text-[10px] text-[#64748B] mt-1 font-sans">{metrics.holdRatio}% hold thresholds</div>
            </div>
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 p-5 rounded">
              <span className="text-[9px] font-mono text-[#64748B] block uppercase tracking-wider font-semibold">Failed (Prepaid Only)</span>
              <div className="text-2xl font-bold font-mono text-[#B91C1C] mt-1">{metrics.failedOrders}</div>
              <div className="text-[10px] text-[#64748B] mt-1 font-sans">{metrics.claimRatio}% claim RTO ratio</div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-8 items-start">
          <div className="space-y-8">
            {/* ORDERS LOG TABLE */}
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/30 rounded p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono font-bold text-[#0A2540]">RECENT TRANSACTION LOGS</span>
                <span className="text-[9px] font-mono text-[#64748B] uppercase">Updates live on API receipt</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#0A2540]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[9px] font-mono text-[#64748B] uppercase font-semibold">
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
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-mono text-xs">
                          No order logs recorded. Submit a simulated checkout API request.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const hasClaim = claims.some((c) => c.orderId === o.id);
                        return (
                          <tr key={o.id} className="border-b border-[#E2E8F0]/60 hover:bg-[#F1F3F7]/40 font-mono text-xs">
                            <td className="py-3 px-2 text-[#64748B]">{o.id.substring(0, 8)}</td>
                            <td className="py-3 px-2">{o.phone}</td>
                            <td className="py-3 px-2">{o.pincode}</td>
                            <td className="py-3 px-2 text-[#64748B]">INR {o.value.toFixed(0)}</td>
                            <td className="py-3 px-2 text-center font-bold">
                              <span
                                className={
                                  o.riskScore > 70
                                    ? "text-[#B91C1C]"
                                    : o.riskScore > 35
                                    ? "text-[#B45309]"
                                    : "text-[#15803D]"
                                }
                              >
                                {o.riskScore}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-[10px]">
                              <span
                                className={`font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                                  o.protectionStatus === "Protected"
                                    ? "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/35"
                                    : o.protectionStatus === "Held"
                                    ? "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/35"
                                    : "bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/35"
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
                                  className={`text-[9px] px-2 py-0.5 rounded font-mono font-semibold transition-all ${
                                    hasClaim
                                      ? "bg-[#F1F3F7] text-slate-400 cursor-not-allowed"
                                      : "bg-[#0055D4] hover:bg-[#0044B3] text-white"
                                  }`}
                                >
                                  {hasClaim ? "CLAIMED" : "CLAIM PAYOUT"}
                                </button>
                              )}
                              {o.protectionStatus === "Protected" && (
                                <span className="text-[10px] text-[#15803D] font-mono">Guaranteed</span>
                              )}
                              {o.protectionStatus === "Held" && (
                                <span className="text-[10px] text-[#B45309] font-mono font-semibold">Awaiting OTP</span>
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
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/30 rounded p-6">
              <span className="text-xs font-mono font-bold text-[#0A2540] block mb-4 uppercase">
                SIMULATE INCOMING CHECKOUT API REQUEST (POST /api/v1/orders/risk-check)
              </span>

              <form onSubmit={handleSimulateOrder} className="space-y-4 font-sans text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono text-[#64748B] mb-1 uppercase font-semibold">Customer Phone</label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white border border-[#E2E8F0] rounded px-2.5 py-1.5 text-xs font-mono text-[#0A2540] outline-none focus:border-[#0055D4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-[#64748B] mb-1 uppercase font-semibold">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={simPincode}
                      onChange={(e) => setSimPincode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white border border-[#E2E8F0] rounded px-2.5 py-1.5 text-xs font-mono text-[#0A2540] outline-none focus:border-[#0055D4]"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[9px] font-mono text-[#64748B] mb-1 uppercase font-semibold">Order Value (INR)</label>
                    <input
                      type="number"
                      value={simValue}
                      onChange={(e) => setSimValue(parseInt(e.target.value) || 0)}
                      className="w-full bg-white border border-[#E2E8F0] rounded px-2.5 py-1.5 text-xs font-mono text-[#0A2540] outline-none focus:border-[#0055D4]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={simLoading || simPhone.length !== 10 || simPincode.length !== 6}
                    className="inline-flex items-center gap-1.5 border border-[#0055D4] bg-white text-[#0055D4] hover:bg-[#0055D4] hover:text-white text-[10px] px-3.5 py-2 rounded font-mono font-bold transition-all disabled:opacity-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {simLoading ? "CHECKING..." : "DISPATCH RISK CHECK"}
                  </button>
                  {simFeedback && (
                    <span className="text-[10px] font-mono text-[#64748B]">{simFeedback}</span>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            {/* CREDENTIALS CARD */}
            {selectedMerchant && (
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/30 rounded p-6 space-y-4">
                <span className="text-xs font-mono font-bold text-[#0A2540] block border-b border-[#E2E8F0] pb-2 font-semibold">
                  API CREDENTIALS & SERVICE CONFIG
                </span>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[#64748B] block uppercase text-[9px]">Merchant Name</span>
                    <span className="text-[#0A2540] font-bold">{selectedMerchant.name.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block uppercase text-[9px]">Protection Tier</span>
                    <span className="text-[#0A2540] font-bold">{selectedMerchant.tier}</span>
                  </div>
                </div>

                <div className="space-y-2 font-sans">
                  <span className="text-[#64748B] block uppercase text-[9px] font-mono font-semibold">Private Webhook Key</span>
                  <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] p-2.5 rounded justify-between font-mono text-xs text-[#0A2540]">
                    <span className="break-all select-all">
                      {showApiKey ? selectedMerchant.apiKey : "••••••••••••••••••••••••••••••••"}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="text-[#64748B] hover:text-[#0055D4] transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={handleCopyKey}
                        className="text-[#64748B] hover:text-[#0055D4] transition-colors relative"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copied && (
                          <span className="absolute -top-7 right-0 text-[9px] font-mono bg-white border border-[#E2E8F0] text-[#0A2540] rounded px-1.5 py-0.5">
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
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/30 rounded">
              <span className="text-xs font-mono font-bold text-[#0A2540] block p-6 pb-2 border-b border-[#E2E8F0] font-semibold">
                ACTIVE PROTECTION CLAIMS
              </span>

              <div className="p-6 pt-4 space-y-4">
                {claims.length === 0 ? (
                  <div className="text-xs text-[#64748B] font-mono text-center py-6">
                    No active insurance claims logged.
                  </div>
                ) : (
                  claims.map((c) => (
                    <div key={c.id} className="border border-[#E2E8F0] bg-white p-3 rounded space-y-2">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="text-[#64748B]">Order Ref: {c.order.id.substring(0, 8)}</span>
                        <span className="text-[#0A2540] font-bold">INR {c.order.value.toFixed(0)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            c.status === "Approved"
                              ? "bg-[#15803D]"
                              : c.status === "Pending"
                              ? "bg-[#B45309]"
                              : "bg-[#B91C1C]"
                          }`}
                        ></span>
                        <span className="font-semibold text-slate-700">Claim {c.status}</span>
                      </div>

                      {/* Display steps progress bar */}
                      <div className="grid grid-cols-4 gap-1 pt-1 h-1">
                        <div className="h-full rounded bg-[#15803D]"></div>
                        <div className={`h-full rounded ${c.step >= 2 ? "bg-[#15803D]" : "bg-slate-200"}`}></div>
                        <div className={`h-full rounded ${c.step >= 3 ? "bg-[#15803D]" : "bg-slate-200"}`}></div>
                        <div className={`h-full rounded ${c.step >= 4 ? "bg-[#15803D]" : "bg-slate-200"}`}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
