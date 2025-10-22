# Pipeline 异步轮询系统配置指南

## 系统概述

Pipeline 系统已从**同步阻塞模式**改造为**异步轮询模式**,实现以下改进:

- ✅ 前端立即响应,不再阻塞等待
- ✅ 每个工作流完成后立即渲染,无需等待全部完成
- ✅ 支持页面刷新后恢复进度
- ✅ 后端自动编排工作流链(Intent → Competitor Discovery → Top-5 Selector)

## 架构变更

### 旧架构(同步阻塞)
```
用户点击 New Action
  → 调用 /api/n8n/analyze (等待60s)
    → 渲染结果1
      → 调用 /api/n8n/competitor-discovery (等待90s)
        → 渲染结果2
          → 调用 /api/n8n/top-five-selector (等待60s)
            → 渲染结果3
总耗时: 210秒,完全阻塞
```

### 新架构(异步轮询)
```
用户点击 New Action
  → 调用 /api/pipeline/start (立即返回jobId)
    → 前端每3-5秒轮询 /api/pipeline/status/{jobId}
      → Intent完成 → 自动渲染结果1
        → 后端自动触发 Competitor Discovery
          → Competitor完成 → 自动渲染结果2
            → 后端自动触发 Top-5 Selector
              → Top-5完成 → 自动渲染结果3

用户等待时间: 0秒(立即看到进度)
总耗时: 仍然210秒,但**非阻塞**,用户体验大幅提升
```

## 必要配置步骤

### 1. 数据库迁移

**⚠️ 重要:** Schema 已扩展,需要运行迁移

```bash
# 启动数据库(如果未启动)
# 例如使用 Docker:
# docker start postgres

# 或使用本地 PostgreSQL:
# brew services start postgresql

# 运行迁移
cd /Users/caihongjia/SignalIdea
bun db:push
```

**新增的数据库表:**
- `PipelineJob`: 跟踪整个 Pipeline 生命周期
  - 字段: intentTaskId, competitorTaskId, topFiveTaskId
  - 缓存: intentResult, competitorResult, topFiveResult
  - 状态: currentStage, status, errorMessage

**新增的 WorkflowType 枚举值:**
- `INTENT_CLARIFIER`
- `COMPETITOR_DISCOVERY`
- `TOP_FIVE_SELECTOR`

### 2. 环境变量配置

在 `.env.local` 或 Vercel 环境变量中添加:

```bash
# N8N Callback Secret (用于验证回调请求)
N8N_CALLBACK_SECRET=your-secure-random-secret-here

# 现有的 N8N 配置(保持不变)
N8N_WEBHOOK_URL=http://your-n8n:5678/webhook/requirement-analysis
N8N_COMPETITOR_DISCOVERY_URL=http://your-n8n:5678/webhook/competitor-discovery
N8N_TOP_FIVE_SELECTOR_URL=http://your-n8n:5678/webhook/top-five-selector
N8N_API_KEY=your_n8n_api_key
```

**生成安全的密钥:**
```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -base64 32
```

### 3. N8N Workflow 配置

每个 N8N workflow **必须添加回调节点**,在完成后通知后端:

#### 添加 HTTP Request 节点(Callback)

在每个 workflow 的末尾添加:

**节点名称:** "Callback to Backend"

**配置:**
```
Method: POST
URL: https://your-app.vercel.app/api/pipeline/callback
Authentication: None
Headers:
  Content-Type: application/json
Body (JSON):
{
  "secret": "{{$env.N8N_CALLBACK_SECRET}}",
  "taskId": "{{$json.taskId}}",
  "status": "COMPLETED",
  "result": {{$json.output}}
}
```

**错误处理:**
如果 workflow 失败,添加 Error Trigger 节点:
```json
{
  "secret": "{{$env.N8N_CALLBACK_SECRET}}",
  "taskId": "{{$json.taskId}}",
  "status": "FAILED",
  "errorMessage": "{{$json.error.message}}"
}
```

#### N8N 环境变量

在 N8N 中设置:
```bash
N8N_CALLBACK_SECRET=same-secret-as-in-nextjs
```

### 4. N8N Workflow 输入格式调整

#### Intent Clarifier (requirement-analysis)
**输入:**
```json
{
  "input": "用户输入的需求",
  "taskId": 123
}
```

#### Competitor Discovery
**输入:**
```json
{
  "userInput": "原始需求",
  "analysisData": { /* Intent Clarifier 结果 */ },
  "taskId": 124
}
```

#### Top-5 Selector
**输入:**
```json
{
  "competitors": [ /* Competitor Discovery 结果 */ ],
  "analysisData": { /* Intent Clarifier 结果 */ },
  "taskId": 125
}
```

## API 端点说明

### POST /api/pipeline/start
启动完整 Pipeline,立即返回 jobId

**请求:**
```json
{
  "userInput": "I want to build an AI image product"
}
```

**响应:**
```json
{
  "jobId": 1,
  "status": "PROCESSING",
  "message": "Pipeline started successfully. Use /api/pipeline/status/{jobId} to check progress."
}
```

### GET /api/pipeline/status/{jobId}
查询 Pipeline 当前状态和已完成的结果

**响应:**
```json
{
  "id": 1,
  "authUserId": "user_xxx",
  "userInput": "I want to build...",
  "status": "PROCESSING",
  "currentStage": "COMPETITOR_DISCOVERY",
  "intentTask": {
    "id": 10,
    "status": "COMPLETED",
    "createdAt": "...",
    "completedAt": "..."
  },
  "intentResult": { /* 完整的 Intent Clarifier 结果 */ },
  "competitorTask": {
    "id": 11,
    "status": "PROCESSING",
    "createdAt": "..."
  },
  "competitorResult": null,
  "topFiveTask": null,
  "topFiveResult": null
}
```

