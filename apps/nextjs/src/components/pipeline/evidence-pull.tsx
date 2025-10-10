"use client";

import { useState } from "react";
import { StageCard } from "./stage-card";
import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { ExternalLink, Eye, EyeOff, Download, RefreshCw } from "lucide-react";
import { cn } from "@saasfly/ui";

interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  timestamp: string;
  url: string;
}

interface Cluster {
  id: string;
  topic: string;
  sentiment: { positive: number; neutral: number; negative: number };
  posts: RedditPost[];
  visible: boolean;
}

interface EvidencePullProps {
  clusters: Cluster[];
  totalQueries: number;
  onToggleCluster?: (id: string) => void;
  onRepull?: () => void;
  onChangeKeywords?: () => void;
  onDownload?: () => void;
}

export function EvidencePull({
  clusters,
  totalQueries,
  onToggleCluster,
  onRepull,
  onChangeKeywords,
  onDownload,
}: EvidencePullProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(
    clusters[0]?.id || null
  );

  const currentCluster = clusters.find((c) => c.id === selectedCluster);

  return (
    <StageCard
      title="Evidence Pull"
      status="approved"
      description="Reddit discussions organized by topic clusters"
      onDownload={onDownload}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full text-xs">
            {totalQueries} queries
          </Badge>
          <Badge variant="secondary" className="rounded-full text-xs">
            {clusters.length} clusters
          </Badge>
        </div>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={onChangeKeywords}
            className="h-7 rounded-lg text-xs"
          >
            Change keywords
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRepull}
            className="h-7 rounded-lg text-xs"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Re-pull (-60%)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Left: Cluster List */}
        <div className="col-span-2 space-y-1.5">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => setSelectedCluster(cluster.id)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-all",
                selectedCluster === cluster.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {cluster.topic}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCluster?.(cluster.id);
                  }}
                  className="h-6 w-6 rounded-lg p-0 flex-shrink-0"
                >
                  {cluster.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </Button>
              </div>
              <div className="mt-2 flex gap-1">
                <div
                  className="h-1.5 rounded-full bg-green-500"
                  style={{ width: `${cluster.sentiment.positive}%` }}
                />
                <div
                  className="h-1.5 rounded-full bg-gray-300"
                  style={{ width: `${cluster.sentiment.neutral}%` }}
                />
                <div
                  className="h-1.5 rounded-full bg-red-500"
                  style={{ width: `${cluster.sentiment.negative}%` }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Right: Posts */}
        <div className="col-span-3 space-y-2">
          {currentCluster ? (
            currentCluster.posts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-gray-200 bg-white p-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">r/{post.subreddit}</span>
                      <span>•</span>
                      <span>{post.timestamp}</span>
                    </div>
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-300 p-8">
              <p className="text-sm text-gray-500">Select a cluster to view posts</p>
            </div>
          )}
        </div>
      </div>
    </StageCard>
  );
}
