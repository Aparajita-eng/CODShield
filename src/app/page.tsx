"use client";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const [activeLayer, setActiveLayer] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const targetId = hash.replace("#", "");
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Navigation />

      <main className="flex-1 bg-[#F8F9FC]">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-24 border-b border-[#E2E8F0]">
          <div className="absolute inset-0 noise-line pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 border border-[#E2E8F0] bg-[#F1F3F7]/50 rounded px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0055D4]"></span>
                <span className="text-[10px] font-mono tracking-wider text-[#64748B] uppercase font-semibold">
                  Beta Release
                </span>
              </div>

              <h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-[#0A2540]">
                Protect every COD order before it ships.
              </h1>

              <p className="text-sm sm:text-base text-[#64748B] max-w-xl leading-relaxed">
                A programmatic trust infrastructure layer that evaluates checkout intent. Verify buyer identities, rate regional postal zones, block repeat refusals, and protect dispatch margin.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/sandbox"
                  className="inline-flex items-center gap-2 bg-[#0055D4] hover:bg-[#0044B3] text-white font-semibold text-xs px-5 py-3.5 rounded transition-colors"
                >
                  Open Sandbox Console
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 border border-[#E2E8F0] bg-[#F1F3F7]/40 text-[#0A2540] font-semibold text-xs px-5 py-3.5 rounded hover:bg-[#F1F3F7]/80 transition-colors"
                >
                  Access Merchant Dashboard
                </Link>
              </div>

              {/* Specific pilot stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-[#E2E8F0] pt-8 mt-4">
                <div>
                  <div className="font-mono font-semibold text-2xl text-[#0A2540]">11%</div>
                  <div className="text-[10px] font-mono text-[#64748B] mt-1.5 uppercase tracking-wider">
                    RTO REDUCTION IN PILOT
                  </div>
                </div>
                <div>
                  <div className="font-mono font-semibold text-2xl text-[#0A2540]">~42.1K</div>
                  <div className="text-[10px] font-mono text-[#64748B] mt-1.5 uppercase tracking-wider">
                    MONTHLY ORDERS EVALUATED
                  </div>
                </div>
                <div>
                  <div className="font-mono font-semibold text-2xl text-[#0055D4]">5 / mo</div>
                  <div className="text-[10px] font-mono text-[#64748B] mt-1.5 uppercase tracking-wider">
                    BETA ONBOARDING CAP
                  </div>
                </div>
                <div>
                  <div className="font-mono font-semibold text-2xl text-[#0A2540]">₹2.1L</div>
                  <div className="text-[10px] font-mono text-[#64748B] mt-1.5 uppercase tracking-wider">
                    FRAUD PREVENTED SINCE MAR
                  </div>
                </div>
              </div>
            </div>

            {/* Line Chart aligned to Brand Blue */}
            <div className="relative">
              <div className="relative rounded-lg border border-[#E2E8F0] bg-[#F1F3F7]/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">PILOT METRIC ANALYSIS</span>
                    <h4 className="font-serif font-bold text-sm text-[#0A2540] mt-0.5">RTO Rate Evolution (First 90 Days)</h4>
                  </div>
                  <span className="text-[9px] font-mono border border-[#E2E8F0] px-2 py-0.5 text-[#64748B] rounded">
                    Apparel Category
                  </span>
                </div>

                <svg viewBox="0 0 400 240" className="w-full h-auto text-[#64748B]">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="380" y2="30" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="40" y1="75" x2="380" y2="75" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="40" y1="165" x2="380" y2="165" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="40" y1="210" x2="380" y2="210" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="30" y="34" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#64748B">40%</text>
                  <text x="30" y="79" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#64748B">30%</text>
                  <text x="30" y="124" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#64748B">20%</text>
                  <text x="30" y="169" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#64748B">10%</text>
                  <text x="30" y="214" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#64748B">0%</text>

                  {/* X Axis Labels */}
                  <text x="40" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#64748B">Day 0</text>
                  <text x="125" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#64748B">Day 30</text>
                  <text x="210" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#64748B">Day 60</text>
                  <text x="295" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#64748B">Day 90</text>
                  <text x="380" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#64748B">Day 120</text>

                  {/* Line 1: Without CODShield (Dashed Slate) */}
                  <path
                    d="M40,79 L125,75 L210,81 L295,73 L380,77"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  
                  {/* Line 2: With CODShield Active (Solid Brand Blue) */}
                  <path
                    d="M40,79 L125,120 L210,145 L295,160 L380,165"
                    fill="none"
                    stroke="#0055D4"
                    strokeWidth="2"
                  />

                  {/* Data Points */}
                  <circle cx="380" cy="165" r="3.5" fill="#0055D4" />
                  <circle cx="380" cy="77" r="3" fill="#64748B" />
                </svg>

                {/* Legend */}
                <div className="flex justify-start gap-6 mt-4 pt-3 border-t border-[#E2E8F0] text-[10px] font-mono text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#0055D4] inline-block"></span>
                    <span>CODShield protected (RTO drops to 11.2%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-[#64748B] inline-block"></span>
                    <span>Control group (Unprotected baseline ~29%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE PROBLEM */}
        <section className="py-28 border-b border-[#E2E8F0] bg-[#F8F9FC]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                The Problem
              </span>
              <h2 className="font-serif font-bold text-3xl text-[#0A2540] mt-2">
                COD is costing merchants more than they realize.
              </h2>
              <p className="text-[#64748B] mt-4 text-xs sm:text-sm leading-relaxed font-sans">
                Every unverified shipment carries hidden risks, and by the time it is flagged at the customer doorstep, shipping costs are already wasted.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6">
                <span className="font-mono text-xs text-[#B91C1C] font-semibold">01</span>
                <h3 className="font-serif font-bold text-[#0A2540] text-base mt-2">Fake COD orders</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-sans">
                  Orders placed with no real buying intent, often generated by automated bots or bulk abuse campaigns.
                </p>
              </div>
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6">
                <span className="font-mono text-xs text-[#B91C1C] font-semibold">02</span>
                <h3 className="font-serif font-bold text-[#0A2540] text-base mt-2">Wrong addresses</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-sans">
                  Incomplete, invalid, or unreachable delivery details that guarantee a failed attempt.
                </p>
              </div>
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6">
                <span className="font-mono text-xs text-[#B91C1C] font-semibold">03</span>
                <h3 className="font-serif font-bold text-[#0A2540] text-base mt-2">Customer refusal</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-sans">
                  Buyers rejecting parcels at their doorsteps after the product has traveled across transit hubs.
                </p>
              </div>
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6">
                <span className="font-mono text-xs text-[#B91C1C] font-semibold">04</span>
                <h3 className="font-serif font-bold text-[#0A2540] text-base mt-2">High RTO losses</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-sans">
                  Return-to-origin freight costs consume margins in both directions, plus repackaging overhead.
                </p>
              </div>
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6">
                <span className="font-mono text-xs text-[#B91C1C] font-semibold">05</span>
                <h3 className="font-serif font-bold text-[#0A2540] text-base mt-2">Inventory lock</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-sans">
                  Capital sits tied up in locked inventory traveling towards orders that never convert.
                </p>
              </div>
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6">
                <span className="font-mono text-xs text-[#B91C1C] font-semibold">06</span>
                <h3 className="font-serif font-bold text-[#0A2540] text-base mt-2">Shipping waste</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed font-sans">
                  Every failed delivery creates direct waste across packaging materials, warehousing, and logistics.
                </p>
              </div>
            </div>

            {/* LOSS ANALYTICS BAR CHART - Cool Gray with Brand Blue Highlight */}
            <div className="border border-[#E2E8F0] bg-[#F1F3F7]/30 rounded-lg p-6 mt-12">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Historical RTO losses</div>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-1">
                    Monthly control group losses without protection
                  </h3>
                </div>
                <div className="text-[10px] font-mono text-[#0055D4] border border-[#E2E8F0] bg-white rounded px-3 py-1 font-semibold">
                  Averaging ₹18.4L exposure / month in pilot
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-end h-40 pt-4">
                <div className="h-[38%] bg-[#64748B]/20 rounded-t-sm"></div>
                <div className="h-[52%] bg-[#64748B]/20 rounded-t-sm"></div>
                <div className="h-[44%] bg-[#64748B]/20 rounded-t-sm"></div>
                <div className="h-[68%] bg-[#64748B]/20 rounded-t-sm"></div>
                <div className="h-[58%] bg-[#64748B]/20 rounded-t-sm"></div>
                <div className="h-[80%] bg-[#64748B]/20 rounded-t-sm"></div>
                <div className="h-[74%] bg-[#64748B]/40 rounded-t-sm"></div>
                <div className="h-[90%] bg-[#64748B]/40 rounded-t-sm"></div>
                <div className="h-[100%] bg-[#64748B]/40 rounded-t-sm"></div>
                <div className="h-[86%] bg-[#64748B]/60 rounded-t-sm"></div>
                <div className="h-[96%] bg-[#64748B]/60 rounded-t-sm"></div>
                <div className="h-[98%] bg-[#0055D4] rounded-t-sm"></div> {/* Brand Blue Highlight */}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#64748B] mt-3 px-1">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>
            </div>
          </div>
        </section>

        {/* INFRASTRUCTURE */}
        <section id="infrastructure" className="py-28 border-b border-[#E2E8F0] bg-[#F1F3F7]/20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                The Infrastructure
              </span>
              <h2 className="font-serif font-bold text-3xl text-[#0A2540]">
                Built as commerce trust infrastructure.
              </h2>
              <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed">
                Not just OTP. Not just static blacklist lists. CODShield creates an active, real-time trust layer for your store, evaluating checkout integrity before labels are printed.
              </p>
            </div>

            <div className="mt-16 max-w-4xl mx-auto space-y-3">
              {[
                {
                  layer: "Layer 04",
                  name: "Protection Layer",
                  desc: "Claims, payouts, and automated reimbursement processing when a protected order fails.",
                  color: "border-[#E2E8F0] bg-white text-[#15803D]",
                },
                {
                  layer: "Layer 03",
                  name: "Fraud Layer",
                  desc: "Historical cross-merchant blacklist matching across buyer identity coordinates, devices, and addresses.",
                  color: "border-[#E2E8F0] bg-white text-[#B91C1C]",
                },
                {
                  layer: "Layer 02",
                  name: "Risk Layer",
                  desc: "Weighted scoring algorithm evaluating delivery pincodes and transactional value vectors.",
                  color: "border-[#E2E8F0] bg-white text-[#B45309]",
                },
                {
                  layer: "Layer 01",
                  name: "Trust Layer",
                  desc: "Identity, intent confirmation, and active network matching computed at check-out time.",
                  color: "border-[#E2E8F0] bg-white text-[#0055D4]",
                },
              ].map((stack, idx) => {
                const isActive = activeLayer === idx;
                return (
                  <div
                    key={stack.layer}
                    onClick={() => setActiveLayer(idx)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded px-5 py-4 cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "border-[#0055D4] bg-white scale-[1.01]"
                        : "border-[#E2E8F0] bg-[#F1F3F7]/30 text-[#64748B] hover:border-[#64748B]/55"
                    }`}
                  >
                    <span className="font-mono text-xs tracking-wider w-24 shrink-0 font-semibold">{stack.layer}</span>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-serif font-bold text-sm text-[#0A2540]">{stack.name}</h4>
                      <p className="text-xs text-[#64748B]">{stack.desc}</p>
                    </div>
                    <span
                      className={`w-1.5 h-1.5 rounded-full hidden sm:block ${
                        idx === 0 ? "bg-[#15803D]" : idx === 1 ? "bg-[#B91C1C]" : idx === 2 ? "bg-[#B45309]" : "bg-[#0055D4]"
                      }`}
                    ></span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CORE MODULES */}
        <section id="modules" className="py-28 border-b border-[#E2E8F0] bg-[#F8F9FC]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                Core Modules
              </span>
              <h2 className="font-serif font-bold text-3xl text-[#0A2540] mt-2">
                Seven modules. One unified trust layer.
              </h2>
              <p className="text-[#64748B] mt-3 text-xs sm:text-sm leading-relaxed">
                Each module queries local risk metrics to update the core trust system, generating better decisions over time.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              {/* Module 1 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-[#0A2540] border-b border-[#0055D4] pb-0.5 block w-max">
                    Intent Validation
                  </span>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-4">OTP Verification Engine</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Verifies intent via instant simulated SMS and WhatsApp confirmations at order placement.
                  </p>
                  <ul className="text-xs text-[#64748B] mt-4 space-y-1.5 font-sans">
                    <li>- Automated fallback flow</li>
                    <li>- Expiry management</li>
                    <li>- Verified check-in status</li>
                  </ul>
                </div>
                <Link
                  href="/sandbox?tab=otp"
                  className="text-xs text-[#0055D4] hover:text-[#0044B3] transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans font-mono"
                >
                  Test this module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Module 2 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-[#0A2540] border-b border-[#0055D4] pb-0.5 block w-max">
                    Network Relations
                  </span>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-4">Trust Graph Engine</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Cross-merchant networks matching phone details and address coordinates to trace repeat buyer patterns.
                  </p>
                  <ul className="text-xs text-[#64748B] mt-4 space-y-1.5 font-sans">
                    <li>- Shared identity matching</li>
                    <li>- Delivery cluster mapping</li>
                    <li>- Multi-merchant signals</li>
                  </ul>
                </div>
                <Link
                  href="/sandbox?tab=trust"
                  className="text-xs text-[#0055D4] hover:text-[#0044B3] transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans font-mono"
                >
                  Test this module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Module 3 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-[#0A2540] border-b border-[#0055D4] pb-0.5 block w-max">
                    Zone Intelligence
                  </span>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-4">Pincode Intelligence</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Maintains real-time database risk indexes on Indian postal pin codes, mapping regional default RTO rates.
                  </p>
                  <ul className="text-xs text-[#64748B] mt-4 space-y-1.5 font-sans">
                    <li>- Regional risk tracking</li>
                    <li>- Automated multiplier rules</li>
                    <li>- Courier delivery feedback</li>
                  </ul>
                </div>
                <Link
                  href="/sandbox?tab=pincode"
                  className="text-xs text-[#0055D4] hover:text-[#0044B3] transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans font-mono"
                >
                  Test this module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Module 4 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-[#0A2540] border-b border-[#0055D4] pb-0.5 block w-max">
                    Abuse History
                  </span>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-4">Fraud History Layer</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Identifies repeating refusal historical coordinates, flagging phone numbers displaying abusive behaviour.
                  </p>
                  <ul className="text-xs text-[#64748B] mt-4 space-y-1.5 font-sans">
                    <li>- High refusal blacklisting</li>
                    <li>- Historic database indices</li>
                    <li>- Custom risk exclusions</li>
                  </ul>
                </div>
                <Link
                  href="/sandbox?tab=fraud"
                  className="text-xs text-[#0055D4] hover:text-[#0044B3] transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans font-mono"
                >
                  Test this module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Module 5 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-[#0A2540] border-b border-[#0055D4] pb-0.5 block w-max">
                    Scoring Algorithms
                  </span>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-4">Dynamic Risk Engine</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Calculates a mathematical risk score (5 to 98) using a multi-factor weighting formula.
                  </p>
                  <ul className="text-xs text-[#64748B] mt-4 space-y-1.5 font-sans">
                    <li>- Logarithmic value factoring</li>
                    <li>- Weighted threat scores</li>
                    <li>- Real-time verdict outcomes</li>
                  </ul>
                </div>
                <Link
                  href="/sandbox?tab=risk"
                  className="text-xs text-[#0055D4] hover:text-[#0044B3] transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans font-mono"
                >
                  Test this module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Module 6 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-serif font-bold text-[#0A2540] border-b border-[#0055D4] pb-0.5 block w-max">
                    Compliance Tiers
                  </span>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base mt-4">Merchant Risk Scoring</h3>
                  <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                    Tracks merchant order profiles and claim behaviors to evaluate compliance tiers dynamically.
                  </p>
                  <ul className="text-xs text-[#64748B] mt-4 space-y-1.5 font-sans">
                    <li>- Claim ratio evaluation</li>
                    <li>- Auto security throttling</li>
                    <li>- Watchlist flags</li>
                  </ul>
                </div>
                <Link
                  href="/sandbox?tab=merchant"
                  className="text-xs text-[#0055D4] hover:text-[#0044B3] transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans font-mono"
                >
                  Test this module <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="py-28 border-b border-[#E2E8F0] bg-[#F1F3F7]/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-12">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                Benefits
              </span>
              <h2 className="font-serif font-bold text-3xl text-[#0A2540]">
                Why e-commerce brands scale with CODShield.
              </h2>
              <p className="text-[#64748B] text-xs leading-relaxed max-w-sm font-sans">
                A system built to protect checkouts without introducing friction to valid transactions.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Reduce Return-To-Origin", text: "Prevent costly transit overhead on deliveries that have high risk of refusal.", metric: "-11%" },
                { title: "Verify Customer Intent", text: "Ensure customer phone numbers are reachable and verified before booking delivery.", metric: "VERIFY" },
                { title: "Defend Revenue", text: "Protect profit margins against return transport and shipping logistics waste.", metric: "DEFEND" },
                { title: "Automate Logic", text: "Run seamless automated checks based on order metrics without manual review delays.", metric: "AUTOMATE" }
              ].map((benefit) => (
                <div key={benefit.title} className="border border-[#E2E8F0] bg-white p-5 rounded flex gap-4">
                  <div className="font-mono text-xs text-[#0055D4] font-semibold shrink-0">{benefit.metric}</div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#0A2540]">{benefit.title}</h4>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed font-sans">{benefit.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section id="integrations" className="py-28 border-b border-[#E2E8F0] bg-[#F8F9FC] noise-line">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                Integrations
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#0A2540]">
                Works with your existing e-commerce stack.
              </h2>
              <p className="text-[#64748B] text-xs font-sans">
                Connects directly to top store systems and courier interfaces through standardized endpoints.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-4">
              {["Shopify", "WooCommerce", "Shiprocket", "Delhivery", "NimbusPost", "Razorpay"].map((partner) => (
                <span
                  key={partner}
                  className="text-xs border border-[#E2E8F0] bg-white text-[#64748B] px-5 py-3 rounded hover:text-[#0A2540] hover:border-[#64748B]/55 transition-colors cursor-default font-sans font-semibold"
                >
                  {partner}
                </span>
              ))}
            </div>
            <p className="text-[9px] text-[#64748B] font-mono uppercase tracking-wide">
              + custom Webhook routes and API endpoints supported natively
            </p>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-28 bg-[#F8F9FC]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                Pricing
              </span>
              <h2 className="font-serif font-bold text-3xl text-[#0A2540]">
                Flexible pricing based on protection volume.
              </h2>
              <p className="text-[#64748B] text-xs font-sans">
                Choose the plan that matches your transactional scale. No hidden platform costs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
              {/* Plan 1 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base">Starter</h3>
                  <p className="text-xs text-[#64748B] mt-1 font-sans">For shops testing verification tools.</p>
                  <div className="font-mono font-semibold text-lg text-[#0A2540] mt-4">
                    2.00 INR <span className="text-[10px] text-[#64748B] font-sans">/ order verified</span>
                  </div>
                  <ul className="text-xs text-[#64748B] mt-6 space-y-2.5 border-t border-[#E2E8F0] pt-6 font-sans">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> OTP verification
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Pincode risk ratings
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Basic risk metrics
                    </li>
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 block text-center border border-[#E2E8F0] bg-white text-[#0A2540] hover:bg-[#F1F3F7] text-xs font-bold py-2.5 rounded transition-colors font-sans font-mono"
                >
                  GET STARTED
                </Link>
              </div>

              {/* Plan 2 */}
              <div className="border border-[#0055D4] bg-white rounded p-6 flex flex-col justify-between relative">
                <span className="absolute -top-3 left-6 bg-[#0055D4] text-white font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                  Growth Scale
                </span>
                <div>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base">Growth</h3>
                  <p className="text-xs text-[#64748B] mt-1 font-sans">For growing multi-region brands.</p>
                  <div className="font-mono font-semibold text-lg text-[#0A2540] mt-4">
                    3.50 INR <span className="text-[10px] text-[#64748B] font-sans">/ order verified</span>
                  </div>
                  <ul className="text-xs text-[#64748B] mt-6 space-y-2.5 border-t border-[#E2E8F0] pt-6 font-sans">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Everything in Starter
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Trust Graph analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Fraud history indexes
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Claim protection
                    </li>
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 block text-center bg-[#0055D4] hover:bg-[#0044B3] text-white text-xs font-bold py-2.5 rounded transition-colors font-sans font-mono shadow-sm"
                >
                  GET STARTED
                </Link>
              </div>

              {/* Plan 3 */}
              <div className="border border-[#E2E8F0] bg-[#F1F3F7]/40 rounded p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-[#0A2540] text-base">Enterprise</h3>
                  <p className="text-xs text-[#64748B] mt-1 font-sans">For massive transactional networks.</p>
                  <div className="font-mono font-semibold text-lg text-[#0A2540] mt-4">
                    Custom scale
                  </div>
                  <ul className="text-xs text-[#64748B] mt-6 space-y-2.5 border-t border-[#E2E8F0] pt-6 font-sans">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Everything in Growth
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> Merchant risk metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0055D4]" /> SLA-backed priority APIs
                    </li>
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 block text-center border border-[#E2E8F0] bg-white text-[#0A2540] hover:bg-[#F1F3F7] text-xs font-bold py-2.5 rounded transition-colors font-sans font-mono"
                >
                  CONTACT SALES
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#F8F9FC] border-t border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="relative rounded-lg border border-[#E2E8F0] bg-[#F1F3F7]/40 px-8 py-16 text-center overflow-hidden">
              <div className="absolute inset-0 noise-line pointer-events-none"></div>
              <h2 className="relative font-serif font-bold text-3xl text-[#0A2540]">
                Build trust before you ship.
              </h2>
              <p className="relative text-[#64748B] mt-4 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-sans font-mono">
                Secure every single cash-on-delivery order with predictive risk modeling to defend your margins.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center bg-[#0055D4] hover:bg-[#0044B3] text-white font-bold text-xs px-5 py-2.5 rounded transition-colors font-sans font-mono"
                >
                  Open Merchant Dashboard
                </Link>
                <Link
                  href="/sandbox"
                  className="inline-flex items-center border border-[#E2E8F0] bg-white hover:bg-[#F1F3F7] text-[#0A2540] font-bold text-xs px-5 py-2.5 rounded transition-colors font-sans font-mono"
                >
                  Try Sandbox Console
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
