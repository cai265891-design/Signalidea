# n8n 工作流详细配置指南

## 📋 Pipeline 架构说明

SignalIdea Pipeline 采用**混合架构**:部分阶段使用 N8N AI 工作流,部分使用前端逻辑。

### 完整 Pipeline 阶段

| 阶段 | 实现方式 | 预计时间 | 作用 | 状态 |
|------|---------|---------|------|------|
| 1. Intent Clarifier | N8N Workflow | 10-30秒 | AI 分析用户需求 | ✅ 已集成 |
| 2. Candidate Finder | N8N Workflow | 30-60秒 | AI 搜索和分析竞品 | ✅ 已集成 |
| 3. Top-5 Selector | **混合方案** | <1秒 或 30-60秒 | 智能选择 Top 5 | ✅ 已集成 |
| 4. Evidence Pull | N8N Workflow | 1-2分钟 | Reddit 需求收集 | 📝 待集成 |
| 5. Matrix Forge | N8N Workflow | 2-5分钟 | 竞品功能特性对比 | 📝 待集成 |
| 6. Report Builder | N8N Workflow | 30秒-1分钟 | 汇总生成最终报告 | 📝 待集成 |

### Top-5 Selector 混合方案

**实现策略**:
- **≤5 个竞品**: 使用前端逻辑按 confidence 排序 (即时响应,<1秒)
- **>5 个竞品**: 调用 N8N AI 智能筛选 (30-60秒)

**为什么采用混合方案**:
1. **小数据集优化** - 5个以内直接前端排序,无需 AI
2. **大数据集需要 AI** - 10+、20+ 竞品时,简单排序不够,需要 AI 根据需求分析结果进行智能匹配
3. **性能与质量平衡** - 小数据集追求速度,大数据集追求准确性
4. **成本优化** - 只在必要时调用 AI API
5. **容错设计** - N8N 失败时自动降级到前端排序

**N8N 工作流映射**:
- N8N 工作流 1 = **Intent Clarifier** (Requirement Analysis)
- N8N 工作流 2 = **Candidate Finder** (Competitor Discovery)
- N8N 工作流 3 = **Top-5 Selector** (Intelligent Selection) - 仅当竞品 >5 时调用
- N8N 工作流 4 = **Matrix Forge** (Feature Analysis) - 分析 Top 5
- N8N 工作流 5 = **Evidence Pull** (Reddit Insights)
- N8N 工作流 6 = **Report Builder** (Final Summary)

## 📋 环境变量配置

首先在 n8n 中配置环境变量（Settings → Environments）：

```bash
# 后端回调地址
BACKEND_CALLBACK_URL=https://your-domain.com/api/n8n/workflow.webhookCallback

# 回调验证密钥（与后端 .env.local 中的 N8N_CALLBACK_SECRET 保持一致）
N8N_CALLBACK_SECRET=your-shared-secret-key

# API 密钥（用于验证来自后端的请求）
N8N_API_KEY=your-n8n-api-key
```

**后端环境变量配置** (`.env.local` 和 Vercel Environment Variables):
```bash
# N8N 通用配置
N8N_API_KEY=your-n8n-api-key
N8N_CALLBACK_SECRET=your-shared-secret-key

# 工作流 1: Intent Clarifier (需求分析) - ✅ 已集成
N8N_WEBHOOK_URL=http://159.203.68.208:5678/webhook/requirement-analysis

# 工作流 2: Candidate Finder (竞品发现) - ✅ 已集成
N8N_COMPETITOR_DISCOVERY_URL=http://159.203.68.208:5678/webhook/competitor-discovery

# 工作流 3: Top-5 Selector (智能筛选) - ✅ 已集成
N8N_TOP_FIVE_SELECTOR_URL=http://159.203.68.208:5678/webhook/top-five-selector

# 工作流 4: Matrix Forge (特征分析) - 📝 待创建
# 注意: Matrix Forge 已拆分为两个工作流
N8N_FEATURE_MATRIX_URL_1=http://159.203.68.208:5678/webhook/feature-matrix-1
N8N_FEATURE_MATRIX_URL_2=http://159.203.68.208:5678/webhook/feature-matrix-2

# 工作流 5: Evidence Pull (Reddit 洞察) - 📝 待创建
N8N_EVIDENCE_PULL_URL=http://159.203.68.208:5678/webhook/reddit-insights

# 工作流 6: Report Builder (报告生成) - 📝 待创建
N8N_REPORT_BUILDER_URL=http://159.203.68.208:5678/webhook/report-builder

# 外部 API (可选)
SERPAPI_KEY=your-serpapi-key  # Google 搜索 API (用于工作流 2)
REDDIT_ACCESS_TOKEN=your-reddit-token  # Reddit API (用于工作流 5)
CLAUDE_API_KEY=your-claude-key  # Claude AI (如果使用)
```

**Vercel 配置步骤**:
1. 打开 Vercel Dashboard → 项目 Settings → Environment Variables
2. 逐个添加上述变量
3. 选择环境: Production, Preview, Development (建议全选)
4. 部署后验证: 访问 `/api/env-check` 端点检查环境变量

---

## 🔄 N8N 工作流详细配置

### 工作流 1: Intent Clarifier (需求分析)

**Webhook Path**: `/webhook/requirement-analysis`
**Pipeline 阶段**: Stage 1 - Intent Clarifier
**状态**: ✅ 已集成到前端

### 节点 1: Webhook - 接收触发

**配置**:
```yaml
Node Type: Webhook
Node Name: 接收需求分析请求

Parameters:
  HTTP Method: POST
  Path: requirement-analysis

  Authentication: Header Auth
    Credentials:
      - Name: Authorization
      - Value: Bearer {{$env.N8N_API_KEY}}

  Respond: Immediately
  Response Code: 200
  Response Body:
    {
      "success": true,
      "executionId": "{{ $execution.id }}"
    }
```

**接收的数据格式**:
```json
{
  "projectId": 123,
  "rawInput": "我想做一个帮助独立开发者分析产品需求的SaaS工具"
}
```

**输出的数据格式** (回调后端):
```json
{
  "clearRequirementStatement": "Build a SaaS tool that helps indie developers analyze product requirements",
  "certainties": {
    "Target User Profile": "Indie developers and solo founders building digital products",
    "Target Market": "Global SaaS market, focusing on developer tools",
    "Must-Haves": ["Product requirement analysis", "User-friendly interface for indie developers"],
    "Success Criteria": ["Tool must save time in requirement analysis", "Output must be actionable"],
    "Out of Scope": ["Enterprise features", "Team collaboration features initially"]
  },
  "keyAssumptions": [
    {
      "assumption": "Users have basic product idea but struggle with requirement structuring",
      "rationale": "Common pain point for indie developers based on market research",
      "confidence": 0.8
    },
    {
      "assumption": "Willing to pay $10-50/month for this tool",
      "rationale": "Typical SaaS pricing for indie developer tools",
      "confidence": 0.6
    }
  ]
}
```

