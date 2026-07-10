"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Cpu, 
  Ban, 
  PieChart as PieIcon, 
  Settings, 
  Search, 
  BellRing,
  User 
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer
} from "recharts";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { useIsClient } from "@/lib/hooks";

const showcaseOrders = [
  { id: "#ORD-88231", customer: "Amit Sharma", city: "Mumbai", amount: "₹4,820", risk: "Low", score: 12 },
  { id: "#ORD-91204", customer: "Priya Patel", city: "Ahmedabad", amount: "₹12,450", risk: "High", score: 85 },
  { id: "#ORD-76291", customer: "Rohan Verma", city: "New Delhi", amount: "₹3,190", risk: "Medium", score: 48 },
  { id: "#ORD-54129", customer: "Ananya Rao", city: "Bangalore", amount: "₹8,600", risk: "Low", score: 18 },
  { id: "#ORD-33290", customer: "Vikram Singh", city: "Jaipur", amount: "₹5,200", risk: "Medium", score: 55 },
  { id: "#ORD-12908", customer: "Karan Johar", city: "Pune", amount: "₹1,850", risk: "Low", score: 8 },
  { id: "#ORD-48291", customer: "Deepika Sen", city: "Kolkata", amount: "₹9,300", risk: "High", score: 92 }
];

const showcaseAlerts = [
  { message: "Repeat refusal detected — 3rd attempt, Jaipur 302001", time: "3m ago" },
  { message: "Disposable email domain used during checkout", time: "18m ago" },
  { message: "High velocity checkouts from same IP (Mumbai)", time: "1h ago" },
  { message: "Address matches known RTO list for Surat", time: "2h ago" }
];

const showcaseActivity = [
  { action: "Verification completed", details: "#ORD-54129 (OTP Authenticated)", time: "2m ago" },
  { action: "Order flagged high-risk", details: "#ORD-48291 (Claims history)", time: "14m ago" },
  { action: "Auto-dispatched order", details: "#ORD-88231 (Trust Score 98%)", time: "25m ago" },
  { action: "Claim filed successfully", details: "BlueDart Waybill #99837", time: "45m ago" }
];

// Recharts data styled entirely with design system custom property references
const pieData = [
  { name: "Low Risk", value: 62, color: "var(--positive)" },
  { name: "Medium Risk", value: 28, color: "var(--warning)" },
  { name: "High Risk", value: 10, color: "var(--negative)" }
];

