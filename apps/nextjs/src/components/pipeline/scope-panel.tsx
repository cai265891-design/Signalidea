"use client";

import { useState } from "react";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Label } from "@saasfly/ui/label";
import { Textarea } from "@saasfly/ui/textarea";
import { Badge } from "@saasfly/ui/badge";
import { X } from "lucide-react";

interface ScopePanelProps {
  initialData?: {
    region: string;
    timeWindow: string;
    excludes: string[];
    seedUrls: string[];
  };
  onUpdate?: (data: any) => void;
}

export function ScopePanel({ initialData, onUpdate }: ScopePanelProps) {
  const [region, setRegion] = useState(initialData?.region || "Global");
  const [timeWindow, setTimeWindow] = useState(initialData?.timeWindow || "6 months");
  const [excludes, setExcludes] = useState(initialData?.excludes || []);
  const [seedUrls, setSeedUrls] = useState(initialData?.seedUrls || []);
  const [newExclude, setNewExclude] = useState("");
  const [newSeedUrl, setNewSeedUrl] = useState("");

  const handleAddExclude = () => {
    if (newExclude.trim()) {
      setExcludes([...excludes, newExclude.trim()]);
      setNewExclude("");
    }
  };

  const handleAddSeedUrl = () => {
    if (newSeedUrl.trim()) {
      setSeedUrls([...seedUrls, newSeedUrl.trim()]);
      setNewSeedUrl("");
    }
  };

  const handleRemoveExclude = (index: number) => {
    setExcludes(excludes.filter((_, i) => i !== index));
  };

  const handleRemoveSeedUrl = (index: number) => {
    setSeedUrls(seedUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="sticky top-6 space-y-5 rounded-[18px] border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Scope</h2>
        <p className="mt-1 text-xs text-gray-600">Configure your analysis parameters</p>
      </div>

      <div className="space-y-4">
        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region" className="text-sm font-medium text-gray-700">
            Region
          </Label>
          <Input
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g., Global, North America, Europe"
            className="rounded-[16px]"
          />
        </div>

        {/* Time Window */}
        <div className="space-y-2">
          <Label htmlFor="timeWindow" className="text-sm font-medium text-gray-700">
            Time Window
          </Label>
          <Input
            id="timeWindow"
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value)}
            placeholder="e.g., 6 months, 1 year"
            className="rounded-[16px]"
          />
        </div>

        {/* Excludes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Excludes</Label>
          <div className="flex gap-2">
            <Input
              value={newExclude}
              onChange={(e) => setNewExclude(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddExclude()}
              placeholder="Add exclusion"
              className="rounded-[16px]"
            />
            <Button
              type="button"
              onClick={handleAddExclude}
              size="sm"
              className="rounded-xl"
            >
              Add
            </Button>
          </div>
          {excludes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {excludes.map((exclude, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="rounded-full pl-2.5 pr-1.5 py-1 flex items-center gap-1"
                >
                  <span className="text-xs">{exclude}</span>
                  <button
                    onClick={() => handleRemoveExclude(idx)}
                    className="rounded-full hover:bg-gray-300 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Seed URLs */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Seed URLs</Label>
          <div className="flex gap-2">
            <Input
              value={newSeedUrl}
              onChange={(e) => setNewSeedUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSeedUrl()}
              placeholder="https://..."
              className="rounded-[16px]"
            />
            <Button
              type="button"
              onClick={handleAddSeedUrl}
              size="sm"
              className="rounded-xl"
            >
              Add
            </Button>
          </div>
          {seedUrls.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {seedUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5"
                >
                  <span className="flex-1 text-xs text-gray-700 truncate">{url}</span>
                  <button
                    onClick={() => handleRemoveSeedUrl(idx)}
                    className="rounded-full hover:bg-gray-300 p-0.5 flex-shrink-0"
                  >
                    <X className="h-3 w-3 text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Button
        onClick={() =>
          onUpdate?.({ region, timeWindow, excludes, seedUrls })
        }
        className="w-full rounded-xl bg-[#2D6BFF] hover:bg-[#2D6BFF]/90"
      >
        Update Scope
      </Button>
    </div>
  );
}
