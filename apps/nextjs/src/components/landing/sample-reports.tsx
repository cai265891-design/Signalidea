"use client";

import { useState } from "react";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { Link, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@saasfly/ui/dialog";

interface SampleReport {
  id: string;
  title: string;
  topFive: string[];
  redditPosts: Array<{ title: string; url: string }>;
  htmlPreview: string;
}

const sampleReports: SampleReport[] = [
  {
    id: "1",
    title: "AI note-taking tools for engineers",
    topFive: ["Notion AI", "Obsidian", "Roam Research", "Mem", "Reflect"],
    redditPosts: [
      { title: "Best AI note-taking app for developers?", url: "#" },
      { title: "Notion vs Obsidian for technical documentation", url: "#" },
      { title: "How I organize engineering notes with AI", url: "#" },
    ],
    htmlPreview: "<h1>Sample Report: AI Note-taking Tools</h1><p>This is a preview of the full report...</p>",
  },
  {
    id: "2",
    title: "Project management for remote teams",
    topFive: ["Linear", "Asana", "ClickUp", "Monday.com", "Jira"],
    redditPosts: [
      { title: "Linear vs Jira for engineering teams", url: "#" },
      { title: "Best project tracking for distributed teams", url: "#" },
      { title: "How we switched from Jira to Linear", url: "#" },
    ],
    htmlPreview: "<h1>Sample Report: Project Management Tools</h1><p>This is a preview...</p>",
  },
  {
    id: "3",
    title: "Headless CMS for e-commerce",
    topFive: ["Contentful", "Sanity", "Strapi", "Prismic", "Directus"],
    redditPosts: [
      { title: "Contentful vs Sanity for product catalogs", url: "#" },
      { title: "Best headless CMS for Shopify integration", url: "#" },
      { title: "Self-hosted vs cloud CMS comparison", url: "#" },
    ],
    htmlPreview: "<h1>Sample Report: Headless CMS</h1><p>This is a preview...</p>",
  },
  {
    id: "4",
    title: "API testing tools for developers",
    topFive: ["Postman", "Insomnia", "Bruno", "Thunder Client", "HTTPie"],
    redditPosts: [
      { title: "Postman alternatives in 2024", url: "#" },
      { title: "Local-first API testing tools", url: "#" },
      { title: "Best REST client for VS Code", url: "#" },
    ],
    htmlPreview: "<h1>Sample Report: API Testing Tools</h1><p>This is a preview...</p>",
  },
  {
    id: "5",
    title: "Customer feedback platforms for SaaS",
    topFive: ["Canny", "Productboard", "Frill", "UserVoice", "Feedbear"],
    redditPosts: [
      { title: "Canny vs Productboard for feature requests", url: "#" },
      { title: "How to collect user feedback at scale", url: "#" },
      { title: "Best feedback widget for SaaS apps", url: "#" },
    ],
    htmlPreview: "<h1>Sample Report: Customer Feedback</h1><p>This is a preview...</p>",
  },
  {
    id: "6",
    title: "Code review tools for teams",
    topFive: ["GitHub", "GitLab", "Gerrit", "Phabricator", "Reviewable"],
    redditPosts: [
      { title: "GitHub vs GitLab code review features", url: "#" },
      { title: "Best practices for async code reviews", url: "#" },
      { title: "Improving code review turnaround time", url: "#" },
    ],
    htmlPreview: "<h1>Sample Report: Code Review Tools</h1><p>This is a preview...</p>",
  },
];

export function SampleReports() {
  const [selectedReport, setSelectedReport] = useState<SampleReport | null>(null);

  return (
    <>
      <section className="container py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
            Sample Reports
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            See what our AI-powered research delivers
          </p>
        </div>

        {/* Horizontal Carousel */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {sampleReports.map((report) => (
              <div
                key={report.id}
                className="min-w-[320px] flex-shrink-0 rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900 md:min-w-[360px]"
              >
                {/* Scenario Title */}
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {report.title}
                </h3>

                {/* Top-5 Logo Strip */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Top 5
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.topFive.map((name, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reddit Posts */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Evidence from Reddit
                  </p>
                  <div className="space-y-2">
                    {report.redditPosts.map((post, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <Link className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span className="line-clamp-1 text-gray-700 dark:text-gray-300">
                          {post.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Sample Button */}
                <Button
                  onClick={() => setSelectedReport(report)}
                  variant="outline"
                  className="w-full border-[#2D6BFF] text-[#2D6BFF] hover:bg-[#2D6BFF]/5"
                >
                  Open sample
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: selectedReport?.htmlPreview || "" }} />
          </div>
          <div className="mt-6 flex gap-4">
            <Button disabled className="bg-gray-300 text-gray-500 cursor-not-allowed">
              <Download className="mr-2 h-4 w-4" />
              Export PDF (Login required)
            </Button>
            <Button disabled className="bg-gray-300 text-gray-500 cursor-not-allowed">
              <Icons.Post className="mr-2 h-4 w-4" />
              Export HTML (Login required)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
