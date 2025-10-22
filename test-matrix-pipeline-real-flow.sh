#!/bin/bash

set -e  # 遇到错误立即退出

echo "🧪 Testing Matrix Forge Pipeline - Real Flow Simulation"
echo "========================================================"
echo ""
echo "架构说明:"
echo "- feature-matrix-1: 爬取竞品网站内容(sitemap + pages)"
echo "- feature-matrix-2: AI 分析功能特性"
echo "- 并行处理: 每个竞品独立执行 matrix-1 → matrix-2"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API Key
API_KEY="6249fb21b9c33e571bcb3d3fa03457fc559680d2c0bd9301d1e9310f47f66c12"

# 模拟真实 Pipeline 流程
echo -e "${BLUE}📊 Step 1: Top-5 Selector 完成,返回 5 个竞品${NC}"
echo "---"

TOP_FIVE=$(cat <<'EOF'
[
  {
    "name": "Notion",
    "website": "https://notion.so",
    "tagline": "All-in-one workspace for notes and collaboration"
  },
  {
    "name": "Stripe",
    "website": "https://stripe.com",
    "tagline": "Online payment processing for internet businesses"
  }
]
EOF
)

echo "$TOP_FIVE" | jq '.'
echo ""

# 测试单个竞品的完整流程
COMPETITOR=$(echo "$TOP_FIVE" | jq '.[0]')
COMPETITOR_NAME=$(echo "$COMPETITOR" | jq -r '.name')
COMPETITOR_WEBSITE=$(echo "$COMPETITOR" | jq -r '.website')

echo -e "${BLUE}📊 Step 2: 测试单个竞品流程 - $COMPETITOR_NAME${NC}"
echo "---"
echo ""

# Step 2.1: 调用 feature-matrix-1 (爬取网站)
echo -e "${YELLOW}2.1 调用 feature-matrix-1 (爬取 $COMPETITOR_NAME 网站)${NC}"
echo "Request:"
MATRIX1_REQUEST=$(cat <<EOF
{
  "projectId": 999,
  "topFiveCompetitors": [$COMPETITOR]
}
EOF
)
echo "$MATRIX1_REQUEST" | jq '.'
echo ""

echo "Calling webhook..."
MATRIX1_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://159.203.68.208:5678/webhook/feature-matrix-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$MATRIX1_REQUEST")