### 节点 2: Set - 提取数据

**配置**:
```yaml
Node Type: Set
Node Name: 提取请求数据

Parameters:
  Keep Only Set: false
  Values to Set:
    - Name: projectId
      Value: {{ $json.body.projectId }}

    - Name: rawInput
      Value: {{ $json.body.rawInput }}
```

### 节点 3: OpenAI/Claude - AI 需求分析

**配置**:
```yaml
Node Type: OpenAI (或 HTTP Request 调用 Claude API)
Node Name: AI 需求分析

# 如果使用 OpenAI:
Parameters:
  Resource: Chat
  Model: gpt-4-turbo-preview

  Messages:
    - Role: System
      Content: |
        你是一个专业的产品经理和需求分析师。
        你的任务是分析用户的产品需求，并输出结构化的分析结果。

        请按以下格式输出 JSON:
        {
          "Clear Requirement Statement": "One sentence, unambiguous and actionable",
          "Certainties": {
            "Target User Profile": "If clear, specify (role / size / scenario)",
            "Target Market": "If clear, specify (e.g., United States / SaaS / niche)",
            "Must-Haves": ["Must-have functions or constraints directly confirmed by the input"],
            "Success Criteria": ["Quantitative or outcome-based goals directly confirmed by the input"],
            "Out of Scope": ["Optional; explicitly not doing or not now"]
          },
          "Key Assumptions": [
            { "assumption": "…", "rationale": "Derived from input cues / industry common sense / comparative logic", "confidence": 0.7 },
            { "assumption": "…", "rationale": "…", "confidence": 0.5 }
          ]
        }

    - Role: User
      Content: |
        请分析以下产品需求:

        {{ $json.rawInput }}

        请严格按照 JSON 格式输出，不要包含任何其他文字说明。

  Options:
    Temperature: 0.3
    Response Format: json_object

# 如果使用 Claude API (通过 HTTP Request):
# 参考下面的 HTTP Request 配置
```

**Claude API HTTP Request 配置**:
```yaml
Node Type: HTTP Request
Node Name: Claude AI 需求分析

Parameters:
  Method: POST
  URL: https://api.anthropic.com/v1/messages

  Authentication: Generic Credential Type
    Credentials:
      - Name: x-api-key
      - Value: {{$env.CLAUDE_API_KEY}}

  Send Headers: ON
    Headers:
      - Name: anthropic-version
        Value: 2023-06-01
      - Name: Content-Type
        Value: application/json

  Send Body: ON
    Body Content Type: JSON
    JSON:
      {
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 4096,
        "temperature": 0.3,
        "messages": [
          {
            "role": "user",
            "content": "你是一个专业的产品经理。请分析以下需求并以JSON格式输出:\n\n{{ $json.rawInput }}\n\n输出格式:\n{\"coreNeeds\":[],\"targetUsers\":{},\"painPoints\":[],\"businessGoals\":{}}"
          }
        ]
      }
```

### 节点 4: Code - 格式化 AI 输出

**配置**:
```yaml
Node Type: Code
Node Name: 格式化分析结果

Language: JavaScript

Code: |
  // 获取 AI 返回的数据
  const aiResponse = items[0].json;

  // 提取 JSON 内容
  let analysisResult;

  // OpenAI 返回格式
  if (aiResponse.choices && aiResponse.choices[0]) {
    const content = aiResponse.choices[0].message.content;
    analysisResult = JSON.parse(content);
  }
  // Claude 返回格式
  else if (aiResponse.content && aiResponse.content[0]) {
    const content = aiResponse.content[0].text;
    analysisResult = JSON.parse(content);
  }

  // 格式化输出
  return [{
    json: {
      projectId: items[0].json.projectId || $input.first().json.projectId,
      clearRequirementStatement: analysisResult["Clear Requirement Statement"],
      certainties: JSON.stringify(analysisResult.Certainties),
      keyAssumptions: JSON.stringify(analysisResult["Key Assumptions"])
    }
  }];
```

### 节点 5: HTTP Request - 回调后端

**配置**:
```yaml
Node Type: HTTP Request
Node Name: 回调后端保存结果

Parameters:
  Method: POST
  URL: {{ $env.BACKEND_CALLBACK_URL }}

  Authentication: None

  Send Headers: ON
    Headers:
      - Name: Content-Type
        Value: application/json

  Send Body: ON
    Body Content Type: JSON
    Specify Body: Using JSON
    JSON:
      {
        "secret": "{{ $env.N8N_CALLBACK_SECRET }}",
        "projectId": {{ $json.projectId }},
        "workflowType": "requirement",
        "status": "COMPLETED",
        "executionId": "{{ $execution.id }}",
        "data": {
          "clearRequirementStatement": "{{ $json.clearRequirementStatement }}",
          "certainties": {{ $json.certainties }},
          "keyAssumptions": {{ $json.keyAssumptions }}
        }
      }

  Options:
    Timeout: 30000
    Retry On Fail: true
    Max Retries: 3
```

### 节点 6 (可选): 错误处理 - HTTP Request (失败回调)

在节点 3、4、5 上添加 Error Trigger：

**配置**:
```yaml
Node Type: HTTP Request
Node Name: 错误回调

On Error of Node: [选择上述节点]

Parameters:
  Method: POST
  URL: {{ $env.BACKEND_CALLBACK_URL }}

  Send Body: ON
    Body Content Type: JSON
    JSON:
      {
        "secret": "{{ $env.N8N_CALLBACK_SECRET }}",
        "projectId": {{ $json.projectId }},
        "workflowType": "requirement",
        "status": "FAILED",
        "executionId": "{{ $execution.id }}",
        "errorMessage": "{{ $json.error.message }}",
        "data": {}
      }
```

---

## 🔄 工作流 2: Candidate Finder (竞品挖掘)

**Webhook Path**: `/webhook/competitor-discovery`
**Pipeline 阶段**: Stage 2 - Candidate Finder
**状态**: ✅ 已集成到前端
**说明**: 收集所有相关竞品,返回完整列表(不限制数量)

### 节点 1: Webhook

**配置**:
```yaml
Node Type: Webhook
Path: competitor-discovery
```

**接收数据**:
```json
{
  "projectId": 123,
  "requirements": {
    "coreNeeds": "[...]",
    "targetUsers": "{...}"
  }
}
```

