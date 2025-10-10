"use client";

import { useState } from "react";
import { StageCard } from "./stage-card";
import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { Plus, Ban, ExternalLink, Filter } from "lucide-react";
import { cn } from "@saasfly/ui";

interface Candidate {
  id: string;
  name: string;
  tagline: string;
  website: string;
  lastUpdate: string;
  confidence: number;
}

interface CandidateFinderProps {
  candidates: Candidate[];
  onAddToShortlist?: (id: string) => void;
  onBlacklist?: (id: string) => void;
}

export function CandidateFinder({ candidates, onAddToShortlist, onBlacklist }: CandidateFinderProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <StageCard
      title="Candidate Finder"
      status="approved"
      description="Top candidates discovered from your scope"
    >
      <div className="mb-3 flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-8 rounded-xl">
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Filters
        </Button>
        <Badge variant="secondary" className="rounded-full text-xs">
          {candidates.length} candidates
        </Badge>
      </div>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Tagline</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Website</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Last Update</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-600">Confidence</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  onMouseEnter={() => setHoveredRow(candidate.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={cn(
                    "transition-colors",
                    hoveredRow === candidate.id && "bg-blue-50/50"
                  )}
                >
                  <td className="px-3 py-2.5 text-sm font-medium text-gray-900">
                    {candidate.name}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600 max-w-[200px] truncate">
                    {candidate.tagline}
                  </td>
                  <td className="px-3 py-2.5 text-sm">
                    <a
                      href={candidate.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <span className="truncate max-w-[120px]">{candidate.website}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-600">
                    {candidate.lastUpdate}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge
                      className={cn(
                        "rounded-full text-xs",
                        candidate.confidence >= 80 && "bg-green-100 text-green-700",
                        candidate.confidence >= 60 && candidate.confidence < 80 && "bg-blue-100 text-blue-700",
                        candidate.confidence < 60 && "bg-gray-100 text-gray-700"
                      )}
                    >
                      {candidate.confidence}%
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddToShortlist?.(candidate.id)}
                        className="h-7 rounded-lg text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onBlacklist?.(candidate.id)}
                        className="h-7 w-7 rounded-lg p-0"
                      >
                        <Ban className="h-3.5 w-3.5 text-gray-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2">
        <p className="text-xs text-blue-900">
          <span className="font-medium">Note:</span> Top-5 remains free until you approve.
        </p>
      </div>
    </StageCard>
  );
}
