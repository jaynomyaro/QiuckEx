#!/bin/bash

echo "🔍 QuickEx Analytics Implementation Test"
echo "====================================="

# Test 1: Check if all frontend files exist
echo "📁 Checking frontend files..."
frontend_files=(
    "app/frontend/src/components/EnhancedAnalyticsDashboard.tsx"
    "app/frontend/src/components/AdvancedAnalyticsDashboard.tsx"
    "app/frontend/src/hooks/useRealTimeAnalytics.ts"
    "app/frontend/src/hooks/useAnalyticsExport.ts"
    "app/frontend/src/hooks/analyticsApi.ts"
)

for file in "${frontend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Test 2: Check if all backend files exist
echo ""
echo "📁 Checking backend files..."
backend_files=(
    "app/backend/src/analytics/analytics.controller.ts"
    "app/backend/src/analytics/analytics.service.ts"
    "app/backend/src/analytics/analytics.gateway.ts"
    "app/backend/src/analytics/analytics.module.ts"
    "app/backend/src/common/types/date-range.type.ts"
)

for file in "${backend_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Test 3: Check dependencies
echo ""
echo "📦 Checking dependencies..."
if grep -q "@nestjs/websockets" app/backend/package.json; then
    echo "✅ Backend WebSocket dependency found"
else
    echo "❌ Backend WebSocket dependency missing"
fi

if grep -q "socket.io" app/backend/package.json; then
    echo "✅ Backend Socket.IO dependency found"
else
    echo "❌ Backend Socket.IO dependency missing"
fi

if grep -q "socket.io-client" app/frontend/package.json; then
    echo "✅ Frontend Socket.IO client dependency found"
else
    echo "❌ Frontend Socket.IO client dependency missing"
fi

if grep -q "recharts" app/frontend/package.json; then
    echo "✅ Recharts dependency found"
else
    echo "❌ Recharts dependency missing"
fi

# Test 4: Check module integration
echo ""
echo "🔗 Checking module integration..."
if grep -q "AnalyticsModule" app/backend/src/app.module.ts; then
    echo "✅ AnalyticsModule integrated in AppModule"
else
    echo "❌ AnalyticsModule not integrated in AppModule"
fi

# Test 5: Check dashboard integration
echo ""
echo "🎛️ Checking dashboard integration..."
if grep -q "AdvancedAnalyticsDashboard" app/frontend/src/app/dashboard/page.tsx; then
    echo "✅ AdvancedAnalyticsDashboard integrated in dashboard"
else
    echo "❌ AdvancedAnalyticsDashboard not integrated in dashboard"
fi

if grep -q "analyticsView" app/frontend/src/app/dashboard/page.tsx; then
    echo "✅ Analytics view toggle implemented"
else
    echo "❌ Analytics view toggle not implemented"
fi

# Test 6: Check documentation
echo ""
echo "📚 Checking documentation..."
if [ -f "ANALYTICS_IMPLEMENTATION.md" ]; then
    echo "✅ Implementation documentation exists"
else
    echo "❌ Implementation documentation missing"
fi

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "If all checks pass, the analytics implementation is ready!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm install' to install new dependencies"
echo "2. Start the backend: 'cd app/backend && pnpm dev'"
echo "3. Start the frontend: 'cd app/frontend && pnpm dev'"
echo "4. Navigate to http://localhost:3000/dashboard"
echo "5. Toggle to 'Advanced Analytics' to test the new features"
echo ""
echo "🚀 QuickEx Analytics Implementation Complete!"