### 节点 2: HTTP Request - Google Search API

**配置**:
```yaml
Node Type: HTTP Request
Node Name: Google 搜索竞品

Parameters:
  Method: GET
  URL: https://serpapi.com/search

  Send Query Parameters: ON
    Query Parameters:
      - Name: engine
        Value: google
      - Name: q
        Value: {{ $json.coreNeeds }} competitors alternatives
      - Name: api_key
        Value: {{ $env.SERPAPI_KEY }}
      - Name: num
        Value: 10
```

### 节点 3: Code - 解析搜索结果

**配置**:
```yaml
Node Type: Code
Language: JavaScript

Code: |
  const searchResults = items[0].json.organic_results || [];

  const competitors = searchResults.map(result => ({
    name: result.title,
    url: result.link,
    description: result.snippet,
    source: 'google_search'
  }));

  return [{
    json: {
      projectId: items[0].json.projectId,
      competitors: competitors
    }
  }];
```

### 节点 4: Loop - 遍历每个竞品

**配置**:
```yaml
Node Type: Split In Batches
Node Name: 遍历竞品列表

Parameters:
  Batch Size: 1
```

### 节点 5: HTTP Request - 爬取竞品网站

**配置**:
```yaml
Node Type: HTTP Request
Node Name: 获取竞品网站内容

Parameters:
  Method: GET
  URL: {{ $json.competitors[$json.index].url }}

  Options:
    Timeout: 10000
    Ignore SSL Issues: true
```

### 节点 6: HTML Extract - 提取网页信息

**配置**:
```yaml
Node Type: HTML Extract
Node Name: 提取网页元数据

Parameters:
  Source Data: HTML
  Extraction Values:
    - Key: title
      CSS Selector: title
    - Key: metaDescription
      CSS Selector: meta[name="description"]
    - Key: h1Text
      CSS Selector: h1
```

### 节点 7: OpenAI - AI 分析竞品

**配置**:
```yaml
Node Type: OpenAI
Node Name: AI 分析竞品定位

Messages:
  - Role: System
    Content: |
      分析竞品信息，输出 JSON:
      {
        "category": "产品分类",
        "strength": "核心优势",
        "weakness": "主要劣势",
        "marketPosition": "市场定位"
      }

  - Role: User
    Content: |
      网站: {{ $json.url }}
      标题: {{ $json.title }}
      描述: {{ $json.metaDescription }}
```

### 节点 8: Code - 合并数据

**配置**:
```yaml
Node Type: Code

Code: |
  const competitorData = items[0].json;
  const aiAnalysis = JSON.parse(items[1].json.choices[0].message.content);

  return [{
    json: {
      ...competitorData,
      ...aiAnalysis
    }
  }];
```

### 节点 9: Loop End - 等待所有竞品处理完成

### 节点 10: Code - 汇总所有竞品

**配置**:
```yaml
Node Type: Code

Code: |
  const allCompetitors = items.map(item => item.json);

  return [{
    json: {
      projectId: items[0].json.projectId,
      competitors: allCompetitors
    }
  }];
```

### 节点 11: HTTP Request - 回调后端

```yaml
JSON:
  {
    "secret": "{{ $env.N8N_CALLBACK_SECRET }}",
    "projectId": {{ $json.projectId }},
    "workflowType": "competitor",
    "status": "COMPLETED",
    "executionId": "{{ $execution.id }}",
    "data": {
      "competitors": {{ JSON.stringify($json.competitors) }}
    }
  }
```

---

## 🔄 工作流 3: Top-5 Selector (智能筛选)

**Webhook Path**: `/webhook/top-five-selector`
**Pipeline 阶段**: Stage 3 - Top-5 Selector
**状态**: ✅ 已集成到前端
**触发条件**: 仅当 Candidate Finder 返回 >5 个竞品时调用
**说明**: 使用 AI 从大量竞品中智能选择最相关的 Top 5

### 节点 1: Webhook - 接收所有竞品

**配置**:
```yaml
Node Type: Webhook
Path: top-five-selector
```

**接收数据**:
```json
{
  "competitors": [
    {
      "name": "string",
      "tagline": "string",
      "website": "string",
      "lastUpdate": "string",
      "confidence": 0.85
    }
  ],
  "requirementStatement": "string",
  "certainties": {
    "targetUserProfile": "string",
    "targetMarket": "string",
    "mustHaves": ["string"],
    "successCriteria": ["string"]
  },
  "keyAssumptions": [
    {
      "assumption": "string",
      "rationale": "string",
      "confidence": 0.8
    }
  ]
}
```

### 节点 2: OpenAI - 智能选择 Top 5

**配置**:
```yaml
Node Type: OpenAI
Model: gpt-4o (推荐) 或 gpt-4-turbo
Operation: Message a model
```

**System Prompt**:
```
You are an expert product analyst. Given a list of competitor products and the user's requirement analysis, select the 5 most relevant competitors.

Consider:
1. Alignment with must-have features
2. Target user profile match
3. Success criteria relevance
4. Overall market positioning
5. Confidence scores (but don't rely solely on them)

Return exactly 5 competitors ranked by relevance, with a brief rationale for each selection.
```

**User Message**:
```
Requirement: {{ $json.requirementStatement }}

Must-Haves:
{{ $json.certainties.mustHaves.join('\n- ') }}

Target User: {{ $json.certainties.targetUserProfile }}
Target Market: {{ $json.certainties.targetMarket }}

All Competitors ({{ $json.competitors.length }}):
{{ JSON.stringify($json.competitors, null, 2) }}

Please select the 5 most relevant competitors and explain why each was chosen.
```

**Response Format** (JSON mode):
```json
{
  "selectedCompetitors": [
    {
      "name": "string",
      "tagline": "string",
      "website": "string",
      "lastUpdate": "string",
      "confidence": 0.85,
      "selectionRationale": "Why this competitor was selected"
    }
  ],
  "selectionStrategy": "Overall strategy explanation"
}
```

### 节点 3: Code - 验证和格式化

**配置**:
```javascript
// Ensure exactly 5 competitors were selected
const aiResponse = $input.first().json;

if (!aiResponse.selectedCompetitors || aiResponse.selectedCompetitors.length !== 5) {
  throw new Error(`Expected 5 competitors, got ${aiResponse.selectedCompetitors?.length || 0}`);
}

// Validate all required fields
aiResponse.selectedCompetitors.forEach((comp, idx) => {
  if (!comp.name || !comp.website) {
    throw new Error(`Competitor ${idx + 1} missing required fields`);
  }
});

return {
  json: {
    selectedCompetitors: aiResponse.selectedCompetitors,
    selectionStrategy: aiResponse.selectionStrategy || "AI-powered intelligent selection"
  }
};
```

