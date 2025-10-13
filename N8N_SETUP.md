# N8N Webhook 配置指南

## 环境变量配置

在 `.env.local` 文件中添加或更新以下配置:

```bash
# N8N Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/requirement-analysis
N8N_API_KEY=你的实际API密钥
```

## 获取 N8N API Key

根据你的 webhook 配置,你使用了 `httpHeaderAuth` 认证。

### 方法 1: 从 N8N 凭据中获取

1. 登录 N8N 界面
2. 进入 **Credentials** (凭据)
3. 找到名为 `n8n-key` 的 HTTP Header Auth 凭据
4. 查看该凭据的配置
5. 复制 **Value** 字段的值(这就是你的 API key)

### 方法 2: 从 Workflow JSON 查看

你的 webhook 配置中显示凭据 ID 是 `7FvF2n4yVEObm5ZY`。在 N8N 中找到这个凭据并查看其值。

## 配置 N8N Webhook Header

根据你的 webhook 配置,需要确保:

1. **Header Name**: 通常是 `Authorization` 或自定义名称(检查你的 `n8n-key` 凭据配置)
2. **Header Value**: 就是你的 API key

### 示例配置

如果你的 N8N 凭据配置是:
- Header Name: `Authorization`
- Header Value: `Bearer my-secret-key-123`

那么在 `.env.local` 中设置:
```bash
N8N_API_KEY=Bearer my-secret-key-123
```

如果是自定义 header (如 `X-N8N-API-Key`):
```bash
N8N_API_KEY=my-secret-key-123
```

然后需要修改 `packages/api/src/router/n8n.ts`:
```typescript
// 将这行
headers["Authorization"] = N8N_API_KEY;

// 改为
headers["X-N8N-API-Key"] = N8N_API_KEY;
```

## 测试配置

配置完成后,重启开发服务器:

```bash
# 停止当前服务器 (Ctrl+C)
# 重启
bun run dev:web
```

然后在浏览器中访问 pipeline 页面测试。

## 故障排查

### 错误: "n8n webhook failed: 404 Not Found"
- N8N 服务器未运行
- Webhook URL 配置错误
- Workflow 未激活

### 错误: "n8n webhook failed: 401 Unauthorized" 或 "403 Forbidden"
- API Key 配置错误
- Header name 不匹配
- 凭据未正确关联到 webhook

### 调试步骤

1. 确认 N8N 服务器运行在 http://localhost:5678
2. 在 N8N 界面激活你的 workflow
3. 检查 N8N 执行历史查看错误信息
4. 查看后端日志 (开发服务器控制台)

## 生产环境配置

在 Vercel 或其他生产环境中:

1. 添加环境变量:
   - `N8N_WEBHOOK_URL`: 你的 N8N 生产 URL
   - `N8N_API_KEY`: 生产环境 API key

2. 确保 N8N webhook 可以从外部访问 (配置防火墙/网络)

3. 建议使用 HTTPS 和更强的认证机制
