"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AIPipelineLayout } from "~/components/pipeline/ai-pipeline-layout";
import { AIStageCard } from "~/components/pipeline/ai-stage-card";
import { AIContentSection, AINumberedList, AIStreamingText } from "~/components/pipeline/ai-content-section";
import { useToast } from "@saasfly/ui/use-toast";

const mockHistory = [
  {
    id: "1",
    timestamp: "2 hours ago",
    duration: "3m 24s",
    credits: 18,
    status: "success" as const,
  },
  {
    id: "2",
    timestamp: "Yesterday",
    duration: "2m 56s",
    credits: 16,
    status: "success" as const,
  },
];

interface N8NAnalysisData {
  "Clear Requirement Statement": string;
  Certainties: {
    "Target User Profile"?: string;
    "Target Market"?: string;
    "Must-Haves": string[];
    "Success Criteria"?: string[];
    "Out of Scope"?: string[];
  };
  "Key Assumptions": Array<{
    assumption: string;
    rationale: string;
    confidence: number;
  }>;
}

interface Competitor {
  name: string;
  tagline: string;
  website: string;
  lastUpdate: string;
  confidence: number;
}

interface CompetitorDiscoveryData {
  competitors: Competitor[];
  totalFound?: number;
}

function PipelineContent() {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("query");

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    intent: true,
    candidate: false,
    topFive: false,
  });
  const [userInput, setUserInput] = useState("I want to build an AI image product");
  const [analysisData, setAnalysisData] = useState<N8NAnalysisData | null>(null);
  const [competitorData, setCompetitorData] = useState<CompetitorDiscoveryData | null>(null);
  const [topFiveCompetitors, setTopFiveCompetitors] = useState<Competitor[]>([]);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDiscoveringCompetitors, setIsDiscoveringCompetitors] = useState(false);
  const { toast} = useToast();

  // Call n8n analysis API using API Route
  const handleAnalyze = async (input: string) => {
    try {
      setIsAnalyzing(true);

      const response = await fetch("/api/n8n/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAnalysisData(data);
      toast({
        title: "Analysis completed",
        description: "Requirement analysis has been completed successfully.",
      });

      // Automatically trigger competitor discovery after analysis completes
      await handleCompetitorDiscovery(input, data);
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Call n8n competitor discovery API
  const handleCompetitorDiscovery = async (input: string, analysis: N8NAnalysisData) => {
    try {
      setIsDiscoveringCompetitors(true);

      const response = await fetch("/api/n8n/competitor-discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInput: input,
          analysisData: analysis,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setCompetitorData(data);

      // Automatically extract Top 5 by confidence
      if (data.competitors && data.competitors.length > 0) {
        const sortedCompetitors = [...data.competitors].sort((a, b) => b.confidence - a.confidence);
        const topFive = sortedCompetitors.slice(0, 5);
        setTopFiveCompetitors(topFive);
        setExpandedStages({ ...expandedStages, candidate: true, topFive: true });
      } else {
        setExpandedStages({ ...expandedStages, candidate: true });
      }

      toast({
        title: "Competitors discovered",
        description: `Found ${data.competitors?.length || 0} potential competitors.`,
      });
    } catch (error) {
      console.error("Competitor discovery error:", error);
      toast({
        title: "Competitor discovery failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDiscoveringCompetitors(false);
    }
  };

  // Handle Top-5 reordering
  const handleTopFiveReorder = (reorderedCompetitors: Competitor[]) => {
    setTopFiveCompetitors(reorderedCompetitors);
  };

  // Handle Top-5 replacement
  const handleTopFiveReplace = (id: string) => {
    // Find remaining competitors not in top 5
    const topFiveNames = new Set(topFiveCompetitors.map(c => c.name));
    const remainingCompetitors = competitorData?.competitors.filter(
      c => !topFiveNames.has(c.name)
    ) || [];

    if (remainingCompetitors.length > 0) {
      // Replace the competitor with the next best alternative
      const newTopFive = topFiveCompetitors.map((c) =>
        c.name === id ? remainingCompetitors[0] : c
      );
      setTopFiveCompetitors(newTopFive);
      toast({
        title: "Competitor replaced",
        description: `Replaced with ${remainingCompetitors[0].name}`,
      });
    }
  };

  // Handle Top-5 approval
  const handleTopFiveApprove = () => {
    toast({
      title: "Top 5 approved",
      description: "Ready for deep analysis. (Next stages coming soon!)",
    });
    // TODO: Trigger next stage (Evidence Pull)
  };

  // Auto-trigger analysis when query is provided from URL
  useEffect(() => {
    if (queryFromUrl && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      setUserInput(queryFromUrl);
      toast({
        title: "Starting analysis",
        description: "Your pipeline will begin processing shortly.",
      });
      handleAnalyze(queryFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFromUrl]);

  const handleNewAction = () => {
    toast({
      title: "Starting new analysis",
      description: "Your pipeline will begin processing shortly.",
    });
    // 调用 n8n 分析
    handleAnalyze(userInput);
  };

  return (
    <AIPipelineLayout
      credits={68}
      history={mockHistory}
      onNewAction={handleNewAction}
    >
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        {/* Intent Clarifier */}
        <AIStageCard
          title="Intent Clarifier"
          status={isAnalyzing ? "running" : analysisData ? "completed" : "pending"}
          badge="Free"
          description={isAnalyzing ? "Analyzing requirement..." : undefined}
          isExpanded={expandedStages.intent}
          onToggle={() =>
            setExpandedStages({ ...expandedStages, intent: !expandedStages.intent })
          }
          content={
            <AIContentSection>
              {isAnalyzing ? (
                <AIStreamingText
                  text="Analyzing your requirement with AI..."
                  isStreaming={true}
                />
              ) : analysisData ? (
                <div className="space-y-6">
                  {/* Clear Requirement Statement */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Clear Requirement Statement
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {analysisData["Clear Requirement Statement"]}
                    </p>
                  </div>

                  {/* Certainties */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Certainties
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1.5">Must-Haves:</p>
                        <div className="flex flex-wrap gap-2">
                          {analysisData.Certainties["Must-Haves"].map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Assumptions */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Key Assumptions
                    </h3>
                    <div className="space-y-3">
                      {analysisData["Key Assumptions"].map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-blue-50 p-3 ring-1 ring-inset ring-blue-600/10"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <p className="text-sm font-medium text-gray-900 flex-1">
                              {item.assumption}
                            </p>
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 shrink-0">
                              {Math.round(item.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            <span className="font-medium">Rationale:</span> {item.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Click "New Action" to start analysis
                </p>
              )}
            </AIContentSection>
          }
        />

        {/* Candidate Finder */}
        <AIStageCard
          title="Candidate Finder"
          description={
            isDiscoveringCompetitors
              ? "Discovering competitors..."
              : competitorData
              ? `Found ${competitorData.competitors.length} competitors`
              : undefined
          }
          status={
            isDiscoveringCompetitors
              ? "running"
              : competitorData
              ? "completed"
              : analysisData && !isAnalyzing
              ? "running"
              : "pending"
          }
          badge="Free"
          isExpanded={expandedStages.candidate}
          onToggle={() =>
            setExpandedStages({
              ...expandedStages,
              candidate: !expandedStages.candidate,
            })
          }
          content={
            isDiscoveringCompetitors ? (
              <AIContentSection>
                <AIStreamingText
                  text="Analyzing market competitors and similar solutions..."
                  isStreaming={true}
                />
              </AIContentSection>
            ) : competitorData ? (
              <AIContentSection>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Discovered {competitorData.competitors.length} potential competitors
                    {competitorData.totalFound && competitorData.totalFound > competitorData.competitors.length && (
                      <span className="ml-1">
                        (showing top {competitorData.competitors.length} of {competitorData.totalFound})
                      </span>
                    )}
                  </div>

                  {/* Competitors Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-900">Name</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900">Tagline</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900">Website</th>
                          <th className="text-left py-2 px-3 font-semibold text-gray-900">Last Update</th>
                          <th className="text-right py-2 px-3 font-semibold text-gray-900">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitorData.competitors.map((competitor, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-25"
                            }`}
                          >
                            <td className="py-3 px-3">
                              <span className="font-medium text-gray-900">{competitor.name}</span>
                            </td>
                            <td className="py-3 px-3 text-gray-600 max-w-xs truncate">
                              {competitor.tagline}
                            </td>
                            <td className="py-3 px-3">
                              <a
                                href={competitor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {competitor.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                              </a>
                            </td>
                            <td className="py-3 px-3 text-gray-600 text-xs">
                              {competitor.lastUpdate}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  competitor.confidence >= 0.8
                                    ? "bg-green-100 text-green-700"
                                    : competitor.confidence >= 0.6
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {Math.round(competitor.confidence * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AIContentSection>
            ) : analysisData && !isAnalyzing ? (
              <AIContentSection>
                <AIStreamingText
                  text="Waiting to start competitor discovery..."
                  isStreaming={false}
                />
              </AIContentSection>
            ) : undefined
          }
        />

        {/* Upcoming Stages */}
        {/* Top-5 Selector */}
        <AIStageCard
          title="Top-5 Selector"
          description={
            topFiveCompetitors.length > 0
              ? "Review and reorder the top 5 competitors for deep analysis"
              : undefined
          }
          status={
            topFiveCompetitors.length > 0
              ? "needs-approval"
              : competitorData
              ? "running"
              : "pending"
          }
          badge="Free"
          isExpanded={expandedStages.topFive}
          onToggle={() =>
            setExpandedStages({
              ...expandedStages,
              topFive: !expandedStages.topFive,
            })
          }
          content={
            topFiveCompetitors.length > 0 ? (
              <AIContentSection>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    The top 5 competitors have been automatically selected based on relevance scores.
                    You can reorder them by dragging, or replace any competitor before proceeding.
                  </p>

                  {/* Top 5 List */}
                  <div className="space-y-2">
                    {topFiveCompetitors.map((competitor, index) => (
                      <div
                        key={competitor.name}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-medium text-sm shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {competitor.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {competitor.tagline}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium shrink-0 ${
                            competitor.confidence >= 0.8
                              ? "bg-green-100 text-green-700"
                              : competitor.confidence >= 0.6
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {Math.round(competitor.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Approve Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleTopFiveApprove}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Approve & Continue
                    </button>
                  </div>
                </div>
              </AIContentSection>
            ) : competitorData ? (
              <AIContentSection>
                <AIStreamingText
                  text="Selecting top 5 competitors based on relevance..."
                  isStreaming={true}
                />
              </AIContentSection>
            ) : (
              <AIContentSection>
                <p className="text-sm text-gray-500">
                  Waiting for competitor discovery to complete
                </p>
              </AIContentSection>
            )
          }
        />

        <AIStageCard
          title="Evidence Pull"
          description="Reddit sentiment analysis"
          status="pending"
          badge="16-18 credits"
        />

        <AIStageCard
          title="Feature Matrix"
          description="Feature comparison table"
          status="pending"
          badge="Credits"
        />

        <AIStageCard
          title="Report Builder"
          description="Generate comprehensive report"
          status="pending"
          badge="Credits"
        />
      </div>
    </AIPipelineLayout>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    }>
      <PipelineContent />
    </Suspense>
  );
}
