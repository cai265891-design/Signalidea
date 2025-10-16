"use client";

import { useState, useEffect } from "react";
import { Button } from "@acme/ui/button";
import { Progress } from "@acme/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Badge } from "@acme/ui/badge";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

interface Competitor {
  name: string;
  website: string;
  tagline?: string;
}

interface Task {
  id: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  inputData: {
    name: string;
    website: string;
    tagline: string;
  };
  result: any;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface Progress {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  pending: number;
  percentage: number;
}

interface MatrixForgeParallelProps {
  projectId: number;
  topFiveCompetitors: Competitor[];
  onComplete: (results: Task[]) => void;
}

export function MatrixForgeParallel({
  projectId,
  topFiveCompetitors,
  onComplete,
}: MatrixForgeParallelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<Progress>({
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
    pending: 0,
    percentage: 0,
  });

  // 触发分析
  const triggerAnalysis = async () => {
    setIsRunning(true);

    try {
      const response = await fetch("/api/n8n/matrix-forge-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          topFiveCompetitors,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to trigger analysis");
      }

      const data = await response.json();
      console.log("Analysis triggered:", data);

      // 开始轮询进度
      startPolling();
    } catch (error) {
      console.error("Failed to trigger analysis:", error);
      setIsRunning(false);
      // TODO: 显示错误 toast
    }
  };

  // 轮询进度
  const startPolling = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/n8n/task-progress?projectId=${projectId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch progress");
        }

        const data = await response.json();
        setTasks(data.tasks);
        setProgress(data.progress);

        // 如果全部完成，停止轮询
        if (
          data.progress.completed + data.progress.failed ===
          data.progress.total
        ) {
          clearInterval(interval);
          setIsRunning(false);
          onComplete(data.tasks);
        }
      } catch (error) {
        console.error("Failed to fetch progress:", error);
      }
    }, 3000); // 每 3 秒查询一次

    // 清理函数
    return () => clearInterval(interval);
  };

  // 状态图标
  const StatusIcon = ({ status }: { status: Task["status"] }) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "PROCESSING":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  // 状态徽章
  const StatusBadge = ({ status }: { status: Task["status"] }) => {
    const variants: Record<Task["status"], string> = {
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      PENDING: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={variants[status]} variant="outline">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 触发按钮 */}
      {!isRunning && tasks.length === 0 && (
        <Button
          onClick={triggerAnalysis}
          size="lg"
          className="w-full"
        >
          Start Parallel Analysis
        </Button>
      )}

      {/* 进度条 */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress.percentage} className="h-2" />
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {progress.completed}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {progress.processing}
                </div>
                <div className="text-sm text-muted-foreground">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {progress.pending}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {progress.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 任务列表 */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Competitor Analysis Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={task.status} />
                    <div>
                      <div className="font-medium">{task.inputData.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {task.inputData.website}
                      </div>
                      {task.errorMessage && (
                        <div className="text-sm text-red-600 mt-1">
                          {task.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 完成后显示结果 */}
      {!isRunning && tasks.length > 0 && progress.percentage === 100 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              Analysis Complete! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              Successfully analyzed {progress.completed} competitors.
              {progress.failed > 0 && ` ${progress.failed} failed.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
