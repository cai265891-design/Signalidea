export const SubscriptionPlan = {
  FREE: "FREE",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
} as const;
export type SubscriptionPlan =
  (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];
export const Status = {
  PENDING: "PENDING",
  CREATING: "CREATING",
  INITING: "INITING",
  RUNNING: "RUNNING",
  STOPPED: "STOPPED",
  DELETED: "DELETED",
} as const;
export type Status = (typeof Status)[keyof typeof Status];
export const AnalysisStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;
export type AnalysisStatus =
  (typeof AnalysisStatus)[keyof typeof AnalysisStatus];
export const WorkflowType = {
  FEATURE_MATRIX: "FEATURE_MATRIX",
  REDDIT_SEARCH: "REDDIT_SEARCH",
} as const;
export type WorkflowType = (typeof WorkflowType)[keyof typeof WorkflowType];
