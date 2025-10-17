#!/bin/bash

echo "🧪 Testing Matrix Forge Pipeline"
echo "================================"
echo ""

# Test 1: feature-matrix-1
echo "📊 Test 1: feature-matrix-1"
echo "---"
MATRIX1_RESPONSE=$(curl -s -X POST "http://159.203.68.208:5678/webhook/feature-matrix-1" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 123,
    "topFiveCompetitors": [
      {
        "name": "Notion",
        "website": "https://notion.so",
        "tagline": "All-in-one workspace"
      }
    ]
  }')

echo "Response: $MATRIX1_RESPONSE"
echo ""

# Test 2: feature-matrix-2
echo "📊 Test 2: feature-matrix-2"
echo "---"
MATRIX2_RESPONSE=$(curl -s -X POST "http://159.203.68.208:5678/webhook/feature-matrix-2" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": 123,
    "taskId": 1,
    "competitorName": "Notion",
    "matrix1Result": '"$MATRIX1_RESPONSE"'
  }')

echo "Response: $MATRIX2_RESPONSE"
echo ""

# Test 3: Full pipeline (2 competitors)
echo "📊 Test 3: Full Pipeline (2 competitors)"
echo "---"
echo "Simulating parallel processing..."
echo ""

for i in 1 2; do
  echo "Processing competitor $i..."

  # Call matrix-1
  M1_RESULT=$(curl -s -X POST "http://159.203.68.208:5678/webhook/feature-matrix-1" \
    -H "Content-Type: application/json" \
    -d '{
      "projectId": 123,
      "topFiveCompetitors": [
        {
          "name": "Competitor'"$i"'",
          "website": "https://example'"$i"'.com",
          "tagline": "Test tagline"
        }
      ]
    }')

  echo "  Matrix-1 result: $M1_RESULT"

  # Call matrix-2 immediately
  M2_RESULT=$(curl -s -X POST "http://159.203.68.208:5678/webhook/feature-matrix-2" \
    -H "Content-Type: application/json" \
    -d '{
      "projectId": 123,
      "taskId": '"$i"',
      "competitorName": "Competitor'"$i"'",
      "matrix1Result": '"$M1_RESULT"'
    }')

  echo "  Matrix-2 result: $M2_RESULT"
  echo ""
done

echo "✅ All tests completed!"
