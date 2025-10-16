# N8N 并行执行方案指南

## 架构概述

采用**双工作流 + 数据库队列**的方案，实现真正的并发执行：

```
前端触发
  ↓
工作流 1: URL 发现 (串行处理 5 个竞品)
  ↓
保存到数据库 (AsyncAnalysisTask 表)
  ↓
后端并发触发 (Promise.all 同时发起 5 个请求)
  ↓
工作流 2: 内容爬取 × 5 (并发执行)
  ↓
回调后端更新数据库
  ↓
前端轮询/WebSocket 获取进度
```

---

## 1. 数据库设计

### AsyncAnalysisTask 表

```prisma
model AsyncAnalysisTask {
  id            Int            @id @default(autoincrement())
  projectId     Int            // 项目 ID
  authUserId    String         // 用户 ID
  workflowType  WorkflowType   // FEATURE_MATRIX | REDDIT_SEARCH
  status        AnalysisStatus @default(PENDING)

  // 输入数据
  inputData     Json           // { competitorName, website, keywords... }

  // 中间结果
  discoveredUrls Json?         // ["url1", "url2", ...]

  // 最终结果
  result        Json?          // { features: [...], pages: [...] }

  // 元数据
  n8nExecutionId String?       // N8N 执行 ID
  errorMessage   String?

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  completedAt   DateTime?

  @@index([projectId])
  @@index([authUserId])
  @@index([status])
}
```

---

## 2. N8N 工作流拆分

### 工作流 1: URL 发现 (feature-matrix-discover)

**Webhook URL**: `https://你的n8n/webhook/feature-matrix-discover`

**输入**:
```json
{
  "projectId": 123,
  "authUserId": "user_xxx",
  "topFiveCompetitors": [
    { "name": "竞品A", "website": "https://a.com", "tagline": "..." },
    { "name": "竞品B", "website": "https://b.com", "tagline": "..." }
  ]
}
```

**流程**:
1. 接收 Webhook
2. 循环竞品 (Split In Batches)
3. 获取 robots.txt → 解析 sitemap → 提取 URLs
4. 为每个竞品创建数据库记录:
   ```javascript
   await db.insert({
     projectId: input.projectId,
     authUserId: input.authUserId,
     workflowType: 'FEATURE_MATRIX',
     status: 'PENDING',
     inputData: { name, website, tagline },
     discoveredUrls: urls
   })
   ```
5. 返回 taskIds: `[1, 2, 3, 4, 5]`

### 工作流 2: 内容爬取 (feature-matrix-scrape)

**Webhook URL**: `https://你的n8n/webhook/feature-matrix-scrape`

**输入**:
```json
{
  "taskId": 1,
  "projectId": 123,
  "competitorName": "竞品A",
  "website": "https://a.com",
  "urls": ["url1", "url2", "url3"]
}
```

**流程**:
1. 接收 Webhook
2. 更新数据库状态为 PROCESSING
3. 循环爬取 URLs (每个 URL 判断是否需要 Jina AI)
4. AI 分析提取功能
5. 回调后端: `POST /api/n8n/callback`
   ```json
   {
     "secret": "your-secret-key",
     "taskId": 1,
     "status": "COMPLETED",
     "result": { features: [...], pages: [...] }
   }
   ```

---

## 3. 后端 API Routes

### 文件: `apps/nextjs/src/app/api/n8n/*/route.ts`

```typescript
// 示例代码已在以下文件实现:
// - /api/n8n/matrix-forge-trigger/route.ts
// - /api/n8n/callback/route.ts
// - /api/n8n/task-progress/route.ts

// 核心逻辑:
// 1. 用户认证通过 @clerk/nextjs/server auth()
// 2. 数据库操作通过 @acme/db
// 3. 标准 Next.js API Route 模式
```

---

## 4. 环境变量配置

### `.env.local`

