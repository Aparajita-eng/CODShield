"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "confirmation">("request");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [simulated, setSimulated] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = () => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendResetRequest = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulated(Boolean(data.simulated));
        setDevResetLink(data.devResetLink ?? null);
        setStep("confirmation");
      } else {
        setErrors({ general: data.message || "Failed to send reset link" });
      }
    } catch {
      setErrors({ general: "Network error, please try again" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;
    void sendResetRequest();
  };

  const handleResendEmail = () => {
    if (!validateEmail()) return;
    setCountdown(30);
    void sendResetRequest();
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] space-y-8"
      >
        <Link href="/" className="flex items-center justify-center gap-3 shrink-0 select-none">
          <svg width="44" height="44" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M13 1.5L23.5 6V13C23.5 19.2 19.2 23.8 13 24.9C6.8 23.8 2.5 19.2 2.5 13V6L13 1.5Z" stroke="var(--accent)" strokeWidth="2" fill="var(--accent-muted)" />
            <path d="M8.5 13.2L11.4 16.1L17.6 9.6" stroke="var(--ink-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col justify-center gap-[3px]">
            <span className="font-sans font-extrabold text-[18px] tracking-[0.12em] leading-none uppercase">
              <span className="text-ink-primary">COD</span>
              <span className="text-accent">Shield</span>
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-ink-primary leading-none uppercase">TRUST INFRASTRUCTURE</span>
          </div>
        </Link>

        <div className="bg-bg-base border border-border-default rounded-xl shadow-lg p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === "request" ? (
              <motion.div key="request" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
                <h1 className="font-sans font-bold text-2xl text-ink-primary mb-1">Reset your password</h1>
                <p className="text-sm text-ink-secondary mb-6">We&apos;ll send you a password reset link at your email.</p>

                <form onSubmit={handleSendResetLink} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold text-ink-primary">Email address</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                      placeholder="you@company.com"
                    />
                    {errors.email ? (
                      <p className="text-xs text-negative flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.email}</p>
                    ) : null}
                    {errors.general ? (
                      <p className="text-xs text-negative flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.general}</p>
                    ) : null}
                  </div>

                  <button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-ink-inverse font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                    {isLoading ? "Sending..." : "Send Reset Link"}
                    {!isLoading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-ink-secondary">
                  <Link href="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">Back to login</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div key="confirmation" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="text-center">
                <div className="mb-6 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-positive/10 border border-positive/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-positive" />
                  </div>
                </div>
                <h1 className="font-sans font-bold text-2xl text-ink-primary mb-1">Check your email</h1>
                <p className="text-sm text-ink-secondary mb-4">
                  We&apos;ve sent a password reset link to <span className="font-semibold text-ink-primary">{email}</span>.
                </p>
                {simulated && devResetLink ? (
                  <p className="text-xs text-ink-secondary mb-4 bg-bg-raised border border-border-default rounded-lg p-3 break-all">
                    Dev mode: reset link logged on server.{" "}
                    <a href={devResetLink} className="text-accent font-semibold hover:text-accent/80">Open reset link</a>
                  </p>
                ) : null}

                <button type="button" onClick={handleResendEmail} disabled={countdown > 0 || isLoading} className="text-sm font-semibold text-accent hover:text-accent/80 disabled:text-ink-tertiary disabled:cursor-not-allowed transition-colors">
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
                </button>

                <p className="mt-6 text-center text-sm text-ink-secondary">
                  <Link href="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">Back to login</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
