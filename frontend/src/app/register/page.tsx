"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";

interface FormErrors {
  fullName?: string;
  email?: string;
  companyName?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

type PasswordStrength = "weak" | "medium" | "strong" | null;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordStrength = useMemo((): PasswordStrength => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return "weak";
    if (score <= 3) return "medium";
    return "strong";
  }, [password]);

  const getStrengthColor = () => {
    if (!passwordStrength) return "var(--border-default)";
    if (passwordStrength === "weak") return "var(--negative)";
    if (passwordStrength === "medium") return "var(--warning)";
    return "var(--positive)";
  };

  const getStrengthLabel = () => {
    if (!passwordStrength) return "";
    if (passwordStrength === "weak") return "Weak";
    if (passwordStrength === "medium") return "Medium";
    return "Strong";
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email address";

    if (!companyName.trim()) newErrors.companyName = "Company name is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!agreeTerms)
      newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
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

        {/* Register Card */}
        <div className="bg-bg-base border border-border-default rounded-xl shadow-lg p-6 md:p-8">
          <h1 className="font-sans font-bold text-2xl text-ink-primary mb-1">
            Create your account
          </h1>
          <p className="text-sm text-ink-secondary mb-6">
            Start your free trial with CODShield today.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="fullName" className="block text-xs font-semibold text-ink-primary">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.fullName ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                placeholder="John Doe"
              />
              {errors.fullName ? (
                <p className="text-xs text-negative flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.fullName}
                </p>
              ) : null}
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-ink-primary">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.email ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                placeholder="you@company.com"
              />
              {errors.email ? (
                <p className="text-xs text-negative flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              ) : null}
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="block text-xs font-semibold text-ink-primary">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${errors.companyName ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                placeholder="Your Company"
              />
              {errors.companyName ? (
                <p className="text-xs text-negative flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.companyName}
                </p>
              ) : null}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-ink-primary">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${errors.password ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordStrength ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-border-default rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: passwordStrength === "weak" ? "33%" : passwordStrength === "medium" ? "66%" : "100%",
                        backgroundColor: getStrengthColor(),
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: getStrengthColor() }}>
                    {getStrengthLabel()}
                  </span>
                </div>
              ) : null}
              {errors.password ? (
                <p className="text-xs text-negative flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password}
                </p>
              ) : null}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-ink-primary">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${errors.confirmPassword ? "border-negative bg-negative/5" : "border-border-default bg-bg-raised"} text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="text-xs text-negative flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.confirmPassword}
                </p>
              ) : null}
            </div>

            {/* Terms Checkbox */}
            <div className="space-y-1.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border-default text-accent focus:ring-accent bg-bg-raised"
                />
                <span className="text-xs text-ink-secondary leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-accent font-semibold hover:text-accent/80 transition-colors">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-accent font-semibold hover:text-accent/80 transition-colors">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms ? (
                <p className="text-xs text-negative flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.terms}
                </p>
              ) : null}
            </div>

            {/* Primary Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-ink-inverse font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? "Creating account..." : "Create Account"}
              {!isLoading && <ChevronRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-border-default" />
            <span className="text-xs font-semibold text-ink-tertiary">or</span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Google Button */}
          <div className="space-y-3">
            <button
              type="button"
              className="w-full border border-border-default bg-bg-base hover:bg-bg-raised text-ink-primary font-semibold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Log In Link */}
          <p className="mt-6 text-center text-sm text-ink-secondary">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:text-accent/80 transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
