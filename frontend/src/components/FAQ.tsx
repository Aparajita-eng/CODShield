"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "OTP",
    items: [
      {
        question: "What OTP channels does CODShield support?",
        answer: "CODShield supports SMS, WhatsApp, and voice OTP channels for COD order verification. We prioritize WhatsApp first, then SMS, then voice as fallback options to maximize deliverability and customer response rates."
      },
      {
        question: "Can we customize OTP message content?",
        answer: "Yes, you can fully customize OTP message templates (subject to carrier/WhatsApp compliance guidelines) to include your brand name, order ID, and estimated delivery window, while maintaining our required verification link/button structure."
      },
      {
        question: "How does OTP verification reduce RTO?",
        answer: "OTP verification confirms the customer's identity and intent before the order is dispatched, eliminating fake orders, wrong phone numbers, and prank purchases that cause costly returns and reverse logistics."
      }
    ]
  },
  {
    title: "Fraud",
    items: [
      {
        question: "What fraud signals does CODShield's Risk Engine analyze?",
        answer: "Our Risk Engine analyzes over 30 signals including: pincode historical RTO rate, customer order history, device fingerprinting, IP reputation, email age/type, phone number active status, and cart value anomalies to calculate a real-time risk score for each COD order."
      },
      {
        question: "Does CODShield have a repeat fraudster database?",
        answer: "Yes, CODShield maintains a shared Trust Graph database across all merchants to flag repeat RTO offenders, prank buyers, and known fraudsters, preventing them from placing COD orders even with new accounts or different phone numbers."
      },
      {
        question: "What's the difference between 'Low', 'Medium', and 'High' risk scores?",
        answer: "Low Risk (0-30): Auto-dispatch, no manual review needed. Medium Risk (31-60): Flag for review, optional OTP or partial prepayment. High Risk (61-100): Block order or require full prepayment before dispatch."
      }
    ]
  },
  {
    title: "API",
    items: [
      {
        question: "Does CODShield have a public API?",
        answer: "Yes, CODShield provides a RESTful JSON API with comprehensive documentation for integrating risk scoring, OTP verification, and order status updates into your custom ecommerce platform or backend system."
      },
      {
        question: "What authentication methods do you support for API access?",
        answer: "We support API keys with rate limiting and IP whitelisting for production environments, and OAuth 2.0 for partner integrations. All API requests must be made over HTTPS to ensure data security."
      },
      {
        question: "How long does the risk scoring API take to respond?",
        answer: "Our risk scoring API typically responds in under 100 milliseconds (p95 latency) to ensure it doesn't impact your checkout flow performance."
      }
    ]
  },
  {
    title: "Integrations",
    items: [
      {
        question: "Which ecommerce platforms does CODShield integrate with?",
        answer: "CODShield has native plug-and-play integrations with Shopify, WooCommerce, Magento, and BigCommerce, plus a flexible API for custom platforms. Integration typically takes less than 15 minutes with no code changes required on most platforms."
      },
      {
        question: "Do you integrate with logistics and courier partners?",
        answer: "Yes, we integrate with major Indian couriers (BlueDart, Delhivery, Ecom Express, etc.) to automatically file RTO claims, track return status, and reconcile failed delivery data with your risk scores."
      },
      {
        question: "Can we use CODShield with multiple storefronts?",
        answer: "Absolutely! CODShield supports unlimited storefronts from a single dashboard, with separate analytics and configuration for each store while maintaining a unified Trust Graph and fraudster database."
      }
    ]
  },
  {
    title: "Claims",
    items: [
      {
        question: "Does CODShield automate RTO claims filing?",
        answer: "Yes! Our Claims Engine automatically files RTO claims with your logistics partners as soon as a return is initiated, using pre-filled order data and documentation to reduce manual work and speed up claim resolution."
      },
      {
        question: "What percentage of RTO claims does CODShield successfully recover?",
        answer: "Our merchants typically recover 25-40% of RTO losses through automated claims, depending on their logistics partners and claim policies."
      },
      {
        question: "Can we customize claim filing rules?",
        answer: "Yes, you can configure claim filing rules based on order value, risk score, courier, or other custom criteria to decide which orders to automatically file claims for and which to review manually."
      }
    ]
  },
  {
    title: "Pricing",
    items: [
      {
        question: "How does CODShield's pricing work?",
        answer: "CODShield uses a simple usage-based pricing model with a small fee per verified order, plus a monthly platform fee for enterprise features. We don't charge setup fees or require long-term contracts."
      },
      {
        question: "Is there a free trial available?",
        answer: "Yes! We offer a 14-day free trial with full access to all features, including up to 500 free order verifications to let you test CODShield with real traffic."
      },
      {
        question: "Do you offer custom enterprise pricing?",
        answer: "Yes! For high-volume merchants (over 10,000 orders/month), we offer custom pricing with volume discounts, dedicated account management, and SLA guarantees. Contact our sales team for details."
      }
    ]
  }
];

export default function FAQ() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (categoryTitle: string, questionIndex: number) => {
    const id = `${categoryTitle}-${questionIndex}`;
    setOpenItem(openItem === id ? null : id);
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.flatMap(category =>
      category.items.map(item => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    )
  };

  return (
    <section className="bg-bg-base border-t border-border-default">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-24">
        <div className="max-w-xl mb-16">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-accent uppercase mb-3">
            <span className="w-3 h-px bg-accent inline-block"></span>
            FAQ
          </span>
          <h2 className="font-sans font-bold text-3xl sm:text-4xl text-ink-primary tracking-tight leading-[1.15]">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-ink-secondary leading-relaxed">
            Answers to common questions about CODShield's fraud prevention, OTP verification, and RTO recovery features.
          </p>
        </div>

        <div className="space-y-8">
          {faqData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              <h3 className="font-sans font-semibold text-sm text-ink-primary tracking-tight">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => {
                  const id = `${category.title}-${itemIndex}`;
                  const isOpen = openItem === id;
                  return (
                    <div
                      key={itemIndex}
                      className="border border-border-default rounded-xl overflow-hidden bg-bg-base"
                    >
                      <button
                        onClick={() => toggleItem(category.title, itemIndex)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-content-${id}`}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg-raised transition-colors"
                      >
                        <span className="font-sans font-medium text-sm text-ink-primary flex-1">
                          {item.question}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4 text-ink-tertiary" />
                        </motion.div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-content-${id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-0">
                              <p className="text-sm text-ink-secondary leading-relaxed">
                                {item.answer}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
