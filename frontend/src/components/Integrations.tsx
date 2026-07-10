"use client";
import React from "react";
import { SiShopify, SiWoocommerce, SiRazorpay, SiMeta, SiExpress, SiCloudflare } from "react-icons/si";

interface Integration {
  name: string;
  icon?: React.ComponentType<any>;
  brandColor: string;
}

interface Category {
  title: string;
  description: string;
  items: Integration[];
}

const categories: Category[] = [
  {
    title: "Connects with your store",
    description: "Deploy checkout verification widgets directly to your shopping cart.",
    items: [
      { name: "Shopify", icon: SiShopify, brandColor: "#96BF48" },
      { name: "WooCommerce", icon: SiWoocommerce, brandColor: "#96588A" },
      { name: "Magento", brandColor: "#EE672A" },
    ],
  },
  {
    title: "Payments & verification",
    description: "Cross-reference risk vectors and process automatic RTO claims.",
    items: [
      { name: "Razorpay", icon: SiRazorpay, brandColor: "#3399FF" },
      { name: "Cashfree", brandColor: "#0052FF" },
      { name: "Twilio", brandColor: "#F22F46" },
      { name: "MSG91", brandColor: "#FF5722" },
      { name: "Meta", icon: SiMeta, brandColor: "#0668E1" },
    ],
  },
  {
    title: "Built on",
    description: "Constructed on enterprise-grade runtime engines and delivery networks.",
    items: [
      { name: "Express", icon: SiExpress, brandColor: "#000000" },
      { name: "AWS", brandColor: "#FF9900" },
      { name: "Cloudflare", icon: SiCloudflare, brandColor: "#F38020" },
    ],
  },
];

export default function Integrations() {
  return (
    <section className="bg-bg-raised border-t border-border-default">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        {/* Section Header */}
        <div className="max-w-xl mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-accent uppercase mb-3">
            <span className="w-3 h-px bg-accent inline-block"></span>
            Ecosystem
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-ink-primary tracking-tight leading-[1.15]">
            Unified Integrations
          </h2>
          <p className="mt-4 text-base text-ink-secondary leading-relaxed">
            CODShield runs natively within your existing architecture. Plug in your storefront, connect your gateways, and run on audited cloud infrastructure.
          </p>
        </div>

        {/* Integration Rows */}
        <div className="space-y-8">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-border-default/40 last:border-b-0 last:pb-0"
            >
              <div className="lg:w-80 shrink-0">
                <h3 className="font-sans font-semibold text-sm text-ink-primary tracking-tight">
                  {cat.title}
                </h3>
                <p className="text-[12px] text-ink-secondary mt-1 max-w-md">
                  {cat.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end flex-grow">
                {cat.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={itemIdx}
                      aria-label={`${item.name} Integration`}
                      className="h-11 px-5 bg-bg-base border border-border-default rounded-full flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-accent/40 group shrink-0"
                    >
                      {Icon ? (
                        <>
                          <Icon
                            aria-hidden="true"
                            className="w-4 h-4 text-ink-tertiary transition-colors duration-200"
                            style={
                              {
                                "--hover-color": item.brandColor,
                              } as React.CSSProperties
                            }
                          />
                          <span
                            className="text-sm font-medium text-ink-secondary transition-colors duration-200"
                            style={
                              {
                                "--hover-color": item.brandColor,
                              } as React.CSSProperties
                            }
                          >
                            {item.name}
                          </span>
                        </>
                      ) : (
                        <span
                          className="text-sm font-bold tracking-tight text-ink-secondary transition-colors duration-200"
                          style={
                            {
                              "--hover-color": item.brandColor,
                            } as React.CSSProperties
                          }
                        >
                          {item.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Styled Hover styles using inline component style tag to prevent tailwind config hacks */}
      <style jsx global>{`
        .group:hover [style*="--hover-color"] {
          color: var(--hover-color) !important;
        }
      `}</style>
    </section>
  );
}
