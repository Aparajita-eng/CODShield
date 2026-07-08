"use client";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, animate } from "framer-motion";
import { EASE, fadeUp, staggerContainer, staggerItem, clipReveal, cardHover } from "@/lib/motion";

interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

function Counter({ value, prefix = "", suffix = "", decimals = 0 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (isInView) {
      const node = ref.current;
      if (!node) return;

      const controls = animate(0, value, {
        duration: 1.4,
        ease: "easeOut",
        onUpdate(latest) {
          node.textContent = prefix + latest.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) + suffix;
        },
      });

      return () => controls.stop();
    }
  }, [value, isInView, prefix, suffix, decimals]);

  return <span ref={ref} className="font-mono">{prefix}{(0).toFixed(decimals)}{suffix}</span>;
}

// Custom merged variants for cards that stagger and hover
const cardStaggerAndHover = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  rest: { y: 0, borderColor: "rgba(237,232,223,0.14)" },
  hover: { y: -2, borderColor: "rgba(201,154,75,0.4)", transition: { duration: 0.2 } }
};

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

      <main className="flex-1 bg-bg-base text-ink-primary">
        {/* HERO SECTION - Base Background with Grid */}
        <section className="relative pt-32 pb-24 border-b border-border-subtle bg-bg-base hero-grid">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
            
            <div className="space-y-8">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="inline-flex items-center gap-2 border border-border-default bg-bg-raised/50 rounded px-3 py-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-wider text-ink-secondary uppercase font-semibold">
                  Beta Release
                </span>
              </motion.div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={clipReveal}
              >
                <h1 className="font-serif font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-ink-primary">
                  Protect every COD order before it ships.
                </h1>
              </motion.div>

              <motion.p 
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-ink-secondary max-w-xl leading-relaxed font-sans"
              >
                A programmatic trust infrastructure layer that evaluates checkout intent. Verify buyer identities, rate regional postal zones, block repeat refusals, and protect dispatch margin.
              </motion.p>

              <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-4 pt-2"
              >
                <Link
                  href="/sandbox"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent/80 text-bg-base font-semibold text-xs px-5 py-3.5 rounded transition-colors"
                >
                  Open Sandbox Console
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 border border-border-default bg-bg-raised/40 text-ink-primary font-semibold text-xs px-5 py-3.5 rounded hover:bg-bg-raised/80 transition-colors"
                >
                  Access Merchant Dashboard
                </Link>
              </motion.div>

              {/* Specific pilot stats - Animated */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-border-subtle pt-8 mt-4"
              >
                <div>
                  <div className="font-mono font-semibold text-2xl text-ink-primary">
                    <Counter value={11} suffix="%" />
                  </div>
                  <div className="text-[10px] font-mono text-ink-secondary mt-1.5 uppercase tracking-wider">
                    RTO REDUCTION IN PILOT
                  </div>
                </div>
                <div>
                  <div className="font-mono font-semibold text-2xl text-ink-primary">
                    <Counter value={42100} prefix="~" />
                  </div>
                  <div className="text-[10px] font-mono text-ink-secondary mt-1.5 uppercase tracking-wider">
                    MONTHLY ORDERS EVALUATED
                  </div>
                </div>
                <div>
                  <div className="font-mono font-semibold text-2xl text-accent">
                    <Counter value={5} suffix=" / mo" />
                  </div>
                  <div className="text-[10px] font-mono text-ink-secondary mt-1.5 uppercase tracking-wider">
                    BETA ONBOARDING CAP
                  </div>
                </div>
                <div>
                  <div className="font-mono font-semibold text-2xl text-ink-primary">
                    <Counter value={2.1} prefix="₹" suffix="L" decimals={1} />
                  </div>
                  <div className="text-[10px] font-mono text-ink-secondary mt-1.5 uppercase tracking-wider">
                    FRAUD PREVENTED SINCE MAR
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Line Chart aligned to Brand colors */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative"
            >
              <div className="relative rounded-lg border border-border-default bg-bg-raised/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider">PILOT METRIC ANALYSIS</span>
                    <h4 className="font-serif font-bold text-sm text-ink-primary mt-0.5">RTO Rate Evolution (First 90 Days)</h4>
                  </div>
                  <span className="text-[9px] font-mono border border-border-default px-2 py-0.5 text-ink-secondary rounded">
                    Apparel Category
                  </span>
                </div>

                <svg viewBox="0 0 400 240" className="w-full h-auto text-ink-secondary">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="380" y2="30" stroke="rgba(237,232,223,0.08)" strokeWidth="1" />
                  <line x1="40" y1="75" x2="380" y2="75" stroke="rgba(237,232,223,0.08)" strokeWidth="1" />
                  <line x1="40" y1="120" x2="380" y2="120" stroke="rgba(237,232,223,0.08)" strokeWidth="1" />
                  <line x1="40" y1="165" x2="380" y2="165" stroke="rgba(237,232,223,0.08)" strokeWidth="1" />
                  <line x1="40" y1="210" x2="380" y2="210" stroke="rgba(237,232,223,0.08)" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="30" y="34" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#A39C8E">40%</text>
                  <text x="30" y="79" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#A39C8E">30%</text>
                  <text x="30" y="124" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#A39C8E">20%</text>
                  <text x="30" y="169" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#A39C8E">10%</text>
                  <text x="30" y="214" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="end" fill="#A39C8E">0%</text>

                  {/* X Axis Labels */}
                  <text x="40" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#A39C8E">Day 0</text>
                  <text x="125" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#A39C8E">Day 30</text>
                  <text x="210" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#A39C8E">Day 60</text>
                  <text x="295" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#A39C8E">Day 90</text>
                  <text x="380" y="228" fontSize="9" fontFamily="var(--font-jetbrains-mono), monospace" textAnchor="middle" fill="#A39C8E">Day 120</text>

                  {/* Line 1: Without CODShield (Dashed Slate) */}
                  <path
                    d="M40,79 L125,75 L210,81 L295,73 L380,77"
                    fill="none"
                    stroke="rgba(237,232,223,0.3)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  
                  {/* Line 2: With CODShield Active (Solid Brand Blue) */}
                  <path
                    d="M40,79 L125,120 L210,145 L295,160 L380,165"
                    fill="none"
                    stroke="#C99A4B"
                    strokeWidth="2"
                  />

                  {/* Data Points */}
                  <circle cx="380" cy="165" r="3.5" fill="#C99A4B" />
                  <circle cx="380" cy="77" r="3" fill="#A39C8E" />
                </svg>

                {/* Legend */}
                <div className="flex justify-start gap-6 mt-4 pt-3 border-t border-border-subtle text-[10px] font-mono text-ink-secondary">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-accent inline-block"></span>
                    <span>CODShield protected (RTO drops to 11.2%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-ink-secondary/50 inline-block"></span>
                    <span>Control group (Unprotected baseline ~29%)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* THE PROBLEM - Raised Background */}
        <section className="py-28 border-b border-border-subtle bg-bg-raised">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
                The Problem
              </span>
              <h2 className="font-serif font-bold text-3xl text-ink-primary mt-2">
                COD is costing merchants more than they realize.
              </h2>
              <p className="text-ink-secondary mt-4 text-xs sm:text-sm leading-relaxed font-sans">
                Every unverified shipment carries hidden risks, and by the time it is flagged at the customer doorstep, shipping costs are already wasted.
              </p>
            </div>

            {/* Card grid with stagger container & cards stagger item */}
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
            >
              {[
                { num: "01", title: "Fake COD orders", desc: "Orders placed with no real buying intent, often generated by automated bots or bulk abuse campaigns." },
                { num: "02", title: "Wrong addresses", desc: "Incomplete, invalid, or unreachable delivery details that guarantee a failed attempt." },
                { num: "03", title: "Customer refusal", desc: "Buyers rejecting parcels at their doorsteps after the product has traveled across transit hubs." },
                { num: "04", title: "High RTO losses", desc: "Return-to-origin freight costs consume margins in both directions, plus repackaging overhead." },
                { num: "05", title: "Inventory lock", desc: "Capital sits tied up in locked inventory traveling towards orders that never convert." },
                { num: "06", title: "Shipping waste", desc: "Every failed delivery creates direct waste across packaging materials, warehousing, and logistics." }
              ].map((item) => (
                <motion.div 
                  key={item.num}
                  variants={staggerItem}
                  className="border border-border-default bg-bg-base/40 rounded p-6"
                >
                  <span className="font-mono text-xs text-negative font-semibold">{item.num}</span>
                  <h3 className="font-serif font-bold text-ink-primary text-base mt-2">{item.title}</h3>
                  <p className="text-xs text-ink-secondary mt-2 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* LOSS ANALYTICS BAR CHART - Muted Warm Grays with single Accent */}
            <div className="border border-border-default bg-bg-base/30 rounded-lg p-6 mt-12">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider">Historical RTO losses</div>
                  <h3 className="font-serif font-bold text-ink-primary text-base mt-1">
                    Monthly control group losses without protection
                  </h3>
                </div>
                <div className="text-[10px] font-mono text-accent border border-border-default bg-bg-base rounded px-3 py-1 font-semibold">
                  Averaging ₹18.4L exposure / month in pilot
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-end h-40 pt-4">
                {[38, 52, 44, 68, 58, 80, 74, 90, 100, 86, 96, 98].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: EASE, delay: i * 0.05 }}
                    className={`rounded-t-sm ${i === 11 ? "bg-accent" : "bg-ink-secondary/20"}`}
                    style={{ height: `${height}%`, originY: 1 }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-ink-secondary mt-3 px-1">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
              </div>
            </div>
          </div>
        </section>

        {/* INFRASTRUCTURE - Base Background */}
        <section id="infrastructure" className="py-28 border-b border-border-subtle bg-bg-base">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
                The Infrastructure
              </span>
              <h2 className="font-serif font-bold text-3xl text-ink-primary">
                Built as commerce trust infrastructure.
              </h2>
              <p className="text-ink-secondary text-xs sm:text-sm leading-relaxed">
                Not just OTP. Not just static blacklist lists. CODShield creates an active, real-time trust layer for your store, evaluating checkout integrity before labels are printed.
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mt-16 max-w-4xl mx-auto space-y-3"
            >
              {[
                {
                  layer: "Layer 04",
                  name: "Protection Layer",
                  desc: "Claims, payouts, and automated reimbursement processing when a protected order fails.",
                  color: "border-border-default text-accent",
                },
                {
                  layer: "Layer 03",
                  name: "Fraud Layer",
                  desc: "Historical cross-merchant blacklist matching across buyer identity coordinates, devices, and addresses.",
                  color: "border-border-default text-negative",
                },
                {
                  layer: "Layer 02",
                  name: "Risk Layer",
                  desc: "Weighted scoring algorithm evaluating delivery pincodes and transactional value vectors.",
                  color: "border-border-default text-accent",
                },
                {
                  layer: "Layer 01",
                  name: "Trust Layer",
                  desc: "Identity, intent confirmation, and active network matching computed at check-out time.",
                  color: "border-border-default text-ink-primary",
                },
              ].map((stack, idx) => {
                const isActive = activeLayer === idx;
                return (
                  <motion.div
                    key={stack.layer}
                    variants={staggerItem}
                    onClick={() => setActiveLayer(idx)}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 border rounded px-5 py-4 cursor-pointer transition-all duration-300 ${
                      isActive
                        ? "border-accent bg-accent-muted scale-[1.01]"
                        : "border-border-default bg-bg-raised/30 text-ink-secondary hover:border-accent/40"
                    }`}
                  >
                    <span className="font-mono text-xs tracking-wider w-24 shrink-0 font-semibold">{stack.layer}</span>
                    <div className="flex-1 space-y-0.5">
                      <h4 className="font-serif font-bold text-sm text-ink-primary">{stack.name}</h4>
                      <p className="text-xs text-ink-secondary">{stack.desc}</p>
                    </div>
                    <span
                      className={`w-1.5 h-1.5 rounded-full hidden sm:block ${
                        idx === 0 ? "bg-accent" : idx === 1 ? "bg-negative" : idx === 2 ? "bg-accent" : "bg-ink-secondary"
                      }`}
                    ></span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* CORE MODULES - Raised Background */}
        <section id="modules" className="py-28 border-b border-border-subtle bg-bg-raised">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
                Core Modules
              </span>
              <h2 className="font-serif font-bold text-3xl text-ink-primary mt-2">
                Seven modules. One unified trust layer.
              </h2>
              <p className="text-ink-secondary mt-3 text-xs sm:text-sm leading-relaxed">
                Each module queries local risk metrics to update the core trust system, generating better decisions over time.
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
            >
              {[
                { tag: "Intent Validation", title: "OTP Verification Engine", desc: "Verifies intent via simulated SMS and WhatsApp confirmations at order placement.", items: ["Automated fallback flow", "Expiry management", "Verified check-in status"], tab: "otp" },
                { tag: "Network Relations", title: "Trust Graph Engine", desc: "Cross-merchant networks matching phone details and address coordinates to trace repeat buyer patterns.", items: ["Shared identity matching", "Delivery cluster mapping", "Multi-merchant signals"], tab: "trust" },
                { tag: "Zone Intelligence", title: "Pincode Intelligence", desc: "Maintains real-time database risk indexes on Indian postal pin codes, mapping regional default RTO rates.", items: ["Regional risk tracking", "Automated multiplier rules", "Courier delivery feedback"], tab: "pincode" },
                { tag: "Abuse History", title: "Fraud History Layer", desc: "Identifies repeating refusal historical coordinates, flagging phone numbers displaying abusive behaviour.", items: ["High refusal blacklisting", "Historic database indices", "Custom risk exclusions"], tab: "fraud" },
                { tag: "Scoring Algorithms", title: "Dynamic Risk Engine", desc: "Calculates a mathematical risk score (5 to 98) using a multi-factor weighting formula.", items: ["Logarithmic value factoring", "Weighted threat scores", "Real-time verdict outcomes"], tab: "risk" },
                { tag: "Compliance Tiers", title: "Merchant Risk Scoring", desc: "Tracks merchant order profiles and claim behaviors to evaluate compliance tiers dynamically.", items: ["Claim ratio evaluation", "Auto security throttling", "Watchlist flags"], tab: "merchant" }
              ].map((mod) => (
                <motion.div 
                  key={mod.title}
                  initial="rest"
                  whileHover="hover"
                  variants={cardStaggerAndHover}
                  className="border bg-bg-base/40 rounded p-6 flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-xs font-serif font-bold text-ink-primary border-b border-accent pb-0.5 block w-max">
                      {mod.tag}
                    </span>
                    <h3 className="font-serif font-bold text-ink-primary text-base mt-4">{mod.title}</h3>
                    <p className="text-xs text-ink-secondary mt-2 leading-relaxed">
                      {mod.desc}
                    </p>
                    <ul className="text-xs text-ink-secondary mt-4 space-y-1.5 font-sans">
                      {mod.items.map((it) => (
                        <li key={it}>- {it}</li>
                      ))}
                    </ul>
                  </div>
                  <Link
                    href={`/sandbox?tab=${mod.tab}`}
                    className="text-xs text-accent hover:text-accent/80 transition-colors inline-flex items-center gap-1.5 mt-6 font-semibold font-sans group/link"
                  >
                    Test this module 
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-[3px] transition-transform duration-[150ms] ease-out" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* BENEFITS - Base Background */}
        <section className="py-28 border-b border-border-subtle bg-bg-base">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-[0.8fr_1.2fr] gap-12">
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
                Benefits
              </span>
              <h2 className="font-serif font-bold text-3xl text-ink-primary">
                Why e-commerce brands scale with CODShield.
              </h2>
              <p className="text-ink-secondary text-xs leading-relaxed max-w-sm font-sans">
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
                <div key={benefit.title} className="border border-border-default bg-bg-raised/40 p-5 rounded flex gap-4">
                  <div className="font-mono text-xs text-accent font-semibold shrink-0">{benefit.metric}</div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-ink-primary">{benefit.title}</h4>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed font-sans">{benefit.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTEGRATIONS - Raised Background */}
        <section id="integrations" className="py-28 border-b border-border-subtle bg-bg-raised">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center space-y-6">
            <div className="max-w-xl mx-auto space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
                Integrations
              </span>
              <h2 className="font-serif font-bold text-2xl text-ink-primary">
                Works with your existing e-commerce stack.
              </h2>
              <p className="text-ink-secondary text-xs font-sans">
                Connects directly to top store systems and courier interfaces through standardized endpoints.
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-3 pt-4"
            >
              {["Shopify", "WooCommerce", "Shiprocket", "Delhivery", "NimbusPost", "Razorpay"].map((partner) => (
                <motion.span
                  key={partner}
                  variants={staggerItem}
                  className="text-xs border border-border-default bg-bg-base text-ink-secondary px-5 py-3 rounded opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-default font-sans font-semibold"
                >
                  {partner}
                </motion.span>
              ))}
            </motion.div>
            <p className="text-[9px] text-ink-tertiary font-mono uppercase tracking-wide">
              + custom Webhook routes and API endpoints supported natively
            </p>
          </div>
        </section>

        {/* PRICING - Base Background */}
        <section id="pricing" className="py-28 bg-bg-base">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <span className="text-[10px] font-mono tracking-wider text-ink-tertiary uppercase">
                Pricing
              </span>
              <h2 className="font-serif font-bold text-3xl text-ink-primary">
                Flexible pricing based on protection volume.
              </h2>
              <p className="text-ink-secondary text-xs font-sans">
                Choose the plan that matches your transactional scale. No hidden platform costs.
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
            >
              {/* Plan 1 */}
              <motion.div 
                variants={staggerItem}
                className="border border-border-default bg-bg-raised/40 rounded p-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Starter</h3>
                  <p className="text-xs text-ink-secondary mt-1 font-sans">For shops testing verification tools.</p>
                  <div className="font-mono font-semibold text-lg text-ink-primary mt-4">
                    2.00 INR <span className="text-[10px] text-ink-secondary font-sans">/ order verified</span>
                  </div>
                  <ul className="text-xs text-ink-secondary mt-6 space-y-2.5 border-t border-border-subtle pt-6 font-sans">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> OTP verification
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Pincode risk ratings
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Basic risk metrics
                    </li>
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 block text-center border border-border-default bg-bg-base text-ink-primary hover:bg-bg-raised text-xs font-bold py-2.5 rounded transition-colors font-sans font-mono"
                >
                  GET STARTED
                </Link>
              </motion.div>

              {/* Plan 2 - Growth (Featured Card) */}
              <motion.div 
                variants={staggerItem}
                className="border border-accent bg-bg-raised rounded p-6 flex flex-col justify-between relative"
              >
                <span className="absolute -top-3 left-6 bg-accent text-bg-base font-mono text-[9px] font-bold px-2.5 py-0.5 rounded uppercase">
                  Growth Scale
                </span>
                <div>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Growth</h3>
                  <p className="text-xs text-ink-secondary mt-1 font-sans">For growing multi-region brands.</p>
                  <div className="font-mono font-semibold text-lg text-ink-primary mt-4">
                    3.50 INR <span className="text-[10px] text-ink-secondary font-sans">/ order verified</span>
                  </div>
                  <ul className="text-xs text-ink-secondary mt-6 space-y-2.5 border-t border-border-subtle pt-6 font-sans">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Everything in Starter
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Trust Graph analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Fraud history indexes
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Claim protection
                    </li>
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 block text-center bg-accent hover:bg-accent/80 text-bg-base text-xs font-bold py-2.5 rounded transition-colors font-sans font-mono shadow-sm"
                >
                  GET STARTED
                </Link>
              </motion.div>

              {/* Plan 3 */}
              <motion.div 
                variants={staggerItem}
                className="border border-border-default bg-bg-raised/40 rounded p-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-serif font-bold text-ink-primary text-base">Enterprise</h3>
                  <p className="text-xs text-ink-secondary mt-1 font-sans">For massive transactional networks.</p>
                  <div className="font-mono font-semibold text-lg text-ink-primary mt-4">
                    Custom scale
                  </div>
                  <ul className="text-xs text-ink-secondary mt-6 space-y-2.5 border-t border-border-subtle pt-6 font-sans">
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Everything in Growth
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Merchant risk metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" /> SLA-backed priority APIs
                    </li>
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className="mt-8 block text-center border border-border-default bg-bg-base text-ink-primary hover:bg-bg-raised text-xs font-bold py-2.5 rounded transition-colors font-sans font-mono"
                >
                  CONTACT SALES
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-bg-base border-t border-border-subtle">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="relative rounded-lg border border-border-default bg-bg-raised/40 px-8 py-16 text-center overflow-hidden">
              <h2 className="relative font-serif font-bold text-3xl text-ink-primary">
                Build trust before you ship.
              </h2>
              <p className="relative text-ink-secondary mt-4 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-sans">
                Secure every single cash-on-delivery order with predictive risk modeling to defend your margins.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center bg-accent hover:bg-accent/80 text-bg-base font-bold text-xs px-5 py-2.5 rounded transition-colors font-sans"
                >
                  Open Merchant Dashboard
                </Link>
                <Link
                  href="/sandbox"
                  className="inline-flex items-center border border-border-default bg-bg-base hover:bg-bg-raised text-ink-primary font-bold text-xs px-5 py-2.5 rounded transition-colors font-sans"
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
