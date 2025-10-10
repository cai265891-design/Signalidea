"use client";

import { Badge } from "@saasfly/ui/badge";
import { Button } from "@saasfly/ui/button";
import { Progress } from "@saasfly/ui/progress";
import { Switch } from "@saasfly/ui/switch";
import { Card } from "@saasfly/ui/card";
import { Download, Plus, Minus, ExternalLink } from "lucide-react";
import { cn } from "@saasfly/ui";

interface CreditTransaction {
  id: string;
  date: string;
  stage: string;
  credits: number;
  reason: string;
  type: "charge" | "refund" | "purchase";
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending";
  downloadUrl: string;
}

interface BillingPageProps {
  currentPlan: string;
  monthlyCredits: { used: number; total: number };
  transactions: CreditTransaction[];
  invoices: Invoice[];
  hasFirstReportDiscount?: boolean;
  defaultCap?: boolean;
  onToggleDefaultCap?: (enabled: boolean) => void;
  onBuyCredits?: () => void;
  onUpgradePlan?: () => void;
}

export function BillingPage({
  currentPlan,
  monthlyCredits,
  transactions,
  invoices,
  hasFirstReportDiscount = false,
  defaultCap = true,
  onToggleDefaultCap,
  onBuyCredits,
  onUpgradePlan,
}: BillingPageProps) {
  const creditsProgress = (monthlyCredits.used / monthlyCredits.total) * 100;
  const creditsRemaining = monthlyCredits.total - monthlyCredits.used;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Usage</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your credits, view usage history, and download invoices
        </p>
      </div>

      {/* Current Plan */}
      <Card className="rounded-[18px] border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <Badge className="rounded-full bg-blue-100 text-blue-700">
                {currentPlan}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {monthlyCredits.total} credits per month
            </p>
          </div>
          <Button onClick={onUpgradePlan} className="rounded-xl">
            Upgrade Plan
          </Button>
        </div>
      </Card>

      {/* Credits Balance */}
      <Card className="rounded-[18px] border border-gray-200 p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Monthly Credits</h2>
            <p className="mt-1 text-sm text-gray-600">
              Resets on the 1st of each month
            </p>
          </div>
          {hasFirstReportDiscount && (
            <Badge className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
              First report $9 ✨
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {creditsRemaining}
            </span>
            <span className="text-lg text-gray-500">/ {monthlyCredits.total} credits</span>
          </div>
          <Progress value={creditsProgress} className="h-2.5" />
          <p className="text-sm text-gray-600">
            You've used {monthlyCredits.used} credits this month
          </p>
        </div>

        <Button
          onClick={onBuyCredits}
          className="mt-4 rounded-xl bg-[#2D6BFF] hover:bg-[#2D6BFF]/90"
        >
          Buy Additional Credits
        </Button>
      </Card>

      {/* Settings */}
      <Card className="rounded-[18px] border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h2>
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex-1">
            <label
              htmlFor="default-cap"
              className="text-sm font-medium text-gray-900 cursor-pointer block mb-1"
            >
              Cap at $19 by default
            </label>
            <p className="text-xs text-gray-600">
              Automatically limit spending on each analysis run
            </p>
          </div>
          <Switch
            id="default-cap"
            checked={defaultCap}
            onCheckedChange={onToggleDefaultCap}
          />
        </div>
      </Card>

      {/* Recent Transactions */}
      <Card className="rounded-[18px] border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Credit Transactions
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  Reason
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  Credits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.date}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {transaction.stage}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.reason}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono text-sm font-medium",
                        transaction.type === "charge" && "text-red-600",
                        transaction.type === "refund" && "text-green-600",
                        transaction.type === "purchase" && "text-blue-600"
                      )}
                    >
                      {transaction.type === "charge" && "−"}
                      {transaction.type === "refund" && "+"}
                      {transaction.type === "purchase" && "+"}
                      {Math.abs(transaction.credits)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoices */}
      <Card className="rounded-[18px] border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Invoice {invoice.id}
                  </p>
                  <p className="text-xs text-gray-600">{invoice.date}</p>
                </div>
                <Badge
                  className={cn(
                    "rounded-full",
                    invoice.status === "paid" && "bg-green-100 text-green-700",
                    invoice.status === "pending" && "bg-amber-100 text-amber-700"
                  )}
                >
                  {invoice.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-semibold text-gray-900">
                  ${invoice.amount.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  asChild
                >
                  <a href={invoice.downloadUrl} download>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
