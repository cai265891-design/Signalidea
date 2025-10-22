#!/bin/bash

echo "🧪 Minimal Test for feature-matrix-1"
echo "======================================"
echo ""

API_KEY="6249fb21b9c33e571bcb3d3fa03457fc559680d2c0bd9301d1e9310f47f66c12"

# 最小化测试数据
echo "Testing with minimal data..."
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "http://159.203.68.208:5678/webhook/feature-matrix-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "projectId": 999,
    "topFiveCompetitors": [
      {
        "name": "TestCompany",
        "website": "https://example.com",
        "tagline": "Test tagline"
      }
    ]
  }')

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# 根据文档,feature-matrix-1 应该返回什么?
echo "Expected output format:"
echo "{
  \"sitemap\": {
    \"hasRobotsTxt\": true,
    \"hasSitemap\": true,
    \"allowCrawl\": true,
    \"discoveredUrls\": [...]
  },
  \"pages\": [
    {
      \"url\": \"...\",
      \"title\": \"...\",
      \"contentType\": \"homepage\",
      \"extractedContent\": {...}
    }
  ],
  \"statistics\": {
    \"nativeHttpSuccess\": 0,
    \"jinaAiUsed\": 0
  }
}"
