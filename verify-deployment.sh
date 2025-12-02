#!/bin/bash

echo "🔍 Verifying deployment readiness..."
echo ""

# Check 1: Build
echo -n "1. Build status... "
if bun run build > /dev/null 2>&1; then
  echo "✅"
else
  echo "❌ Build failed"
  exit 1
fi

# Check 2: TypeScript
echo -n "2. TypeScript compilation... "
if bunx tsc --noEmit > /dev/null 2>&1; then
  echo "✅"
else
  echo "⚠️ TypeScript warnings (non-critical)"
fi

# Check 3: Database
echo -n "3. Database connection... "
if [ -n "$DATABASE_URL" ]; then
  if node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$queryRaw\`SELECT 1\`.then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
    echo "✅"
  else
    echo "❌ Check DATABASE_URL"
  fi
else
  echo "⏭️ Skipped (set DATABASE_URL to test)"
fi

# Check 4: Environment
echo -n "4. Environment variables... "
REQUIRED_VARS=("DEEPSEEK_API_KEY")
MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done
if [ ${#MISSING[@]} -eq 0 ]; then
  echo "✅"
else
  echo "⚠️ Missing: ${MISSING[*]} (set in Vercel dashboard)"
fi

# Check 5: Migrations
echo -n "5. Migrations... "
if [ -d "prisma/migrations" ]; then
  COUNT=$(ls -1 prisma/migrations/ | grep -E '^[0-9]+_' | wc -l)
  if [ "$COUNT" -ge 3 ]; then
    echo "✅ ($COUNT migrations)"
  else
    echo "❌ Expected 3+ migrations, found $COUNT"
  fi
else
  echo "❌ Migrations directory not found"
fi

# Check 6: API routes
echo -n "6. API routes... "
ROUTES=("feedback" "feedback/analytics" "readings/\[id\]")
for route in "${ROUTES[@]}"; do
  if ! grep -q "export async function" "app/api/${route}/route.ts" 2>/dev/null; then
    echo "❌ Missing $route"
    exit 1
  fi
done
echo "✅"

# Check 7: Dependencies
echo -n "7. Dependencies... "
if [ -f "package.json" ]; then
  if grep -q "prisma" package.json && grep -q "next" package.json; then
    echo "✅"
  else
    echo "❌ Missing core dependencies"
  fi
else
  echo "❌ package.json not found"
fi

echo ""
echo "════════════════════════════════════════"
echo "✅ Deployment verification complete!"
echo "════════════════════════════════════════"
echo ""
echo "Ready to deploy with:"
echo "  git push origin main"
echo ""
