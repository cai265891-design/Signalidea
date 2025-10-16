# Pipeline 功能集成完成

## ✅ 已完成的工作

### 1. 双版本路由架构

#### 演示版本 (公开访问)
- **路径**: `/[lang]/demo/pipeline`
- **位置**: `apps/nextjs/src/app/[lang]/(marketing)/demo/pipeline/page.tsx`
- **特点**:
  - 无需登录即可访问
  - 使用 mock 数据展示完整功能
  - 顶部显示演示横幅,引导用户登录使用完整版
  - 已添加到 middleware 白名单

#### 完整版本 (需要登录)
- **路径**: `/[lang]/pipeline`
- **位置**: `apps/nextjs/src/app/[lang]/(dashboard)/pipeline/page.tsx`
- **特点**:
  - 受 Clerk 认证保护,未登录自动跳转到登录页
  - 连接 Next.js API Routes
  - 真实的信用额度和计费系统

### 2. Billing 页面重构
- **原路径**: `/[lang]/billing`
- **新路径**: `/[lang]/dashboard/billing`
- **位置**: `apps/nextjs/src/app/[lang]/(dashboard)/dashboard/billing/page.tsx`
- **改进**: 现在统一在 dashboard 下,与其他账户相关功能一致

### 3. 导航集成

#### 主导航栏 (marketing)
在顶部导航添加了 "Demo" 链接:
```typescript
// config/ui/marketing.ts
{
  title: dict.marketing.main_nav_demo,
  href: `/demo/pipeline`,
}
```

#### Dashboard 侧边栏
在用户登录后的侧边栏添加了 "Pipeline" 入口:
```typescript
// config/ui/dashboard.ts
{
  id: "pipeline",
  title: dict.common.dashboard.sidebar_nav_pipeline,
  href: "/pipeline",
}
```

### 4. 多语言支持

已添加英文和中文翻译:

**英文** (en.json):
- `main_nav_demo`: "Demo"
- `sidebar_nav_pipeline`: "Pipeline"

**中文** (zh.json):
- `main_nav_demo`: "演示"
- `sidebar_nav_pipeline`: "分析流程"

### 5. Middleware 配置

在 `utils/clerk.ts` 中添加了 demo 路由到公开路由白名单:
```typescript
new RegExp("/(\\w{2}/)?demo/pipeline(.*)"), // demo pipeline page
```

## 📍 访问路径

### 演示版本
- 英文: `https://yoursite.com/en/demo/pipeline`
- 中文: `https://yoursite.com/zh/demo/pipeline`
- 特点: 任何人都可以访问,展示产品功能

### 完整版本 (需登录)
- 英文: `https://yoursite.com/en/pipeline`
- 中文: `https://yoursite.com/zh/pipeline`
- 访问方式:
  1. 通过顶部导航 "Demo" 进入演示版
  2. 登录后通过 Dashboard 侧边栏 "Pipeline" 进入完整版
  3. 在演示版点击 "Sign in for full access" 登录

### Billing 页面
- 路径: `https://yoursite.com/[lang]/dashboard/billing`
- 访问方式:
  1. Dashboard 侧边栏 "Billing"
  2. 用户头像下拉菜单 "Billing"

## 🎨 UI 特性

### 演示版横幅
演示版顶部显示蓝紫渐变横幅:
- 左侧: Sparkles 图标 + "Demo Mode - You're viewing a sample analysis with mock data"
- 右侧: "Sign in for full access" 按钮 → 跳转到登录页

### 完整功能
- ✅ 三栏布局: Scope 配置 + Pipeline 流程 + Inspector 面板
- ✅ 6 个阶段卡片,状态完整
- ✅ Credits 模态框
- ✅ Toast 通知系统
- ✅ 完整的交互逻辑

## 📁 文件结构

```
apps/nextjs/src/
├── app/[lang]/
│   ├── (marketing)/
│   │   └── demo/
│   │       └── pipeline/
│   │           └── page.tsx          # 演示版本 (公开)
│   └── (dashboard)/
│       ├── pipeline/
│       │   └── page.tsx              # 完整版本 (需登录)
│       └── dashboard/
│           └── billing/
│               └── page.tsx          # Billing 页面
│
├── components/pipeline/              # 所有 Pipeline 组件
│   ├── stage-card.tsx
│   ├── scope-panel.tsx
│   ├── inspector.tsx
│   ├── intent-clarifier.tsx
│   ├── candidate-finder.tsx
│   ├── top-five-review.tsx
│   ├── evidence-pull.tsx
│   ├── matrix-forge.tsx
│   ├── report-builder.tsx
│   ├── credits-modal.tsx
│   ├── billing-page.tsx
│   ├── index.ts
│   └── README.md
│
├── config/
│   ├── ui/
│   │   ├── marketing.ts             # 添加了 Demo 导航
│   │   └── dashboard.ts             # 添加了 Pipeline 侧边栏
│   └── dictionaries/
│       ├── en.json                  # 添加了英文翻译
│       └── zh.json                  # 添加了中文翻译
│
└── utils/
    └── clerk.ts                     # 添加了 demo 白名单

packages/ui/src/
├── badge.tsx                        # 新增
├── progress.tsx                     # 新增
├── textarea.tsx                     # 新增
└── index.ts                         # 更新导出
```

## ✅ API 架构变更

