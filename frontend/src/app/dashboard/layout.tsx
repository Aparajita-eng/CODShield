"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  MapPin,
  ShieldAlert,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  User,
  ChevronDown
} from "lucide-react";

// Define nav items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/pincode-intelligence", label: "Pincode Intelligence", icon: MapPin },
  { href: "/dashboard/fraud-center", label: "Fraud Center", icon: ShieldAlert },
  { href: "/dashboard/claims", label: "Claims", icon: FileText },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Sample notifications data
const notifications = [
  { id: 1, title: "High Risk Order Flagged", time: "2m ago", type: "warning" },
  { id: 2, title: "Pincode Risk Zone Updated", time: "15m ago", type: "info" },
  { id: 3, title: "New Claim Submitted", time: "1h ago", type: "alert" },
  { id: 4, title: "OTP Verification Success", time: "2h ago", type: "success" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Close mobile sidebar on path change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-notification-dropdown]')) {
        setIsNotificationOpen(false);
      }
      if (!target.closest('[data-profile-dropdown]')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get active nav item to display section title
  const activeNavItem = navItems.find(item => pathname === item.href);
  const sectionTitle = activeNavItem?.label || "Dashboard";

  return (
    <div className="min-h-screen bg-bg-base text-ink-primary font-sans flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isDesktop ? 0 : isSidebarOpen ? 0 : "-100%",
        }}
        transition={{ type: "tween", duration: 0.2 }}
        className="fixed left-0 top-0 h-full w-64 bg-bg-raised border-r border-border-default z-50 flex flex-col"
      >
        {/* Logo section */}
        <div className="p-6 border-b border-border-default flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path
              d="M13 1.5L23.5 6V13C23.5 19.2 19.2 23.8 13 24.9C6.8 23.8 2.5 19.2 2.5 13V6L13 1.5Z"
              stroke="var(--accent)"
              strokeWidth="2"
              fill="var(--accent-muted)"
            />
            <path
              d="M8.5 13.2L11.4 16.1L17.6 9.6"
              stroke="var(--ink-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="flex flex-col justify-center gap-[3px]">
            <span className="font-sans font-extrabold text-xs tracking-[0.12em] leading-none uppercase">
              <span className="text-ink-primary">COD</span>
              <span className="text-accent">Shield</span>
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-ink-secondary leading-none uppercase">
              Trust Infrastructure
            </span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="ml-auto lg:hidden text-ink-secondary hover:text-ink-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent-muted text-accent border-l-2 border-accent"
                    : "text-ink-secondary hover:bg-bg-sunken hover:text-ink-primary border-l-2 border-transparent"
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-bg-base border-b border-border-default px-4 lg:px-6 h-14 flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-ink-secondary hover:text-ink-primary"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Section title */}
          <h1 className="font-semibold text-sm text-ink-primary">{sectionTitle}</h1>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden sm:flex items-center gap-2 bg-bg-raised border border-border-default rounded-lg px-3 py-2 w-64 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent">
            <Search className="w-4 h-4 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-xs text-ink-primary placeholder:text-ink-tertiary w-full"
            />
          </div>
          <button className="sm:hidden text-ink-secondary hover:text-ink-primary">
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Notifications */}
          <div className="relative" data-notification-dropdown>
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsProfileOpen(false);
              }}
              className="relative p-2 rounded-lg text-ink-secondary hover:bg-bg-raised hover:text-ink-primary transition-colors"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-negative rounded-full"></span>
            </button>
            <AnimatePresence>
              {isNotificationOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-2 w-80 bg-bg-base border border-border-default rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-4 border-b border-border-default">
                    <h3 className="text-xs font-semibold text-ink-primary">Notifications</h3>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-4 hover:bg-bg-raised border-b border-border-subtle last:border-b-0">
                        <p className="text-xs text-ink-primary font-medium">{n.title}</p>
                        <p className="text-[10px] text-ink-tertiary mt-0.5">{n.time}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-border-default">
                    <button className="text-xs text-accent font-medium hover:text-accent/80 w-full text-left">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative" data-profile-dropdown>
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-bg-raised transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-accent-muted border border-accent/20 flex items-center justify-center text-accent font-semibold text-xs">
                FC
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-semibold text-ink-primary">FastCommerce Inc.</span>
                <span className="text-[10px] text-ink-tertiary">Enterprise</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-ink-tertiary hidden sm:block" />
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute right-0 mt-2 w-56 bg-bg-base border border-border-default rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-2">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-ink-secondary hover:bg-bg-raised hover:text-ink-primary">
                      <User className="w-4 h-4" />
                      Profile
                    </Link>
                    <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-ink-secondary hover:bg-bg-raised hover:text-ink-primary">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                  <div className="p-2 border-t border-border-default">
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/login";
                      }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-negative hover:bg-negative/5 w-full text-left"
                    >
                      Log out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
