"use client";

import { useState } from "react";
import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { Card } from "@saasfly/ui/card";
import { Sparkles, Clock, CheckCircle2, Loader2, Plus } from "lucide-react";
import { cn } from "@saasfly/ui";

interface HistoryItem {
  id: string;
  timestamp: string;
  duration: string;
  credits: number;
  status: "success" | "running" | "failed";
}

interface AIPipelineLayoutProps {
  children: React.ReactNode;
  credits?: number;
  history?: HistoryItem[];
  onNewAction?: () => void;
}

export function AIPipelineLayout({
  children,
  credits = 68,
  history = [],
  onNewAction,
}: AIPipelineLayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Sidebar - History */}
      <aside className="w-80 border-r border-gray-200 bg-white p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">History</h2>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 space-y-3 overflow-y-auto">
          {history.map((item) => (
            <Card
              key={item.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.status === "success" && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  {item.status === "running" && (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  )}
                  {item.status === "failed" && (
                    <div className="h-4 w-4 rounded-full bg-red-100 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {item.timestamp}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    item.status === "success" && "bg-green-100 text-green-700",
                    item.status === "running" && "bg-blue-100 text-blue-700",
                    item.status === "failed" && "bg-red-100 text-red-700"
                  )}
                >
                  {item.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{item.duration}</span>
                <span className="font-medium">{item.credits} credits</span>
              </div>
            </Card>
          ))}
        </div>

        {/* New Action Button */}
        <Button
          onClick={onNewAction}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Action
        </Button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 border-0 px-4 py-1.5">
                <span className="font-semibold">Credits {credits}</span>
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gray-300"
              >
                cai
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
