"use client";

import React, { useState } from "react";

interface FormErrors {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  preferredTime?: string;
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
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!name.trim()) nextErrors.name = "Please enter your name.";
    if (!email.trim()) nextErrors.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Please enter a valid email address.";
    if (!company.trim()) nextErrors.company = "Please enter your company name.";
    if (!phone.trim()) nextErrors.phone = "Please enter your phone number.";
    if (!preferredTime.trim()) nextErrors.preferredTime = "Please choose a preferred time.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);
    setSuccess(false);

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
          preferredTime,
          message: message.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormMessage(data.message || "Unable to submit your request. Please try again later.");
        setSuccess(false);
      } else {
        setSuccess(true);
        setFormMessage(
          "Your demo booking request has been received. Confirmation emails have been sent to you and to the company team."
        );
        setName("");
        setEmail("");
        setCompany("");
        setPhone("");
        setPreferredTime("");
        setMessage("");
      }
    } catch {
      setFormMessage("Network error. Please try again in a few moments.");
      setSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const cardClasses = "bg-bg-base border border-border-default rounded-3xl p-8 shadow-lg max-w-3xl mx-auto";

  return (
    <main className="min-h-screen bg-bg-base py-16 px-4 sm:px-6 lg:px-8">
      <div className={cardClasses}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-3 text-center">
            <p className="text-xs font-mono tracking-[0.32em] text-accent uppercase">Book a Demo</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-ink-primary">Schedule your live demo</h1>
            <p className="text-sm text-ink-secondary leading-relaxed">
              Choose a time that works for you, and we’ll send a confirmation to your inbox and to info@veritonaitechnologies.com.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-ink-secondary">
                <span>Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.name ? "border-negative bg-negative/5" : "border-border-default bg-bg-base"
                  }`}
                  placeholder="Your full name"
                />
                {errors.name ? <p className="text-xs text-negative">{errors.name}</p> : null}
              </label>

              <label className="space-y-2 text-sm text-ink-secondary">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.email ? "border-negative bg-negative/5" : "border-border-default bg-bg-base"
                  }`}
                  placeholder="you@company.com"
                />
                {errors.email ? <p className="text-xs text-negative">{errors.email}</p> : null}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-ink-secondary">
                <span>Company</span>
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.company ? "border-negative bg-negative/5" : "border-border-default bg-bg-base"
                  }`}
                  placeholder="Company name"
                />
                {errors.company ? <p className="text-xs text-negative">{errors.company}</p> : null}
              </label>

              <label className="space-y-2 text-sm text-ink-secondary">
                <span>Phone</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.phone ? "border-negative bg-negative/5" : "border-border-default bg-bg-base"
                  }`}
                  placeholder="+91 98765 43210"
                />
                {errors.phone ? <p className="text-xs text-negative">{errors.phone}</p> : null}
              </label>
            </div>

            <label className="space-y-2 text-sm text-ink-secondary block">
              <span>Preferred time slot</span>
              <select
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                  errors.preferredTime ? "border-negative bg-negative/5" : "border-border-default bg-bg-base"
                }`}
              >
                <option value="">Select a preferred time</option>
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.preferredTime ? <p className="text-xs text-negative">{errors.preferredTime}</p> : null}
            </label>

            <label className="space-y-2 text-sm text-ink-secondary block">
              <span>Additional notes (optional)</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-[120px] w-full rounded-xl border border-border-default bg-bg-base px-4 py-3 text-sm outline-none transition"
                placeholder="Any additional details for the demo team..."
              />
            </label>

            {formMessage ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-negative/30 bg-negative/10 text-negative"
                }`}
              >
                {formMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-ink-inverse transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Sending request..." : "Send booking request"}
            </button>
          </form>

          <div className="rounded-2xl border border-border-default bg-bg-raised p-4 text-sm text-ink-secondary">
            <p className="font-semibold text-ink-primary">Info</p>
            <p>We will notify info@veritonaitechnologies.com and your email with the selected time slot.</p>
            <p className="mt-2">If you need a custom time, select “Other / Flexible” and add the details in the notes.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
