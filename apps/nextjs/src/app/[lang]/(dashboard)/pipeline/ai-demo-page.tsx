"use client";

import { useState } from "react";
import { AIPipelineLayout } from "~/components/pipeline/ai-pipeline-layout";
import { AIStageCard } from "~/components/pipeline/ai-stage-card";
import { AIContentSection, AINumberedList, AIStreamingText } from "~/components/pipeline/ai-content-section";

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

const analysisContent = [
  {
    title: "Initial Understanding",
    content:
      "The user wants a simple way to create and manage new tasks directly from the main interface without navigating through multiple pages.",
  },
  {
    title: "Underlying Motivation",
    content:
      'They aim to save time and reduce friction in their daily workflow. A "New Task" button allows them to quickly capture ideas or to-dos the moment they arise, preventing task loss and improving productivity.',
  },
  {
    title: "Target User Persona",
    content:
      "This feature is designed for freelancers, project managers, and self-improvement enthusiasts who frequently manage multiple goals or projects. They often work in dynamic environments (e.g., switching between meetings, messages, and planning tools) and need an efficient, low-effort way to record and track new tasks anytime, anywhere.",
  },
];

export default function AIDemoPipelinePage() {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    intent: true,
    candidate: false,
  });

  return (
    <AIPipelineLayout
      credits={68}
      history={mockHistory}
      onNewAction={() => console.log("New action")}
    >
      <div className="max-w-5xl mx-auto p-8 space-y-4">
        {/* Intent Clarifier */}
        <AIStageCard
          title="Intent Clarifier"
          status="completed"
          badge="Free"
          isExpanded={expandedStages.intent}
          onToggle={() =>
            setExpandedStages({ ...expandedStages, intent: !expandedStages.intent })
          }
          content={
            <AIContentSection>
              <AINumberedList items={analysisContent} />
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
        <AIStageCard title="Top-5 Selector" status="pending" badge="Free" />

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
