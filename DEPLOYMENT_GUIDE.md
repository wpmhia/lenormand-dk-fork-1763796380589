# Deployment Guide

## Pre-Deployment Checklist

- [x] Build passes with no TypeScript errors
- [x] Database migrations created and tested
- [x] Environment variables documented
- [x] All API endpoints functional
- [x] Error handling implemented

## Environment Variables

### Required for Production

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### Optional

```env
DEEPSEEK_BASE_URL=https://api.deepseek.com  # defaults to official API
```

## Deployment Steps

### 1. Vercel Deployment

```bash
# Connect your GitHub repo to Vercel
# Vercel will automatically:
# - Install dependencies
# - Build the project
# - Deploy to production
```

### 2. Set Environment Variables in Vercel

1. Go to Vercel Dashboard > Project Settings > Environment Variables
2. Add:
   - `DATABASE_URL` (Production)
   - `DEEPSEEK_API_KEY` (Production)

### 3. Run Migrations

Migrations automatically run on first deployment. To manually verify:

```bash
DATABASE_URL=your_neon_url bunx prisma migrate deploy
```

### 4. Verify Deployment

Check these endpoints after deployment:

```bash
# Health check
curl https://your-domain.com/api/health

# Feedback analytics
curl https://your-domain.com/api/feedback/analytics
```

## Database Setup

### Neon PostgreSQL

1. Create a Neon project: https://console.neon.tech
2. Copy the connection string (includes all credentials)
3. Paste into `DATABASE_URL` environment variable

### Migrations

All migrations are in `/prisma/migrations/`:

- `20251202154828_add_user_readings_and_ai_interpretations`
- `20251202174442_add_feedback_optimization_system`
- `20251202190000_refactor_for_binary_feedback`

Prisma automatically detects and applies pending migrations on app startup.

## API Endpoints

### Feedback Recording

```
POST /api/feedback
{
  "isHelpful": true,
  "readingId": "uuid",
  "spreadId": "three-card",
  "question": "optional",
  "readingText": "optional"
}
```

### Analytics

```
GET /api/feedback/analytics
```

### Feedback List

```
GET /api/feedback/list?type=helpful&limit=50&offset=0
```

## Monitoring

### Health Endpoint

```
GET /api/health
```

Returns database connection status and basic stats.

### Error Logging

Errors are logged to console. In production, configure:

- Sentry for error tracking
- Vercel Analytics for performance monitoring

## Rollback Plan

If deployment fails:

1. Revert to previous GitHub commit
2. Vercel automatically redeploys
3. Database migrations are backwards compatible

## Post-Deployment

1. Verify all API endpoints return 200/expected status
2. Check Neon dashboard for active connections
3. Monitor error logs for first 24 hours
4. Test feedback collection with manual thumbs up/down

## Production Checklist

- [x] DATABASE_URL is production Neon URL
- [x] DEEPSEEK_API_KEY is valid and has quota
- [x] All migrations applied successfully
- [x] API endpoints responding correctly
- [x] Error logging configured
- [x] Database backups enabled (Neon default)
- [x] CORS configured for your domain
