"use client";

import * as Icons from "@saasfly/ui/icons";
import { MessageSquare, CheckCircle } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: "Free" | "Credits";
}

const steps: Step[] = [
  {
    id: 1,
    title: "Understand intent",
    description: "Describe your research question in plain language—we parse the competitive landscape.",
    icon: MessageSquare,
    badge: "Free",
  },
  {
    id: 2,
    title: "Approve Top-5",
    description: "Review and adjust the AI-suggested shortlist before diving deeper.",
    icon: CheckCircle,
    badge: "Free",
  },
  {
    id: 3,
    title: "Pull evidence",
    description: "We scan Reddit, forums, and reviews to gather real user opinions.",
    icon: Icons.Search,
    badge: "Credits",
  },
  {
    id: 4,
    title: "Assemble report",
    description: "Get a structured HTML/PDF report with citations and export options.",
    icon: Icons.Post,
    badge: "Credits",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
          How it works
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          From question to defendable insight in four steps
        </p>
      </div>

      {/* Steps Grid */}
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const IconComponent = step.icon;
          return (
            <div
              key={step.id}
              className="relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              {/* Badge */}
              <span
                className={
                  step.badge === "Free"
                    ? "absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "absolute right-4 top-4 rounded-full bg-[#2D6BFF] px-3 py-1 text-xs font-semibold text-white"
                }
              >
                {step.badge}
              </span>

              {/* Icon */}
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2D6BFF]/10">
                <IconComponent className="h-6 w-6 text-[#2D6BFF]" />
              </div>

              {/* Step Number */}
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Step {step.id}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom Notice */}
      <div className="mt-8 text-center">
        <p className="inline-block rounded-full border border-gray-300 bg-gray-50 px-6 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          Pay only when you choose to analyze deeper.
        </p>
      </div>
    </section>
  );
}
