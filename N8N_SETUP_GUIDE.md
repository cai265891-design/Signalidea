# N8N 配置指南

## 问题诊断

如果你遇到以下错误:
- "N8N workflow returned empty response"
- "Authorization data is wrong!"
- Pipeline 页面一直转圈但 N8N 已返回数据

这通常是因为 **N8N 认证配置不正确**。

## 解决方案

### 1. 配置 N8N API Key

1. 登录你的 N8N 实例
2. 进入 **Settings > API Keys**
3. 创建一个新的 API Key 或复制现有的
4. 将 API Key 添加到环境变量中

### 2. 环境变量配置

在你的 `.env.local` 或 Vercel 环境变量中添加:

```bash
# N8N Webhook URLs
N8N_WEBHOOK_URL=http://your-n8n-instance:5678/webhook/requirement-analysis
N8N_COMPETITOR_DISCOVERY_URL=http://your-n8n-instance:5678/webhook/competitor-discovery
N8N_TOP_FIVE_SELECTOR_URL=http://your-n8n-instance:5678/webhook/top-five-selector

# N8N API Key - 从 N8N Settings > API Keys 获取
N8N_API_KEY=your_actual_api_key_here
```

**重要:**
- N8N Webhook 使用 `Authorization: Bearer {API_KEY}` HTTP header 进行认证
- 代码已经更新为使用正确的认证方式

### 3. N8N Webhook 配置

在你的 N8N workflow 中:

1. **Webhook 节点配置:**
   - Authentication: Header Auth
   - Header Name: `Authorization`
   - Header Value: `Bearer {{$env.N8N_API_KEY}}`

2. **Respond to Webhook 节点:**
   - 确保 workflow 末尾有 "Respond to Webhook" 节点
   - Response Mode: "Immediately"
   - Response Data: 返回正确格式的 JSON

### 4. Top-5 Selector 响应格式

N8N webhook 必须返回以下格式的数组:

```json
[
  {
    "product_name": "Product Name",
    "url": "https://example.com",
    "description": "Product description",
    "confidence": 0.95
  }
]
```

这会被自动转换为前端格式:

```json
{
  "competitors": [
    {
      "name": "Product Name",
      "tagline": "Product description",
      "website": "https://example.com",
      "lastUpdate": "2024-01-01",
      "confidence": 0.95
    }
  ],
  "selectionStrategy": "AI-powered intelligent selection based on requirement alignment",
  "totalFound": 5
}
```

## 验证配置

### 测试 webhook (命令行):

```bash
curl -X POST http://your-n8n-instance:5678/webhook/top-five-selector \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key_here" \
  -d '{
    "competitors": [...],
    "requirementStatement": "Test",
    "certainties": {...},
    "keyAssumptions": []
  }'
```

应该返回 JSON 数组,而不是 "Authorization data is wrong!"

## Vercel 部署

在 Vercel 项目设置中:
1. 进入 **Settings > Environment Variables**
2. 添加所有 N8N 相关的环境变量
3. 确保选择正确的环境 (Production, Preview, Development)
4. 重新部署项目

## 错误处理

代码现在会提供详细的错误信息:

- **401 Unauthorized**: N8N_API_KEY 缺失或错误
- **500 Empty Response**: Webhook 未正确配置 Respond 节点
- **500 Invalid JSON**: N8N 返回了非 JSON 格式的数据
- **400 Invalid Input**: 前端发送的数据格式不正确

查看控制台日志获取详细诊断信息。

## 相关文件

- API Routes:
  - `/apps/nextjs/src/app/api/n8n/top-five-selector/route.ts`
  - `/apps/nextjs/src/app/api/n8n/competitor-discovery/route.ts`
  - `/apps/nextjs/src/app/api/n8n/analyze/route.ts`
- 前端: `/apps/nextjs/src/app/[lang]/(dashboard)/pipeline/page.tsx`
- 环境变量示例: `/.env.example`
