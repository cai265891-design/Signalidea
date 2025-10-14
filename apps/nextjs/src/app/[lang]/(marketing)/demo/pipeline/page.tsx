"use client";

import { useState } from "react";
import Link from "next/link";
import { AIPipelineLayout } from "~/components/pipeline/ai-pipeline-layout";
import { AIStageCard } from "~/components/pipeline/ai-stage-card";
import { AIContentSection, AINumberedList, AIStreamingText } from "~/components/pipeline/ai-content-section";
import { useToast } from "@saasfly/ui/use-toast";
import { Button } from "@saasfly/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

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

export default function PipelineDemoPage() {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({
    intent: true,
    candidate: false,
  });
  const { toast } = useToast();

  return (
    <>
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

      <AIPipelineLayout
        credits={68}
        history={mockHistory}
        onNewAction={() =>
          toast({
            title: "Demo Mode",
            description: "Sign in to start a real analysis",
          })
        }
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
    </>
  );
}