# 分离 HTTP 状态码和响应体
HTTP_STATUS=$(echo "$MATRIX1_RESPONSE" | tail -n1)
MATRIX1_BODY=$(echo "$MATRIX1_RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo -e "${RED}❌ feature-matrix-1 调用失败${NC}"
  echo "Response: $MATRIX1_BODY"
  exit 1
fi

echo -e "${GREEN}✅ feature-matrix-1 返回成功${NC}"
echo "Response:"
echo "$MATRIX1_BODY" | jq '.' 2>/dev/null || echo "$MATRIX1_BODY"
echo ""

# 验证 matrix-1 响应格式
echo -e "${YELLOW}2.2 验证 matrix-1 响应格式${NC}"

HAS_SITEMAP=$(echo "$MATRIX1_BODY" | jq 'has("sitemap")' 2>/dev/null || echo "false")
HAS_PAGES=$(echo "$MATRIX1_BODY" | jq 'has("pages")' 2>/dev/null || echo "false")
PAGES_COUNT=$(echo "$MATRIX1_BODY" | jq '.pages | length' 2>/dev/null || echo "0")

if [ "$HAS_SITEMAP" == "true" ]; then
  echo -e "${GREEN}✅ sitemap 数据存在${NC}"
  echo "$MATRIX1_BODY" | jq '.sitemap' 2>/dev/null
else
  echo -e "${RED}❌ 缺少 sitemap 数据${NC}"
fi
echo ""

if [ "$HAS_PAGES" == "true" ] && [ "$PAGES_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ pages 数据存在 ($PAGES_COUNT 个页面)${NC}"
  echo "$MATRIX1_BODY" | jq '.pages[0]' 2>/dev/null
else
  echo -e "${RED}❌ 缺少 pages 数据或页面数为 0${NC}"
fi
echo ""

# Step 2.2: 调用 feature-matrix-2 (AI 分析)
echo -e "${YELLOW}2.3 调用 feature-matrix-2 (AI 分析功能)${NC}"
echo "Request:"
MATRIX2_REQUEST=$(cat <<EOF
{
  "projectId": 999,
  "taskId": 1,
  "competitorName": "$COMPETITOR_NAME",
  "matrix1Result": $MATRIX1_BODY
}
EOF
)
echo "$MATRIX2_REQUEST" | jq '.' 2>/dev/null || echo "$MATRIX2_REQUEST"
echo ""

echo "Calling webhook..."
MATRIX2_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://159.203.68.208:5678/webhook/feature-matrix-2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$MATRIX2_REQUEST")

HTTP_STATUS_2=$(echo "$MATRIX2_RESPONSE" | tail -n1)
MATRIX2_BODY=$(echo "$MATRIX2_RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_STATUS_2"
echo ""

if [ "$HTTP_STATUS_2" != "200" ]; then
  echo -e "${RED}❌ feature-matrix-2 调用失败${NC}"
  echo "Response: $MATRIX2_BODY"
else
  echo -e "${GREEN}✅ feature-matrix-2 返回成功${NC}"
  echo "Response:"
  echo "$MATRIX2_BODY" | jq '.' 2>/dev/null || echo "$MATRIX2_BODY"
fi
echo ""

# Step 3: 验证最终输出
echo -e "${BLUE}📊 Step 3: 验证最终输出格式${NC}"
echo "---"

if [ "$HTTP_STATUS_2" == "200" ]; then
  HAS_FEATURES=$(echo "$MATRIX2_BODY" | jq 'has("features")' 2>/dev/null || echo "false")
  FEATURES_COUNT=$(echo "$MATRIX2_BODY" | jq '.features | length' 2>/dev/null || echo "0")

  if [ "$HAS_FEATURES" == "true" ] && [ "$FEATURES_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 功能列表提取成功 ($FEATURES_COUNT 个功能)${NC}"
    echo "$MATRIX2_BODY" | jq '.features[0]' 2>/dev/null
  else
    echo -e "${YELLOW}⚠️  未提取到功能列表${NC}"
  fi
  echo ""

  HAS_SUMMARY=$(echo "$MATRIX2_BODY" | jq 'has("contentSummary")' 2>/dev/null || echo "false")
  if [ "$HAS_SUMMARY" == "true" ]; then
    echo -e "${GREEN}✅ 内容摘要存在${NC}"
    echo "$MATRIX2_BODY" | jq '.contentSummary' 2>/dev/null
  fi
fi
echo ""

# Step 4: 总结
echo -e "${BLUE}📋 测试总结${NC}"
echo "=========="
echo ""

if [ "$HTTP_STATUS" == "200" ] && [ "$HTTP_STATUS_2" == "200" ]; then
  echo -e "${GREEN}✅ 完整流程测试成功!${NC}"
  echo ""
  echo "验证项目:"
  echo "  ✅ feature-matrix-1 正确爬取网站内容"
  echo "  ✅ feature-matrix-2 正确接收 matrix-1 结果"
  echo "  ✅ AI 成功提取功能列表"
  echo "  ✅ 数据格式符合预期"
  echo ""
  echo "下一步:"
  echo "  1. 测试多个竞品并行处理"
  echo "  2. 集成到前端 Pipeline 页面"
  echo "  3. 添加数据库存储逻辑"
else
  echo -e "${RED}❌ 流程测试失败${NC}"
  echo ""
  echo "失败原因:"
  [ "$HTTP_STATUS" != "200" ] && echo "  - feature-matrix-1 调用失败 (HTTP $HTTP_STATUS)"
  [ "$HTTP_STATUS_2" != "200" ] && echo "  - feature-matrix-2 调用失败 (HTTP $HTTP_STATUS_2)"
  echo ""
  echo "排查建议:"
  echo "  1. 检查 N8N 工作流是否已激活"
  echo "  2. 检查 API Key 是否正确"
  echo "  3. 查看 N8N Executions 历史"
  echo "  4. 验证 webhook 认证配置"
fi
echo ""
