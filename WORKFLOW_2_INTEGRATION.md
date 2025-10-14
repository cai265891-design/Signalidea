# Workflow 2: Candidate Finder (Competitor Discovery) 集成完成

## ✅ 完成时间
2025-10-14

## 📋 实现概述

成功接入第二个 n8n 工作流 - Candidate Finder (竞品发现),实现了从 Intent Clarifier 到 Competitor Discovery 的数据传递和自动化流程。

## 🔧 技术实现

### 1. API Route 创建

**文件**: `apps/nextjs/src/app/api/n8n/competitor-discovery/route.ts`

**功能特性**:
- ✅ 接收来自 Intent Clarifier 的完整分析数据
- ✅ 将数据转换为 n8n webhook 所需格式
- ✅ 使用 Zod 验证输入和输出数据
- ✅ 90秒超时保护 (比第一个工作流更长)
- ✅ 支持 Bearer Token 认证
- ✅ 完整的错误处理和日志记录

**输入数据结构**:
```typescript
{
  userInput: string,              // 原始用户输入
  analysisData: {                 // 来自 Intent Clarifier
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

**发送到 n8n 的数据**:
```typescript
{
  userInput: string,
  requirementStatement: string,
  mustHaves: string[],
  keyAssumptions: Array<{...}>
}
```

**返回数据结构**:
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

### 2. 前端集成

**文件**: `apps/nextjs/src/app/[lang]/(dashboard)/pipeline/page.tsx`

**新增状态管理**:
```typescript
const [competitorData, setCompetitorData] = useState<CompetitorDiscoveryData | null>(null);
const [isDiscoveringCompetitors, setIsDiscoveringCompetitors] = useState(false);
```

**自动化流程**:
1. 用户输入需求 → Intent Clarifier 分析
2. Intent Clarifier 完成 → 自动触发 Competitor Discovery
3. Competitor Discovery 完成 → 自动展开结果面板

**核心函数**:
```typescript
const handleCompetitorDiscovery = async (input: string, analysis: N8NAnalysisData) => {
  // 调用 /api/n8n/competitor-discovery
  // 传递用户输入和分析数据
  // 更新 UI 状态
}
```

### 3. UI 展示

**Candidate Finder 卡片**:
- **状态显示**: pending → running → completed
- **进度描述**: "Discovering competitors..." → "Found X competitors"
- **徽章**: "Free" (免费阶段)

**结果展示 - 表格形式**:

| 列名 | 说明 | 样式 |
|------|------|------|
| Name | 竞品名称 | 加粗显示 |
| Tagline | 一句话描述 | 灰色文字,超长截断 |
| Website | 官网链接 | 蓝色可点击链接,新标签页打开 |
| Last Update | 最后更新时间 | 小字灰色 |
| Confidence | 置信度 | 彩色徽章:≥80%绿色,≥60%黄色,<60%灰色 |

**表格特性**:
- ✅ 斑马纹行 (zebra striping)
- ✅ 悬停高亮
- ✅ 响应式布局
- ✅ 自动滚动

## 📁 文件变更

### 新增文件
```
apps/nextjs/src/app/api/n8n/
└── competitor-discovery/
    └── route.ts                    # 156 行,完整的 API Route
```

### 修改文件
```
apps/nextjs/src/app/[lang]/(dashboard)/pipeline/
└── page.tsx                        # 新增 145 行代码
    - 新增 Competitor 和 CompetitorDiscoveryData 接口
    - 新增状态变量和 handleCompetitorDiscovery 函数
    - 更新 Candidate Finder 卡片 UI
```

### 配置文件
```
.env.example                        # 新增 N8N_COMPETITOR_DISCOVERY_URL
PIPELINE_INTEGRATION.md             # 新增 Candidate Finder 章节
```

## 🔗 数据流程图

```
用户点击 "New Action"
    ↓
handleAnalyze() 调用
    ↓
POST /api/n8n/analyze
    ↓
n8n Intent Clarifier Webhook
    ↓ 返回分析数据
setAnalysisData(data)
    ↓ 自动触发
handleCompetitorDiscovery(input, data)
    ↓
POST /api/n8n/competitor-discovery
    ↓ 传递完整上下文
{
  userInput: "原始输入",
  analysisData: { /* Intent Clarifier 结果 */ }
}
    ↓
n8n Competitor Discovery Webhook
    ↓ AI 搜索和分析
{
  competitors: [...],
  totalFound: 15
}
    ↓ 返回前端