### 节点 4: Respond to Webhook

**配置**:
```yaml
Node Type: Respond to Webhook
Response Code: 200
Response Body:
```

```json
{
  "selectedCompetitors": {{ JSON.stringify($json.selectedCompetitors) }},
  "selectionStrategy": "{{ $json.selectionStrategy }}"
}
```

---

## 🔄 工作流 4: Matrix Forge (特征矩阵分析) - 优化版

**Webhook Path**: `/webhook/feature-matrix-1` 和 `/webhook/feature-matrix-2`
**Pipeline 阶段**: Stage 5 - Matrix Forge
**状态**: 📝 待集成
**说明**: 接收 Top 5 竞品列表,智能爬取完整站点结构并进行深度功能对比分析
**注意**: 此工作流已拆分为两个独立的 N8N workflow

**设计理念**:
- 从竞品域名/主页开始,自动发现站点结构
- 利用 robots.txt 与 sitemap.xml 判断爬取权限和页面列表
- 使用 Firecrawl 进行智能页面渲染和内容提取
- 批次化处理,控制爬取速率,防止被封禁
- 聚合所有页面数据,形成完整的竞品内容画像

**输入数据**:
```json
{
  "projectId": 123,
  "topFiveCompetitors": [
    {
      "name": "string",
      "website": "https://example.com",
      "tagline": "string"
    }
  ]
}
```

**输出数据** (回调后端):
```json
{
  "competitorProfiles": [
    {
      "name": "Competitor A",
      "website": "https://example.com",
      "sitemap": {
        "hasRobotsTxt": true,
        "hasSitemap": true,
        "allowCrawl": true,
        "discoveredUrls": ["https://example.com", "https://example.com/features", "https://example.com/pricing"]
      },
      "pages": [
        {
          "url": "https://example.com",
          "title": "Homepage",
          "contentType": "homepage",
          "extractedContent": {
            "title": "Product Name",
            "description": "...",
            "mainFeatures": ["Feature 1", "Feature 2"],
            "images": ["url1", "url2"],
            "externalLinks": ["url1", "url2"]
          }
        }
      ],
      "features": [
        {
          "featureName": "Feature 1",
          "description": "Detailed description",
          "category": "Core/Advanced/Premium",
          "sourcePages": ["https://example.com/features"],
          "priority": "HIGH"
        }
      ],
      "contentSummary": {
        "hasPricingPage": true,
        "hasFeaturesPage": true,
        "hasDocumentation": true,
        "totalPagesAnalyzed": 5
      }
    }
  ]
}
```

### 节点流程 (智能降级版)

```
1. Webhook - 接收 Top 5 竞品
   ↓
2. SplitInBatches (Competitor Level) - 遍历每个竞品
   ↓
3. HTTP Request - 访问 robots.txt
   ↓
4. Function - 解析 robots.txt (是否允许爬取)
   ↓
5. HTTP Request - 访问 sitemap.xml
   ↓
6. IF Node - 判断是否存在 sitemap
   ├─ YES: XML 节点解析 <loc> 提取 URL 列表
   └─ NO: Function 节点生成常见路径模板 (/, /about, /pricing, /features, /docs)
   ↓
7. Merge - 合并 sitemap URLs 或模板 URLs
   ↓
8. Function - 过滤和优先级排序 (首页、pricing、features 优先)
   ↓
9. SplitInBatches (Page Level) - 分批遍历 URL (每批 3-5 个)
   ↓
10. Wait - 控制爬取速率 (2-3秒间隔)
   ↓
11. HTTP Request - 原生 HTTP 爬取 (第一次尝试,免费)
   ↓
12. HTML Extract - 提取页面元数据
   ↓
13. Function - 检测内容质量 (判断是否需要 JS 渲染)
   ↓
14. IF Node - 需要 JS 渲染?
   ├─ YES → 15a. HTTP Request (Jina AI) - 智能爬取 (消耗 tokens)
   └─ NO → 15b. Function - 直接使用原生内容 (免费)
   ↓
16. Merge - 合并两个分支
   ↓
17. Function - 统一格式化输出
   ↓
18. Loop End (Page Level)
   ↓
19. Merge - 聚合同一竞品的所有页面数据
   ↓
20. OpenAI - 分析聚合内容,提取功能列表
   ↓
21. Function - 生成竞品内容画像
   ↓
22. Loop End (Competitor Level)
   ↓
23. Merge - 汇总所有竞品数据
   ↓
24. HTTP Request - 回调后端 或 写入 Google Sheets/Database
```

### 详细节点配置

#### 节点 1: Webhook
```yaml
Node Type: Webhook
Node Name: 接收竞品列表

Parameters:
  HTTP Method: POST
  Path: feature-matrix
  Authentication: Header Auth
    - Name: Authorization
    - Value: Bearer {{$env.N8N_API_KEY}}
  Respond: Immediately
  Response Code: 200
```

#### 节点 2: SplitInBatches (Competitor Level)
```yaml
Node Type: SplitInBatches
Node Name: 遍历竞品

Parameters:
  Batch Size: 1
  Input Items: {{ $json.topFiveCompetitors }}
```

#### 节点 3: HTTP Request - robots.txt
```yaml
Node Type: HTTP Request
Node Name: 获取 robots.txt

Parameters:
  Method: GET
  URL: {{ $json.website }}/robots.txt
  Options:
    Ignore SSL Issues: true
    Timeout: 5000
    Response Format: Text
    Continue On Fail: true  # 有些网站没有 robots.txt
```

#### 节点 4: Function - 解析 robots.txt
```javascript
Node Type: Function
Node Name: 解析爬取权限

const robotsTxt = $input.first().json.data || '';
const website = $input.first().json.website;
const isAllowed = !robotsTxt.toLowerCase().includes('disallow: /');

// 提取 sitemap 位置
const sitemapMatch = robotsTxt.match(/Sitemap:\s*(.+)/i);
const sitemapUrl = sitemapMatch
  ? sitemapMatch[1].trim()
  : `${website}/sitemap.xml`;

return {
  json: {
    website,
    name: $input.first().json.name,
    tagline: $input.first().json.tagline,
    robotsTxt: {
      exists: !!robotsTxt,
      allowCrawl: isAllowed,
      sitemapUrl: sitemapUrl
    }
  }
};
```

#### 节点 5: HTTP Request - sitemap.xml
```yaml
Node Type: HTTP Request
Node Name: 获取 Sitemap

Parameters:
  Method: GET
  URL: {{ $json.robotsTxt.sitemapUrl }}
  Options:
    Ignore SSL Issues: true
    Timeout: 10000
    Response Format: Text
    Continue On Fail: true
```

