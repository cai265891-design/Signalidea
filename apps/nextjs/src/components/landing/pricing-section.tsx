"use client";

import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { Badge } from "@saasfly/ui/badge";

interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  cta: string;
  ribbon?: string;
  features: string[];
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    id: "per-report",
    name: "Per-report",
    price: "$19",
    priceNote: "/report",
    description: "Perfect for occasional research needs",
    cta: "Buy a report",
    ribbon: "First report $9",
    features: [
      "Full research workflow",
      "Up to 10 competitors analyzed",
      "Reddit + forum evidence",
      "HTML & PDF export",
      "Valid for 30 days",
      "No recurring charges",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    priceNote: "/month",
    description: "5 reports/month, rollover unused credits",
    cta: "Start free trial",
    popular: true,
    features: [
      "5 reports per month",
      "Priority processing",
      "Advanced filtering options",
      "Team collaboration (3 seats)",
      "Email support",
      "Credit rollover",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$79",
    priceNote: "/month",
    description: "Unlimited reports + API access",
    cta: "Contact sales",
    features: [
      "Unlimited reports",
      "API access included",
      "Custom data sources",
      "Dedicated account manager",
      "SSO & advanced security",
      "SLA guarantee",
    ],
  },
];

export function PricingSection() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Choose the plan that fits your research workflow
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={`relative rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:bg-gray-900 ${
              tier.popular
                ? "border-[#2D6BFF] ring-2 ring-[#2D6BFF] ring-opacity-50"
                : "border-gray-200 dark:border-gray-800"
            }`}
          >
            {/* Ribbon */}
            {tier.ribbon && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-[#2D6BFF] text-white">
                  {tier.ribbon}
                </Badge>
              </div>
            )}

            {/* Popular Badge */}
            {tier.popular && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-[#2D6BFF] text-white">
                  Most popular
                </Badge>
              </div>
            )}

            {/* Plan Name */}
            <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              {tier.name}
            </h3>

            {/* Price */}
            <div className="mb-2 flex items-baseline">
              <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                {tier.price}
              </span>
              {tier.priceNote && (
                <span className="ml-1 text-gray-600 dark:text-gray-400">
                  {tier.priceNote}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              {tier.description}
            </p>

            {/* CTA Button */}
            <Button
              className={`mb-6 w-full ${
                tier.popular
                  ? "bg-[#2D6BFF] text-white hover:bg-[#1a56e8]"
                  : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
              }`}
              variant={tier.popular ? "default" : "outline"}
            >
              {tier.cta}
            </Button>

            {/* Features */}
            <ul className="space-y-3">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Icons.Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2D6BFF]" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
