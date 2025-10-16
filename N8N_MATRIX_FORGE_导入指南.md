# N8N Matrix Forge 工作流导入指南

## 📦 导入步骤

### 1. 导入工作流 JSON

1. 访问你的 N8N 实例: `http://159.203.68.208:5678`
2. 点击左上角 **"+"** → **"Import from File"**
3. 选择文件: `n8n-workflow-matrix-forge.json`
4. 点击 **"Import"**

### 2. 配置环境变量

在 N8N Settings → Environments 中添加:

```bash
# 后端回调地址
BACKEND_CALLBACK_URL=https://your-domain.com/api/trpc/workflow.webhookCallback

# 回调验证密钥
N8N_CALLBACK_SECRET=your-shared-secret-key
```

### 3. 配置 OpenAI 凭证

1. 点击 **"AI 提取功能列表"** 节点
2. 在 **Credentials** 下拉框中选择 **"Create New"**
3. 输入你的 OpenAI API Key
4. 保存凭证

### 4. 激活工作流

1. 点击右上角 **"Inactive"** 切换为 **"Active"**
2. 复制 Webhook URL (应该是: `http://159.203.68.208:5678/webhook/feature-matrix`)

### 5. 更新后端环境变量

在你的 `.env.local` 和 Vercel 中添加:

```bash
N8N_FEATURE_MATRIX_URL=http://159.203.68.208:5678/webhook/feature-matrix
```

---

## 🧪 测试工作流

### 方法 1: 在 N8N 中手动测试

1. 点击工作流左上角的 **"Test Workflow"**
2. 点击 **"接收 Top 5 竞品"** 节点
3. 点击 **"Listen for Test Event"**
4. 使用 curl 发送测试请求:

```bash
curl -X POST http://159.203.68.208:5678/webhook-test/feature-matrix \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 123,
    "topFiveCompetitors": [
      {
        "name": "Stripe",
        "website": "https://stripe.com",
        "tagline": "Online payment processing"
      }
    ]
  }'
```

### 方法 2: 从后端调用

在你的 tRPC API 中调用:

```typescript
// packages/api/src/router/n8n.ts
const response = await fetch(process.env.N8N_FEATURE_MATRIX_URL!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: input.projectId,
    topFiveCompetitors: input.competitors
  })
});
```

---

## 🔍 工作流节点说明

### 第 1 层: 竞品级遍历 (5 个竞品)

| 节点 | 功能 | 耗时 |
|------|------|------|
| 1. Webhook | 接收 Top 5 竞品 | 即时 |
| 2. 遍历竞品 | SplitInBatches (每次 1 个) | - |
| 3-4. robots.txt | 获取并解析爬取权限 | 1-2秒 |
| 5-8. sitemap | 解析 sitemap 或生成模板 URL | 2-3秒 |

### 第 2 层: 页面级遍历 (每竞品 10 页)

| 节点 | 功能 | 耗时 |
|------|------|------|
| 9. 分批遍历页面 | SplitInBatches (每批 3 页) | - |
| 10. Wait | 控制速率 (2秒间隔) | 2秒 |
| 11-13. 原生 HTTP | 免费爬取 + 质量检测 | 3-5秒 |
| 14. IF 判断 | 是否需要 JS 渲染? | - |
| 15a. Jina AI | 智能爬取 (仅 SPA) | 5-8秒 |
| 15b. 直接使用 | 使用原生内容 | 即时 |

### 第 3 层: 分析汇总

| 节点 | 功能 | 耗时 |
|------|------|------|
| 19. 聚合页面 | 合并同一竞品的所有页面 | - |
| 20. OpenAI | AI 提取功能列表 | 5-10秒 |
| 21. 生成画像 | 格式化竞品内容 | - |
| 23. 汇总 | 合并所有竞品数据 | - |
| 24. 回调 | 保存结果到后端 | 1-2秒 |

---

## ⏱️ 预计总耗时

