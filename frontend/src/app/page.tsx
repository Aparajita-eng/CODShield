"use client";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import DashboardShowcase from "@/components/DashboardShowcase";
import Integrations from "@/components/Integrations";
import Pricing from "@/components/Pricing";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, TrendingDown, PackageX, PhoneOff, BarChart2, AlertTriangle, CheckCircle, Info, Smartphone, MessageSquare, Gauge, Network, History, MapPin, FileCheck, Bell, LineChart } from "lucide-react";
import { EASE, fadeUp, clipReveal, staggerContainer, staggerItem } from "@/lib/motion";

interface MockOrder {
  id: string;
  customer: string;
  location: string;
  pincode: string;
  pincodeRisk: string;
  pincodeZone: "Zone A" | "Zone B" | "Zone C";
  pincodeRto: string;
  otpStatus: string;
  otpIcon: "verified" | "pending" | "failed";
  emailStatus: string;
  phoneStatus: string;
  deviceStatus: string;
  fraudAlerts: string[];
  riskScore: number;
}

const mockOrders: MockOrder[] = [
  {
    id: "#ORD-48291",
    customer: "Rahul Sharma",
    location: "Mumbai, MH",
    pincode: "400001",
    pincodeRisk: "Low Risk",
    pincodeZone: "Zone A",
    pincodeRto: "1.2% RTO",
    otpStatus: "Verified via WhatsApp OTP",
    otpIcon: "verified",
    emailStatus: "Verified (Active 3.2 yrs)",
    phoneStatus: "Active (Registered MH)",
    deviceStatus: "Match (Safari on macOS)",
    fraudAlerts: [],
    riskScore: 12,
  },
  {
    id: "#ORD-92813",
    customer: "Amit Patel",
    location: "Darbhanga, BR",
    pincode: "847211",
    pincodeRisk: "High Risk",
    pincodeZone: "Zone C",
    pincodeRto: "31.4% RTO",
    otpStatus: "Unresponsive (3 attempts)",
    otpIcon: "failed",
    emailStatus: "Temp email (Created 2h ago)",
    phoneStatus: "Inactive / DND active",
    deviceStatus: "Suspicious VPN (Proxy detected)",
    fraudAlerts: ["Blacklisted phone number", "High volume bot behavior"],
    riskScore: 94,
  },
  {
    id: "#ORD-61048",
    customer: "Priya Nair",
    location: "Bengaluru, KA",
    pincode: "560034",
    pincodeRisk: "Moderate Risk",
    pincodeZone: "Zone B",
    pincodeRto: "12.8% RTO",
    otpStatus: "SMS Delivered · Awaiting Response",
    otpIcon: "pending",
    emailStatus: "Verified (Active 1.1 yrs)",
    phoneStatus: "Active (Registered KA)",
    deviceStatus: "Match (Chrome on iOS)",
    fraudAlerts: ["High transactional value (₹12,499)"],
    riskScore: 48,
  },
];

