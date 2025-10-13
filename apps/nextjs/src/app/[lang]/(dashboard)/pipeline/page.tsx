"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AIPipelineLayout } from "~/components/pipeline/ai-pipeline-layout";
import { AIStageCard } from "~/components/pipeline/ai-stage-card";
import { AIContentSection, AINumberedList, AIStreamingText } from "~/components/pipeline/ai-content-section";
import { useToast } from "@saasfly/ui/use-toast";
import { trpc } from "~/trpc/client";

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
    "Must-Haves": string[];
  };
  "Key Assumptions": Array<{
    assumption: string;
    rationale: string;
    confidence: number;
  }>;
}

function PipelineContent() {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("query");

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    intent: true,
    candidate: false,
  });
  const [userInput, setUserInput] = useState("I want to build an AI image product");
  const [analysisData, setAnalysisData] = useState<N8NAnalysisData | null>(null);
  const [hasAutoTriggered, setHasAutoTriggered] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Function to call n8n analysis using trpc client directly
  const analyzeRequirement = async (input: string) => {
    try {
      setIsAnalyzing(true);
      const data = await trpc.n8n.analyzeRequirement.mutate({ input });
      setAnalysisData(data);
      toast({
        title: "Analysis completed",
        description: "Requirement analysis has been completed successfully.",
      });
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

  // Auto-trigger analysis when query is provided from URL
  useEffect(() => {
    if (queryFromUrl && !hasAutoTriggered) {
      setHasAutoTriggered(true);
      setUserInput(queryFromUrl);
      toast({
        title: "Starting analysis",
        description: "Your pipeline will begin processing shortly.",
      });
      analyzeRequirement(queryFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFromUrl]);

  const handleNewAction = () => {
    toast({
      title: "Starting new analysis",
      description: "Your pipeline will begin processing shortly.",
    });
    // 调用 n8n 分析
    analyzeRequirement(userInput);
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
          description="Running Analysis..."
          status="running"
          badge="Free"
          isExpanded={expandedStages.candidate}
          onToggle={() =>
            setExpandedStages({
              ...expandedStages,
              candidate: !expandedStages.candidate,
            })
          }
          content={
            <AIContentSection>
              <AIStreamingText
                text="Analyzing market competitors and similar solutions..."
                isStreaming={true}
              />
            </AIContentSection>
          }
        />

        {/* Upcoming Stages */}
        <AIStageCard title="Top-5 Review" status="pending" badge="Free" />

        <AIStageCard
          title="Evidence Pull"
          description="Reddit sentiment analysis"
          status="pending"
          badge="16-18 credits"
        />

        <AIStageCard
          title="Matrix Forge"
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
