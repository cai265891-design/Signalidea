"use client";

import { StageCard } from "./stage-card";
import { Button } from "@saasfly/ui/button";
import { Download } from "lucide-react";

interface ScopeData {
  targetUsers: string;
  region: string;
  timeRange: string;
  excludes: string[];
}

interface IntentClarifierProps {
  scope: ScopeData;
  onApplyChanges?: () => void;
  onDownload?: () => void;
}

export function IntentClarifier({ scope, onApplyChanges, onDownload }: IntentClarifierProps) {
  return (
    <StageCard
      title="Intent Clarifier"
      status="approved"
      description="Confirming parsed scope from your input"
      onPrimaryAction={onApplyChanges}
      primaryActionLabel="Apply changes"
    >
      <div className="space-y-3 rounded-xl bg-gray-50 p-4">
        <div>
          <p className="text-xs font-medium text-gray-500">Target Users</p>
          <p className="mt-1 text-sm text-gray-900">{scope.targetUsers}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-gray-500">Region</p>
            <p className="mt-1 text-sm text-gray-900">{scope.region}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Time Range</p>
            <p className="mt-1 text-sm text-gray-900">{scope.timeRange}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">Excludes</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {scope.excludes.map((item, idx) => (
              <span
                key={idx}
                className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-700 border border-gray-200"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDownload}
        className="mt-3 h-8 text-xs rounded-xl"
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Download brief.json
      </Button>
    </StageCard>
  );
}
