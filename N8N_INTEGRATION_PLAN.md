# n8n 工作流集成方案

## 📋 项目概述

本文档描述了 SignalIdea 项目中 n8n 工作流与前后端的集成架构设计。

## 🏗️ 整体架构设计

### 交互模式
```
前端 ↔ Next.js API Routes ↔ 数据库 ↔ n8n Workflows
         ↓                    ↑
    触发 n8n (Webhook)        |
         └─────────────────────┘
```

### 工作流交互方式

**方式 A: Webhook 触发(推荐)**
- 前端通过 API Route 触发
- API Route 调用 n8n webhook
- n8n 执行完成后回调 API endpoint
- API Route 更新数据库状态
- 前端轮询或 WebSocket 获取结果

**方式 B: 数据库轮询**
- API Route 创建任务记录
- n8n 定时轮询数据库
- n8n 处理后更新数据库
- 前端轮询 API 获取结果

## 🎯 五大工作流

### 1. 需求分析工作流
**功能**: 根据用户输入的自然语言进行需求分析

**流程**:
```
Webhook 触发
  → 接收 projectId + rawInput
  → OpenAI/Claude API (需求分析 prompt)
  → 结构化输出(JSON):
      - 核心需求 (coreNeeds)
      - 目标用户 (targetUsers)
      - 痛点分析 (painPoints)
      - 商业目标 (businessGoals)
  → HTTP Request 回调 API endpoint
```

**输入**:
- `projectId`: 项目ID
- `rawInput`: 用户原始需求描述

**输出**:
- 结构化的需求分析结果(JSON)

### 2. 竞品挖掘工作流
**功能**: 根据用户需求挖掘相关竞品

**流程**:
```
Webhook 触发
  → 接收 projectId + requirements
  → Google Search API / SerpAPI (搜索竞品)
  → AI 筛选相关竞品
  → 批量爬取竞品网站基本信息
  → 回调保存到数据库
```

**输入**:
- `projectId`: 项目ID
- `requirements`: 需求分析结果

**输出**:
- 竞品列表(名称、URL、描述、分类等)

### 3. 竞品功能分析工作流
**功能**: 分析竞品的核心功能

**流程**:
```
Webhook 触发
  → 接收 competitorIds[]
  → 循环处理每个竞品:
      → 爬取产品页面/文档
      → AI 提取功能列表
      → AI 分析实现方式
      → 用户反馈分析(如果有)
  → 回调保存结果
```

**输入**:
- `projectId`: 项目ID
- `competitorIds`: 竞品ID列表

**输出**:
- 每个竞品的功能详细分析

### 4. Reddit 需求收集工作流
**功能**: 从 Reddit 收集相关用户需求和反馈

**流程**:
```
Webhook 触发
  → 接收 keywords + subreddits
  → Reddit API 搜索帖子
  → 过滤相关帖子(按热度/相关性)
  → AI 分析每个帖子:
      → 提取用户需求
      → 情感分析
      → 优先级判断
  → 批量保存结果
```

**输入**:
- `projectId`: 项目ID
- `keywords`: 搜索关键词
- `subreddits`: 目标子版块(可选)

**输出**:
- Reddit 帖子及提取的需求洞察

### 5. 最终汇总分析工作流
**功能**: 综合工作流 3 和 4 的结果，生成最终分析报告

**流程**:
```
Webhook 触发
  → 从数据库读取:
      - Requirement (需求分析)
      - CompetitorFeature (所有竞品功能)
      - RedditInsight (所有Reddit洞察)
  → AI 综合分析(传入所有数据):
      → 提取关键发现
      → 功能优先级排序
      → 竞品差异化分析
      → 生成产品路线图建议
  → 保存最终报告
```

**输入**:
- `projectId`: 项目ID

**输出**:
- 综合分析报告(关键发现、推荐方案、功能优先级、路线图)

## 📊 数据库表设计

### Prisma Schema