#### 节点 6: IF - 判断 Sitemap 是否存在
```yaml
Node Type: IF
Node Name: Sitemap 存在?

Conditions:
  - Condition: $json.data is not empty
```

#### 节点 7a: XML 节点 (Sitemap 存在分支)
```yaml
Node Type: XML
Node Name: 解析 Sitemap

Parameters:
  Mode: XML to JSON
  Property Name: data
  Options:
    Explicit Array: false
```

#### 节点 7b: Function - 提取 <loc> URL
```javascript
Node Type: Function
Node Name: 提取 URL 列表

const sitemapData = $input.first().json;
const urls = [];

// 处理 sitemap 格式 (可能是 urlset 或 sitemapindex)
const urlset = sitemapData.urlset?.url || [];
const sitemapindex = sitemapData.sitemapindex?.sitemap || [];

// 提取 <loc>
if (Array.isArray(urlset)) {
  urlset.forEach(entry => {
    if (entry.loc) urls.push(entry.loc);
  });
} else if (urlset.loc) {
  urls.push(urlset.loc);
}

// 如果是 sitemap index,需要再次请求子 sitemap (简化版:取前10个)
if (Array.isArray(sitemapindex)) {
  sitemapindex.slice(0, 10).forEach(entry => {
    if (entry.loc) urls.push(entry.loc);
  });
}

// 过滤和优先级排序
const priorityKeywords = ['pricing', 'features', 'product', 'about', 'docs'];
const priorityUrls = urls.filter(url =>
  priorityKeywords.some(kw => url.toLowerCase().includes(kw))
);
const otherUrls = urls.filter(url =>
  !priorityKeywords.some(kw => url.toLowerCase().includes(kw))
);

const selectedUrls = [...new Set([
  $input.first().json.website, // 首页优先
  ...priorityUrls.slice(0, 8),
  ...otherUrls.slice(0, 2)
])].slice(0, 10);

return selectedUrls.map(url => ({
  json: {
    website: $input.first().json.website,
    name: $input.first().json.name,
    tagline: $input.first().json.tagline,
    url: url,
    source: 'sitemap'
  }
}));
```

#### 节点 7c: Function - 生成常见路径模板 (无 Sitemap 分支)
```javascript
Node Type: Function
Node Name: 生成常见路径

const website = $input.first().json.website;
const commonPaths = [
  '',           // 首页
  '/features',
  '/pricing',
  '/product',
  '/about',
  '/docs',
  '/documentation',
  '/solutions',
  '/how-it-works',
  '/blog'
];

return commonPaths.map(path => ({
  json: {
    website: website,
    name: $input.first().json.name,
    tagline: $input.first().json.tagline,
    url: `${website}${path}`,
    source: 'template'
  }
}));
```

#### 节点 8: Merge
```yaml
Node Type: Merge
Node Name: 合并 URL 来源

Parameters:
  Mode: Combine
  Combine By: Combine All
```

#### 节点 9: SplitInBatches (Page Level)
```yaml
Node Type: SplitInBatches
Node Name: 分批遍历页面

Parameters:
  Batch Size: 3  # 每批爬取 3 个页面
```

#### 节点 10: Wait
```yaml
Node Type: Wait
Node Name: 控制爬取速率

Parameters:
  Resume: After Time Interval
  Wait Amount: 2
  Wait Unit: Seconds
```

#### 节点 11: HTTP Request - 原生爬取 (第一次尝试)
```yaml
Node Type: HTTP Request
Node Name: 原生 HTTP 爬取

Parameters:
  Method: GET
  URL: {{ $json.url }}

  Send Headers: ON
    - Name: User-Agent
      Value: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

  Options:
    Timeout: 10000
    Ignore SSL Issues: true
    Response Format: Text
    Continue On Fail: true
```

#### 节点 12: HTML Extract - 提取原生内容
```yaml
Node Type: HTML Extract
Node Name: 提取页面元数据

Parameters:
  Source Data: HTML
  HTML Input: {{ $json.data }}

  Extraction Values:
    - Key: title
      CSS Selector: title
      Extract: Text

    - Key: metaDescription
      CSS Selector: meta[name="description"]
      Extract: Attribute
      Attribute: content

    - Key: ogDescription
      CSS Selector: meta[property="og:description"]
      Extract: Attribute
      Attribute: content

    - Key: h1Text
      CSS Selector: h1
      Extract: Text

    - Key: mainContent
      CSS Selector: main, article, [role="main"], .content, .main-content
      Extract: Text

    - Key: bodyText
      CSS Selector: body
      Extract: Text

  Options:
    Continue On Fail: true
```

#### 节点 13: Function - 检测内容质量
```javascript
Node Type: Function
Node Name: 判断是否需要 JS 渲染

const extractedData = $input.first().json;
const originalUrl = $input.first().json.url || $input.item(0).json.url;

// 计算有效内容长度
const title = extractedData.title || '';
const description = extractedData.metaDescription || extractedData.ogDescription || '';
const mainContent = extractedData.mainContent || '';
const bodyText = extractedData.bodyText || '';

// 清理空白字符
const cleanText = (text) => {
  return (text || '').replace(/\s+/g, ' ').trim();
};

const contentLength = cleanText(mainContent || bodyText).length;
const wordCount = cleanText(mainContent || bodyText).split(' ').length;

// 判断条件: 内容过少 或 发现 SPA 特征
const isSPA =
  bodyText.includes('<div id="root"></div>') ||
  bodyText.includes('<div id="__next"></div>') ||
  bodyText.includes('<div id="app"></div>') ||
  bodyText.includes('<app-root>');

const needsJSRendering =
  contentLength < 200 ||      // 内容太短
  wordCount < 30 ||            // 词数太少
  isSPA;                       // 明显的 SPA

return {
  json: {
    url: originalUrl,
    website: $input.item(0).json.website,
    name: $input.item(0).json.name,
    tagline: $input.item(0).json.tagline,
    source: $input.item(0).json.source,
    nativeExtraction: {
      title: title,
      description: description,
      mainContent: cleanText(mainContent),
      contentLength: contentLength,
      wordCount: wordCount
    },
    needsJSRendering: needsJSRendering,
    detectedSPA: isSPA
  }
};
```

#### 节点 14: IF - 判断是否需要 Jina AI
```yaml
Node Type: IF
Node Name: 需要 JS 渲染?

Conditions:
  - Field: needsJSRendering
    Operation: is equal to
    Value: true
```