```
5 个竞品 × 10 个页面:
- Sitemap 解析: 5 × 3秒 = 15秒
- 页面爬取: 50 × 5秒 = 250秒 (含 Wait)
- AI 分析: 5 × 8秒 = 40秒
- 总计: ~5-6 分钟
```

**优化建议**:
- 减少每竞品的页面数 (10 → 5): 节省 50% 时间
- 增加批次大小 (3 → 5): 节省 20% 时间
- 减少 Wait 时间 (2秒 → 1秒): 节省 15% 时间

---

## 💰 成本估算

### 智能降级版 (推荐)

假设 50 个页面:
- **30 页**: 原生 HTTP 成功 (免费)
- **20 页**: Jina AI (20 × 2500 tokens = 50K tokens)
- **AI 分析**: 5 次 × 约 $0.15 = $0.75

**总成本**: ~$0.75/次 (Jina AI 在免费额度内)

### Jina AI 免费额度

- **10M tokens/月**: 可用 200 次 (10M ÷ 50K)
- **10 亿 tokens/$50**: 可用 20,000 次

---

## 🛠️ 故障排查

### 问题 1: Webhook 无响应

**检查**:
- 工作流是否已激活 (Active)?
- Webhook URL 是否正确?
- 后端是否能访问 N8N 服务器?

**解决**:
```bash
# 测试 Webhook 连通性
curl -X POST http://159.203.68.208:5678/webhook/feature-matrix \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### 问题 2: OpenAI 节点报错

**错误**: "Authentication failed"

**解决**:
1. 点击 "AI 提取功能列表" 节点
2. 点击 Credentials 下拉框
3. 选择你的 OpenAI 凭证
4. 点击 "Test" 验证

### 问题 3: Jina AI 超时

**错误**: "Timeout after 15000ms"

**解决**:
1. 点击 "Jina AI 爬取" 节点
2. Options → Timeout 改为 20000
3. 或者减少爬取的页面数量

### 问题 4: 部分页面爬取失败

**现象**: 某些页面返回空内容

**正常**: 这是预期行为
- 有些页面可能 404
- 有些网站可能禁止爬取
- Continue On Fail 会跳过这些页面

**检查统计**:
- 查看回调数据中的 `totalPagesAnalyzed`
- 正常情况下应该 ≥5 个页面/竞品

---

## 📊 监控和优化

### 查看执行历史

1. N8N 左侧菜单 → **"Executions"**
2. 点击某次执行查看详情
3. 查看每个节点的输入/输出

### 关键指标

- **成功率**: 应该 >90%
- **平均耗时**: 5-6 分钟
- **Jina AI 使用率**: 30-40%
- **原生 HTTP 成功率**: 60-70%

### 优化建议

如果 Jina AI 使用率 >60%:
- 说明大部分网站是 SPA
- 考虑放宽判断条件 (contentLength < 200 → 100)

如果原生 HTTP 成功率 <50%:
- 可能触发了反爬虫
- 增加 Wait 时间 (2秒 → 3秒)
- 减少批次大小 (3 → 2)

---

## 🔐 安全建议

1. **API Key 管理**:
   - 不要在代码中硬编码 API Key
   - 使用 N8N 的 Credentials 功能
   - 定期轮换 API Key

2. **回调验证**:
   - 后端必须验证 `N8N_CALLBACK_SECRET`
   - 防止恶意回调

3. **速率限制**:
   - Wait 节点至少 2 秒
   - 避免被目标网站封禁

---

## 📝 下一步

1. ✅ 导入工作流
2. ✅ 配置环境变量和凭证
3. ✅ 测试单个竞品
4. ✅ 测试 5 个竞品
5. 🔄 创建后端 API 端点 (`/api/n8n/feature-matrix`)
6. 🔄 集成到前端 Pipeline 页面
7. 🔄 添加数据库存储逻辑

---

## 🆘 获取帮助

- N8N 文档: https://docs.n8n.io
- Jina AI 文档: https://jina.ai/reader
- OpenAI API 文档: https://platform.openai.com/docs

如有问题,请检查:
1. N8N Executions 历史
2. 后端日志
3. 环境变量配置