```prisma
// 项目/需求表
model Project {
  id          Int      @id @default(autoincrement())
  authUserId  String
  name        String
  description String   @db.Text
  rawInput    String   @db.Text  // 用户原始输入
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 关联
  requirements      Requirement[]
  competitors       Competitor[]
  competitorFeatures CompetitorFeature[]
  redditInsights    RedditInsight[]
  finalSummary      FinalSummary?

  @@index([authUserId])
}

// 需求分析结果
model Requirement {
  id              Int      @id @default(autoincrement())
  projectId       Int
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  status          WorkflowStatus @default(PENDING)
  n8nExecutionId  String?  // n8n 执行 ID

  // AI 分析结果
  coreNeeds       String   @db.Text  // JSON 格式
  targetUsers     String   @db.Text  // JSON 格式
  painPoints      String   @db.Text  // JSON 格式
  businessGoals   String   @db.Text  // JSON 格式

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
}

// 竞品信息
model Competitor {
  id              Int      @id @default(autoincrement())
  projectId       Int
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  status          WorkflowStatus @default(PENDING)
  n8nExecutionId  String?

  name            String
  url             String?
  description     String?  @db.Text
  category        String?
  strength        String?  @db.Text
  weakness        String?  @db.Text
  marketPosition  String?  @db.Text

  features        CompetitorFeature[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
}

// 竞品功能分析
model CompetitorFeature {
  id              Int        @id @default(autoincrement())
  projectId       Int
  project         Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  competitorId    Int
  competitor      Competitor @relation(fields: [competitorId], references: [id], onDelete: Cascade)

  status          WorkflowStatus @default(PENDING)
  n8nExecutionId  String?

  featureName     String
  description     String     @db.Text
  priority        String?    // HIGH, MEDIUM, LOW
  implementation  String?    @db.Text
  userFeedback    String?    @db.Text

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([projectId])
  @@index([competitorId])
}

// Reddit 用户需求洞察
model RedditInsight {
  id              Int      @id @default(autoincrement())
  projectId       Int
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  status          WorkflowStatus @default(PENDING)
  n8nExecutionId  String?

  postTitle       String
  postUrl         String
  subreddit       String
  content         String   @db.Text
  sentiment       String?  // POSITIVE, NEUTRAL, NEGATIVE
  upvotes         Int?
  commentsCount   Int?

  // AI 提取的需求
  extractedNeeds  String   @db.Text  // JSON 格式
  priority        String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
}

// 最终汇总分析
model FinalSummary {
  id              Int      @id @default(autoincrement())
  projectId       Int      @unique
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  status          WorkflowStatus @default(PENDING)
  n8nExecutionId  String?

  // 综合分析结果
  keyFindings     String   @db.Text  // JSON 格式
  recommendations String   @db.Text  // JSON 格式
  featurePriority String   @db.Text  // JSON 格式
  roadmapSuggestion String @db.Text  // JSON 格式

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([projectId])
}

// 工作流执行状态
enum WorkflowStatus {
  PENDING      // 等待执行
  RUNNING      // 执行中
  COMPLETED    // 完成
  FAILED       // 失败
  CANCELLED    // 取消
}
```

## 🔌 Next.js API Routes 端点设计

### Router: `packages/api/src/router/workflow.ts`

