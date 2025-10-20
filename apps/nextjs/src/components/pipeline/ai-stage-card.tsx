"use client";

import { useState } from "react";
import { Card } from "@saasfly/ui/card";
import { Badge } from "@saasfly/ui/badge";
import { Button } from "@saasfly/ui/button";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { cn } from "@saasfly/ui";

interface AIStageCardProps {
  title: string;
  description?: string;
  status: "pending" | "running" | "completed" | "active" | "needs-approval";
  content?: React.ReactNode;
  badge?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function AIStageCard({
  title,
  description,
  status,
  content,
  badge,
  isExpanded: controlledExpanded,
  onToggle,
}: AIStageCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const StatusIcon = {
    pending: Circle,
    running: Loader2,
    completed: CheckCircle2,
    active: Sparkles,
    "needs-approval": CheckCircle2,
  }[status];

  const statusColors = {
    pending: "text-gray-400",
    running: "text-blue-600 animate-spin",
    completed: "text-green-600",
    active: "text-purple-600",
    "needs-approval": "text-amber-600",
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all",
      status === "pending" && "border-l-gray-300 bg-gray-50/50",
      status === "running" && "border-l-blue-500 bg-blue-50/30",
      status === "completed" && "border-l-green-500 bg-white",
      status === "active" && "border-l-purple-500 bg-purple-50/30",
      status === "needs-approval" && "border-l-amber-500 bg-amber-50/30"
    )}>
      <div
        className="flex items-start justify-between p-6 cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-start gap-4 flex-1">
          <div className="mt-1">
            <StatusIcon className={cn("h-5 w-5", statusColors[status])} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {badge && (
                <Badge variant="secondary" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600">{description}</p>
            )}
          </div>
        </div>

        {content && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {content && isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 bg-white">
          {content}
        </div>
      )}
    </Card>
  );
}
