"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ChevronRight, Phone, Lock, AlertCircle } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  phone?: string;
  otp?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<"password" | "otp">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const validatePasswordForm = () => {
    const newErrors: FormErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";

    if (!password) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePhoneForm = () => {
    const newErrors: FormErrors = {};
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "Invalid phone number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginType === "password" && !validatePasswordForm()) return;
    if (loginType === "otp" && !validatePhoneForm()) return;

    setIsLoading(true);

    if (loginType === "otp") {
      try {
        const res = await fetch("/api/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (data.success) {
          const nextUrl = data.simulated && data.code
            ? `/verify-otp?phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(data.code)}&remember=${rememberMe}`
            : `/verify-otp?phone=${encodeURIComponent(phone)}&remember=${rememberMe}`;
          router.push(nextUrl);
        } else {
          setErrors({ phone: data.message || "Failed to send OTP" });
        }
      } catch {
        setErrors({ phone: "Network error, please try again" });
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, rememberMe }),
        });
        const data = await res.json();
        if (data.success) {
          router.push("/dashboard");
        } else {
          setErrors({ password: data.message || "Invalid email or password" });
        }
      } catch {
        setErrors({ password: "Network error, please try again" });
      } finally {
        setIsLoading(false);
      }
    }
  };

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

        {/* Login Card */}
        <div className="bg-bg-base border border-border-default rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="font-sans font-bold text-2xl text-ink-primary mb-1">
            Log in to CODShield
          </h1>
          <p className="text-sm text-ink-secondary mb-6">
            Welcome back! Please enter your details.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginType === "password" ? (
              <>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold text-ink-primary">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                      placeholder="you@example.com"
                    />
                    {errors.email ? (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-negative" />
                    ) : null}
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-negative flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-xs font-semibold text-ink-primary">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${errors.password ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-negative flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password}
                    </p>
                  ) : null}
                </div>


              </>
            ) : (
              <>
                {/* Phone Field */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-xs font-semibold text-ink-primary">
                    Phone number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.phone ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-negative flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </>
            )}

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default text-accent focus:ring-accent bg-bg-raised"
                />
                <span className="text-xs text-ink-secondary">Remember me</span>
              </label>
            </div>

            {/* Primary Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-ink-inverse font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (loginType === "otp" ? "Sending OTP..." : "Logging in...") : (loginType === "otp" ? "Send OTP" : "Log In")}
              {!isLoading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border-default" />
            <span className="text-xs font-semibold text-ink-tertiary">or</span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Social / Alternative Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="w-full border border-border-default bg-bg-sunken text-ink-tertiary font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#9CA3AF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#9CA3AF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#9CA3AF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#9CA3AF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google — Coming soon
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType(loginType === "password" ? "otp" : "password");
                setErrors({});
              }}
              className="w-full border border-border-default bg-bg-base hover:bg-bg-raised text-ink-primary font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loginType === "password" ? (
                <>
                  <Phone className="w-4 h-4" />
                  Login with OTP
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Login with password
                </>
              )}
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-ink-secondary">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-accent hover:text-accent/80 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
