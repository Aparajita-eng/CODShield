"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

function VerifyOtpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const phoneFromQuery = searchParams.get("phone") || "+91 9876543210";
  const codeFromQuery = searchParams.get("code") || "";
  const [otp, setOtp] = useState<string[]>(() => {
    const digits = codeFromQuery.replace(/\D/g, "").slice(0, 6).split("");
    return digits.length === 6 ? digits : ["", "", "", "", "", ""];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mask phone number: "+91 98••••••10"
  const maskedPhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 7) return phone;
    const first = cleaned.slice(0, 3);
    const last = cleaned.slice(-2);
    const middle = "•".repeat(cleaned.length - 5);
    return `${first} ${middle}${last}`;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Auto-focus first input when component mounts
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    if (value.length > 1) {
      // Paste handling: split and fill
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      // Focus next empty or last input
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
    if (showError) setShowError(false);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setCountdown(30);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneFromQuery }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.message || "Failed to resend OTP");
        setShowError(true);
      }
    } catch {
      setErrorMessage("Network error, please try again");
      setShowError(true);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;

    setIsLoading(true);
    setShowError(false);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneFromQuery, code: otpCode }),
      });
      const data = await res.json();

      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setErrorMessage(data.message || "Invalid OTP");
        setShowError(true);
      }
    } catch {
      setErrorMessage("Network error, please try again");
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] space-y-8"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 shrink-0 select-none">
          <svg width="44" height="44" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
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
            <span className="font-sans font-extrabold text-[18px] tracking-[0.12em] leading-none uppercase">
              <span className="text-ink-primary">COD</span>
              <span className="text-accent">Shield</span>
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-ink-primary leading-none uppercase">
              TRUST INFRASTRUCTURE
            </span>
          </div>
        </Link>

        {/* Verify OTP Card */}
        <div className="bg-bg-base border border-border-default rounded-xl shadow-lg p-6 md:p-8">
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="mb-6 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-positive/10 border border-positive/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-positive" />
                  </div>
                </div>
                <h1 className="font-sans font-bold text-2xl text-ink-primary mb-1">
                  Verified!
                </h1>
                <p className="text-sm text-ink-secondary mb-6">
                  Redirecting you to the dashboard...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="font-sans font-bold text-2xl text-ink-primary mb-1">
                  Verify your number
                </h1>
                <p className="text-sm text-ink-secondary mb-6">
                  We&apos;ve sent a 6-digit code to <span className="font-semibold text-ink-primary">{maskedPhone(phoneFromQuery)}</span>.
                </p>
                <form onSubmit={handleVerify} className="space-y-4">
                  {/* OTP Inputs */}
                  <div className="space-y-2">
                    <motion.div
                      animate={showError ? { x: [-5, 5, -5, 5, 0] } : {}}
                      transition={{ duration: 0.4 }}
                      className="flex items-center justify-between gap-3"
                    >
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className={`w-12 h-14 text-center text-lg font-bold rounded-lg border ${
                            showError ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"
                          } text-ink-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all`}
                        />
                      ))}
                    </motion.div>
                    {showError ? (
                      <p className="text-xs text-negative flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errorMessage}
                      </p>
                    ) : null}
                  </div>

                  {/* Countdown Timer / Resend Link */}
                  <div className="text-center">
                    {countdown > 0 ? (
                      <span className="text-xs text-ink-secondary">
                        Resend OTP in {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  {/* Primary Verify Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !isOtpComplete}
                    className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-ink-inverse font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? "Verifying..." : "Verify"}
                    {!isLoading && <ChevronRight className="w-4 h-4" />}
                  </button>
                </form>

                {/* Back to Login Link */}
                <p className="mt-6 text-center text-sm text-ink-secondary">
                  <Link href="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">
                    Back to login
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-ink-secondary text-sm">Loading...</div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
