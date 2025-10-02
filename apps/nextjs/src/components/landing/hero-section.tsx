"use client";

import { useState } from "react";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";

const suggestionChips = [
  "AI note-taking tools for engineers",
  "Best project management software for remote teams",
  "Headless CMS comparison for e-commerce",
  "API testing tools for developers",
  "Customer feedback platforms for SaaS",
];

const trustItems = [
  "Evidence-first",
  "Modular workflow",
  "HTML/PDF export",
];

export function HeroSection() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    // Simulate progress
    setTimeout(() => {
      setIsLoading(false);
      // Handle actual submission here
      console.log("Submit query:", query);
    }, 300);
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  return (
    <section className="container flex flex-col items-center justify-center py-20 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        {/* H1 Title */}
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-5xl lg:text-6xl">
          Turn raw market signals into defendable reports
        </h1>

        {/* Subtitle */}
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
          Research competitor landscapes faster with AI-powered evidence gathering
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative mx-auto max-w-3xl">
            {isLoading ? (
              // Skeleton shimmer
              <div className="h-14 w-full animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] shadow-sm"
                   style={{
                     animation: 'shimmer 1.5s infinite',
                   }}
              />
            ) : (
              <div className="relative flex items-center overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe what you want to research..."
                  className="flex-1 bg-transparent px-6 py-4 text-base text-gray-900 placeholder-gray-500 outline-none dark:text-gray-100 dark:placeholder-gray-400"
                />
                <Button
                  type="submit"
                  className="m-1.5 rounded-xl bg-[#2D6BFF] px-6 py-2.5 font-medium text-white transition-colors hover:bg-[#1a56e8]"
                >
                  Start
                </Button>
              </div>
            )}
          </div>
        </form>

        {/* Suggestion Chips */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-all hover:border-[#2D6BFF] hover:bg-[#2D6BFF]/5 hover:text-[#2D6BFF] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-[#2D6BFF]/10"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Trust Bar */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          {trustItems.map((item, index) => (
            <span key={item} className="flex items-center">
              {item}
              {index < trustItems.length - 1 && (
                <span className="mx-4 text-gray-400">·</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </section>
  );
}