```typescript
import { z } from "zod";
import { Next.js API Route, // 使用 @clerk/nextjs/server auth(), // 公开 API endpoint } from "../trpc";
import { db, WorkflowStatus } from "@saasfly/db";
import { getCurrentUser } from "@saasfly/auth";

const N8N_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_CALLBACK_SECRET = process.env.N8N_CALLBACK_SECRET;

export const workflowRouter = Next.js API Route({

  // 1. 创建项目并触发需求分析
  createProject: // 使用 @clerk/nextjs/server auth()
    .input(z.object({
      name: z.string(),
      description: z.string(),
      rawInput: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      // 创建项目
      const project = await db
        .insertInto("Project")
        .values({
          authUserId: user.id,
          name: input.name,
          description: input.description,
          rawInput: input.rawInput,
        })
        .returningAll()
        .executeTakeFirst();

      if (!project) {
        throw new Error("Failed to create project");
      }

      // 创建 Requirement 记录
      await db
        .insertInto("Requirement")
        .values({
          projectId: project.id,
          status: WorkflowStatus.PENDING,
          coreNeeds: "{}",
          targetUsers: "{}",
          painPoints: "{}",
          businessGoals: "{}",
        })
        .execute();

      // 触发 n8n 需求分析工作流
      const response = await fetch(`${N8N_URL}/webhook/requirement-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${N8N_API_KEY}`,
        },
        body: JSON.stringify({
          projectId: project.id,
          rawInput: input.rawInput,
        }),
      });

      if (!response.ok) {
        console.error("Failed to trigger n8n workflow");
      }

      return project;
    }),

  // 2. 触发竞品挖掘
  triggerCompetitorDiscovery: // 使用 @clerk/nextjs/server auth()
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      // 验证项目所有权
      const project = await db
        .selectFrom("Project")
        .where("id", "=", input.projectId)
        .where("authUserId", "=", user.id)
        .selectAll()
        .executeTakeFirst();

      if (!project) {
        throw new Error("Project not found");
      }

      // 获取需求分析结果
      const requirement = await db
        .selectFrom("Requirement")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .executeTakeFirst();

      // 调用 n8n webhook
      const response = await fetch(`${N8N_URL}/webhook/competitor-discovery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${N8N_API_KEY}`,
        },
        body: JSON.stringify({
          projectId: input.projectId,
          requirements: requirement,
        }),
      });

      const data = await response.json();
      return { executionId: data.executionId };
    }),

  // 3. 触发竞品功能分析
  triggerFeatureAnalysis: // 使用 @clerk/nextjs/server auth()
    .input(z.object({
      projectId: z.number(),
      competitorIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      // 验证项目所有权
      const project = await db
        .selectFrom("Project")
        .where("id", "=", input.projectId)
        .where("authUserId", "=", user.id)
        .selectAll()
        .executeTakeFirst();

      if (!project) {
        throw new Error("Project not found");
      }

      // 调用 n8n webhook
      const response = await fetch(`${N8N_URL}/webhook/feature-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${N8N_API_KEY}`,
        },
        body: JSON.stringify({
          projectId: input.projectId,
          competitorIds: input.competitorIds,
        }),
      });

      const data = await response.json();
      return { executionId: data.executionId };
    }),

  // 4. 触发 Reddit 需求收集
  triggerRedditInsights: // 使用 @clerk/nextjs/server auth()
    .input(z.object({
      projectId: z.number(),
      keywords: z.array(z.string()),
      subreddits: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      // 验证项目所有权
      const project = await db
        .selectFrom("Project")
        .where("id", "=", input.projectId)
        .where("authUserId", "=", user.id)
        .selectAll()
        .executeTakeFirst();

      if (!project) {
        throw new Error("Project not found");
      }

      // 调用 n8n webhook
      const response = await fetch(`${N8N_URL}/webhook/reddit-insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${N8N_API_KEY}`,
        },
        body: JSON.stringify({
          projectId: input.projectId,
          keywords: input.keywords,
          subreddits: input.subreddits,
        }),
      });

      const data = await response.json();
      return { executionId: data.executionId };
    }),

  // 5. 触发最终汇总
  triggerFinalSummary: // 使用 @clerk/nextjs/server auth()
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      // 验证项目所有权
      const project = await db
        .selectFrom("Project")
        .where("id", "=", input.projectId)
        .where("authUserId", "=", user.id)
        .selectAll()
        .executeTakeFirst();

      if (!project) {
        throw new Error("Project not found");
      }

      // 检查前置工作流是否完成
      const competitorFeatures = await db
        .selectFrom("CompetitorFeature")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .execute();

      const redditInsights = await db
        .selectFrom("RedditInsight")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .execute();

      if (competitorFeatures.length === 0 && redditInsights.length === 0) {
        throw new Error("No data available for summary. Please run feature analysis and Reddit insights first.");
      }

      // 创建 FinalSummary 记录
      await db
        .insertInto("FinalSummary")
        .values({
          projectId: input.projectId,
          status: WorkflowStatus.RUNNING,
          keyFindings: "{}",
          recommendations: "{}",
          featurePriority: "{}",
          roadmapSuggestion: "{}",
        })
        .onConflict((oc) => oc
          .column("projectId")
          .doUpdateSet({ status: WorkflowStatus.RUNNING })
        )
        .execute();

      // 调用 n8n webhook
      const response = await fetch(`${N8N_URL}/webhook/final-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${N8N_API_KEY}`,
        },
        body: JSON.stringify({
          projectId: input.projectId,
        }),
      });

      const data = await response.json();
      return { executionId: data.executionId };
    }),

  // 6. 获取项目状态(包含所有工作流状态)
  getProjectStatus: // 使用 @clerk/nextjs/server auth()
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      // 获取项目基本信息
      const project = await db
        .selectFrom("Project")
        .where("id", "=", input.projectId)
        .where("authUserId", "=", user.id)
        .selectAll()
        .executeTakeFirst();

      if (!project) {
        throw new Error("Project not found");
      }

      // 获取需求分析
      const requirement = await db
        .selectFrom("Requirement")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .executeTakeFirst();

      // 获取竞品列表
      const competitors = await db
        .selectFrom("Competitor")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .execute();

      // 获取竞品功能
      const competitorFeatures = await db
        .selectFrom("CompetitorFeature")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .execute();

      // 获取 Reddit 洞察
      const redditInsights = await db
        .selectFrom("RedditInsight")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .execute();

      // 获取最终汇总
      const finalSummary = await db
        .selectFrom("FinalSummary")
        .where("projectId", "=", input.projectId)
        .selectAll()
        .executeTakeFirst();

      return {
        project,
        requirement,
        competitors,
        competitorFeatures,
        redditInsights,
        finalSummary,
      };
    }),

  // 7. 获取项目列表
  listProjects: // 使用 @clerk/nextjs/server auth()
    .query(async ({ ctx }) => {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("Unauthorized");
      }

      return await db
        .selectFrom("Project")
        .where("authUserId", "=", user.id)
        .selectAll()
        .orderBy("createdAt", "desc")
        .execute();
    }),

  // 8. n8n 回调端点(更新结果)
  webhookCallback: // 公开 API endpoint
    .input(z.object({
      secret: z.string(),
      projectId: z.number(),
      workflowType: z.enum(["requirement", "competitor", "feature", "reddit", "summary"]),
      status: z.enum(["COMPLETED", "FAILED"]),
      data: z.any(),
      executionId: z.string(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // 验证回调密钥
      if (input.secret !== N8N_CALLBACK_SECRET) {
        throw new Error("Invalid callback secret");
      }

      // 根据 workflowType 更新对应表
      switch(input.workflowType) {
        case "requirement":
          await db
            .updateTable("Requirement")
            .set({
              status: input.status === "COMPLETED" ? WorkflowStatus.COMPLETED : WorkflowStatus.FAILED,
              n8nExecutionId: input.executionId,
              coreNeeds: input.data.coreNeeds || "{}",
              targetUsers: input.data.targetUsers || "{}",
              painPoints: input.data.painPoints || "{}",
              businessGoals: input.data.businessGoals || "{}",
              updatedAt: new Date(),
            })
            .where("projectId", "=", input.projectId)
            .execute();
          break;

        case "competitor":
          // 批量插入竞品
          if (input.data.competitors && Array.isArray(input.data.competitors)) {
            for (const competitor of input.data.competitors) {
              await db
                .insertInto("Competitor")
                .values({
                  projectId: input.projectId,
                  status: WorkflowStatus.COMPLETED,
                  n8nExecutionId: input.executionId,
                  name: competitor.name,
                  url: competitor.url,
                  description: competitor.description,
                  category: competitor.category,
                  strength: competitor.strength,
                  weakness: competitor.weakness,
                  marketPosition: competitor.marketPosition,
                })
                .execute();
            }
          }
          break;

        case "feature":
          // 批量插入功能分析
          if (input.data.features && Array.isArray(input.data.features)) {
            for (const feature of input.data.features) {
              await db
                .insertInto("CompetitorFeature")
                .values({
                  projectId: input.projectId,
                  competitorId: feature.competitorId,
                  status: WorkflowStatus.COMPLETED,
                  n8nExecutionId: input.executionId,
                  featureName: feature.featureName,
                  description: feature.description,
                  priority: feature.priority,
                  implementation: feature.implementation,
                  userFeedback: feature.userFeedback,
                })
                .execute();
            }
          }
          break;

        case "reddit":
          // 批量插入 Reddit 洞察
          if (input.data.insights && Array.isArray(input.data.insights)) {
            for (const insight of input.data.insights) {
              await db
                .insertInto("RedditInsight")
                .values({
                  projectId: input.projectId,
                  status: WorkflowStatus.COMPLETED,
                  n8nExecutionId: input.executionId,
                  postTitle: insight.postTitle,
                  postUrl: insight.postUrl,
                  subreddit: insight.subreddit,
                  content: insight.content,
                  sentiment: insight.sentiment,
                  upvotes: insight.upvotes,
                  commentsCount: insight.commentsCount,
                  extractedNeeds: insight.extractedNeeds || "{}",
                  priority: insight.priority,
                })
                .execute();
            }
          }
          break;

        case "summary":
          await db
            .updateTable("FinalSummary")
            .set({
              status: input.status === "COMPLETED" ? WorkflowStatus.COMPLETED : WorkflowStatus.FAILED,
              n8nExecutionId: input.executionId,
              keyFindings: input.data.keyFindings || "{}",
              recommendations: input.data.recommendations || "{}",
              featurePriority: input.data.featurePriority || "{}",
              roadmapSuggestion: input.data.roadmapSuggestion || "{}",
              updatedAt: new Date(),
            })
            .where("projectId", "=", input.projectId)
            .execute();
          break;
      }

      return { success: true };
    }),
});
```

