"use client";
import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

interface PricingTier {
  name: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted: boolean;
}

const tiers: PricingTier[] = [
  {
    name: "Starter",
    price: "₹4,999",
    priceNote: "per month",
    description: "For small COD sellers getting started with fraud prevention.",
    features: [
      "OTP verification — up to 1,000 orders/mo",
      "Basic risk scoring",
      "Pincode risk zone lookup",
      "Email support",
    ],
    cta: "Get Started",
    ctaHref: "mailto:demo@codshield.com?subject=Book%20Demo",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "₹14,999",
    priceNote: "per month",
    description: "For scaling stores that need deeper fraud signal coverage.",
    features: [
      "Everything in Starter",
      "Up to 10,000 orders/mo",
      "Trust Graph fraud detection",
      "Fraud history tracking",
      "Shopify & WooCommerce native integration",
      "Priority support",
    ],
    cta: "Get Started",
    ctaHref: "mailto:demo@codshield.com?subject=Book%20Demo",
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    priceNote: "contact sales",
    description:
      "For large operations that need SLA guarantees, dedicated support, and custom infrastructure.",
    features: [
      "Everything in Growth",
      "Unlimited orders",
      "Dedicated account manager",
      "Custom API rate limits",
      "SLA-backed uptime",
      "Claims engine automation",
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:demo@codshield.com?subject=Enterprise%20Inquiry",
    highlighted: true,
  },
];

export default function Pricing() {
  return (
    <section className="bg-bg-base border-t border-border-default">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        {/* Section Header */}
        <div className="max-w-xl mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-accent uppercase mb-3">
            <span className="w-3 h-px bg-accent inline-block"></span>
            Pricing
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-ink-primary tracking-tight leading-[1.15]">
            Simple, transparent plans
          </h2>
          <p className="mt-4 text-base text-ink-secondary leading-relaxed">
            No hidden fees, no per-query charges. Pay a flat monthly rate for
            the protection tier your volume needs.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) =>
            tier.highlighted ? (
              /* Enterprise — dark inverted card, accent border */
              <div
                key={tier.name}
                className="relative bg-ink-primary border-2 border-accent rounded-xl p-8 flex flex-col"
              >
                {/* Plan name */}
                <div className="mb-6">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-accent uppercase mb-4">
                    <span className="w-3 h-px bg-accent inline-block"></span>
                    {tier.name}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans font-bold text-4xl text-ink-inverse tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-sm text-ink-inverse/50 font-normal">
                      {tier.priceNote}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-inverse/60 leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-ink-inverse/80"
                    >
                      <Check
                        className="w-4 h-4 text-accent shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className="w-full inline-flex items-center justify-center h-11 rounded-lg bg-accent text-ink-inverse text-sm font-semibold transition-all duration-200 hover:bg-accent/90"
                >
                  {tier.cta}
                </Link>
              </div>
            ) : (
              /* Starter & Growth — standard light card */
              <div
                key={tier.name}
                className="relative bg-bg-base border border-border-default rounded-xl p-8 flex flex-col hover:border-border-default hover:shadow-sm transition-all duration-200"
              >
                {/* Plan name */}
                <div className="mb-6">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-ink-tertiary uppercase mb-4 inline-block">
                    {tier.name}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans font-bold text-4xl text-ink-primary tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-sm text-ink-tertiary font-normal">
                      {tier.priceNote}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                {/* Feature list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-ink-secondary"
                    >
                      <Check
                        className="w-4 h-4 text-accent shrink-0 mt-0.5"
                        strokeWidth={2.5}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={tier.ctaHref}
                  className="w-full inline-flex items-center justify-center h-11 rounded-lg border border-accent text-accent text-sm font-semibold transition-all duration-200 hover:bg-accent hover:text-ink-inverse"
                >
                  {tier.cta}
                </Link>
              </div>
            )
          )}
        </div>

        {/* Fine print */}
        <p className="mt-10 text-center text-xs text-ink-tertiary">
          All plans include a 14-day free trial. No credit card required.
          Enterprise pricing depends on monthly order volume and SLA tier.
        </p>
      </div>
    </section>
  );
}
