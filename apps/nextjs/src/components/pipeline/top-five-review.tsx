"use client";

import { useState } from "react";
import { StageCard } from "./stage-card";
import { Button } from "@saasfly/ui/button";
import { GripVertical, RefreshCw, X } from "lucide-react";
import { cn } from "@saasfly/ui";
import Image from "next/image";

interface Competitor {
  id: string;
  name: string;
  tagline: string;
  logo?: string;
}

interface TopFiveReviewProps {
  competitors: Competitor[];
  estimatedCredits?: string;
  onApprove?: () => void;
  onReplace?: (id: string) => void;
  onReorder?: (competitors: Competitor[]) => void;
}

export function TopFiveReview({
  competitors,
  estimatedCredits = "16–18",
  onApprove,
  onReplace,
}: TopFiveReviewProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  return (
    <StageCard
      title="Top-5 Selector"
      status="needs-approval"
      description="Drag to reorder or replace competitors before deep analysis"
      onPrimaryAction={onApprove}
      primaryActionLabel="Approve & continue"
    >
      <div className="space-y-2">
        {competitors.slice(0, 5).map((competitor, index) => (
          <div
            key={competitor.id}
            draggable
            onDragStart={() => setDraggedItem(competitor.id)}
            onDragEnd={() => setDraggedItem(null)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all",
              "hover:border-gray-300 hover:shadow-sm cursor-move",
              draggedItem === competitor.id && "opacity-50"
            )}
          >
            <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 flex-shrink-0">
              {competitor.logo ? (
                <Image
                  src={competitor.logo}
                  alt={competitor.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-600">
                  {competitor.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{competitor.name}</p>
              <p className="text-xs text-gray-600 truncate">{competitor.tagline}</p>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReplace?.(competitor.id)}
                className="h-7 rounded-lg text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Replace
              </Button>
            </div>

            <span className="absolute -left-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
              {index + 1}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm font-medium text-blue-900">
            Deep analysis will cost ~{estimatedCredits} credits
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Free Top-5:</span> 2/day per account
          </p>
        </div>
      </div>
    </StageCard>
  );
}