export default function Home() {
  const [selectedOrderIdx, setSelectedOrderIdx] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const animationsDisabled = isMounted && shouldReduceMotion;
  const currentOrder = mockOrders[selectedOrderIdx];

  // Radial progress calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.3
  const strokeDashoffset = circumference - (circumference * currentOrder.riskScore) / 100;

  // Semantic color selectors
  const getRiskColor = (score: number) => {
    if (score < 30) return "text-emerald-600 stroke-emerald-600 bg-emerald-50 border-emerald-100";
    if (score < 60) return "text-amber-500 stroke-amber-500 bg-amber-50 border-amber-100";
    return "text-red-600 stroke-red-600 bg-red-50 border-red-100";
  };

  const getRiskBadgeColor = (score: number) => {
    if (score < 30) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (score < 60) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <>
      <Navigation />

      <main className="flex-1 bg-bg-base text-ink-primary hero-grid relative min-h-screen flex items-center pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Headline and Description */}
            <div className="space-y-8 max-w-xl">
              <motion.div
                variants={animationsDisabled ? {} : fadeUp}
                initial={animationsDisabled ? "visible" : "hidden"}
                animate="visible"
                className="inline-flex items-center gap-2 border border-border-default bg-bg-raised/70 rounded px-3 py-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-wider text-ink-secondary uppercase font-bold">
                  CODShield Commerce Trust Engine
                </span>
              </motion.div>

              <div className="space-y-4">
                <motion.h1
                  variants={animationsDisabled ? {} : clipReveal}
                  initial={animationsDisabled ? "visible" : "hidden"}
                  animate="visible"
                  className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-ink-primary"
                >
                  Reduce COD Fraud Before Orders Ship.
                </motion.h1>
                
                <motion.p
                  variants={animationsDisabled ? {} : fadeUp}
                  initial={animationsDisabled ? "visible" : "hidden"}
                  animate="visible"
                  className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans"
                >
                  AI-powered fraud prevention platform for Shopify, WooCommerce and custom ecommerce stores.
                </motion.p>
              </div>

              <motion.div
                variants={animationsDisabled ? {} : fadeUp}
                initial={animationsDisabled ? "visible" : "hidden"}
                animate="visible"
                className="flex flex-wrap items-center gap-4"
              >
                <a
                  href="mailto:demo@codshield.com?subject=Book%20Demo"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold text-xs px-5 py-3.5 rounded-lg transition-colors cursor-pointer"
                >
                  Book Demo
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 border border-border-default bg-bg-base text-ink-primary font-semibold text-xs px-5 py-3.5 rounded-lg hover:bg-bg-raised transition-colors"
                >
                  View Dashboard
                </Link>
              </motion.div>
            </div>

            {/* Right Column: High-Fidelity Interactive Dashboard Preview */}
            <motion.div
              variants={animationsDisabled ? {} : fadeUp}
              initial={animationsDisabled ? "visible" : "hidden"}
              animate="visible"
              className="w-full relative"
            >
              <div className="w-full bg-white rounded-xl border border-border-default shadow-lg overflow-hidden flex flex-col md:flex-row h-[480px]">
                
                {/* Orders Sidebar List */}
                <div className="w-full md:w-[170px] border-b md:border-b-0 md:border-r border-border-default bg-bg-raised flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 scrollbar-none">
                  <div className="p-3 border-b border-border-default hidden md:block">
                    <span className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold">Incoming Orders</span>
                  </div>
                  {mockOrders.map((order, idx) => {
                    const isActive = idx === selectedOrderIdx;
                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrderIdx(idx)}
                        className={`flex flex-col gap-1.5 p-3 text-left w-auto md:w-full shrink-0 md:shrink-0 transition-colors border-b border-border-default last:border-b-0 ${
                          isActive
                            ? "bg-white border-l-2 border-l-accent"
                            : "hover:bg-bg-sunken border-l-2 border-l-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-mono text-xs font-bold text-ink-primary leading-none">{order.id}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${
                            order.riskScore < 30 ? "bg-emerald-50 text-emerald-700" :
                            order.riskScore < 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          }`}>
                            {order.riskScore}%
                          </span>
                        </div>
                        <div className="hidden md:block">
                          <div className="text-[11px] font-medium text-ink-secondary leading-none truncate">{order.customer}</div>
                          <div className="text-[9px] text-ink-tertiary leading-none mt-1">{order.location}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dashboard Detail Pane */}
                <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto bg-white">
                  
                  {/* Top Stats: Risk Score & Order Info */}
                  <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
                    <div>
                      <div className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold">Order Details</div>
                      <h4 className="font-sans font-bold text-base text-ink-primary mt-0.5">{currentOrder.customer}</h4>
                      <p className="text-xs text-ink-secondary">{currentOrder.location}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-bg-raised border border-border-default rounded-lg p-2 shrink-0">
                      {/* Gauge */}
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-12 h-12 transform -rotate-9deg">
                          <circle cx="50" cy="50" r={radius} stroke="var(--border-subtle)" strokeWidth="10" fill="transparent" />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r={radius}
                            className={getRiskColor(currentOrder.riskScore)}
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: strokeDashoffset }}
                            transition={{ duration: 0.4, ease: EASE }}
                          />
                        </svg>
                        <span className="absolute font-mono text-xs font-extrabold text-ink-primary">{currentOrder.riskScore}</span>
                      </div>
                      
                      <div className="flex flex-col pr-1">
                        <span className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider leading-none">RISK SCORE</span>
                        <span className={`text-[11px] font-bold mt-1 leading-none ${
                          currentOrder.riskScore < 30 ? "text-emerald-600" :
                          currentOrder.riskScore < 60 ? "text-amber-500" : "text-red-600"
                        }`}>
                          {currentOrder.riskScore < 30 ? "Low Risk" :
                           currentOrder.riskScore < 60 ? "Medium Risk" : "High Risk"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Section: Verification Checklist & Pincode Risk */}
                  <div className="grid sm:grid-cols-2 gap-4 my-4">
                    
                    {/* Identity Verification Check */}
                    <div className="border border-border-default rounded-lg p-3.5 bg-bg-raised/30 flex flex-col justify-between">
                      <div className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold mb-2.5">Verification Signals</div>
                      <div className="space-y-2">
                        {[
                          { label: "Email Check", status: currentOrder.emailStatus, active: !currentOrder.emailStatus.includes("Temp") },
                          { label: "Phone Status", status: currentOrder.phoneStatus, active: currentOrder.phoneStatus.includes("Active") },
                          { label: "Device Integrity", status: currentOrder.deviceStatus, active: !currentOrder.deviceStatus.includes("VPN") }
                        ].map((sig, i) => (
                          <div key={i} className="flex items-start gap-2">
                            {sig.active ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="text-xs font-semibold text-ink-primary leading-tight">{sig.label}</div>
                              <div className="text-[10px] text-ink-secondary leading-tight">{sig.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pincode & OTP Cards Stacked */}
                    <div className="flex flex-col gap-3">
                      {/* Pincode card */}
                      <div className="border border-border-default rounded-lg p-3 bg-bg-raised/30 flex items-center gap-3">
                        <div className="p-2 bg-white border border-border-default rounded shrink-0">
                          <span className="font-mono text-xs font-bold text-accent">{currentOrder.pincode}</span>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider leading-none">Pincode Integrity</div>
                          <div className="text-xs font-bold text-ink-primary mt-1 leading-none">{currentOrder.pincodeZone} · {currentOrder.pincodeRisk}</div>
                          <div className="text-[10px] text-ink-secondary mt-0.5 leading-none">{currentOrder.pincodeRto} expected</div>
                        </div>
                      </div>

                      {/* OTP Verification status */}
                      <div className="border border-border-default rounded-lg p-3 bg-bg-raised/30 flex items-center gap-3">
                        <div className="p-2 bg-white border border-border-default rounded shrink-0">
                          <Smartphone className={`w-4 h-4 ${
                            currentOrder.otpIcon === "verified" ? "text-emerald-600" :
                            currentOrder.otpIcon === "pending" ? "text-amber-500" : "text-red-500"
                          }`} />
                        </div>
                        <div>
                          <div className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider leading-none">OTP Status</div>
                          <div className="text-xs font-bold text-ink-primary mt-1 leading-none">
                            {currentOrder.otpIcon === "verified" ? "Confirmed ✓" :
                             currentOrder.otpIcon === "pending" ? "Pending" : "Failed / Timeout"}
                          </div>
                          <div className="text-[10px] text-ink-secondary mt-0.5 leading-none">{currentOrder.otpStatus}</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Alerts Section */}
                  <div className="border border-border-default rounded-lg p-3 bg-bg-raised/30">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold mb-2">
                      <Info className="w-3.5 h-3.5" />
                      Risk Evaluation Verdict
                    </div>
                    {currentOrder.fraudAlerts.length > 0 ? (
                      <div className="space-y-1.5">
                        {currentOrder.fraudAlerts.map((alert, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded px-2.5 py-1.5 text-[11px] font-medium text-red-800">
                            <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                            {alert}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded px-2.5 py-1.5 text-[11px] font-medium text-emerald-800">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        Order passed all validation checks. Safe to dispatch.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* WHY COD BUSINESSES LOSE MILLIONS */}
      <section className="bg-bg-raised border-t border-border-default">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">

          {/* Section Header */}
          <motion.div
            variants={animationsDisabled ? {} : fadeUp}
            initial={animationsDisabled ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="max-w-xl mb-16"
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-accent uppercase mb-3">
              <span className="w-3 h-px bg-accent inline-block"></span>
              The Problem
            </span>
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-ink-primary tracking-tight leading-[1.15]">
              Why COD Businesses<br />Lose Millions
            </h2>
            <p className="mt-4 text-base text-ink-secondary leading-relaxed">
              Cash-on-delivery is the default payment method for 65% of Indian e-commerce — yet it carries the highest loss surface of any fulfillment model.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            variants={animationsDisabled ? {} : staggerContainer}
            initial={animationsDisabled ? "visible" : "hidden"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              {
                icon: TrendingDown,
                stat: "35%",
                statSuffix: "avg. RTO rate",
                label: "Return-to-Origin Losses",
                description:
                  "1 in 3 COD shipments returns undelivered. Each failed trip costs 2× in forward and reverse logistics alone — before repackaging.",
              },
              {
                icon: PackageX,
                stat: "48%",
                statSuffix: "of fraud orders",
                label: "Fake & Bogus Orders",
                description:
                  "Nearly half of high-risk COD orders are placed with no purchase intent — bots, rivals, and repeat abusers exploiting open checkout flows.",
              },
              {
                icon: PhoneOff,
                stat: "₹4,200",
                statSuffix: "avg. loss per refusal",
                label: "Doorstep Refusals",
                description:
                  "Buyers refusing parcels at the door after transit is complete. The merchant absorbs shipping, handling, and restocking in full.",
              },
              {
                icon: BarChart2,
                stat: "3×",
                statSuffix: "more ops overhead",
                label: "Manual Verification Cost",
                description:
                  "Calling every COD customer to confirm intent adds 3× per-order ops cost versus prepaid — and still misses 30% of bad actors.",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={animationsDisabled ? {} : staggerItem}
                className="group relative bg-white border border-border-default rounded-xl p-6 flex flex-col gap-5 hover:border-border-strong hover:shadow-md transition-all duration-200"
              >
                {/* Icon — always --negative (#DC2626) */}
                <div className="w-10 h-10 rounded-lg border border-negative/20 bg-negative/8 flex items-center justify-center shrink-0">
                  <card.icon className="w-5 h-5 text-negative" strokeWidth={1.75} />
                </div>

                {/* Stat */}
                <div>
                  <div className="font-sans font-bold text-3xl tracking-tight leading-none text-negative">
                    {card.stat}
                  </div>
                  <div className="text-[11px] font-mono text-ink-tertiary uppercase tracking-widest mt-1">
                    {card.statSuffix}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border-default w-full" />

                {/* Label & Description */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-sans font-semibold text-[14px] text-ink-primary leading-snug">
                    {card.label}
                  </h3>
                  <p className="text-[13px] text-ink-secondary leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* THE CODSHIELD ENGINE */}
      <section className="bg-bg-base border-t border-border-default">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">

          {/* Section Header - Static / No entrance animations */}
          <div className="max-w-xl mb-16">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-accent uppercase mb-3">
              <span className="w-3 h-px bg-accent inline-block"></span>
              Core Technology
            </span>
            <h2 className="font-sans font-bold text-3xl sm:text-4xl text-ink-primary tracking-tight leading-[1.15]">
              The CODShield Engine
            </h2>
            <p className="mt-4 text-base text-ink-secondary leading-relaxed">
              Eight specialized risk and automation components working in sync to secure checkout, verify intent, and minimize RTO overhead.
            </p>
          </div>

          {/* Feature Cards Grid - Static / No entrance animations, hover only */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: MessageSquare,
                name: "OTP Engine",
                description: "Sends and verifies one-time passwords via SMS before a COD order is confirmed, catching fake or unreachable phone numbers before dispatch."
              },
              {
                icon: Gauge,
                name: "Risk Engine",
                description: "Scores every order in real time using signals like device, order history, and delivery zone, before it reaches the fulfillment queue."
              },
              {
                icon: Network,
                name: "Trust Graph Engine",
                description: "Cross-references customer identity across orders, phone numbers, and addresses to catch repeat offenders hiding behind new accounts."
              },
              {
                icon: History,
                name: "Fraud History",
                description: "Keeps a running record of refusals and RTOs per customer, so repeat fraud doesn't slip through a second time."
              },
              {
                icon: MapPin,
                name: "Pincode Intelligence",
                description: "Classifies delivery pincodes into risk zones based on historical RTO rates across India."
              },
              {
                icon: FileCheck,
                name: "Claims Engine",
                description: "Automates courier claim filing and dispute resolution when RTO losses occur, cutting manual ops work."
              },
              {
                icon: LineChart,
                name: "Analytics",
                description: "A live dashboard of fraud trends, RTO rates, and verification pass rates by region."
              },
              {
                icon: Bell,
                name: "Notification Engine",
                description: "Alerts the ops team in real time when a high-risk order is placed, before it ships."
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-white border border-border-default rounded-xl p-6 flex flex-col gap-4 hover:border-accent hover:shadow-md transition-all duration-200"
              >
                {/* Icon Badge */}
                <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-accent" strokeWidth={1.75} />
                </div>

                {/* Engine details */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-sans font-semibold text-[14px] text-ink-primary leading-snug">
                    {feature.name}
                  </h3>
                  <p className="text-[13px] text-ink-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <DashboardShowcase />
      <Integrations />
      <Pricing />
    </>
  );
}
