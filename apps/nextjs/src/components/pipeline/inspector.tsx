"use client";

import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { Switch } from "@saasfly/ui/switch";
import { Progress } from "@saasfly/ui/progress";
import { DollarSign, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@saasfly/ui";

interface RunHistoryItem {
  id: string;
  timestamp: string;
  status: "success" | "failed" | "running";
  duration?: string;
  credits: number;
}

interface InspectorProps {
  estimatedCredits: string;
  cappedAt?: number;
  onToggleCap?: (enabled: boolean) => void;
  monthlyCreditsUsed: number;
  monthlyCreditsTotal: number;
  runHistory: RunHistoryItem[];
  onBuyCredits?: () => void;
}

export function Inspector({
  estimatedCredits,
  cappedAt = 19,
  onToggleCap,
  monthlyCreditsUsed,
  monthlyCreditsTotal,
  runHistory,
  onBuyCredits,
}: InspectorProps) {
  const creditsProgress = (monthlyCreditsUsed / monthlyCreditsTotal) * 100;
  const creditsRemaining = monthlyCreditsTotal - monthlyCreditsUsed;

  return (
    <div className="sticky top-6 space-y-4">
      {/* Credits Card */}
      <div className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-[#2D6BFF]" />
          <h3 className="text-base font-semibold text-gray-900">Credits</h3>
        </div>

        <div className="space-y-4">
          {/* Estimated Credits */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-600 mb-1">Estimated for this run</p>
            <p className="text-2xl font-bold text-blue-900">~{estimatedCredits}</p>
            <p className="text-xs text-blue-700 mt-1">credits</p>
          </div>

          {/* Cap Toggle */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <label htmlFor="cap-toggle" className="text-sm text-gray-700 cursor-pointer flex-1">
              Cap at ${cappedAt}
            </label>
            <Switch
              id="cap-toggle"
              defaultChecked
              onCheckedChange={onToggleCap}
            />
          </div>

          {/* Monthly Credits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Monthly credits</span>
              <span className="text-xs font-medium text-gray-900">
                {creditsRemaining} / {monthlyCreditsTotal}
              </span>
            </div>
            <Progress value={creditsProgress} className="h-2" />
            <p className="mt-2 text-xs text-gray-500">
              {creditsRemaining} credits remaining this month
            </p>
          </div>

          {/* Buy Credits */}
          <Button
            onClick={onBuyCredits}
            variant="outline"
            className="w-full rounded-xl"
          >
            Buy credits
          </Button>
        </div>
      </div>

      {/* History Card */}
      <div className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">History</h3>
        </div>

        <div className="space-y-2">
          {runHistory.length > 0 ? (
            runHistory.slice(0, 3).map((run) => (
              <div
                key={run.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {run.status === "success" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      )}
                      {run.status === "failed" && (
                        <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                      )}
                      {run.status === "running" && (
                        <AlertCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 animate-pulse" />
                      )}
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {run.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {run.duration && <span>{run.duration}</span>}
                      <span>•</span>
                      <span className="font-medium">{run.credits} credits</span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full text-xs flex-shrink-0",
                      run.status === "success" && "bg-green-100 text-green-700",
                      run.status === "failed" && "bg-red-100 text-red-700",
                      run.status === "running" && "bg-blue-100 text-blue-700"
                    )}
                  >
                    {run.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center">
              <p className="text-xs text-gray-500">No runs yet</p>
            </div>
          )}
        </div>

        {runHistory.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs rounded-xl"
          >
            View all history
          </Button>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">
            Credits are pre-held and only charged for actual usage. Unused credits are
            rolled back automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