export default function DashboardShowcase() {
  const isMounted = useIsClient();
  const [activeTab, setActiveTab] = useState("Overview");
  const shouldReduceMotion = useReducedMotion();

  const animationsDisabled = isMounted && shouldReduceMotion;

  // Aggregate stats calculations
  const aggScore = 32;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (aggScore / 100) * circumference;

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case "Low":
        return "text-positive bg-positive/8 border-positive/20";
      case "Medium":
        return "text-warning bg-warning/8 border-warning/20";
      case "High":
        return "text-negative bg-negative/8 border-negative/20";
      default:
        return "text-ink-secondary bg-bg-sunken border-border-default";
    }
  };

  return (
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
            Merchant Workspace
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-ink-primary tracking-tight leading-[1.15]">
            The Merchant Console
          </h2>
          <p className="mt-4 text-base text-ink-secondary leading-relaxed">
            Monitor real-time checkout verifications, review automated claims, and track risk vectors across all your distribution routes.
          </p>
        </motion.div>

        {/* Browser Chrome style container */}
        <motion.div
          variants={animationsDisabled ? {} : fadeUp}
          initial={animationsDisabled ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="w-full bg-bg-base border border-border-default rounded-xl shadow-lg overflow-hidden flex flex-col font-sans"
        >
          {/* Browser Top Bar */}
          <div className="bg-bg-sunken border-b border-border-default px-4 py-3 flex items-center justify-between">
            {/* Control dots */}
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-negative/35 border border-negative/40"></span>
              <span className="w-3 h-3 rounded-full bg-warning/35 border border-warning/40"></span>
              <span className="w-3 h-3 rounded-full bg-positive/35 border border-positive/40"></span>
            </div>
            
            {/* Address Bar */}
            <div className="bg-bg-base border border-border-default rounded px-6 py-1 text-[11px] font-mono text-ink-secondary flex items-center gap-2 select-none w-1/3 min-w-[200px] justify-center">
              <span className="text-accent opacity-50 font-bold">https://</span>
              <span>dashboard.codshield.com</span>
            </div>

            {/* Dummy window actions */}
            <div className="w-12"></div>
          </div>

          {/* Core Dashboard Frame */}
          <div className="flex flex-1 min-h-[620px]">
            
            {/* Sidebar component - collapsed/hidden on mobile to prevent layout breakdown */}
            <aside className="w-52 border-r border-border-default bg-bg-raised hidden md:flex flex-col p-4 justify-between shrink-0">
              <div className="space-y-6">
                {/* Product Title */}
                <div className="px-2 py-1 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center text-ink-inverse text-[10px] font-bold">
                    C
                  </div>
                  <span className="text-xs font-bold text-ink-primary tracking-tight">CODShield Console</span>
                </div>

                {/* Sidebar Navigation */}
                <nav className="space-y-1">
                  {[
                    { name: "Overview", icon: LayoutDashboard },
                    { name: "Orders", icon: ShoppingBag },
                    { name: "Risk Engine", icon: Cpu },
                    { name: "Fraud Alerts", icon: Ban },
                    { name: "Analytics", icon: PieIcon },
                    { name: "Settings", icon: Settings }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;
                    return (
                      <button
                        key={item.name}
                        onClick={() => setActiveTab(item.name)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          isActive 
                            ? "bg-accent-muted text-accent" 
                            : "text-ink-secondary hover:bg-bg-sunken hover:text-ink-primary"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                        {item.name}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Sidebar footer user profile */}
              <div className="border-t border-border-default pt-4 flex items-center gap-2.5 px-2">
                <div className="w-7 h-7 rounded-full bg-accent-muted flex items-center justify-center border border-accent/10">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold text-ink-primary truncate leading-tight">FastCommerce Inc.</span>
                  <span className="text-[9px] text-ink-tertiary truncate leading-none">Enterprise Plan</span>
                </div>
              </div>
            </aside>

            {/* Main Console Workspace */}
            <main className="flex-1 bg-bg-base flex flex-col min-w-0">
              
              {/* Internal Dashboard Header / Top Nav */}
              <header className="border-b border-border-default px-6 py-4 flex items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
                  <input 
                    type="text" 
                    placeholder="Search by order ID, phone, city..."
                    disabled
                    className="w-full bg-bg-raised border border-border-default rounded-md pl-8 pr-3 py-1.5 text-xs text-ink-primary outline-none placeholder:text-ink-tertiary"
                  />
                </div>

                {/* Left profile and notification controls */}
                <div className="flex items-center gap-4">
                  <button className="relative w-8 h-8 rounded-md border border-border-default flex items-center justify-center hover:bg-bg-raised transition-colors cursor-not-allowed">
                    <BellRing className="w-4 h-4 text-ink-secondary" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-negative"></span>
                  </button>
                  <div className="h-6 w-px bg-border-default"></div>
                  <span className="text-xs font-medium text-ink-secondary">Mumbai Gateway</span>
                </div>
              </header>

              {/* Main Content Scroll container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Dashboard Metrics Row */}
                <div className="grid sm:grid-cols-3 gap-5">
                  
                  {/* Gauge Risk Card */}
                  <div className="border border-border-default bg-bg-raised/40 rounded-xl p-5 flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold">Consolidated Risk</span>
                      <h4 className="text-2xl font-bold font-mono text-ink-primary leading-none">32%</h4>
                      <p className="text-[10px] text-ink-secondary leading-relaxed">
                        Aggregate checkout risk matches the low-mid threshold targets.
                      </p>
                    </div>
                    {/* Gauge circle matching the Hero dashboard pattern */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 100 100" className="w-16 h-16 transform -rotate-90">
                        <circle cx="50" cy="50" r={radius} stroke="var(--border-subtle)" strokeWidth="10" fill="transparent" />
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="stroke-warning"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                        />
                      </svg>
                      <span className="absolute font-mono text-xs font-extrabold text-ink-primary">{aggScore}%</span>
                    </div>
                  </div>

                  {/* Recharts Pie Chart representation */}
                  <div className="border border-border-default bg-bg-raised/40 rounded-xl p-5 flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between border-b border-border-default/40 pb-2">
                      <span className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold">Distribution Share</span>
                      <span className="text-[9px] font-mono text-positive bg-positive/8 border border-positive/10 px-1.5 py-0.5 rounded uppercase font-bold">Stable</span>
                    </div>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                        {isMounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={22}
                                outerRadius={36}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 text-ink-secondary">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                              {d.name}
                            </div>
                            <span className="font-mono font-bold text-ink-primary">{d.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity List */}
                  <div className="border border-border-default bg-bg-raised/40 rounded-xl p-5 flex flex-col justify-between">
                    <span className="text-[9px] font-mono text-ink-tertiary uppercase tracking-wider font-semibold mb-3 block">Recent Activity</span>
                    <div className="space-y-3 flex-1">
                      {showcaseActivity.map((act, i) => (
                        <div key={i} className="flex justify-between items-start gap-2 text-[10px]">
                          <div className="min-w-0">
                            <span className="font-bold text-ink-primary block leading-tight">{act.action}</span>
                            <span className="text-ink-secondary block truncate mt-0.5 leading-none">{act.details}</span>
                          </div>
                          <span className="text-[9px] font-mono text-ink-tertiary shrink-0">{act.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Bottom Main Content Rows: Orders & Fraud Alerts */}
                <div className="grid lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Orders Table component */}
                  <div className="border border-border-default rounded-xl bg-bg-base overflow-hidden lg:col-span-2 flex flex-col">
                    <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-ink-primary tracking-tight">TRANSACTION MONITOR</span>
                      <span className="text-[9px] font-mono text-ink-tertiary uppercase">Updated real-time</span>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                        <thead>
                          <tr className="border-b border-border-default bg-bg-raised text-[9px] font-mono text-ink-tertiary uppercase font-semibold">
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Customer</th>
                            <th className="py-3 px-4">City</th>
                            <th className="py-3 px-4">Amount</th>
                            <th className="py-3 px-4 text-center">Score</th>
                            <th className="py-3 px-4 text-right">Verdict</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                          {showcaseOrders.map((ord, idx) => (
                            <tr key={idx} className="hover:bg-bg-raised/40 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-semibold text-ink-secondary">{ord.id}</td>
                              <td className="py-3.5 px-4 font-semibold text-ink-primary">{ord.customer}</td>
                              <td className="py-3.5 px-4 text-ink-secondary">{ord.city}</td>
                              <td className="py-3.5 px-4 font-mono text-ink-primary font-bold">{ord.amount}</td>
                              <td className="py-3.5 px-4 text-center font-mono text-ink-secondary">{ord.score}</td>
                              <td className="py-3.5 px-4 text-right">
                                <span className={`inline-block text-[9px] font-mono border px-2 py-0.5 rounded font-bold uppercase ${getRiskBadgeStyles(ord.risk)}`}>
                                  {ord.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Fraud Alerts component */}
                  <div className="border border-border-default rounded-xl bg-bg-base flex flex-col">
                    <div className="px-5 py-4 border-b border-border-default">
                      <span className="text-xs font-mono font-bold text-ink-primary tracking-tight">SYSTEM RISK ALERTS</span>
                    </div>
                    <div className="flex-1 divide-y divide-border-subtle">
                      {showcaseAlerts.map((alert, i) => (
                        <div key={i} className="p-4 hover:bg-bg-raised/40 transition-colors flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-negative bg-negative/8 border border-negative/10 px-1.5 py-0.5 rounded uppercase font-bold">
                              High Risk
                            </span>
                            <span className="text-[9px] font-mono text-ink-tertiary">{alert.time}</span>
                          </div>
                          <p className="text-[11px] text-ink-primary leading-relaxed font-medium">
                            {alert.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </main>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
