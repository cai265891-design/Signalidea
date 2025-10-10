"use client";

import { useState } from "react";
import Link from "next/link";
import { ScopePanel } from "~/components/pipeline/scope-panel";
import { Inspector } from "~/components/pipeline/inspector";
import { IntentClarifier } from "~/components/pipeline/intent-clarifier";
import { CandidateFinder } from "~/components/pipeline/candidate-finder";
import { TopFiveReview } from "~/components/pipeline/top-five-review";
import { EvidencePull } from "~/components/pipeline/evidence-pull";
import { MatrixForge } from "~/components/pipeline/matrix-forge";
import { ReportBuilder } from "~/components/pipeline/report-builder";
import { CreditsModal } from "~/components/pipeline/credits-modal";
import { useToast } from "@saasfly/ui/use-toast";
import { Button } from "@saasfly/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

// Mock data
const mockScope = {
  targetUsers: "Early-stage SaaS founders",
  region: "Global",
  timeRange: "6 months",
  excludes: ["Forums", "Aggregators", "Tutorials"],
};

const mockCandidates = [
  {
    id: "1",
    name: "Competitor A",
    tagline: "All-in-one platform for startups",
    website: "competitora.com",
    lastUpdate: "2 days ago",
    confidence: 92,
  },
  {
    id: "2",
    name: "Competitor B",
    tagline: "Simple analytics for teams",
    website: "competitorb.io",
    lastUpdate: "1 week ago",
    confidence: 85,
  },
  {
    id: "3",
    name: "Competitor C",
    tagline: "Developer-first tools",
    website: "competitorc.dev",
    lastUpdate: "3 days ago",
    confidence: 88,
  },
];

const mockCompetitors = [
  { id: "1", name: "Competitor A", tagline: "All-in-one platform", logo: "" },
  { id: "2", name: "Competitor B", tagline: "Simple analytics", logo: "" },
  { id: "3", name: "Competitor C", tagline: "Developer tools", logo: "" },
  { id: "4", name: "Competitor D", tagline: "Team workspace", logo: "" },
  { id: "5", name: "Competitor E", tagline: "Project management", logo: "" },
];

const mockClusters = [
  {
    id: "1",
    topic: "Pricing concerns and value perception",
    sentiment: { positive: 30, neutral: 45, negative: 25 },
    visible: true,
    posts: [
      {
        id: "p1",
        title: "Is Competitor A worth the price?",
        subreddit: "SaaS",
        timestamp: "2 days ago",
        url: "https://reddit.com/r/SaaS/...",
      },
      {
        id: "p2",
        title: "Comparing pricing: A vs B",
        subreddit: "startups",
        timestamp: "3 days ago",
        url: "https://reddit.com/r/startups/...",
      },
    ],
  },
  {
    id: "2",
    topic: "Integration and API limitations",
    sentiment: { positive: 20, neutral: 35, negative: 45 },
    visible: true,
    posts: [
      {
        id: "p3",
        title: "API rate limits are too restrictive",
        subreddit: "webdev",
        timestamp: "1 week ago",
        url: "https://reddit.com/r/webdev/...",
      },
    ],
  },
];

const mockMatrixRows = [
  {
    feature: "Free tier",
    cells: [
      { value: "Yes" },
      { value: "No" },
      { value: "Limited" },
      { value: "—" },
      { value: "Yes" },
    ],
  },
  {
    feature: "Starting price",
    cells: [
      { value: "$29/mo" },
      { value: "$19/mo" },
      { value: "$49/mo" },
      { value: "$39/mo" },
      { value: "$25/mo" },
    ],
  },
  {
    feature: "API access",
    cells: [
      { value: "All plans" },
      { value: "Pro+" },
      { value: "All plans" },
      { value: "Enterprise" },
      { value: "Pro+" },
    ],
  },
];

const mockReportSections = [
  { id: "summary", name: "Executive Summary", enabled: true },
  { id: "competitors", name: "Top-5 Overview", enabled: true },
  { id: "evidence", name: "Reddit Evidence", enabled: true },
  { id: "matrix", name: "Feature Matrix", enabled: true },
  { id: "opportunities", name: "Opportunities", enabled: true },
  { id: "sources", name: "Sources & Methodology", enabled: true },
];

const mockOpportunities = [
  {
    title: "Mobile app gap",
    description: "3 of 5 competitors lack native mobile apps",
    evidenceLinks: 12,
    risk: "low" as const,
    nextStep: "User research",
  },
  {
    title: "API rate limits pain point",
    description: "Users frustrated with restrictive API limits",
    evidenceLinks: 8,
    risk: "medium" as const,
    nextStep: "Competitive API analysis",
  },
];

const mockRunHistory = [
  {
    id: "1",
    timestamp: "2 hours ago",
    status: "success" as const,
    duration: "3m 24s",
    credits: 18,
  },
  {
    id: "2",
    timestamp: "Yesterday",
    status: "success" as const,
    duration: "2m 56s",
    credits: 16,
  },
];

export default function PipelineDemoPage() {
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Report ready",
      description: "HTML and PDF saved to your library.",
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Demo Banner */}
      <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Demo Mode - You're viewing a sample analysis with mock data
            </span>
          </div>
          <Link href="/en/login-clerk">
            <Button size="sm" className="rounded-xl">
              Sign in for full access
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="grid grid-cols-[280px_1fr_320px] gap-6">
          {/* Left Sidebar - Scope */}
          <aside>
            <ScopePanel
              initialData={{
                region: "Global",
                timeWindow: "6 months",
                excludes: ["Forums", "Aggregators"],
                seedUrls: [],
              }}
            />
          </aside>

          {/* Center - Pipeline Board */}
          <main className="space-y-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
              <p className="mt-1 text-sm text-gray-600">
                Competitive intelligence analysis pipeline
              </p>
            </div>

            <IntentClarifier scope={mockScope} />

            <CandidateFinder
              candidates={mockCandidates}
              onAddToShortlist={(id) => console.log("Add to shortlist:", id)}
              onBlacklist={(id) => console.log("Blacklist:", id)}
            />

            <TopFiveReview
              competitors={mockCompetitors}
              onApprove={() => setShowCreditsModal(true)}
            />

            <EvidencePull
              clusters={mockClusters}
              totalQueries={48}
              onToggleCluster={(id) => console.log("Toggle cluster:", id)}
            />

            <MatrixForge
              competitors={mockCompetitors.map((c) => c.name)}
              rows={mockMatrixRows}
              onCellEdit={(row, col, value) =>
                console.log("Edit cell:", row, col, value)
              }
            />

            <ReportBuilder
              sections={mockReportSections}
              opportunities={mockOpportunities}
              onToggleSection={(id) => console.log("Toggle section:", id)}
              onExportHTML={handleSuccess}
              onExportPDF={handleSuccess}
            />
          </main>

          {/* Right Sidebar - Inspector */}
          <aside>
            <Inspector
              estimatedCredits="16–18"
              monthlyCreditsUsed={32}
              monthlyCreditsTotal={100}
              runHistory={mockRunHistory}
              onBuyCredits={() => console.log("Buy credits")}
            />
          </aside>
        </div>
      </div>

      <CreditsModal
        open={showCreditsModal}
        onOpenChange={setShowCreditsModal}
        estimatedCredits="16–18"
        creditsRemaining={68}
        hasFreeTrial={true}
        onProceed={(capped) => {
          console.log("Proceed with cap:", capped);
          setShowCreditsModal(false);
          handleSuccess();
        }}
      />
    </div>
  );
}
