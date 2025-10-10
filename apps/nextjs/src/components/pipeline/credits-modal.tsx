"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@saasfly/ui/dialog";
import { Button } from "@saasfly/ui/button";
import { Switch } from "@saasfly/ui/switch";
import { Badge } from "@saasfly/ui/badge";
import { DollarSign, Sparkles, ExternalLink } from "lucide-react";

interface CreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimatedCredits: string;
  creditsRemaining: number;
  hasFreeTrial?: boolean;
  onUseFreeTrial?: () => void;
  onBuyCredits?: () => void;
  onProceed?: (capped: boolean) => void;
}

export function CreditsModal({
  open,
  onOpenChange,
  estimatedCredits,
  creditsRemaining,
  hasFreeTrial = false,
  onUseFreeTrial,
  onBuyCredits,
  onProceed,
}: CreditsModalProps) {
  const [capEnabled, setCapEnabled] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-[18px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Analyze deeper with credits</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            This deep analysis requires credits to run the full pipeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estimated Credits */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white p-2">
                <DollarSign className="h-5 w-5 text-[#2D6BFF]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Estimated cost for this run
                </p>
                <p className="text-3xl font-bold text-[#2D6BFF]">~{estimatedCredits}</p>
                <p className="text-xs text-gray-600 mt-1">
                  You have <span className="font-semibold">{creditsRemaining} credits</span> remaining
                  this month
                </p>
              </div>
            </div>
          </div>

          {/* Cap Option */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <label
                  htmlFor="cap-toggle-modal"
                  className="text-sm font-medium text-gray-900 cursor-pointer block mb-1"
                >
                  Cap this run at $19
                </label>
                <p className="text-xs text-gray-600">
                  Automatically stop if costs exceed the cap
                </p>
              </div>
              <Switch
                id="cap-toggle-modal"
                checked={capEnabled}
                onCheckedChange={setCapEnabled}
              />
            </div>
          </div>

          {/* Free Trial Badge */}
          {hasFreeTrial && (
            <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    First report $9
                  </p>
                  <p className="text-xs text-purple-700">
                    Use your one-time trial offer to get this analysis at a discounted rate
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {hasFreeTrial && (
              <Button
                onClick={onUseFreeTrial}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Use 1 free trial ($9)
              </Button>
            )}
            <Button
              onClick={() => onProceed?.(capEnabled)}
              className="w-full rounded-xl bg-[#2D6BFF] hover:bg-[#2D6BFF]/90"
            >
              Proceed with credits
            </Button>
            <Button
              onClick={onBuyCredits}
              variant="outline"
              className="w-full rounded-xl"
            >
              Buy more credits
            </Button>
          </div>

          {/* Learn More */}
          <div className="text-center">
            <a
              href="#"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Learn how credits work
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