### 从 tRPC 改为 Next.js API Route

**决策原因**:
- n8n webhook 集成需要标准的 REST API 端点
- Next.js API Route 更适合外部服务集成
- 简化了与第三方服务的对接流程

**实现方式**:
1. **API Route**: `/api/n8n/analyze/route.ts`
   - 使用标准的 Next.js API Route (App Router)
   - POST 请求接收用户输入
   - 调用 n8n webhook 进行需求分析
   - 使用 Zod 验证返回数据结构
   - 60秒超时保护
   - 支持 Bearer Token 认证

2. **前端调用**:
   ```typescript
   // 在 pipeline/page.tsx 中
   const response = await fetch("/api/n8n/analyze", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ input }),
   });
   ```

3. **环境变量**:
   - `N8N_WEBHOOK_URL`: Intent Clarifier webhook 地址 (默认: http://localhost:5678/webhook/requirement-analysis)
   - `N8N_COMPETITOR_DISCOVERY_URL`: Competitor Discovery webhook 地址 (默认: http://localhost:5678/webhook/competitor-discovery)
   - `N8N_API_KEY`: n8n API 认证密钥 (可选)

4. **数据流程**:
   ```
   用户输入 → Pipeline Page (Client)
       ↓ fetch POST
   Next.js API Route (/api/n8n/analyze)
       ↓ fetch POST
   n8n Webhook
       ↓ AI 分析
   返回结构化数据 → 验证 (Zod) → 前端展示
   ```

### Candidate Finder (竞品发现) - ✅ 已完成

**API Route**: `/api/n8n/competitor-discovery/route.ts`

1. **输入数据**:
   ```typescript
   {
     userInput: string,              // 原始用户输入
     analysisData: {                 // 来自 Intent Clarifier 的分析结果
       "Clear Requirement Statement": string,
       "Certainties": {
         "Must-Haves": string[]
       },
       "Key Assumptions": Array<{
         assumption: string,
         rationale: string,
         confidence: number
       }>
     }
   }
   ```

2. **返回数据**:
   ```typescript
   {
     competitors: Array<{
       name: string,
       tagline: string,
       website: string,
       lastUpdate: string,
       confidence: number
     }>,
     totalFound?: number
   }
   ```

3. **自动触发**: Intent Clarifier 完成后自动调用 Competitor Discovery
4. **UI 展示**: 表格形式展示竞品,包含名称、标语、网站、更新时间和置信度
5. **超时设置**: 90秒 (比 Intent Clarifier 更长,因为需要搜索和分析)

### Top-5 Selector (前端逻辑筛选) - ✅ 已完成

**实现方式**: 前端逻辑,无需 N8N 工作流

1. **触发时机**: Candidate Finder 完成后自动执行
2. **筛选逻辑**:
   - 按 confidence 降序排序所有竞品
   - 自动选择 Top 5
   - 用户可以查看并批准

3. **UI 功能**:
   - 显示 Top 5 竞品列表,带排名编号
   - 每个竞品显示名称、tagline、confidence
   - "Approve & Continue" 按钮进入下一阶段
   - (TODO: Drag-and-drop 重新排序)
   - (TODO: 替换功能 - 从剩余竞品中选择)

4. **状态管理**:
   ```typescript
   const [topFiveCompetitors, setTopFiveCompetitors] = useState<Competitor[]>([]);
   ```

5. **为什么不用 N8N**:
   - Top-5 筛选是确定性逻辑(按 confidence 排序)
   - 前端筛选速度更快(毫秒级 vs 秒级)
   - 节省 AI API 成本
   - 用户可以手动调整

## 🚀 下一步工作

1. ✅ ~~Candidate Finder workflow 集成~~
2. ✅ ~~Top-5 Selector 前端逻辑~~
3. **扩展其他阶段 API**
   - Evidence Pull (Reddit 分析)
   - Feature Matrix
   - Report Builder
4. **实现信用额度消耗跟踪**

2. **信用额度系统**
   - 集成 Stripe 支付
   - 实现信用额度消耗和充值逻辑
   - Pre-hold 和 rollback 机制

3. **增强功能**
   - 实现真实的拖放排序 (使用 @dnd-kit)
   - PDF/HTML 导出功能
   - WebSocket 实时状态更新

4. **其他语言翻译**
   - 日语 (ja.json)
   - 韩语 (ko.json)

## 📝 测试建议

1. **演示版测试**:
   ```bash
   # 访问演示页面 (无需登录)
   open http://localhost:3000/en/demo/pipeline
   ```

2. **完整版测试**:
   ```bash
   # 访问完整版 (需要登录)
   open http://localhost:3000/en/pipeline
   # 应该自动重定向到登录页
   ```

3. **导航测试**:
   - 检查顶部导航是否显示 "Demo" 链接
   - 登录后检查 Dashboard 侧边栏是否显示 "Pipeline"
   - 检查用户下拉菜单的 "Billing" 是否正确跳转

## 🎯 总结

✅ 演示版和完整版已完全分离
✅ 演示版公开访问,完整版需要登录
✅ 所有导航入口已配置完成
✅ 多语言支持已添加
✅ UI 组件完整,准备连接后端

现在用户可以:
- 通过 `/demo/pipeline` 查看产品演示
- 登录后通过 `/pipeline` 使用完整功能
- 在 Dashboard 中管理 Billing 和其他设置