#### 节点 15a: HTTP Request - Jina AI (降级方案)
```yaml
Node Type: HTTP Request
Node Name: Jina AI 爬取

Parameters:
  Method: GET
  URL: https://r.jina.ai/{{ $json.url }}

  Send Headers: ON
    - Name: Accept
      Value: application/json
    - Name: X-Return-Format
      Value: markdown

  Options:
    Timeout: 15000
    Retry On Fail: true
    Max Retries: 2
    Continue On Fail: true

# 仅在 IF 分支 YES 时执行
```

**Jina AI 返回格式**:
```json
{
  "code": 200,
  "status": 200,
  "data": {
    "title": "Product Name",
    "description": "Product description",
    "url": "https://...",
    "content": "Full markdown content...",
    "usage": {
      "tokens": 2500
    }
  }
}
```

#### 节点 15b: Function - 直接使用原生内容 (无需 JS)
```javascript
Node Type: Function
Node Name: 使用原生抓取结果

// 直接传递原生抓取的内容
return {
  json: {
    url: $input.first().json.url,
    website: $input.first().json.website,
    name: $input.first().json.name,
    source: $input.first().json.source,
    extractedContent: {
      title: $input.first().json.nativeExtraction.title,
      description: $input.first().json.nativeExtraction.description,
      markdown: $input.first().json.nativeExtraction.mainContent,
      contentType: detectPageType($input.first().json.url),
      wordCount: $input.first().json.nativeExtraction.wordCount,
      scrapeMethod: 'native-http'
    }
  }
};

function detectPageType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('pricing')) return 'pricing';
  if (lower.includes('features') || lower.includes('product')) return 'features';
  if (lower.includes('about')) return 'about';
  if (lower.includes('docs') || lower.includes('documentation')) return 'docs';
  if (lower.endsWith('/') || lower.split('/').length <= 3) return 'homepage';
  return 'other';
}

# 仅在 IF 分支 NO 时执行
```

#### 节点 16: Merge - 合并两个分支
```yaml
Node Type: Merge
Node Name: 合并爬取结果

Parameters:
  Mode: Combine
  Combine By: Combine All
```

#### 节点 17: Function - 统一格式化输出
```javascript
Node Type: Function
Node Name: 统一格式化

const item = $input.first().json;

// 如果是 Jina AI 返回的数据
if (item.data && item.data.content) {
  return {
    json: {
      url: item.data.url || $input.item(0).json.url,
      website: $input.item(0).json.website,
      name: $input.item(0).json.name,
      source: $input.item(0).json.source,
      extractedContent: {
        title: item.data.title || '',
        description: item.data.description || '',
        markdown: item.data.content || '',
        contentType: detectPageType(item.data.url),
        wordCount: (item.data.content || '').split(/\s+/).length,
        scrapeMethod: 'jina-ai',
        tokenUsage: item.data.usage?.tokens || 0
      }
    }
  };
}

// 如果是原生 HTTP 的数据,直接返回
return { json: item };

function detectPageType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('pricing')) return 'pricing';
  if (lower.includes('features') || lower.includes('product')) return 'features';
  if (lower.includes('about')) return 'about';
  if (lower.includes('docs') || lower.includes('documentation')) return 'docs';
  if (lower.endsWith('/') || lower.split('/').length <= 3) return 'homepage';
  return 'other';
}
```

#### 节点 18: Loop End (Page Level)
```yaml
Node Type: Loop End
Node Name: 页面遍历结束
```

#### 节点 19: Merge - 聚合竞品页面数据
```yaml
Node Type: Merge
Node Name: 聚合竞品页面数据

Parameters:
  Mode: Combine
  Combine By: Combine All
```

#### 节点 20: OpenAI - 分析功能
```yaml
Node Type: OpenAI
Node Name: AI 提取功能列表

Parameters:
  Resource: Chat
  Model: gpt-4o
  Temperature: 0.3
  Response Format: json_object

Messages:
  - Role: System
    Content: |
      你是一个产品分析专家。分析竞品的多个页面内容,提取核心功能列表。

      输出 JSON 格式:
      {
        "features": [
          {
            "featureName": "功能名称",
            "description": "详细描述",
            "category": "Core/Advanced/Premium",
            "sourcePages": ["url1", "url2"],
            "priority": "HIGH/MEDIUM/LOW"
          }
        ],
        "contentSummary": {
          "hasPricingPage": true/false,
          "hasFeaturesPage": true/false,
          "hasDocumentation": true/false,
          "totalPagesAnalyzed": 5
        }
      }

  - Role: User
    Content: |
      竞品名称: {{ $json[0].name }}
      竞品网站: {{ $json[0].website }}

      已分析页面内容:
      {{ $json.map(page => `
      URL: ${page.url}
      类型: ${page.extractedContent.contentType}
      标题: ${page.extractedContent.title}
      描述: ${page.extractedContent.description}
      内容摘要: ${page.extractedContent.markdown.substring(0, 2000)}
      ---
      `).join('\n') }}

      请提取核心功能列表。
```

#### 节点 21: Function - 生成竞品画像
```javascript
Node Type: Function
Node Name: 生成竞品内容画像

const pages = $input.all().filter(item => item.json.extractedContent);
const aiAnalysis = $input.last().json;

// 解析 AI 返回
let analysisResult = {};
try {
  const content = aiAnalysis.choices[0].message.content;
  analysisResult = JSON.parse(content);
} catch (e) {
  analysisResult = { features: [], contentSummary: {} };
}

// 生成竞品画像
return {
  json: {
    name: pages[0].json.name,
    website: pages[0].json.website,
    tagline: pages[0].json.tagline || '',
    sitemap: {
      hasRobotsTxt: true,
      hasSitemap: pages[0].json.source === 'sitemap',
      allowCrawl: true,
      discoveredUrls: pages.map(p => p.json.url)
    },
    pages: pages.map(p => ({
      url: p.json.url,
      title: p.json.extractedContent.title,
      contentType: p.json.extractedContent.contentType,
      wordCount: p.json.extractedContent.wordCount
    })),
    features: analysisResult.features || [],
    contentSummary: {
      ...analysisResult.contentSummary,
      totalPagesAnalyzed: pages.length
    }
  }
};
```

#### 节点 22: Loop End (Competitor Level)
```yaml
Node Type: Loop End
Node Name: 竞品遍历结束
```

#### 节点 23: Merge - 汇总所有竞品
```yaml
Node Type: Merge
Node Name: 汇总所有竞品

Parameters:
  Mode: Combine
  Combine By: Combine All
```

