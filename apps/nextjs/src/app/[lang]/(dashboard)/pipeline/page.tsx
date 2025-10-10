"use client";

import { useState } from "react";
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
  // Add more mock candidates...
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
    ],
  },
  // Add more clusters...
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
  // Add more rows...
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

export default function PipelinePage() {
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Report ready",
      description: "HTML and PDF saved to your library.",
    });
  };

  const handleWarning = () => {
    toast({
      title: "Upstream changes detected",
      description: "This section may be outdated.",
      variant: "destructive",
      action: (
        <button className="text-sm font-medium underline" onClick={() => {}}>
          Re-run now
        </button>
      ),
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
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
