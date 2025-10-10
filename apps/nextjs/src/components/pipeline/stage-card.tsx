"use client";

import { cn } from "@saasfly/ui";
import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { Progress } from "@saasfly/ui/progress";
import { AlertCircle, CheckCircle2, Clock, PlayCircle, RotateCcw, Download, FileText } from "lucide-react";

export type StageStatus = "idle" | "running" | "needs-approval" | "approved" | "failed" | "stale";

interface StageCardProps {
  title: string;
  status: StageStatus;
  description: string;
  progress?: number;
  credits?: number;
  onPrimaryAction?: () => void;
  onViewLogs?: () => void;
  onDownload?: () => void;
  primaryActionLabel?: string;
  error?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const statusConfig: Record<StageStatus, {
  badge: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  idle: { badge: "Idle", color: "bg-gray-100 text-gray-700", icon: Clock },
  running: { badge: "Running", color: "bg-blue-100 text-blue-700", icon: PlayCircle },
  "needs-approval": { badge: "Needs Approval", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  approved: { badge: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  failed: { badge: "Failed", color: "bg-red-100 text-red-700", icon: AlertCircle },
  stale: { badge: "Stale", color: "bg-amber-100 text-amber-700", icon: RotateCcw },
};

export function StageCard({
  title,
  status,
  description,
  progress,
  credits,
  onPrimaryAction,
  onViewLogs,
  onDownload,
  primaryActionLabel,
  error,
  isLoading,
  children,
}: StageCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const getDefaultActionLabel = () => {
    if (primaryActionLabel) return primaryActionLabel;
    if (status === "needs-approval") return "Approve";
    if (status === "stale") return `Re-run${credits ? ` (~${credits} credits)` : ""}`;
    if (status === "failed") return "Retry";
    return "Run";
  };

  return (
    <div className="rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
        <Badge className={cn("ml-3 flex items-center gap-1.5 rounded-full px-3 py-1", config.color)}>
          <Icon className="h-3.5 w-3.5" />
          {config.badge}
        </Badge>
      </div>

      {/* Progress Bar */}
      {typeof progress === "number" && (
        <div className="mb-4">
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={onPrimaryAction} className="rounded-xl">
              Retry now
            </Button>
            {onViewLogs && (
              <Button size="sm" variant="ghost" onClick={onViewLogs} className="rounded-xl">
                View logs
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {children && (
        <div className="mb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            children
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onPrimaryAction && (
          <Button
            onClick={onPrimaryAction}
            disabled={isLoading}
            className={cn(
              "rounded-xl",
              status === "needs-approval" && "bg-[#2D6BFF] hover:bg-[#2D6BFF]/90",
              status === "stale" && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {getDefaultActionLabel()}
          </Button>
        )}
        {onViewLogs && (
          <Button
            size="sm"
            variant="outline"
            onClick={onViewLogs}
            className="rounded-xl"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            View logs
          </Button>
        )}
        {onDownload && (
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="rounded-xl"
          >
            <Download className="mr-1.5 h-4 w-4" />
            Download
          </Button>
        )}
      </div>
    </div>
  );
}