#### 节点 24: HTTP Request - 回调后端
```yaml
Node Type: HTTP Request
Node Name: 回调保存结果

Parameters:
  Method: POST
  URL: {{ $env.BACKEND_CALLBACK_URL }}

  Send Headers: ON
    - Name: Content-Type
      Value: application/json

  Send Body: ON
    Body Content Type: JSON
    JSON:
      {
        "secret": "{{ $env.N8N_CALLBACK_SECRET }}",
        "projectId": {{ $json[0].projectId }},
        "workflowType": "feature-matrix",
        "status": "COMPLETED",
        "executionId": "{{ $execution.id }}",
        "data": {
          "competitorProfiles": {{ JSON.stringify($json) }}
        }
      }

  Options:
    Timeout: 30000
    Retry On Fail: true
    Max Retries: 3
```

### 环境变量配置

无需额外配置! 智能降级方案使用免费的 Jina AI:

```bash
# 无需 API Key,Jina AI Reader 免费使用
# URL: https://r.jina.ai/[目标网址]
```

### 性能优化建议

1. **爬取速率控制**:
   - Wait 节点设置 2-3 秒间隔
   - 每个竞品最多爬取 10 个页面
   - 批次大小: 3-5 个页面

2. **超时和重试**:
   - HTTP Request 超时: 10-15 秒
   - 最多重试 2 次
   - Continue On Fail: true (防止单个页面失败影响整体)

3. **数据存储**:
   - 爬取结果可以写入 Google Sheets 或 Database
   - 便于后续分析和可视化

4. **成本控制** (智能降级版):
   - **原生 HTTP**: 完全免费,预计 50-60% 页面可用
   - **Jina AI**: 免费 10M tokens/月,仅在必要时调用
   - **预估节省**: 50-60% 的页面用免费方案

   **示例成本计算** (5 竞品 × 10 页面):
   ```
   假设:
   - 30 个页面: 原生 HTTP 成功 (免费)
   - 20 个页面: 需要 Jina AI (20 × 2500 tokens = 50K tokens)

   Jina AI 消耗: 50K tokens (免费额度内)
   OpenAI 分析: 5 次 × $0.15 = $0.75

   总成本: $0.75 (比原方案节省 93%)
   ```

### 智能降级逻辑

**触发 Jina AI 的条件**:
1. 内容长度 < 200 字符
2. 词数 < 30 个
3. 检测到 SPA 特征:
   - `<div id="root"></div>`
   - `<div id="__next"></div>`
   - `<div id="app"></div>`
   - `<app-root></app-root>`

**预期成功率**:
- 传统网站 (WordPress, Django 等): 95% 用原生 HTTP
- SPA 网站 (React, Vue, Next.js): 100% 降级到 Jina AI
- 混合网站: 50-70% 用原生 HTTP

### 监控和优化

在最终回调中添加统计信息:

```javascript
// 在节点 24 回调时添加
{
  "statistics": {
    "totalPages": 50,
    "nativeHttpSuccess": 30,
    "jinaAiUsed": 20,
    "totalTokensUsed": 50000,
    "costSavings": "60%"
  }
}
```

### 错误处理

在关键节点添加 Error Trigger:

```yaml
Node Type: HTTP Request (Error Handler)
On Error of Nodes: [Firecrawl, OpenAI, 回调]

Body:
  {
    "secret": "{{ $env.N8N_CALLBACK_SECRET }}",
    "projectId": {{ $json.projectId }},
    "workflowType": "feature-matrix",
    "status": "FAILED",
    "executionId": "{{ $execution.id }}",
    "errorMessage": "{{ $json.error.message }}",
    "data": {}
  }
```

---

## 🔄 工作流 5: Evidence Pull (Reddit 需求收集)

**Webhook Path**: `/webhook/reddit-insights` (待定)
**Pipeline 阶段**: Stage 4 - Evidence Pull
**状态**: 📝 待集成
**说明**: 从 Reddit 收集用户对 Top 5 竞品的真实评论和反馈

**输入数据**:
```json
{
  "topFiveCompetitors": [
    {
      "name": "string",
      "website": "string"
    }
  ]
}
```

### 节点流程

```
1. Webhook 接收
   ↓
2. HTTP Request - Reddit API 搜索
   ↓
3. Code - 过滤和排序帖子
   ↓
4. Loop - 遍历帖子
   ↓
5. HTTP Request - 获取帖子详情和评论
   ↓
6. OpenAI - 分析用户需求
   ↓
7. OpenAI - 情感分析
   ↓
8. Loop End
   ↓
9. HTTP Request - 回调
```

### 关键节点配置

**节点 2: Reddit 搜索**
```yaml
Method: GET
URL: https://oauth.reddit.com/search

Headers:
  - Name: Authorization
    Value: Bearer {{ $env.REDDIT_ACCESS_TOKEN }}

Query Parameters:
  - Name: q
    Value: {{ $json.keywords.join(' OR ') }}
  - Name: sort
    Value: top
  - Name: t
    Value: month
  - Name: limit
    Value: 50
```

**节点 3: 过滤帖子**
```yaml
Code: |
  const posts = items[0].json.data.children;

  // 过滤：upvotes > 10，非垃圾内容
  const filtered = posts
    .filter(post => post.data.ups > 10)
    .filter(post => post.data.selftext.length > 100)
    .slice(0, 20); // 取前20个

  return filtered.map(post => ({
    json: {
      projectId: items[0].json.projectId,
      postTitle: post.data.title,
      postUrl: `https://reddit.com${post.data.permalink}`,
      subreddit: post.data.subreddit,
      content: post.data.selftext,
      upvotes: post.data.ups,
      commentsCount: post.data.num_comments,
      postId: post.data.id
    }
  }));
```

**节点 6: 提取需求**
```yaml
Prompt: |
  分析这个 Reddit 帖子，提取用户的需求和痛点。

  输出 JSON:
  {
    "extractedNeeds": [
      {
        "need": "需求描述",
        "category": "功能需求/性能需求/用户体验",
        "priority": "HIGH/MEDIUM/LOW",
        "reasoning": "判断依据"
      }
    ]
  }

  帖子标题: {{ $json.postTitle }}
  帖子内容: {{ $json.content }}
```

---

## 🔄 工作流 6: Report Builder (最终报告生成)

**Webhook Path**: `/webhook/report-builder` (待定)
**Pipeline 阶段**: Stage 6 - Report Builder
**状态**: 📝 待集成
**说明**: 汇总所有阶段数据,生成最终竞品分析报告

**输入数据**:
```json
{
  "requirementAnalysis": {},
  "topFiveCompetitors": [],
  "evidenceData": {},
  "featureMatrix": {}
}
```

### 节点流程

```
1. Webhook 接收
   ↓
2. HTTP Request - 获取所有数据
   ↓
3. Code - 整合数据
   ↓
4. OpenAI - 综合分析
   ↓
5. Code - 格式化报告
   ↓