### POST /api/pipeline/callback
N8N 回调接口(内部使用)

**安全验证:** 需要提供正确的 `N8N_CALLBACK_SECRET`

## 前端实现细节

### usePipelinePolling Hook

**智能轮询间隔:**
- 前30秒: 每3秒轮询一次
- 30秒-2分钟: 每5秒轮询一次
- 2分钟后: 每10秒轮询一次

**自动停止:**
- Pipeline 完成(COMPLETED)时停止
- Pipeline 失败(FAILED)时停止
- 组件卸载时清理

**localStorage 持久化:**
- 保存 jobId 用于页面刷新恢复
- 完成或失败后自动清理

### Pipeline Page 改造

**状态管理:**
```typescript
const [jobId, setJobId] = useState<number | null>(null);
const { status, isLoading, error, refresh } = usePipelinePolling({
  jobId,
  enabled: !!jobId,
  onComplete: (finalStatus) => { /* 处理完成 */ },
});

// 从 status 中提取数据
const analysisData = status?.intentResult;
const competitorData = status?.competitorResult;
const topFiveCompetitors = status?.topFiveResult?.competitors || [];
```

**自动展开逻辑:**
- Intent Clarifier 完成时自动展开
- Competitor Discovery 开始/完成时展开
- Top-5 Selector 开始/完成时展开

## 测试步骤

### 1. 本地测试

```bash
# 启动开发服务器
bun run dev:web

# 访问 Pipeline 页面
open http://localhost:3000/pipeline

# 点击 "New Action" 按钮
# 观察:
# - 立即返回,无阻塞
# - 每个阶段完成后自动展开并显示结果
# - 可以刷新页面,进度恢复
```

### 2. N8N 测试

```bash
# 测试 Intent Clarifier webhook
curl -X POST http://your-n8n:5678/webhook/requirement-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -d '{
    "input": "I want to build an AI image product",
    "taskId": 999
  }'

# 检查是否调用了 callback:
# POST /api/pipeline/callback
# {"secret":"...","taskId":999,"status":"COMPLETED","result":{...}}
```

### 3. 端到端测试

1. 点击 "New Action" → 应该立即返回
2. 等待3秒 → Intent Clarifier 开始处理
3. Intent 完成 → 自动展开显示结果,Competitor Discovery 自动开始
4. Competitor 完成 → 自动展开显示竞品列表,Top-5 开始(如果>5个)
5. Top-5 完成 → 显示最终5个竞品
6. 刷新页面 → 进度恢复,继续轮询

## 故障排查

### 问题: Pipeline 一直 PENDING
**原因:** N8N webhook 未收到请求或失败
**检查:**
- N8N webhook URL 是否正确
- N8N_API_KEY 是否配置
- 查看 API 日志: `/api/pipeline/start`

### 问题: 任务完成但状态不更新
**原因:** N8N 未调用 callback
**检查:**
- N8N workflow 是否有 callback 节点
- N8N_CALLBACK_SECRET 是否一致
- 查看 N8N workflow 执行日志

### 问题: Callback 返回 401 Unauthorized
**原因:** Secret 不匹配
**解决:**
```bash
# 确保两边一致
grep N8N_CALLBACK_SECRET .env.local
# N8N 环境变量中也设置相同值
```

### 问题: 下一阶段未自动触发
**原因:** Callback 处理逻辑错误
**检查:**
- `/api/pipeline/callback` 日志
- PipelineJob.currentStage 是否更新
- 相关 taskId 是否创建

## 性能优化

### 减少数据库查询
Callback API 已优化:
- 使用单次查询获取所有 task
- 缓存结果到 PipelineJob 表
- 前端轮询只查询必要字段

### 减少前端轮询
- 动态调整轮询间隔
- 完成后立即停止
- 支持手动刷新按钮

### 并发处理
- 前端可同时启动多个 Pipeline(不同 jobId)
- 后端使用异步任务,不阻塞请求
- N8N workflow 可并行执行

## 回滚方案

如果遇到问题需要回滚到旧版本:

```bash
# 恢复 Pipeline Page
mv apps/nextjs/src/app/[lang]/(dashboard)/pipeline/page.tsx.backup \
   apps/nextjs/src/app/[lang]/(dashboard)/pipeline/page.tsx

# 前端继续使用旧的同步 API
# /api/n8n/analyze
# /api/n8n/competitor-discovery
# /api/n8n/top-five-selector
```

**注意:** 新的 API 路由保持兼容,可以逐步迁移

## 相关文件

### 后端
- `/apps/nextjs/src/app/api/pipeline/start/route.ts`
- `/apps/nextjs/src/app/api/pipeline/status/[jobId]/route.ts`
- `/apps/nextjs/src/app/api/pipeline/callback/route.ts`

### 前端
- `/apps/nextjs/src/app/[lang]/(dashboard)/pipeline/page.tsx`
- `/apps/nextjs/src/hooks/usePipelinePolling.ts`
- `/apps/nextjs/src/types/pipeline.ts`

### 数据库
- `/packages/db/prisma/schema.prisma`

### 文档
- `/N8N_SETUP_GUIDE.md` (N8N 认证配置)
- `/PIPELINE_ASYNC_SETUP.md` (本文档)
