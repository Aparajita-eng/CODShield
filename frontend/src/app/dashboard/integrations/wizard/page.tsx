"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ArrowRight, ArrowLeft, Store, ShieldCheck,
  Truck, Bell, FileText, Zap, Check, RefreshCw, AlertCircle
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Store Platform", icon: Store, desc: "Connect your ecommerce storefront" },
  { id: 2, title: "Verification", icon: ShieldCheck, desc: "Configure WhatsApp & AI Voice verification" },
  { id: 3, title: "Logistics", icon: Truck, desc: "Set up shipping & courier preferences" },
  { id: 4, title: "Notifications", icon: Bell, desc: "Configure customer alerts & channels" },
  { id: 5, title: "Review & Finish", icon: FileText, desc: "Verify settings and activate orchestration" },
];

export default function CapabilityWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [platform, setPlatform] = useState("SHOPIFY");
  const [verificationMethod, setVerificationMethod] = useState("WHATSAPP");
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [logisticsProvider, setLogisticsProvider] = useState("SHIPROCKET");
  const [autoDispatch, setAutoDispatch] = useState(false);
  const [smsNotify, setSmsNotify] = useState(true);
  const [emailNotify, setEmailNotify] = useState(true);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Connect default service integrations if needed
      await fetch("/api/service-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "LOGISTICS",
          provider: logisticsProvider,
          config: { wizardAutoConfig: true },
        }),
      });

      await fetch("/api/service-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: verificationMethod === "WHATSAPP" ? "WHATSAPP" : "AI_VOICE",
          provider: "META",
          config: { wizardAutoConfig: true },
        }),
      });

      setSavedSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/integrations");
      }, 1500);
    } catch {
      alert("Failed to complete capability setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: "32px auto", padding: "0 24px" }}>
      <style>{`
        .wz-header { margin-bottom: 32px; }
        .wz-eyebrow { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--accent, #059669); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
        .wz-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 6px; }
        .wz-sub { font-size: 14px; color: #6b7280; margin: 0; }

        .wz-stepper { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin-bottom: 32px; }
        .wz-step-item { display: flex; align-items: center; gap: 10px; }
        .wz-step-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
        .wz-step-active { background: var(--accent, #059669); color: #fff; }
        .wz-step-done { background: rgba(5,150,105,0.1); color: var(--accent, #059669); }
        .wz-step-pending { background: #f3f4f6; color: #9ca3af; }
        .wz-step-label { font-size: 12px; font-weight: 600; color: #374151; }
        .wz-step-sub { font-size: 10px; color: #9ca3af; display: block; }

        .wz-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
        .wz-option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
        .wz-option-card { padding: 16px; border: 1px solid #e5e7eb; border-radius: 10px; cursor: pointer; transition: all 0.15s; background: #fff; text-align: left; }
        .wz-option-card:hover { border-color: var(--accent, #059669); background: rgba(5,150,105,0.02); }
        .wz-option-selected { border-color: var(--accent, #059669); background: rgba(5,150,105,0.06) !important; }

        .wz-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
        .wz-btn-sec { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
        .wz-btn-pri { display: flex; align-items: center; gap: 6px; padding: 10px 22px; border-radius: 8px; border: none; background: var(--accent, #059669); font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; box-shadow: 0 1px 4px rgba(5,150,105,0.25); }
      `}</style>

      {/* Header */}
      <div className="wz-header">
        <div className="wz-eyebrow"><Zap className="w-3.5 h-3.5" /> Capability Detection Wizard</div>
        <h1 className="wz-title">Configure CODShield Orchestration</h1>
        <p className="wz-sub">Detect merchant preferences to automatically handle order verification, fraud prevention, and shipping dispatch.</p>
      </div>

      {/* Stepper */}
      <div className="wz-stepper">
        {STEPS.map((s) => {
          const isDone = currentStep > s.id;
          const isActive = currentStep === s.id;
          return (
            <div key={s.id} className="wz-step-item">
              <div className={`wz-step-num ${isActive ? "wz-step-active" : isDone ? "wz-step-done" : "wz-step-pending"}`}>
                {isDone ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <div className="hidden md:block">
                <span className="wz-step-label">{s.title}</span>
                <span className="wz-step-sub">{s.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Body */}
      <div className="wz-card">
        {savedSuccess ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CheckCircle2 style={{ width: 48, height: 48, color: "var(--accent, #059669)", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Capability Setup Complete!</h2>
            <p style={{ fontSize: 14, color: "#6b7280" }}>Redirecting to your Integrations Dashboard…</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
            >
              {currentStep === 1 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Step 1: Select Ecommerce Store Platform</h3>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>Where do your customer COD orders originate?</p>

                  <div className="wz-option-grid">
                    {[
                      { id: "SHOPIFY", name: "Shopify", desc: "Automatic webhooks & REST API" },
                      { id: "WOOCOMMERCE", name: "WooCommerce", desc: "WordPress REST API ingestion" },
                      { id: "MAGENTO", name: "Magento 2", desc: "Enterprise Magento API" },
                      { id: "CUSTOM_API", name: "Custom API", desc: "Direct Webhook endpoint ingestion" },
                    ].map((p) => (
                      <div
                        key={p.id}
                        className={`wz-option-card ${platform === p.id ? "wz-option-selected" : ""}`}
                        onClick={() => setPlatform(p.id)}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Step 2: Customer Verification Method</h3>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>How should CODShield verify buyer intent before dispatching?</p>

                  <div className="wz-option-grid">
                    {[
                      { id: "WHATSAPP", name: "WhatsApp Interactive", desc: "Send WhatsApp button messages for 1-click confirmation" },
                      { id: "AI_VOICE", name: "AI Voice Call", desc: "Automated outbound voice call asking customer to press 1" },
                    ].map((v) => (
                      <div
                        key={v.id}
                        className={`wz-option-card ${verificationMethod === v.id ? "wz-option-selected" : ""}`}
                        onClick={() => setVerificationMethod(v.id)}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{v.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={fallbackEnabled}
                        onChange={(e) => setFallbackEnabled(e.target.checked)}
                      />
                      Enable CODShield Managed Fallback Service if merchant channel fails
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Step 3: Preferred Logistics Partner</h3>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>Select primary courier partner for automated dispatch</p>

                  <div className="wz-option-grid">
                    {[
                      { id: "SHIPROCKET", name: "Shiprocket", desc: "Multi-courier aggregator with 24,000+ pincodes" },
                      { id: "DELHIVERY", name: "Delhivery Direct", desc: "Direct Delhivery surface & express integration" },
                      { id: "BLUEDART", name: "Blue Dart", desc: "Premium express delivery for high-value orders" },
                      { id: "DEMO", name: "CODShield Managed Logistics", desc: "Default fallback shipping dispatch" },
                    ].map((l) => (
                      <div
                        key={l.id}
                        className={`wz-option-card ${logisticsProvider === l.id ? "wz-option-selected" : ""}`}
                        onClick={() => setLogisticsProvider(l.id)}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{l.desc}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={autoDispatch}
                        onChange={(e) => setAutoDispatch(e.target.checked)}
                      />
                      Automatically dispatch order to top-ranked courier once verified
                    </label>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Step 4: Customer Notification Channels</h3>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>Enable real-time customer tracking alerts</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    <div style={{ padding: 14, background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>SMS Status Alerts</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>Send order confirmation & dispatch SMS to buyer</div>
                      </div>
                      <input type="checkbox" checked={smsNotify} onChange={(e) => setSmsNotify(e.target.checked)} />
                    </div>

                    <div style={{ padding: 14, background: "#fff", borderRadius: 8, border: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Email Tracking & Invoices</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>Send digital receipt and live tracking URL via Email</div>
                      </div>
                      <input type="checkbox" checked={emailNotify} onChange={(e) => setEmailNotify(e.target.checked)} />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Step 5: Review & Save Settings</h3>
                  <p style={{ fontSize: 13, color: "#6b7280" }}>Verify your configured orchestration capabilities before activating.</p>

                  <div style={{ marginTop: 20, background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", padding: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
                      <div><strong style={{ color: "#6b7280" }}>Store Platform:</strong> <div>{platform}</div></div>
                      <div><strong style={{ color: "#6b7280" }}>Verification Channel:</strong> <div>{verificationMethod} (Fallback: {fallbackEnabled ? "Enabled" : "Disabled"})</div></div>
                      <div><strong style={{ color: "#6b7280" }}>Primary Courier:</strong> <div>{logisticsProvider}</div></div>
                      <div><strong style={{ color: "#6b7280" }}>Auto-Dispatch:</strong> <div>{autoDispatch ? "Enabled" : "Disabled"}</div></div>
                      <div><strong style={{ color: "#6b7280" }}>Notifications:</strong> <div>{[smsNotify && "SMS", emailNotify && "Email"].filter(Boolean).join(", ") || "None"}</div></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="wz-actions">
                {currentStep > 1 ? (
                  <button className="wz-btn-sec" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {currentStep < 5 ? (
                  <button className="wz-btn-pri" onClick={handleNext}>
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button className="wz-btn-pri" onClick={handleFinish} disabled={loading}>
                    {loading ? <><RefreshCw className="w-4 h-4 spin" /> Saving…</> : <>Activate Capabilities <Check className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
