// Pipeline 相关类型定义

export type AnalysisStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type WorkflowType =
  | "INTENT_CLARIFIER"
  | "COMPETITOR_DISCOVERY"
  | "TOP_FIVE_SELECTOR"
  | "FEATURE_MATRIX"
  | "REDDIT_SEARCH";

// Intent Clarifier 结果
export interface IntentClarifierResult {
  "Clear Requirement Statement": string;
  Certainties: {
    "Target User Profile"?: string;
    "Target Market"?: string;
    "Must-Haves": string[];
    "Success Criteria"?: string[];
    "Out of Scope"?: string[];
  };
  "Key Assumptions": Array<{
    assumption: string;
    rationale: string;
    confidence: number;
  }>;
}

// Competitor
export interface Competitor {
  name: string;
  tagline: string;
  website: string;
  lastUpdate: string;
  confidence: number;
}

// Competitor Discovery 结果
export interface CompetitorDiscoveryResult {
  competitors: Competitor[];
  totalFound?: number;
}

// Top-5 Selector 结果
export interface TopFiveSelectorResult {
  competitors: Competitor[];
  selectionStrategy?: string;
  totalFound?: number;
}

// 异步任务状态
export interface AsyncTask {
  id: number;
  status: AnalysisStatus;
  workflowType: WorkflowType;
  result: any | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// Pipeline Job 完整状态
export interface PipelineJobStatus {
  id: number;
  authUserId: string;
  userInput: string;
  status: AnalysisStatus;
  currentStage: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;

  // 子任务
  intentTask: AsyncTask | null;
  competitorTask: AsyncTask | null;
  topFiveTask: AsyncTask | null;

  // 结果缓存
  intentResult: IntentClarifierResult | null;
  competitorResult: CompetitorDiscoveryResult | null;
  topFiveResult: TopFiveSelectorResult | null;
}

// Pipeline 启动响应
export interface StartPipelineResponse {
  jobId: number;
  status: AnalysisStatus;
  message: string;
}

// Pipeline 进度信息
export interface PipelineProgress {
  total: number; // 总步骤数
  completed: number; // 已完成步骤
  current: string; // 当前步骤名称
  percentage: number; // 完成百分比
}