```bash
# N8N Webhook URLs
N8N_WEBHOOK_DISCOVER_URL=https://你的n8n.com/webhook/feature-matrix-discover
N8N_WEBHOOK_SCRAPE_URL=https://你的n8n.com/webhook/feature-matrix-scrape

# N8N 回调密钥
N8N_CALLBACK_SECRET=your-secret-key-here

# 后端回调 URL (供 N8N 调用)
NEXT_PUBLIC_APP_URL=https://你的域名.com
```

### N8N 服务器环境变量

```bash
# docker-compose.yml 或 .env
N8N_CONCURRENCY_PRODUCTION_LIMIT=10
EXECUTIONS_MODE=regular
N8N_EXECUTION_TIMEOUT=300
WEBHOOK_TIMEOUT_SECONDS=180
```

---

## 5. 前端集成示例

### 使用 MatrixForgeParallel 组件

```typescript
// app/pipeline/page.tsx
import { MatrixForgeParallel } from "@/components/pipeline/matrix-forge-parallel";

export default function PipelinePage() {
  const [results, setResults] = useState(null);

  return (
    <MatrixForgeParallel
      projectId={currentProject.id}
      topFiveCompetitors={topFiveCompetitors}
      onComplete={(results) => {
        setResults(results);
        // 处理完成后的逻辑
      }}
    />
  );
}
```

完整组件代码见:
`apps/nextjs/src/components/pipeline/matrix-forge-parallel.tsx`

**核心功能:**
- 触发按钮调用 `/api/n8n/matrix-forge-trigger`
- 自动轮询 `/api/n8n/task-progress?projectId=xxx`
- 实时显示进度条和任务状态
- 完成后触发 onComplete 回调

---

## 6. 部署清单

### 数据库迁移

```bash
cd packages/db
bun db:push
```

### N8N 工作流导入

1. 导入 `n8n-workflow-1-discover.json`
2. 导入 `n8n-workflow-2-scrape.json`
3. 配置 Webhook URLs
4. 配置回调 URL 和密钥

### 环境变量配置

- 前端: `.env.local`
- N8N: `docker-compose.yml`

### 测试并发

```bash
# 使用 test-n8n-concurrent.sh 测试
./test-n8n-concurrent.sh
```

---

## 7. 性能优化建议

1. **数据库索引**: 已在 `projectId`, `authUserId`, `status` 上建立索引
2. **N8N 并发限制**: 根据服务器配置调整 `N8N_CONCURRENCY_PRODUCTION_LIMIT`
3. **前端轮询间隔**: 建议 3-5 秒，避免过于频繁
4. **WebSocket 替代**: 生产环境可用 WebSocket 替代轮询
5. **Redis 缓存**: 高并发场景可引入 Redis 缓存任务状态

---

## 8. 故障处理

### 单个竞品失败

- 不影响其他竞品的爬取
- 数据库记录 `errorMessage`
- 前端显示失败原因

### 整体流程失败

- 工作流 1 失败: 直接返回错误给前端
- 工作流 2 失败: 回调标记为 FAILED，不阻塞其他任务

### 重试机制

```typescript
// 手动重试失败的任务
retryTask: protectedProcedure
  .input(z.object({ taskId: z.number() }))
  .mutation(async ({ ctx, input }) => {
    const task = await ctx.db
      .selectFrom("AsyncAnalysisTask")
      .selectAll()
      .where("id", "=", input.taskId)
      .executeTakeFirst();

    if (task?.status === "FAILED") {
      // 重新触发工作流 2
      await triggerParallelScraping([task.id]);
    }
  })
```

---

## 总结

✅ **真正的并发执行**: 5 个竞品同时爬取
✅ **数据隔离**: 通过 projectId 和 authUserId 严格隔离
✅ **容错机制**: 单个失败不影响整体
✅ **可扩展**: 支持 Reddit 搜索等其他工作流类型
✅ **易监控**: 实时进度展示和错误追踪

**下一步**: 创建 N8N 工作流 JSON 文件
