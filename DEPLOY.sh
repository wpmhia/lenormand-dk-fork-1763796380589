#!/bin/bash

# Deployment script for Tarot Reading App
# Usage: ./DEPLOY.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
echo "🚀 Deploying to $ENVIRONMENT..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build
echo -e "${YELLOW}Step 1: Building project...${NC}"
bun run build
echo -e "${GREEN}✓ Build successful${NC}"

# Step 2: Test database connection
echo -e "${YELLOW}Step 2: Testing database connection...${NC}"
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}✗ DATABASE_URL not set${NC}"
  exit 1
fi

bun prisma db execute --stdin <<< "SELECT 1;"
echo -e "${GREEN}✓ Database connection successful${NC}"

# Step 3: Run migrations
echo -e "${YELLOW}Step 3: Running database migrations...${NC}"
bun prisma migrate deploy
echo -e "${GREEN}✓ Migrations complete${NC}"

# Step 4: Generate Prisma client
echo -e "${YELLOW}Step 4: Generating Prisma client...${NC}"
bun prisma generate
echo -e "${GREEN}✓ Prisma client generated${NC}"

# Step 5: Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Ready for deployment to $ENVIRONMENT${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Push to GitHub"
echo "2. Vercel will automatically build and deploy"
echo "3. Verify at: https://your-domain.com/api/health"
echo ""
