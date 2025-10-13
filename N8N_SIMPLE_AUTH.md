# n8n Webhook 简单认证方案

## 🎯 最简单的配置方式（推荐）

不使用 Header Auth，而是在 Body 中传递密钥进行验证。

### 1. 生成共享密钥

在终端运行：
```bash
# 生成随机密钥
openssl rand -base64 32
```

输出示例：`xK9mP2nR5tY8wQ3vL6jH4fD7sA1gN0bC`

### 2. n8n 环境变量配置

在 n8n 中配置环境变量（Settings → Environments）：
```env
N8N_SHARED_SECRET=xK9mP2nR5tY8wQ3vL6jH4fD7sA1gN0bC
```

### 3. 后端环境变量配置

在 `.env.local` 中添加：
```env
# n8n 配置
N8N_WEBHOOK_URL=https://your-n8n.digitalocean.app
N8N_SHARED_SECRET=xK9mP2nR5tY8wQ3vL6jH4fD7sA1gN0bC
N8N_CALLBACK_SECRET=另一个随机密钥用于回调验证
```

### 4. n8n 工作流配置

#### 节点 1: Webhook
```yaml
Node Type: Webhook
Node Name: 接收请求

Parameters:
  HTTP Method: POST
  Path: requirement-analysis
  Authentication: None  ✅ 保持 None
  Respond: Immediately
```

#### 节点 2: IF - 验证密钥
```yaml
Node Type: IF
Node Name: 验证请求密钥

Conditions:
  Condition 1:
    - Value 1: {{ $json.body.secret }}
    - Operation: Equal
    - Value 2: {{ $env.N8N_SHARED_SECRET }}

True Branch: 继续执行工作流
False Branch: 连接到 "返回错误" 节点
```

#### 节点 3 (False 分支): Respond to Webhook - 返回错误
```yaml
Node Type: Respond to Webhook
Node Name: 返回认证失败

Parameters:
  Response Code: 401
  Response Body:
    {
      "error": "Unauthorized",
      "message": "Invalid secret key"
    }
```

#### 节点 4 (True 分支): Set - 提取数据
```yaml
Node Type: Set
Node Name: 提取请求数据

继续正常的工作流...
```

### 5. 后端调用代码

```typescript
// packages/api/src/router/workflow.ts

const N8N_URL = process.env.N8N_WEBHOOK_URL;
const N8N_SECRET = process.env.N8N_SHARED_SECRET;

export const workflowRouter = createTRPCRouter({
  createProject: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string(),
      rawInput: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // ... 创建项目 ...

      // 触发 n8n 工作流
      const response = await fetch(`${N8N_URL}/webhook/requirement-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: N8N_SECRET,  // ✅ 在 body 中传递密钥
          projectId: project.id,
          rawInput: input.rawInput,
        }),
      });

      if (!response.ok) {
        console.error("Failed to trigger n8n workflow");
        throw new Error("Failed to trigger workflow");
      }

      return project;
    }),
});
```

---

## 🔒 进阶：使用 Header Auth（更安全）

如果你想使用标准的 Header Auth：

### 1. 生成 Token

```bash
openssl rand -base64 32
```
输出：`sk_n8n_xK9mP2nR5tY8wQ3vL6jH4fD7sA1gN0bC`

### 2. n8n Webhook 配置

#### 步骤 1: 选择 Header Auth
在 Webhook 节点：
```
Authentication: Header Auth
```

#### 步骤 2: 创建凭证
点击 "Create New Credential"，填写：

```yaml
Credential Type: Header Auth
Credential Name: Backend API Token

Configuration:
  Name: Authorization
  Value: Bearer sk_n8n_xK9mP2nR5tY8wQ3vL6jH4fD7sA1gN0bC
```

#### 步骤 3: 保存并选择
保存后在 Webhook 节点的 Authentication 下拉菜单中选择刚创建的凭证。

### 3. 后端调用

```typescript
const N8N_AUTH_TOKEN = process.env.N8N_AUTH_TOKEN; // Bearer sk_n8n_xxx...

const response = await fetch(`${N8N_URL}/webhook/requirement-analysis`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": N8N_AUTH_TOKEN,  // ✅ 在 header 中传递
  },
  body: JSON.stringify({
    projectId: project.id,
    rawInput: input.rawInput,
  }),
});
```

### 4. .env.local 配置

```env
N8N_WEBHOOK_URL=https://your-n8n.digitalocean.app
N8N_AUTH_TOKEN=Bearer sk_n8n_xK9mP2nR5tY8wQ3vL6jH4fD7sA1gN0bC
N8N_CALLBACK_SECRET=另一个密钥
```

---

## 🆚 两种方式对比

| 特性 | Body Secret | Header Auth |
|------|-------------|-------------|
| 配置难度 | ⭐ 简单 | ⭐⭐ 中等 |
| 安全性 | ⭐⭐ 中等 | ⭐⭐⭐ 较高 |
| 标准化 | 非标准 | RESTful 标准 |
| 调试便利 | 容易看到 secret | Header 需要检查 |
| 推荐场景 | 开发/测试 | 生产环境 |

---

## 🎯 我的建议

**对于你的项目，推荐使用"Body Secret"方式**：

### 理由：
1. ✅ 配置简单，不需要管理 n8n credentials
2. ✅ 调试方便，可以直接在 body 中看到验证逻辑
3. ✅ 足够安全（HTTPS + 密钥验证）
4. ✅ n8n 和后端代码都更清晰

### 实施步骤：

1. **生成密钥**：
   ```bash
   openssl rand -base64 32
   ```

2. **配置 n8n 环境变量**：
   - 在 n8n Settings → Environments 添加 `N8N_SHARED_SECRET`

3. **配置后端 .env.local**：
   ```env
   N8N_WEBHOOK_URL=https://your-n8n.digitalocean.app
   N8N_SHARED_SECRET=你生成的密钥
   N8N_CALLBACK_SECRET=另一个密钥（用于 n8n 回调后端时验证）
   ```

4. **在 n8n 工作流中添加 IF 节点验证**（见上面的配置）

5. **后端调用时在 body 中包含 secret**

---

## 📝 完整示例

### n8n 工作流结构：
```
[Webhook]
    ↓
[IF: 验证 secret]
    ├─ False → [Respond: 401 错误]
    └─ True  → [Set: 提取数据]
                    ↓
                [继续工作流...]
```

### 测试命令：
```bash
# 正确的请求
curl -X POST https://your-n8n.app/webhook/requirement-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "你的密钥",
    "projectId": 1,
    "rawInput": "测试需求"
  }'

# 错误的密钥
curl -X POST https://your-n8n.app/webhook/requirement-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "wrong-secret",
    "projectId": 1,
    "rawInput": "测试需求"
  }'
# 应该返回 401 错误
```

---

## ❓ 常见问题

### Q: n8n 有没有自带的 API Key？
A: n8n 有 API Key，但那是用于调用 n8n 管理 API 的（如创建工作流、获取执行历史等），不是用于 Webhook 认证的。

### Q: 我的 n8n 部署在 DigitalOcean，安全吗？
A: 只要：
1. 使用 HTTPS（n8n 默认配置）
2. 配置了密钥验证
3. 定期更换密钥
4. 就足够安全

### Q: 密钥泄露了怎么办？
A:
1. 立即生成新密钥
2. 更新 n8n 环境变量
3. 更新后端 .env.local
4. 重启服务

### Q: 可以为每个工作流设置不同的密钥吗？
A: 可以，但不推荐（管理复杂）。建议所有工作流共用一个密钥，或者按环境（dev/prod）区分。

---

需要我帮你实际配置这个认证流程吗？