## 🎨 前端集成方案

### 项目详情页面示例

```typescript
// app/dashboard/projects/[id]/page.tsx

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
// 使用标准 fetch 调用 API Routes
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { Badge } from "@saasfly/ui/badge";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = parseInt(params.id as string);

  // 获取项目状态
  const {
    data: projectData,
    isLoading,
    refetch
  } = api.workflow.getProjectStatus.useQuery({ projectId });

  // 触发工作流的 mutations
  const triggerCompetitor = api.workflow.triggerCompetitorDiscovery.useMutation({
    onSuccess: () => {
      console.log("Competitor discovery workflow triggered");
      refetch();
    },
  });

  const triggerFeature = api.workflow.triggerFeatureAnalysis.useMutation({
    onSuccess: () => {
      console.log("Feature analysis workflow triggered");
      refetch();
    },
  });

  const triggerReddit = api.workflow.triggerRedditInsights.useMutation({
    onSuccess: () => {
      console.log("Reddit insights workflow triggered");
      refetch();
    },
  });

  const triggerSummary = api.workflow.triggerFinalSummary.useMutation({
    onSuccess: () => {
      console.log("Final summary workflow triggered");
      refetch();
    },
  });

  // 轮询刷新(当有工作流在运行时)
  useEffect(() => {
    if (!projectData) return;

    const hasRunningWorkflows =
      projectData.requirement?.status === "RUNNING" ||
      projectData.competitors?.some(c => c.status === "RUNNING") ||
      projectData.competitorFeatures?.some(f => f.status === "RUNNING") ||
      projectData.redditInsights?.some(r => r.status === "RUNNING") ||
      projectData.finalSummary?.status === "RUNNING";

    if (hasRunningWorkflows) {
      const interval = setInterval(() => {
        refetch();
      }, 5000); // 每5秒刷新一次

      return () => clearInterval(interval);
    }
  }, [projectData, refetch]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!projectData?.project) {
    return <div>Project not found</div>;
  }

  const { project, requirement, competitors, competitorFeatures, redditInsights, finalSummary } = projectData;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 项目基本信息 */}
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
        <p className="text-gray-600 mb-4">{project.description}</p>
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">原始需求:</h3>
          <p>{project.rawInput}</p>
        </div>
      </Card>

      {/* 工作流状态看板 */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">工作流状态</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 需求分析 */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">1. 需求分析</h3>
            <Badge>{requirement?.status || "PENDING"}</Badge>
            {requirement?.status === "COMPLETED" && (
              <div className="mt-2 text-sm text-green-600">✓ 已完成</div>
            )}
          </div>

          {/* 竞品挖掘 */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">2. 竞品挖掘</h3>
            <div className="space-y-1">
              <div>找到 {competitors?.length || 0} 个竞品</div>
              <Button
                size="sm"
                onClick={() => triggerCompetitor.mutate({ projectId })}
                disabled={triggerCompetitor.isLoading || requirement?.status !== "COMPLETED"}
              >
                {triggerCompetitor.isLoading ? "执行中..." : "开始挖掘"}
              </Button>
            </div>
          </div>

          {/* 竞品功能分析 */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">3. 功能分析</h3>
            <div className="space-y-1">
              <div>分析 {competitorFeatures?.length || 0} 个功能</div>
              <Button
                size="sm"
                onClick={() => {
                  const competitorIds = competitors?.map(c => c.id) || [];
                  if (competitorIds.length > 0) {
                    triggerFeature.mutate({ projectId, competitorIds });
                  }
                }}
                disabled={triggerFeature.isLoading || !competitors || competitors.length === 0}
              >
                {triggerFeature.isLoading ? "分析中..." : "开始分析"}
              </Button>
            </div>
          </div>

          {/* Reddit 需求收集 */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">4. Reddit 洞察</h3>
            <div className="space-y-1">
              <div>收集 {redditInsights?.length || 0} 条洞察</div>
              <Button
                size="sm"
                onClick={() => {
                  // 这里可以弹出对话框让用户输入关键词
                  const keywords = [project.name]; // 简化示例
                  triggerReddit.mutate({ projectId, keywords });
                }}
                disabled={triggerReddit.isLoading || requirement?.status !== "COMPLETED"}
              >
                {triggerReddit.isLoading ? "收集中..." : "开始收集"}
              </Button>
            </div>
          </div>

          {/* 最终汇总 */}
          <div className="border p-4 rounded">
            <h3 className="font-semibold mb-2">5. 最终汇总</h3>
            <div className="space-y-1">
              <Badge>{finalSummary?.status || "PENDING"}</Badge>
              <Button
                size="sm"
                onClick={() => triggerSummary.mutate({ projectId })}
                disabled={
                  triggerSummary.isLoading ||
                  (!competitorFeatures?.length && !redditInsights?.length)
                }
              >
                {triggerSummary.isLoading ? "汇总中..." : "生成汇总"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 需求分析结果 */}
      {requirement?.status === "COMPLETED" && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">需求分析结果</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">核心需求</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                {requirement.coreNeeds}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">目标用户</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                {requirement.targetUsers}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">痛点分析</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                {requirement.painPoints}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">商业目标</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                {requirement.businessGoals}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* 竞品列表 */}
      {competitors && competitors.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">竞品分析</h2>
          <div className="space-y-4">
            {competitors.map(competitor => (
              <div key={competitor.id} className="border p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold">{competitor.name}</h3>
                  {competitor.url && (
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      访问网站 →
                    </a>
                  )}
                </div>
                {competitor.description && (
                  <p className="text-gray-600 mb-2">{competitor.description}</p>
                )}
                {competitor.category && (
                  <Badge variant="outline">{competitor.category}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 竞品功能分析 */}
      {competitorFeatures && competitorFeatures.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">功能分析</h2>
          <div className="space-y-3">
            {competitorFeatures.map(feature => (
              <div key={feature.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">{feature.featureName}</h4>
                  {feature.priority && (
                    <Badge variant={
                      feature.priority === "HIGH" ? "destructive" :
                      feature.priority === "MEDIUM" ? "default" :
                      "secondary"
                    }>
                      {feature.priority}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reddit 洞察 */}
      {redditInsights && redditInsights.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Reddit 用户洞察</h2>
          <div className="space-y-4">
            {redditInsights.map(insight => (
              <div key={insight.id} className="border p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{insight.postTitle}</h4>
                  <div className="flex gap-2">
                    {insight.sentiment && (
                      <Badge variant={
                        insight.sentiment === "POSITIVE" ? "default" :
                        insight.sentiment === "NEGATIVE" ? "destructive" :
                        "secondary"
                      }>
                        {insight.sentiment}
                      </Badge>
                    )}
                    {insight.upvotes && (
                      <span className="text-sm text-gray-500">
                        ↑ {insight.upvotes}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={insight.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mb-2 block"
                >
                  r/{insight.subreddit}
                </a>
                <p className="text-sm text-gray-600 mb-2">{insight.content.substring(0, 200)}...</p>
                {insight.extractedNeeds && insight.extractedNeeds !== "{}" && (
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <h5 className="text-sm font-semibold mb-1">提取的需求:</h5>
                    <pre className="text-xs overflow-auto">{insight.extractedNeeds}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 最终汇总报告 */}
      {finalSummary?.status === "COMPLETED" && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
          <h2 className="text-2xl font-bold mb-4">📊 最终分析报告</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🔑 关键发现</h3>
              <pre className="bg-white p-4 rounded text-sm overflow-auto">
                {finalSummary.keyFindings}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💡 推荐方案</h3>
              <pre className="bg-white p-4 rounded text-sm overflow-auto">
                {finalSummary.recommendations}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⭐ 功能优先级</h3>
              <pre className="bg-white p-4 rounded text-sm overflow-auto">
                {finalSummary.featurePriority}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🗺️ 产品路线图建议</h3>
              <pre className="bg-white p-4 rounded text-sm overflow-auto">
                {finalSummary.roadmapSuggestion}
              </pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### 项目列表页面

```typescript
// app/dashboard/projects/page.tsx

