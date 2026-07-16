"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Calendar, Clock, CheckCircle2, Download, Building, Mail, User, Phone, ArrowLeft, Info } from "lucide-react";

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  date?: string;
  timeSlot?: string;
  captchaToken?: string;
}

const TIME_OPTIONS = [
  "09:00 AM - 10:00 AM",
  "11:00 AM - 12:00 PM",
  "02:00 PM - 03:00 PM",
  "04:00 PM - 05:00 PM",
  "Other / Flexible",
];

export default function BookDemoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot field

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Turnstile widget states
  const [captchaToken, setCaptchaToken] = useState("");
  const [isTurnstileLoaded, setIsTurnstileLoaded] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  // Today's date string formatted as YYYY-MM-DD for min date limit
  const todayStr = new Date().toISOString().split("T")[0];

  // Initialize Turnstile captcha once the script is loaded
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkAndRenderTurnstile = () => {
      const container = turnstileContainerRef.current;
      if (container && (window as any).turnstile) {
        if (!container.hasChildNodes()) {
          try {
            (window as any).turnstile.render(container, {
              sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
              callback: (token: string) => {
                setCaptchaToken(token);
                setErrors((prev) => ({ ...prev, captchaToken: undefined }));
              },
              "expired-callback": () => {
                setCaptchaToken("");
              },
            });
          } catch (error) {
            console.error("Failed to render Cloudflare Turnstile widget:", error);
          }
        }
      } else {
        // Retry shortly if container ref or window.turnstile isn't ready
        timer = setTimeout(checkAndRenderTurnstile, 150);
      }
    };

    checkAndRenderTurnstile();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTurnstileLoaded]);

  // Clean-up error messages instantly when fields change
  const handleFieldChange = (
    field: keyof FormErrors,
    value: string,
    setter: (val: string) => void
  ) => {
    setter(value);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) nextErrors.name = "Please enter your name.";
    
    if (!email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!company.trim()) nextErrors.company = "Please enter your company name.";
    
    if (!phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (!/^[+0-9\s\-()]{7,25}$/.test(phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number.";
    }

    if (!date.trim()) nextErrors.date = "Please select a preferred date.";
    else {
      const selected = new Date(date);
      const day = selected.getDay();
      // Simple Working Hours check: reject weekends (Saturday = 6, Sunday = 0)
      if (day === 0 || day === 6) {
        nextErrors.date = "Demos are scheduled on business days only (Monday to Friday).";
      }
    }

    if (!timeSlot.trim()) nextErrors.timeSlot = "Please choose a preferred time slot.";
    
    if (!captchaToken) {
      nextErrors.captchaToken = "Please complete the CAPTCHA verification.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim(),
          phone: phone.trim(),
          date,
          timeSlot,
          message: message.trim(),
          captchaToken,
          website: website.trim(), // honeypot
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormMessage(data.message || "Unable to submit your request. Please try again later.");
        // Reset Captcha token on failure so they verify again
        if ((window as any).turnstile) {
          (window as any).turnstile.reset(turnstileContainerRef.current);
          setCaptchaToken("");
        }
      } else {
        setSuccess(true);
        setFormMessage(
          "Your demo booking request has been received. Confirmation emails have been sent to you and to the company team."
        );
      }
    } catch {
      setFormMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate and download .ics file directly on client side for premium UX
  const downloadIcsFile = () => {
    let startHour = 10;
    let startMin = 0;
    let endHour = 11;
    let endMin = 0;

    if (timeSlot !== "Other / Flexible") {
      const match = timeSlot.match(/(\d{2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let sh = parseInt(match[1], 10);
        const sm = parseInt(match[2], 10);
        const sampm = match[3].toUpperCase();
        let eh = parseInt(match[4], 10);
        const em = parseInt(match[5], 10);
        const eampm = match[6].toUpperCase();

        if (sampm === "PM" && sh < 12) sh += 12;
        if (sampm === "AM" && sh === 12) sh = 0;
        if (eampm === "PM" && eh < 12) eh += 12;
        if (eampm === "AM" && eh === 12) eh = 0;

        startHour = sh;
        startMin = sm;
        endHour = eh;
        endMin = em;
      }
    }

    const startLocal = new Date(`${date}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00+05:30`);
    const endLocal = new Date(`${date}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00+05:30`);

    const formatICSDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const dtstamp = formatICSDate(new Date());
    const dtstart = formatICSDate(startLocal);
    const dtend = formatICSDate(endLocal);

    const cleanCompany = company.replace(/[,;]/g, "\\$1");
    const cleanName = name.replace(/[,;]/g, "\\$1");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CODShield//Demo Booking System//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${Math.random().toString(36).substring(2)}@codshield.com`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:CODShield Live Demo - ${cleanCompany}`,
      `DESCRIPTION:Live demo session with CODShield Trust Infrastructure team.\\n\\nName: ${cleanName}\\nCompany: ${cleanCompany}\\nPhone: ${phone}\\nDate: ${date}\\nTime Slot: ${timeSlot}`,
      "LOCATION:Online Meeting (Link to be shared)",
      "STATUS:CONFIRMED",
      "SEQUENCE:0",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `codshield-demo-${date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetForm = () => {
    setName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setDate("");
    setTimeSlot("");
    setMessage("");
    setCaptchaToken("");
    setSuccess(false);
    setFormMessage(null);
  };

  return (
    <main className="min-h-screen bg-bg-base py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      {/* Cloudflare Turnstile loader script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onLoad={() => setIsTurnstileLoaded(true)}
      />

      <div className="w-full max-w-2xl bg-bg-base border border-border-default rounded-[2rem] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-20 transition-all duration-300">
        
        {success ? (
          /* SUCCESS SCREEN DISPLAY */
          <div className="space-y-8 py-4 animate-in fade-in zoom-in duration-300 text-center">
            <div className="mx-auto w-16 h-16 bg-accent-muted flex items-center justify-center rounded-2xl text-accent border border-accent/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-ink-primary tracking-tight">Demo request received!</h1>
              <p className="text-sm text-ink-secondary leading-relaxed max-w-md mx-auto">
                We have saved your request. A confirmation email has been dispatched to <span className="font-semibold text-ink-primary">{email}</span> and to our sales operations team.
              </p>
            </div>

            <div className="bg-bg-raised border border-border-default rounded-2xl p-6 text-left max-w-md mx-auto space-y-4 shadow-sm">
              <h3 className="font-semibold text-ink-primary text-sm flex items-center gap-2 border-b border-border-default pb-2">
                <Info className="w-4 h-4 text-accent" /> Booking Information
              </h3>
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <span className="text-ink-secondary">Contact Person:</span>
                <span className="font-medium text-ink-primary text-right">{name}</span>

                <span className="text-ink-secondary">Company Name:</span>
                <span className="font-medium text-ink-primary text-right">{company}</span>

                <span className="text-ink-secondary">Meeting Date:</span>
                <span className="font-medium text-ink-primary text-right flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3 text-accent" /> {date}
                </span>

                <span className="text-ink-secondary">Preferred Time:</span>
                <span className="font-medium text-ink-primary text-right flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-accent" /> {timeSlot} (IST)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={downloadIcsFile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-ink-inverse transition hover:bg-accent/90 focus:ring-2 focus:ring-accent/20 outline-none w-full"
              >
                <Download className="w-4 h-4" /> Download Invite (.ics)
              </button>

              <button
                onClick={handleResetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-default bg-bg-base px-5 py-3 text-sm font-medium text-ink-secondary transition hover:bg-bg-raised w-full"
              >
                <ArrowLeft className="w-4 h-4" /> Book another slot
              </button>
            </div>
          </div>
        ) : (
          /* BOOKING FORM DISPLAY */
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3 text-center">
              <p className="text-xs font-mono tracking-[0.25em] text-accent uppercase font-bold">Book a Demo</p>
              <h1 className="text-3xl sm:text-4xl font-bold text-ink-primary tracking-tight">Schedule your live demo</h1>
              <p className="text-sm text-ink-secondary max-w-lg mx-auto leading-relaxed">
                Connect with our product architect team. Pick a date and time slot that fits your schedule.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Spam Honeypot Field (invisible to users) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Leave this field blank</label>
                <input
                  id="website"
                  type="text"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-ink-tertiary" /> Name</span>
                  <input
                    value={name}
                    onChange={(event) => handleFieldChange("name", event.target.value, setName)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      errors.name 
                        ? "border-negative bg-negative/5 focus:ring-negative/10" 
                        : "border-border-default bg-bg-base focus:border-accent focus:ring-accent-muted"
                    }`}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="text-xs text-negative font-medium">{errors.name}</p>}
                </label>

                <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                  <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-ink-tertiary" /> Email address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => handleFieldChange("email", event.target.value, setEmail)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      errors.email 
                        ? "border-negative bg-negative/5 focus:ring-negative/10" 
                        : "border-border-default bg-bg-base focus:border-accent focus:ring-accent-muted"
                    }`}
                    placeholder="you@company.com"
                  />
                  {errors.email && <p className="text-xs text-negative font-medium">{errors.email}</p>}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                  <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-ink-tertiary" /> Company</span>
                  <input
                    value={company}
                    onChange={(event) => handleFieldChange("company", event.target.value, setCompany)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      errors.company 
                        ? "border-negative bg-negative/5 focus:ring-negative/10" 
                        : "border-border-default bg-bg-base focus:border-accent focus:ring-accent-muted"
                    }`}
                    placeholder="Company name"
                  />
                  {errors.company && <p className="text-xs text-negative font-medium">{errors.company}</p>}
                </label>

                <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                  <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-ink-tertiary" /> Phone</span>
                  <input
                    value={phone}
                    onChange={(event) => handleFieldChange("phone", event.target.value, setPhone)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      errors.phone 
                        ? "border-negative bg-negative/5 focus:ring-negative/10" 
                        : "border-border-default bg-bg-base focus:border-accent focus:ring-accent-muted"
                    }`}
                    placeholder="+91 98765 43210"
                  />
                  {errors.phone && <p className="text-xs text-negative font-medium">{errors.phone}</p>}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-ink-tertiary" /> Preferred Date</span>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(event) => handleFieldChange("date", event.target.value, setDate)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      errors.date 
                        ? "border-negative bg-negative/5 focus:ring-negative/10" 
                        : "border-border-default bg-bg-base focus:border-accent focus:ring-accent-muted"
                    }`}
                  />
                  {errors.date && <p className="text-xs text-negative font-medium">{errors.date}</p>}
                </label>

                <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-ink-tertiary" /> Preferred Time Slot</span>
                  <select
                    value={timeSlot}
                    onChange={(event) => handleFieldChange("timeSlot", event.target.value, setTimeSlot)}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${
                      errors.timeSlot 
                        ? "border-negative bg-negative/5 focus:ring-negative/10" 
                        : "border-border-default bg-bg-base focus:border-accent focus:ring-accent-muted"
                    }`}
                  >
                    <option value="">Select preferred time</option>
                    {TIME_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.timeSlot && <p className="text-xs text-negative font-medium">{errors.timeSlot}</p>}
                </label>
              </div>

              <label className="space-y-1.5 text-sm font-medium text-ink-secondary block">
                <span>Additional notes (optional)</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-border-default bg-bg-base px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-muted"
                  placeholder="Any additional details for the demo team..."
                />
              </label>

              {/* Cloudflare Turnstile explicit container */}
              <div className="space-y-2 flex flex-col items-center sm:items-start">
                <span className="text-xs font-semibold text-ink-secondary">Verification</span>
                <div 
                  ref={turnstileContainerRef} 
                  id="turnstile-widget" 
                  className="min-h-[65px]"
                ></div>
                {errors.captchaToken && (
                  <p className="text-xs text-negative font-medium text-center sm:text-left">{errors.captchaToken}</p>
                )}
              </div>

              {formMessage && (
                <div
                  className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative"
                  role="alert"
                >
                  {formMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-ink-inverse transition hover:bg-accent/90 focus:ring-2 focus:ring-accent-muted disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
              >
                {isLoading ? "Submitting request..." : "Send booking request"}
              </button>
            </form>

            <div className="rounded-xl border border-border-default bg-bg-raised p-4 text-xs text-ink-secondary flex items-start gap-3">
              <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-ink-primary">Scheduling details</p>
                <p>We work Monday to Friday, 9:00 AM - 5:00 PM (IST). Confirmations are sent to your inbox and our sales operations team.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

