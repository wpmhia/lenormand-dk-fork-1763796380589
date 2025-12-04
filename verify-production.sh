#!/bin/bash

# Production Deployment Verification Script
# Run this after deployment to verify everything is working

set -e

echo "🚀 Verifying Production Deployment..."
echo ""

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./verify-production.sh <production-url>"
    echo "Example: ./verify-production.sh https://your-app.vercel.app"
    exit 1
fi

PROD_URL=$1

echo "Testing URL: $PROD_URL"
echo ""

# Test 1: Health Check
echo "✓ Testing health endpoint..."
HEALTH_STATUS=$(curl -s "${PROD_URL}/api/health" | grep -o '"status":"ok"' || echo "failed")
if [ "$HEALTH_STATUS" = '"status":"ok"' ]; then
    echo "  ✅ Health check passed"
else
    echo "  ❌ Health check failed"
    exit 1
fi

# Test 2: Homepage
echo "✓ Testing homepage..."
HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/")
if [ "$HOME_STATUS" = "200" ]; then
    echo "  ✅ Homepage loads (Status: $HOME_STATUS)"
else
    echo "  ❌ Homepage failed (Status: $HOME_STATUS)"
    exit 1
fi

# Test 3: Card Library
echo "✓ Testing card library..."
CARDS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/cards")
if [ "$CARDS_STATUS" = "200" ]; then
    echo "  ✅ Card library loads (Status: $CARDS_STATUS)"
else
    echo "  ❌ Card library failed (Status: $CARDS_STATUS)"
    exit 1
fi

# Test 4: New Reading Page
echo "✓ Testing reading page..."
READ_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/read/new")
if [ "$READ_STATUS" = "200" ]; then
    echo "  ✅ Reading page loads (Status: $READ_STATUS)"
else
    echo "  ❌ Reading page failed (Status: $READ_STATUS)"
    exit 1
fi

# Test 5: Learning Center
echo "✓ Testing learning center..."
LEARN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/learn")
if [ "$LEARN_STATUS" = "200" ]; then
    echo "  ✅ Learning center loads (Status: $LEARN_STATUS)"
else
    echo "  ❌ Learning center failed (Status: $LEARN_STATUS)"
    exit 1
fi

# Test 6: API Endpoint
echo "✓ Testing test cards API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/api/test-cards")
if [ "$API_STATUS" = "200" ]; then
    echo "  ✅ API responds (Status: $API_STATUS)"
else
    echo "  ❌ API failed (Status: $API_STATUS)"
    exit 1
fi

# Test 7: Environment Check (if accessible)
echo "✓ Checking environment variables..."
ENV_CHECK=$(curl -s "${PROD_URL}/env-check" | grep -o "Environment Variables" || echo "not accessible")
if [ "$ENV_CHECK" = "Environment Variables" ]; then
    echo "  ✅ Environment check page accessible"
else
    echo "  ⚠️  Environment check page not accessible (this is okay in production)"
fi

echo ""
echo "✅ All critical tests passed!"
echo ""
echo "📊 Manual verification checklist:"
echo "  □ Visit ${PROD_URL} and verify homepage loads"
echo "  □ Test creating a reading at ${PROD_URL}/read/new"
echo "  □ Check mobile responsiveness"
echo "  □ Verify theme switching works"
echo "  □ Test card interactions"
echo "  □ Submit feedback (thumbs up/down)"
echo ""
echo "🎉 Deployment verification complete!"
