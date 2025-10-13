# n8n 工作流详细配置指南

## 📋 环境变量配置

首先在 n8n 中配置环境变量（Settings → Environments）：

```bash
# 后端回调地址
BACKEND_CALLBACK_URL=https://your-domain.com/api/trpc/workflow.webhookCallback

# 回调验证密钥（与后端 .env.local 中的 N8N_CALLBACK_SECRET 保持一致）
N8N_CALLBACK_SECRET=your-shared-secret-key

# API 密钥（用于验证来自后端的请求）
N8N_API_KEY=your-n8n-api-key
```

## 🔄 工作流 1: 需求分析 (Requirement Analysis)

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

## 🔄 工作流 2: 竞品挖掘 (Competitor Discovery)

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

## 🔄 工作流 3: 竞品功能分析 (Feature Analysis)

### 节点流程

```
1. Webhook 接收
   ↓
2. HTTP Request - 从后端获取竞品详情
   ↓
3. Loop - 遍历每个竞品
   ↓
4. HTTP Request - 爬取产品页面
   ↓
5. OpenAI - 提取功能列表
   ↓
6. OpenAI - 分析每个功能
   ↓
7. Loop End
   ↓
8. Code - 汇总
   ↓
9. HTTP Request - 回调
```

### 关键节点配置

**节点 2: 获取竞品详情**
```yaml
Method: POST
URL: https://your-domain.com/api/trpc/workflow.getCompetitorDetails

Body:
  {
    "competitorIds": {{ $json.competitorIds }}
  }
```

**节点 5: AI 提取功能**
```yaml
Prompt: |
  分析以下网页内容，提取产品的核心功能列表。

  输出 JSON 格式:
  {
    "features": [
      {
        "featureName": "功能名称",
        "description": "功能描述",
        "priority": "HIGH/MEDIUM/LOW"
      }
    ]
  }

  网页内容:
  {{ $json.htmlContent }}
```

---

## 🔄 工作流 4: Reddit 需求收集 (Reddit Insights)

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

## 🔄 工作流 5: 最终汇总 (Final Summary)

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
URL: https://your-domain.com/api/trpc/workflow.getProjectStatus

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

1. 在 n8n 中导入/创建这 5 个工作流
2. 配置环境变量
3. 测试每个 Webhook URL
4. 实施后端 tRPC API
5. 端到端测试

需要我帮你创建具体某个工作流的 JSON 导出文件吗？