"use client";

// 使用标准 fetch 调用 API Routes
import { Button } from "@saasfly/ui/button";
import { Card } from "@saasfly/ui/card";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projects, isLoading } = api.workflow.listProjects.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的项目</h1>
        <Button onClick={() => router.push("/dashboard/projects/new")}>
          创建新项目
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map(project => (
          <Card
            key={project.id}
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
          >
            <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>
            <div className="text-xs text-gray-500">
              创建于 {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>

      {projects?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          还没有项目，点击上方按钮创建第一个项目
        </div>
      )}
    </div>
  );
}
```

## 🔐 安全配置

### 环境变量

在 `.env.local` 中添加:

```env
# n8n 配置
N8N_WEBHOOK_URL=https://your-n8n.digitalocean.app
N8N_API_KEY=your-n8n-api-key
N8N_CALLBACK_SECRET=your-shared-secret-key-for-callbacks
```

### n8n Webhook 安全

1. 在 n8n 工作流的 Webhook 节点中配置 Header Authentication
2. 验证 `Authorization: Bearer ${N8N_API_KEY}`
3. 回调时携带 `N8N_CALLBACK_SECRET` 进行验证

## 📝 实施步骤

### Phase 1: 数据库准备
1. 更新 `packages/db/prisma/schema.prisma` 添加上述表结构
2. 运行 `bun db:push` 应用数据库变更
3. 验证数据库表创建成功

### Phase 2: Next.js API Routes 开发
1. 创建 `packages/api/src/router/workflow.ts`
2. 在 `packages/api/src/edge.ts` 中添加 `workflowRouter`
3. 测试 API 端点

### Phase 3: n8n 工作流搭建
1. 在 n8n 中创建 5 个工作流
2. 配置 Webhook 触发器和回调
3. 配置 AI 节点(OpenAI/Claude)
4. 配置数据采集节点(Google Search, Reddit API 等)
5. 测试每个工作流单独运行

### Phase 4: 前端开发
1. 创建项目列表页面 `/dashboard/projects`
2. 创建项目创建页面 `/dashboard/projects/new`
3. 创建项目详情页面 `/dashboard/projects/[id]`
4. 实现工作流触发和状态监控
5. 实现结果可视化展示

### Phase 5: 联调测试
1. 端到端测试每个工作流
2. 测试错误处理和重试逻辑
3. 性能优化(轮询频率、缓存等)
4. 用户体验优化

## 🎯 下一步行动

建议按顺序实施:

1. ✅ **Phase 1**: 数据库设计 (最重要,是基础)
2. ✅ **Phase 2**: API 端点开发
3. ⏳ **Phase 3**: n8n 工作流搭建
4. ⏳ **Phase 4**: 前端界面开发
5. ⏳ **Phase 5**: 整体联调测试

需要我帮你实施哪个阶段?
