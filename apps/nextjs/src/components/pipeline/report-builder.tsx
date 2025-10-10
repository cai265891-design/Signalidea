"use client";

import { useState } from "react";
import { StageCard } from "./stage-card";
import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { Switch } from "@saasfly/ui/switch";
import { FileDown, FileText, ExternalLink } from "lucide-react";
import { cn } from "@saasfly/ui";

interface ReportSection {
  id: string;
  name: string;
  enabled: boolean;
}

interface OpportunityCard {
  title: string;
  description: string;
  evidenceLinks: number;
  risk: "low" | "medium" | "high";
  nextStep: string;
}

interface ReportBuilderProps {
  sections: ReportSection[];
  opportunities: OpportunityCard[];
  onToggleSection?: (id: string) => void;
  onExportHTML?: () => void;
  onExportPDF?: () => void;
}

export function ReportBuilder({
  sections,
  opportunities,
  onToggleSection,
  onExportHTML,
  onExportPDF,
}: ReportBuilderProps) {
  return (
    <StageCard
      title="Report Builder"
      status="approved"
      description="Customize and export your competitive intelligence report"
    >
      <div className="grid grid-cols-5 gap-4">
        {/* Left: Build Controls */}
        <div className="col-span-2 space-y-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Sections</h4>
            <div className="space-y-2.5">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between gap-3"
                >
                  <label
                    htmlFor={section.id}
                    className="text-sm text-gray-700 cursor-pointer flex-1"
                  >
                    {section.name}
                  </label>
                  <Switch
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => onToggleSection?.(section.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onExportHTML}
              className="flex-1 rounded-xl"
              variant="outline"
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Export HTML
            </Button>
            <Button
              onClick={onExportPDF}
              className="flex-1 rounded-xl bg-[#2D6BFF] hover:bg-[#2D6BFF]/90"
            >
              <FileDown className="mr-1.5 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="h-[480px] overflow-y-auto p-6 space-y-6">
              {/* Executive Summary */}
              {sections.find((s) => s.id === "summary")?.enabled && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Executive Summary
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Competitive landscape analysis for SaaS tools targeting early-stage
                    startups. Five leading competitors identified with deep feature
                    comparison and market positioning.
                  </p>
                </div>
              )}

              {/* Top-5 Overview */}
              {sections.find((s) => s.id === "competitors")?.enabled && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Top-5 Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-lg bg-gray-100" />
                          <span className="text-sm font-semibold text-gray-900">
                            Competitor {n}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          Brief tagline and positioning statement
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {sections.find((s) => s.id === "opportunities")?.enabled && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    Opportunities
                  </h3>
                  <div className="space-y-3">
                    {opportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-gray-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">
                            {opp.title}
                          </h4>
                          <Badge
                            className={cn(
                              "rounded-full text-xs",
                              opp.risk === "low" && "bg-green-100 text-green-700",
                              opp.risk === "medium" && "bg-amber-100 text-amber-700",
                              opp.risk === "high" && "bg-red-100 text-red-700"
                            )}
                          >
                            {opp.risk} risk
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          {opp.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {opp.evidenceLinks} evidence links
                          </span>
                          <span className="font-medium text-gray-700">
                            Next: {opp.nextStep}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Sources & Methodology</span>
                  <span className="opacity-50">Generated by SignalIdea</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StageCard>
  );
}
