"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Terminal, Shield, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

function SandboxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") || "otp";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    if (searchParams?.get("tab")) {
      setActiveTab(searchParams.get("tab") as string);
    }
  }, [searchParams]);

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    router.push(`/sandbox?tab=${tab}`);
  };

  const [rawPayload, setRawPayload] = useState<string>("{\n  \"status\": \"awaiting_action\",\n  \"message\": \"Select a module and submit a request to view raw network logs.\"\n}");
  const [loading, setLoading] = useState<boolean>(false);

  // Module 1: OTP State
  const [otpPhone, setOtpPhone] = useState<string>("9876543210");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [otpDemoCode, setOtpDemoCode] = useState<string>("");
  const [otpStatus, setOtpStatus] = useState<string>("Awaiting input");
  const [otpSuccess, setOtpSuccess] = useState<boolean | null>(null);

  // Module 2: Trust Graph State
  const [trustPhone, setTrustPhone] = useState<string>("9876543210");
  const [trustAddress, setTrustAddress] = useState<string>("Koramangala, Bengaluru");
  const [trustScore, setTrustScore] = useState<number>(0);
  const [trustResult, setTrustResult] = useState<any>(null);

  // Module 3: Pincode State
  const [pincodeVal, setPincodeVal] = useState<string>("560034");
  const [pincodeResult, setPincodeResult] = useState<any>(null);

  // Module 4: Fraud State
  const [fraudPhone, setFraudPhone] = useState<string>("9123456780");
  const [fraudResult, setFraudResult] = useState<any>(null);

  // Module 5: Risk Engine State
  const [riskValue, setRiskValue] = useState<number>(4500);
  const [riskPincode, setRiskPincode] = useState<string>("560034");
  const [riskPhone, setRiskPhone] = useState<string>("9876543210");
  const [riskResult, setRiskResult] = useState<any>(null);

  // Module 6: Merchant State
  const [claimRatio, setClaimRatio] = useState<number>(4.0);
  const [merchantResult, setMerchantResult] = useState<any>(null);

  // Module 7: Claim State
  const [claimOrderId, setClaimOrderId] = useState<string>("8a7c-9b88f-1249c");
  const [claimSteps, setClaimSteps] = useState<any[]>([]);

  useEffect(() => {
    setRawPayload(JSON.stringify({ status: "awaiting_action", activeModule: activeTab }, null, 2));
  }, [activeTab]);

  const handleSendOtp = async () => {
    setLoading(true);
    setOtpSuccess(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setOtpSent(true);
        setOtpDemoCode(data.code);
        setOtpStatus(`Verification code dispatched to ${otpPhone}.`);
      } else {
        setOtpStatus(data.message || "Failed to dispatch verification code.");
      }
    } catch (e) {
      setOtpStatus("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, code: otpCode }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setOtpSuccess(true);
        setOtpStatus("Verification successful. Identity authenticated.");
        confetti({ particleCount: 50, spread: 30, colors: ["#C99A4B", "#B5563C"] });
      } else {
        setOtpSuccess(false);
        setOtpStatus(data.message || "Verification code failed mismatch check.");
      }
    } catch (e) {
      setOtpStatus("Verification error.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTrust = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox/trust-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trustPhone, address: trustAddress }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setTrustResult(data);
        setTrustScore(data.score);
      }
    } catch (e) {
      setRawPayload(JSON.stringify({ error: "Failed to fetch trust details" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPincode = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox/pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pincodeVal }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setPincodeResult(data);
      }
    } catch (e) {
      setRawPayload(JSON.stringify({ error: "Failed to query pincode risk map" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchFraud = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox/fraud-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fraudPhone }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setFraudResult(data);
      }
    } catch (e) {
      setRawPayload(JSON.stringify({ error: "Failed to query blacklist" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRisk = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sandbox/risk-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: riskPhone, pincode: riskPincode, value: riskValue }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setRiskResult(data.assessment);
      }
    } catch (e) {
      setRawPayload(JSON.stringify({ error: "Failed to run risk scoring" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleMerchantSlider = async (val: number) => {
    setClaimRatio(val);
    try {
      const res = await fetch("/api/sandbox/merchant-ratio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratio: val }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));
      if (data.success) {
        setMerchantResult(data);
      }
    } catch (e) {
      setRawPayload(JSON.stringify({ error: "Failed to evaluate claim ratio" }, null, 2));
    }
  };

  useEffect(() => {
    if (activeTab === "merchant") {
      handleMerchantSlider(claimRatio);
    }
  }, [activeTab]);

  const handleSimulateClaim = async () => {
    setLoading(true);
    setClaimSteps([]);
    try {
      const res = await fetch("/api/sandbox/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: claimOrderId }),
      });
      const data = await res.json();
      setRawPayload(JSON.stringify(data, null, 2));

      if (data.success && data.steps) {
        const steps = data.steps;
        for (let i = 0; i <= steps.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setClaimSteps(steps.slice(0, i));
          if (i === steps.length) {
            confetti({ particleCount: 30, spread: 20, colors: ["#C99A4B"] });
          }
        }
      }
    } catch (e) {
      setRawPayload(JSON.stringify({ error: "Failed to process claim" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 pt-24 pb-16">
      <div className="space-y-3">
        <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
          Interactive Sandbox
        </span>
        <h1 className="font-serif font-bold text-3xl text-ink-primary">
          Run every trust module yourself.
        </h1>
        <p className="text-ink-secondary text-xs sm:text-sm max-w-2xl leading-relaxed font-sans">
          Test checkout verification components against seed databases without deploying code. Select a module below to begin evaluation.
        </p>
      </div>

      {/* TAB BUTTONS */}
      <div className="flex gap-2 overflow-x-auto pb-3 pt-6 border-b border-border-subtle">
        {[
          { id: "otp", name: "01 · OTP Engine" },
          { id: "trust", name: "02 · Trust Graph" },
          { id: "pincode", name: "03 · Pincode Check" },
          { id: "fraud", name: "04 · Fraud History" },
          { id: "risk", name: "05 · Risk Scoring" },
          { id: "merchant", name: "06 · Merchant Tier" },
          { id: "claim", name: "07 · Claim Coverage" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`shrink-0 font-sans text-xs rounded border transition-all px-3.5 py-1.5 cursor-pointer ${
              activeTab === tab.id
                ? "bg-accent text-bg-base border-accent font-semibold"
                : "border-border-default bg-bg-raised/40 text-ink-secondary hover:text-ink-primary hover:border-accent/40"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mt-8 items-start">
        {/* INTERACTIVE WORKSPACE CARD */}
        <div className="border border-border-default bg-bg-raised rounded-lg p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
          <div>
            {/* PANEL 1: OTP ENGINE */}
            {activeTab === "otp" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-ink-tertiary uppercase font-semibold">Verification Module</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Verify customer intent</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Generates a simulated verification dispatch. Enter a 10-digit number to trigger the fallback pipeline.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={loading || otpPhone.length !== 10}
                    className="w-full bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs py-2 rounded transition-colors disabled:opacity-50 font-sans cursor-pointer"
                  >
                    {loading ? "SENDING..." : "SEND VERIFICATION OTP"}
                  </button>

                  {otpSent && (
                    <div className="space-y-3 pt-2 border-t border-border-subtle">
                      <div className="flex justify-between items-center text-[9px] font-mono text-ink-secondary">
                        <span>Verification Code Input</span>
                        <span className="text-accent font-semibold">(Demo code: {otpDemoCode})</span>
                      </div>
                      <input
                        type="text"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="0000"
                        className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-center text-xs font-mono tracking-widest text-ink-primary focus:border-accent outline-none"
                      />
                      <button
                        onClick={handleVerifyOtp}
                        disabled={loading || otpCode.length !== 4}
                        className="w-full border border-border-default hover:bg-bg-base/60 text-ink-primary font-semibold text-xs py-2 rounded transition-colors font-sans cursor-pointer"
                      >
                        VERIFY CODE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PANEL 2: TRUST GRAPH */}
            {activeTab === "trust" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-tertiary uppercase font-semibold">Graph Module</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Analyze network coordinates</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Maps phone numbers and addresses across merchants to analyze shared cluster integrity scores.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={trustPhone}
                      onChange={(e) => setTrustPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Delivery address
                    </label>
                    <input
                      type="text"
                      value={trustAddress}
                      onChange={(e) => setTrustAddress(e.target.value)}
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleAnalyzeTrust}
                    disabled={loading || !trustAddress.trim() || trustPhone.length !== 10}
                    className="w-full bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs py-2 rounded transition-colors disabled:opacity-50 font-sans cursor-pointer"
                  >
                    {loading ? "ANALYZING..." : "EVALUATE GRAPH NETWORK"}
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 3: PINCODE CHECK */}
            {activeTab === "pincode" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-tertiary uppercase font-semibold">Geo Module</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Check regional RTO density</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Queries postal risk indices. Sample codes: 560034 (Low risk), 110044 (Medium risk), 400072 (High risk).
                  </p>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Postal Pincode (6 digits)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincodeVal}
                      onChange={(e) => setPincodeVal(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleCheckPincode}
                    disabled={loading || pincodeVal.length !== 6}
                    className="w-full bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs py-2 rounded transition-colors disabled:opacity-50 font-sans cursor-pointer"
                  >
                    {loading ? "QUERYING..." : "EVALUATE POSTAL CODE"}
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 4: FRAUD HISTORY */}
            {activeTab === "fraud" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-tertiary uppercase font-semibold">Abuse Database</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Search blacklist database</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Matches phone history against delivery refusal databases. Sample flagged: 9123456780.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={fraudPhone}
                      onChange={(e) => setFraudPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSearchFraud}
                    disabled={loading || fraudPhone.length !== 10}
                    className="w-full bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs py-2 rounded transition-colors disabled:opacity-50 font-sans cursor-pointer"
                  >
                    {loading ? "SEARCHING..." : "CHECK ABUSE HISTORY"}
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 5: RISK SCORING */}
            {activeTab === "risk" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-tertiary uppercase font-semibold">Assessment Model</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Compute mathematical risk score</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Orchestrates multiple weights to output a transactional risk assessment and shipping action.
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-ink-secondary mb-1 uppercase">
                        Order Value (INR)
                      </label>
                      <input
                        type="number"
                        value={riskValue}
                        onChange={(e) => setRiskValue(parseInt(e.target.value) || 0)}
                        className="w-full bg-bg-base border border-border-default rounded px-2.5 py-1.5 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-ink-secondary mb-1 uppercase">
                        Pincode
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={riskPincode}
                        onChange={(e) => setRiskPincode(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-bg-base border border-border-default rounded px-2.5 py-1.5 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={riskPhone}
                      onChange={(e) => setRiskPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleCalculateRisk}
                    disabled={loading || riskPhone.length !== 10 || riskPincode.length !== 6}
                    className="w-full bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs py-2 rounded transition-colors disabled:opacity-50 font-sans font-mono cursor-pointer"
                  >
                    {loading ? "COMPUTING..." : "CALCULATE ORDER RISK"}
                  </button>
                </div>
              </div>
            )}

            {/* PANEL 6: MERCHANT TIER */}
            {activeTab === "merchant" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-tertiary uppercase font-semibold">Compliance Module</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Evaluate merchant profile tier</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Simulates how merchant claim rates change authorization tiers dynamically.
                  </p>
                </div>

                <div className="space-y-6 max-w-sm">
                  <div>
                    <div className="flex justify-between items-center text-xs font-mono text-ink-secondary mb-2 font-semibold">
                      <span>Simulated Claim Ratio</span>
                      <span className="text-ink-primary font-semibold">{claimRatio.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={0.5}
                      value={claimRatio}
                      onChange={(e) => handleMerchantSlider(parseFloat(e.target.value))}
                      className="accent-accent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 7: CLAIM COVERAGE */}
            {activeTab === "claim" && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-ink-tertiary uppercase font-semibold">Guarantees</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Simulate payout pipeline</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                    Runs the automated 4-stage insurance reimbursement algorithm for protected orders that failed delivery.
                  </p>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div>
                    <label className="block text-[10px] font-mono text-ink-secondary mb-1.5 uppercase">
                      Order log reference ID
                    </label>
                    <input
                      type="text"
                      value={claimOrderId}
                      onChange={(e) => setClaimOrderId(e.target.value)}
                      className="w-full bg-bg-base border border-border-default rounded px-3 py-2 text-xs font-mono text-ink-primary focus:border-accent outline-none"
                    />
                  </div>

                  <button
                    onClick={handleSimulateClaim}
                    disabled={loading || !claimOrderId.trim()}
                    className="w-full bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs py-2 rounded transition-colors disabled:opacity-50 font-sans cursor-pointer"
                  >
                    {loading ? "RUNNING PIPELINE..." : "INITIALIZE CLAIM VERIFICATION"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE MODULE OUTPUT VIEWS */}
          <div className="mt-8 border-t border-border-subtle pt-6">
            <span className="text-[9px] font-mono text-ink-tertiary uppercase block mb-3 font-semibold">MODULE OUTPUT LOG</span>

            {/* OTP OUTPUT */}
            {activeTab === "otp" && (
              <div className="border border-border-default bg-bg-base/40 p-4 rounded flex items-center justify-between">
                <div className="space-y-0.5 font-sans">
                  <span className="text-[9px] font-mono text-ink-tertiary block">Verification Status</span>
                  <div className="text-xs text-ink-primary font-semibold">{otpStatus}</div>
                </div>
                {otpSuccess === true && <span className="text-xs font-mono font-bold text-accent">Success</span>}
                {otpSuccess === false && <span className="text-xs font-mono font-bold text-negative">Failed</span>}
                {otpSuccess === null && otpSent && <RefreshCw className="w-3.5 h-3.5 text-ink-tertiary animate-spin shrink-0" />}
              </div>
            )}

            {/* TRUST GRAPH OUTPUT */}
            {activeTab === "trust" && (
              <div className="space-y-4">
                {trustResult ? (
                  <div className="grid sm:grid-cols-2 gap-4 border border-border-default bg-bg-base/40 p-4 rounded">
                    <div className="space-y-1 font-sans">
                      <span className="text-[9px] font-mono text-ink-tertiary block">Network Connections</span>
                      <div className="text-xs font-semibold text-ink-primary">
                        Found {trustResult.connections} matching nodes
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-ink-tertiary">Trust score</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-accent">{trustResult.score}/100</span>
                        <span className="text-[10px] text-ink-secondary">({trustResult.verdict})</span>
                      </div>
                      <div className="w-full bg-border-subtle h-1 rounded overflow-hidden mt-1">
                        <div
                          className="h-full rounded transition-all duration-700 bg-accent"
                          style={{ width: `${trustScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-ink-secondary font-mono text-center py-4 border border-border-default bg-bg-base/40 rounded">Awaiting evaluation triggers...</div>
                )}
              </div>
            )}

            {/* PINCODE RISK OUTPUT */}
            {activeTab === "pincode" && (
              <div className="space-y-4">
                {pincodeResult ? (
                  <div className="grid sm:grid-cols-3 gap-4 border border-border-default bg-bg-base/40 p-4 rounded font-mono text-xs text-ink-primary">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-ink-tertiary">Regional Weight</span>
                      <div className="font-semibold">{(pincodeResult.weight * 100).toFixed(0)}%</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-ink-tertiary">Predicted RTO</span>
                      <div className="text-negative font-semibold">{pincodeResult.rto}%</div>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono text-ink-tertiary">Accept Ratio</span>
                      <div className="text-accent font-semibold">{pincodeResult.accept}%</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-ink-secondary font-mono text-center py-4 border border-border-default bg-bg-base/40 rounded">Awaiting postal code entry...</div>
                )}
              </div>
            )}

            {/* FRAUD DATABASE OUTPUT */}
            {activeTab === "fraud" && (
              <div className="space-y-4">
                {fraudResult ? (
                  <div className="border border-border-default bg-bg-base/40 p-4 rounded space-y-3 font-mono text-xs text-ink-primary">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <span className="text-[9px] font-mono text-ink-tertiary">Match Status</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          fraudResult.flagged ? "bg-negative/10 text-negative border border-negative/30" : "bg-accent/10 text-accent border border-accent/30"
                        }`}
                      >
                        {fraudResult.flagged ? "Flagged profile" : "Clear profile"}
                      </span>
                    </div>
                    <p className="text-ink-secondary font-sans">{fraudResult.message}</p>
                    {fraudResult.flags.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-border-subtle">
                        <span className="text-[9px] font-mono text-ink-tertiary block uppercase font-semibold">Identified matches</span>
                        <ul className="text-[10px] text-ink-secondary space-y-1 font-sans">
                          {fraudResult.flags.map((flag: string, index: number) => (
                            <li key={index} className="flex gap-2">
                              <span className="text-negative font-bold">-</span>
                              {flag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-ink-secondary font-mono text-center py-4 border border-border-default bg-bg-base/40 rounded">Awaiting phone entry search...</div>
                )}
              </div>
            )}

            {/* RISK SCORING ENGINE OUTPUT */}
            {activeTab === "risk" && (
              <div className="space-y-4">
                {riskResult ? (
                  <div className="border border-border-default bg-bg-base/40 p-5 rounded space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border-subtle pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-ink-tertiary">Calculated Score</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold font-mono text-ink-primary">{riskResult.score}</span>
                          <span className="text-[10px] text-ink-secondary">/ 100</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[9px] font-mono text-ink-tertiary font-semibold block">Decision Verdict</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase inline-block border ${
                            riskResult.verdict === "LOW"
                              ? "bg-accent/15 text-accent border-accent/30"
                              : riskResult.verdict === "MEDIUM"
                              ? "bg-accent/10 text-accent/80 border-accent/25"
                              : "bg-negative/15 text-negative border-negative/30"
                          }`}
                        >
                          {riskResult.verdict} Risk · {riskResult.action.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono text-xs">
                      <div className="bg-bg-base/60 border border-border-subtle rounded py-2">
                        <div className="text-[9px] font-mono text-ink-secondary">Pincode Risk</div>
                        <div className="font-semibold text-ink-primary mt-0.5">{riskResult.pincodeRisk}</div>
                      </div>
                      <div className="bg-bg-base/60 border border-border-subtle rounded py-2">
                        <div className="text-[9px] font-mono text-ink-secondary">Value Risk</div>
                        <div className="font-semibold text-ink-primary mt-0.5">{riskResult.valueRisk}</div>
                      </div>
                      <div className="bg-bg-base/60 border border-border-subtle rounded py-2">
                        <div className="text-[9px] font-mono text-ink-secondary">Refusal Risk</div>
                        <div className="font-semibold text-ink-primary mt-0.5">{riskResult.phoneRisk}</div>
                      </div>
                    </div>

                    <div className="space-y-1 font-sans text-xs">
                      <span className="text-[9px] font-mono text-ink-tertiary uppercase block">Assessment Rationale</span>
                      <ul className="text-[11px] text-ink-secondary space-y-1">
                        {riskResult.reasons.map((reason: string, i: number) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-accent font-bold">-</span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-ink-secondary font-mono text-center py-4 border border-border-default bg-bg-base/40 rounded font-mono">Awaiting risk math indicators...</div>
                )}
              </div>
            )}

            {/* MERCHANT COMPLIANCE OUTPUT */}
            {activeTab === "merchant" && (
              <div className="space-y-4">
                {merchantResult ? (
                  <div className="border border-border-default bg-bg-base/40 p-4 rounded space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono text-ink-tertiary">Compliance score</span>
                        <div className="font-bold text-ink-primary">{merchantResult.score}/100</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${merchantResult.dotClass === "bg-[#15803D]" ? "bg-accent" : "bg-negative"}`}></span>
                        <span className={`text-[10px] font-bold uppercase ${merchantResult.color === "text-[#15803D]" ? "text-accent" : "text-negative"}`}>
                          {merchantResult.tier}
                        </span>
                      </div>
                    </div>
                    <p className="text-ink-secondary font-sans text-xs">{merchantResult.description}</p>
                  </div>
                ) : (
                  <div className="text-[10px] text-ink-secondary font-mono text-center py-4 border border-border-default bg-bg-base/40 rounded font-mono">Evaluating claim parameters...</div>
                )}
              </div>
            )}

            {/* CLAIM protection SIMULATOR OUTPUT */}
            {activeTab === "claim" && (
              <div className="space-y-4">
                <div className="border border-border-default bg-bg-base/40 p-4 rounded font-mono text-xs">
                  <span className="text-[9px] font-mono text-ink-tertiary block mb-3 uppercase font-semibold">Verification timeline</span>
                  {claimSteps.length > 0 ? (
                    <div className="space-y-3">
                      {claimSteps.map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0"></span>
                          <div className="space-y-0.5 font-sans">
                            <div className="font-semibold text-ink-primary">{step.name}</div>
                            <div className="text-[10px] text-ink-secondary leading-none">{step.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] text-ink-secondary text-center py-2 font-mono">
                      Submit request to launch verification check simulation.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CODE OUTPUT PANEL (TERMINAL VIEWER) */}
        <div className="border border-border-default bg-bg-raised rounded-lg p-6 h-full flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono font-bold text-ink-primary">RAW API RESPONSE PAYLOAD</span>
              </div>
              <span className="text-[8px] font-mono border border-border-subtle px-2 py-0.5 text-ink-tertiary rounded">
                HTTP/1.1 200 OK
              </span>
            </div>

            <pre className="text-ink-primary/90 font-mono text-xs overflow-x-auto p-4 bg-bg-base border border-border-subtle rounded-lg leading-relaxed whitespace-pre-wrap max-h-[380px]">
              <code>{rawPayload}</code>
            </pre>
          </div>

          <div className="border-t border-border-subtle pt-6 mt-6 flex items-center justify-between text-[9px] font-mono text-ink-tertiary">
            <span className="flex items-center gap-1.5 text-accent">
              <Shield className="w-3.5 h-3.5" />
              TLS 1.3 Encryption Active
            </span>
            <span>application/json</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sandbox() {
  return (
    <>
      <Navigation />
      <main className="flex-grow bg-bg-base text-ink-primary">
        <Suspense
          fallback={
            <div className="flex-1 bg-bg-base flex items-center justify-center text-ink-secondary font-mono text-xs h-screen">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent" />
                Initializing sandbox...
              </div>
            </div>
          }
        >
          <SandboxContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