setCompetitorData(data)
setExpandedStages({ candidate: true })
    ↓
UI 表格展示竞品列表
```

## 🌐 环境变量配置

在 `.env.local` 中添加:

```bash
# N8N Workflow Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/requirement-analysis
N8N_COMPETITOR_DISCOVERY_URL=http://localhost:5678/webhook/competitor-discovery
N8N_API_KEY=your_n8n_api_key_here  # 可选
```

## 🧪 测试要点

### 1. 单独测试 API
```bash
curl -X POST http://localhost:3000/api/n8n/competitor-discovery \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "I want to build an AI image product",
    "analysisData": {
      "Clear Requirement Statement": "...",
      "Certainties": { "Must-Haves": ["..."] },
      "Key Assumptions": [...]
    }
  }'
```

### 2. 端到端测试
1. 访问 `http://localhost:3000/en/pipeline`
2. 确保已登录
3. 点击 "New Action" 按钮
4. 观察以下流程:
   - Intent Clarifier 状态: pending → running → completed
   - Intent Clarifier 卡片自动展开,显示分析结果
   - Candidate Finder 状态自动变为 running
   - Candidate Finder 完成后自动展开,显示竞品表格
5. 检查 Toast 通知:
   - "Analysis completed"
   - "Competitors discovered - Found X potential competitors"

### 3. 错误处理测试
- n8n 服务未启动 → 显示连接错误
- 超时 (>90秒) → 显示超时错误
- 返回数据格式错误 → Zod 验证失败,显示格式错误

## 📊 性能指标

- **API Route**: ~156 行代码
- **前端代码**: ~145 行新增代码
- **超时设置**: 90秒 (Intent Clarifier 为 60秒)
- **平均响应时间**: 取决于 n8n workflow (预计 10-30 秒)

## 🎯 关键决策

### 1. 自动触发 vs 手动触发
**决策**: 自动触发
**理由**:
- Intent Clarifier 完成后,用户期望立即看到竞品
- 减少用户交互步骤,提升体验
- 数据流自然衔接

### 2. 数据传递方式
**决策**: 传递完整的 analysisData 对象
**理由**:
- n8n workflow 需要完整上下文来精准搜索
- Must-Haves 和 Key Assumptions 都是重要的搜索条件
- 保持数据完整性,方便后续扩展

### 3. 超时时间
**决策**: 90秒 (比 Intent Clarifier 长 50%)
**理由**:
- Competitor Discovery 需要搜索外部数据源
- AI 分析多个竞品需要更长时间
- 留有余地避免频繁超时

### 4. UI 展示方式
**决策**: 表格 + 置信度徽章
**理由**:
- 表格便于对比多个竞品
- 置信度徽章提供可信度参考
- 网站链接可点击,方便用户进一步调研

## 🔄 与其他 Workflow 的集成点

### 上游: Intent Clarifier
- **接收数据**: 完整的需求分析结果
- **触发方式**: 自动触发

### 下游: Top-5 Selector (待实现)
- **传递数据**: 竞品列表 + 用户输入 + 需求分析
- **触发方式**: TBD (可能是用户手动触发或自动触发)

## 📝 已知问题和限制

1. **无分页**: 当前一次性显示所有竞品,如果数量很多可能影响性能
   - **建议**: 后续可以添加分页或虚拟滚动

2. **无排序/筛选**: 表格不支持按列排序或筛选
   - **建议**: 可以添加表头点击排序功能

3. **无缓存**: 每次 "New Action" 都会重新调用两个 workflow
   - **建议**: 可以添加客户端缓存,相同输入直接返回结果

4. **无编辑**: 用户不能手动添加或删除竞品
   - **建议**: Top-5 Selector 阶段可以提供编辑功能

## 🚀 下一步计划

1. **Top-5 Selector** - 用户选择/排序前 5 名竞品
2. **Evidence Pull** - 从 Reddit 等社区拉取用户反馈
3. **Feature Matrix** - 生成竞品功能对比表
4. **Report Builder** - 生成完整的竞品分析报告

## 🎉 总结

✅ Candidate Finder (Workflow 2) 集成完成
✅ 数据从 Workflow 1 自动传递到 Workflow 2
✅ UI 完整展示竞品发现结果
✅ 错误处理和日志记录完善
✅ 文档和环境变量配置更新

**现在用户可以**:
1. 输入需求 → 自动分析意图
2. 自动发现竞品 → 表格展示结果
3. 为下一步的 Top-5 选择做准备