6. HTTP Request - 回调
```

### 关键节点配置

**节点 2: 获取所有数据**
```yaml
Method: POST
URL: https://your-domain.com/api/n8n/workflow.getProjectStatus

Body:
  {
    "projectId": {{ $json.projectId }}
  }
```

**节点 4: AI 综合分析**
```yaml
Model: gpt-4-turbo (需要更强的模型)

Prompt: |
  你是一个资深的产品战略顾问。请基于以下信息，生成一份完整的产品分析报告。

  ## 需求分析
  {{ $json.requirement }}

  ## 竞品功能
  {{ $json.competitorFeatures }}

  ## Reddit 用户洞察
  {{ $json.redditInsights }}

  请输出以下 JSON 格式:
  {
    "keyFindings": [
      "关键发现1",
      "关键发现2"
    ],
    "recommendations": [
      {
        "title": "推荐方案标题",
        "description": "详细描述",
        "impact": "HIGH/MEDIUM/LOW",
        "effort": "HIGH/MEDIUM/LOW"
      }
    ],
    "featurePriority": [
      {
        "feature": "功能名称",
        "priority": "P0/P1/P2",
        "reasoning": "优先级判断依据",
        "marketDemand": "市场需求强度",
        "competitiveDiff": "竞品差异化分析"
      }
    ],
    "roadmapSuggestion": {
      "mvp": ["MVP 必备功能1", "MVP 必备功能2"],
      "phase1": ["第一阶段功能"],
      "phase2": ["第二阶段功能"],
      "longTerm": ["长期规划"]
    }
  }
```

---

## 🔧 通用配置建议

### 1. 错误处理

在每个工作流中添加 Error Trigger 节点：

```yaml
Trigger On: Error in Workflow

Connected Node: HTTP Request (回调后端报告错误)

Body:
  {
    "secret": "{{ $env.N8N_CALLBACK_SECRET }}",
    "projectId": {{ $json.projectId }},
    "workflowType": "xxx",
    "status": "FAILED",
    "executionId": "{{ $execution.id }}",
    "errorMessage": "{{ $json.error.message }}",
    "data": {}
  }
```

### 2. 日志记录

在关键节点后添加 Code 节点记录日志：

```javascript
console.log(`[Workflow] Step completed: ${JSON.stringify(items[0].json)}`);
return items;
```

### 3. 超时设置

对于可能耗时的操作（AI 分析、网页爬取），设置合理的超时：

```yaml
Options:
  Timeout: 30000  # 30秒
  Retry On Fail: true
  Max Retries: 3
  Wait Between Retries: 1000  # 1秒
```

### 4. 速率限制

使用 Wait 节点控制 API 调用频率：

```yaml
Node Type: Wait
Parameters:
  Resume: After Time Interval
  Wait Amount: 1
  Wait Unit: Seconds
```

---

## 📝 测试清单

### 每个工作流测试项：

- [ ] Webhook 能否正确接收数据
- [ ] Authentication 是否工作
- [ ] AI 分析输出格式是否正确
- [ ] 错误处理是否生效
- [ ] 回调是否成功触发
- [ ] 数据是否正确保存到数据库

### 测试命令（从后端触发）：

```bash
# 使用 curl 测试 n8n webhook
curl -X POST https://your-n8n.app/webhook/requirement-analysis \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 1,
    "rawInput": "我想做一个任务管理工具"
  }'
```

---

## 🎯 下一步

### 已完成 ✅
1. ✅ N8N 环境变量配置完成
   - 本地 `.env.local` 已更新
   - Vercel 环境变量配置清单已整理
2. ✅ 工作流 1-3 已创建、激活并测试通过
3. ✅ API 端点适配 N8N 固定格式 (`product_name`, `url`, `description`)

### 待办 📝
1. **Vercel 部署配置**
   - 在 Vercel Dashboard 添加所有 N8N 环境变量
   - 验证生产环境工作流连通性

2. **创建剩余工作流 (4-6)**
   - Evidence Pull (Reddit 洞察)
   - Matrix Forge (特征分析)
   - Report Builder (报告生成)

3. **端到端测试**
   - 完整 Pipeline 流程测试
   - 性能优化和错误处理

---

## 📊 Pipeline 集成状态总结

### ✅ 已完成的阶段

1. **Intent Clarifier** (N8N 工作流 1)
   - API Route: `/api/n8n/analyze`
   - 前端集成: ✅
   - 测试状态: 通过 (10-15秒响应)

2. **Candidate Finder** (N8N 工作流 2)
   - API Route: `/api/n8n/competitor-discovery`
   - 前端集成: ✅
   - 测试状态: 通过 (30-45秒响应)

3. **Top-5 Selector** (N8N 工作流 3 - 混合方案)
   - API 端点: `/api/n8n/top-five-selector` ✅
   - N8N Webhook: `http://159.203.68.208:5678/webhook/top-five-selector` ✅
   - 实现方式:
     - ≤5 竞品: 前端排序 (<1秒)
     - >5 竞品: N8N AI 筛选 (30-60秒)
   - 前端集成: ✅
   - N8N 工作流: ✅ 已创建并激活
   - 测试状态: ✅ 通过 (26秒响应)
   - 数据格式转换: ✅ N8N 固定格式 → 前端格式
     - `product_name` → `name`
     - `url` → `website`
     - `description` → `tagline`

### 📝 待集成的阶段

4. **Evidence Pull** (N8N 工作流 5)
   - 需要创建: `/api/n8n/evidence-pull`
   - 输入: Top 5 竞品列表
   - 输出: Reddit 用户反馈数据

5. **Matrix Forge** (N8N 工作流 4)
   - 需要创建: `/api/n8n/feature-matrix`
   - 输入: Top 5 竞品列表
   - 输出: 功能对比矩阵

6. **Report Builder** (N8N 工作流 6)
   - 需要创建: `/api/n8n/report-builder`
   - 输入: 所有阶段数据汇总
   - 输出: 最终分析报告

### 🎯 下一步行动

1. **Evidence Pull 集成**
   - 创建 N8N webhook: `/webhook/reddit-insights`
   - 创建 API Route: `/api/n8n/evidence-pull/route.ts`
   - 前端集成到 Pipeline 页面

2. **Matrix Forge 集成**
   - 创建 N8N webhook: `/webhook/feature-matrix`
   - 创建 API Route: `/api/n8n/feature-matrix/route.ts`
   - 前端集成到 Pipeline 页面

3. **Report Builder 集成**
   - 创建 N8N webhook: `/webhook/report-builder`
   - 创建 API Route: `/api/n8n/report-builder/route.ts`
   - 前端集成到 Pipeline 页面
