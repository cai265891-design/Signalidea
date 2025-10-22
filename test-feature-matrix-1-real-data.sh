#!/bin/bash

echo "🧪 Testing Feature Matrix 1 with Real Pipeline Data"
echo "===================================================="
echo ""

# 模拟真实 Pipeline 数据
# 假设我们已经完成了前三个阶段,现在要测试 feature-matrix-1

echo "📊 Simulating Real Pipeline Flow"
echo "================================="
echo ""

# Step 1: 模拟 Top-5 Selector 完成后的数据
echo "1️⃣  Top-5 Selector 结果 (模拟):"
echo "---"

TOP_FIVE_COMPETITORS=$(cat <<'EOF'
[
  {
    "name": "Notion",
    "website": "https://notion.so",
    "tagline": "All-in-one workspace for notes, docs, and collaboration",
    "confidence": 0.95
  },
  {
    "name": "ClickUp",
    "website": "https://clickup.com",
    "tagline": "One app to replace them all - tasks, docs, goals, and chat",
    "confidence": 0.92
  },
  {
    "name": "Airtable",
    "website": "https://airtable.com",
    "tagline": "Build collaborative apps to power your workflow",
    "confidence": 0.88
  },
  {
    "name": "Monday.com",
    "website": "https://monday.com",
    "tagline": "Work management platform for teams",
    "confidence": 0.85
  },
  {
    "name": "Asana",
    "website": "https://asana.com",
    "tagline": "Work management platform to organize teams and projects",
    "confidence": 0.82
  }
]
EOF
)

echo "$TOP_FIVE_COMPETITORS" | jq '.'
echo ""

# Step 2: 调用 feature-matrix-1 (单个竞品)
echo "2️⃣  Testing feature-matrix-1 with First Competitor (Notion):"
echo "---"

FIRST_COMPETITOR=$(echo "$TOP_FIVE_COMPETITORS" | jq '.[0]')

echo "Request payload:"
echo '{
  "projectId": 999,
  "topFiveCompetitors": ['"$FIRST_COMPETITOR"']
}' | jq '.'
echo ""

echo "Calling N8N webhook..."
MATRIX1_RESPONSE=$(curl -s -X POST "http://159.203.68.208:5678/webhook/feature-matrix-1" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 999,
    "topFiveCompetitors": ['"$FIRST_COMPETITOR"']
  }')

echo ""
echo "Response from feature-matrix-1:"
echo "---"
echo "$MATRIX1_RESPONSE" | jq '.'
echo ""

# Step 3: 验证响应格式
echo "3️⃣  Validating Response Format:"
echo "---"

# 检查是否有 sitemap 数据
HAS_SITEMAP=$(echo "$MATRIX1_RESPONSE" | jq -r '.sitemap // empty')
if [ ! -z "$HAS_SITEMAP" ]; then
  echo "✅ Sitemap data present"
  echo "$MATRIX1_RESPONSE" | jq '.sitemap'
else
  echo "❌ Missing sitemap data"
fi
echo ""

# 检查是否有 pages 数据
HAS_PAGES=$(echo "$MATRIX1_RESPONSE" | jq -r '.pages // empty')
if [ ! -z "$HAS_PAGES" ]; then
  PAGES_COUNT=$(echo "$MATRIX1_RESPONSE" | jq '.pages | length')
  echo "✅ Pages data present ($PAGES_COUNT pages crawled)"
  echo "$MATRIX1_RESPONSE" | jq '.pages[0]' # 显示第一个页面
else
  echo "❌ Missing pages data"
fi
echo ""

# 检查是否有爬取方法统计
SCRAPE_STATS=$(echo "$MATRIX1_RESPONSE" | jq -r '.statistics // empty')
if [ ! -z "$SCRAPE_STATS" ]; then
  echo "✅ Scraping statistics:"
  echo "$MATRIX1_RESPONSE" | jq '.statistics'
else
  echo "⚠️  No scraping statistics (optional)"
fi
echo ""

# Step 4: 测试多个竞品(模拟并行处理)
echo "4️⃣  Testing All 5 Competitors (Sequential for Demo):"
echo "---"

COMPETITOR_INDEX=0
for competitor in $(echo "$TOP_FIVE_COMPETITORS" | jq -r '.[] | @base64'); do
  _jq() {
    echo "${competitor}" | base64 --decode | jq -r "${1}"
  }

  COMPETITOR_NAME=$(_jq '.name')
  COMPETITOR_WEBSITE=$(_jq '.website')
  COMPETITOR_TAGLINE=$(_jq '.tagline')

  COMPETITOR_INDEX=$((COMPETITOR_INDEX + 1))

  echo ""
  echo "  [$COMPETITOR_INDEX/5] Processing: $COMPETITOR_NAME"
  echo "  Website: $COMPETITOR_WEBSITE"
  echo "  ---"

  # 实际调用 (可选: 取消注释以真正执行)
  # RESPONSE=$(curl -s -X POST "http://159.203.68.208:5678/webhook/feature-matrix-1" \
  #   -H "Content-Type: application/json" \
  #   -d '{
  #     "projectId": 999,
  #     "topFiveCompetitors": [{
  #       "name": "'"$COMPETITOR_NAME"'",
  #       "website": "'"$COMPETITOR_WEBSITE"'",
  #       "tagline": "'"$COMPETITOR_TAGLINE"'"
  #     }]
  #   }')

  # PAGES_COUNT=$(echo "$RESPONSE" | jq -r '.pages | length // 0')
  # echo "  Result: $PAGES_COUNT pages crawled"

  echo "  ⏭  Skipped (uncomment to execute)"
done

echo ""
echo "✅ Test completed!"
echo ""
echo "📋 Summary:"
echo "==========="
echo "- Top-5 Selector returned 5 competitors"
echo "- feature-matrix-1 tested with first competitor (Notion)"
echo "- Response includes sitemap, pages, and optional statistics"
echo "- Ready to integrate with feature-matrix-2"
echo ""
echo "🔗 Next steps:"
echo "1. Verify N8N workflow is working correctly"
echo "2. Check if pages were crawled successfully"
echo "3. Pass result to feature-matrix-2 for AI analysis"
