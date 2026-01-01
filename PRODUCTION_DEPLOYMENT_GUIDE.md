# Production Deployment Guide

This comprehensive guide covers deploying the Lenormand Intelligence API to production with monitoring, health checks, and performance optimization.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Platform-Specific Deployment](#platform-specific-deployment)
4. [Monitoring & Health Checks](#monitoring--health-checks)
5. [Performance Optimization](#performance-optimization)
6. [Security Considerations](#security-considerations)
7. [Post-Deployment Testing](#post-deployment-testing)
8. [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying to production, verify all items are complete:

- [ ] Run `npm run build` successfully without errors
- [ ] Run tests: `npm test` (all passing)
- [ ] Verify environment variables are set correctly
- [ ] Review code for any hardcoded secrets or credentials
- [ ] Check bundle size with `npm run build`
- [ ] Verify all API endpoints are working
- [ ] Test database connections (if applicable)
- [ ] Review error handling and logging
- [ ] Ensure HTTPS is enabled on production domain
- [ ] Set up monitoring and alerting

## Environment Configuration

### Required Environment Variables

```bash
# DeepSeek AI Configuration
DEEPSEEK_API_KEY=sk-your-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Optional: Public facing keys (for client-side features)
NEXT_PUBLIC_DEEPSEEK_API_KEY=sk-your-api-key-here
NEXT_PUBLIC_DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# Node.js Environment
NODE_ENV=production
```

### Setting Environment Variables

#### Vercel

1. Navigate to your Vercel project dashboard
2. Click **Settings**
3. Go to **Environment Variables**
4. Add each variable with its value
5. Select which environments (Production, Preview, Development) apply
6. Redeploy your application

#### Other Platforms (Railway, Heroku, etc.)

Refer to your platform's documentation for setting environment variables. Typically found in:

- Settings → Environment Variables
- Configuration → Environment
- Secrets management section

### Environment Variable Validation

After deployment, verify variables are set correctly by visiting:

```
https://your-domain.com/env-check
```

This page shows which environment variables are configured correctly.

## Platform-Specific Deployment

### Vercel (Recommended)

**Advantages**: Optimal Next.js support, automatic deployment, global CDN, built-in monitoring.

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js configuration

2. **Configure Environment Variables**
   - Click **Settings** → **Environment Variables**
   - Add `DEEPSEEK_API_KEY`
   - Add `DEEPSEEK_BASE_URL`
   - Select appropriate environments
   - Save

3. **Deploy**
   - Click **Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Your site is live at the provided URL

4. **Custom Domain**
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Update DNS records as instructed
   - Enable HTTPS (automatic with Vercel)

**Monitoring on Vercel**:

- Visit project dashboard for real-time metrics
- Enable Vercel Analytics for performance insights
- Set up Slack notifications for deployments

### Railway

1. **Create New Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository

2. **Configure**
   - Railway auto-detects Next.js
   - Add environment variables in **Variables** tab
   - No additional build config needed

3. **Deploy**
   - Railway auto-deploys on push to main
   - Monitor in "Deployments" tab
   - View logs in real-time

### Self-Hosted (Docker/VPS)

For VPS or Docker deployment:

```bash
# Build Docker image
docker build -t lenormand-api .

# Run container
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=sk-your-key \
  -e DEEPSEEK_BASE_URL=https://api.deepseek.com/v1 \
  -e NODE_ENV=production \
  lenormand-api

# Or use docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Health Checks

### Health Check Endpoint

The application provides a comprehensive health check endpoint:

```
GET /api/health
```

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2024-11-23T20:30:45.123Z",
  "service": {
    "name": "Lenormand Intelligence API",
    "version": "1.0.0"
  },
  "environment": "production",
  "uptime": 3600,
  "memory": {
    "heapUsed": 125,
    "heapTotal": 256,
    "external": 12,
    "rss": 512
  },
  "dependencies": {
    "deepseekApi": "operational",
    "cache": "operational",
    "readingHistory": "operational"
  },
  "analytics": {
    "totalReadings": 1234,
    "uniqueSpreads": 8,
    "averageInterpretationTime": 2500
  }
}
```

### Setting Up Health Checks

#### Vercel

1. Go to **Settings** → **Cron Jobs**
2. Add new job: `GET /api/health`
3. Set frequency: every 5 minutes
4. Enable notifications on failure

#### Other Platforms

Use external monitoring services:

- **UptimeRobot**: Monitor /api/health endpoint
- **PagerDuty**: Set up escalation policies
- **Datadog**: Custom health check monitors
- **NewRelic**: Application performance monitoring

### Metrics Endpoint

Export Prometheus-format metrics:

```
GET /api/metrics
```

**Output** (Prometheus format):

```
# HELP lenormand_api_readings_total Total number of readings generated
# TYPE lenormand_api_readings_total gauge
lenormand_api_readings_total 1234

# HELP process_memory_heap_used_bytes Process heap memory used in bytes
# TYPE process_memory_heap_used_bytes gauge
process_memory_heap_used_bytes 131072000
```

**Integration with monitoring tools**:

- **Prometheus**: Add scrape job for `/api/metrics`
- **Grafana**: Create dashboards from Prometheus data
- **Datadog**: Use custom metrics endpoint

Example Prometheus config:

```yaml
scrape_configs:
  - job_name: "lenormand-api"
    static_configs:
      - targets: ["your-domain.com"]
    metrics_path: "/api/metrics"
    scrape_interval: 60s
```

## Performance Optimization

### Caching Strategy

The application implements 3 layers of caching:

1. **Spread Rules Cache** (1 hour TTL)
   - Cached spread definitions
   - Reduces repeated lookups

2. **Response Cache**
   - Identical reading requests return cached responses
   - Cache key: sorted cards + spread ID

3. **Reading History** (max 1000 entries)
   - Analytics data for trends
   - Automatic old entry removal

### Database Optimization

If using a database (Supabase):

- Enable connection pooling
- Use parameterized queries
- Implement query result caching
- Monitor slow queries in logs

### CDN Configuration

For Vercel and most platforms, CDN is automatic. For self-hosted:

```nginx
# Nginx configuration for CDN behavior
location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location / {
    expires 0;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

### Image Optimization

- All images use Next.js Image component
- Automatic format selection (WebP, AVIF)
- Responsive image sizes
- Lazy loading enabled

Verify optimization:

```bash
npm run build
# Check .next/static/chunks for optimized images
```

## Security Considerations

### API Key Protection

**DO NOT**:

- Commit API keys to version control
- Log API keys in error messages
- Expose API keys in client-side code (server keys)
- Share API keys through insecure channels

**DO**:

- Use environment variables only
- Rotate API keys regularly
- Use separate keys for different environments
- Monitor API key usage and set rate limits

### CORS Configuration

The API is configured for secure cross-origin requests:

- Whitelisted origins only
- Credentials enabled where needed
- Proper headers in responses

### Rate Limiting

Built-in rate limiting utility available:

```typescript
import { apiLimiter } from "@/lib/rateLimit";

// Check if request is allowed
const allowed = apiLimiter.isAllowed(clientId, "/api/readings/interpret");
if (!allowed) {
  return new Response("Rate limit exceeded", { status: 429 });
}
```

**Suggested limits**:

- `/api/readings/interpret`: 100 requests/minute per IP
- `/api/health`: 1000 requests/minute per IP
- `/api/metrics`: 100 requests/minute per IP

### Input Validation

All endpoints validate input using the Validator utility:

```typescript
import { Validator } from "@/lib/validation";

const validation = Validator.validateAIReadingRequest(body);
if (!validation.valid) {
  return Response.json({ error: validation.details }, { status: 400 });
}
```

### HTTPS and TLS

- Enable HTTPS on all production domains
- Use TLS 1.3 where possible
- Set HSTS headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Security Headers

Key headers automatically set:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Post-Deployment Testing

### Smoke Tests

Verify basic functionality after deployment:

```bash
# Test homepage
curl https://your-domain.com/ | head -50

# Test health endpoint
curl https://your-domain.com/api/health

# Test API
curl -X POST https://your-domain.com/api/readings/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "cards": [{"id": 1, "name": "(Rider)"}],
    "question": "What does this card mean?",
    "spreadId": "sentence-3"
  }'

# Test metrics
curl https://your-domain.com/api/metrics | head -20
```

### Manual Testing Checklist

- [ ] Visit homepage - loads correctly
- [ ] Visit `/env-check` - shows correct environment status
- [ ] Start new reading at `/read/new` - draws cards correctly
- [ ] Request AI interpretation - processes within 3 seconds
- [ ] Test different spreads - all available spreads work
- [ ] Test mobile view - responsive design works
- [ ] Test dark/light theme - toggle works
- [ ] Test reading history - stores readings correctly
- [ ] Test shared readings - URL sharing works
- [ ] Check console for errors - no JavaScript errors

### Load Testing

For production systems, perform load testing:

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://your-domain.com/

# Using wrk
wrk -t4 -c100 -d30s https://your-domain.com/

# Test API endpoint
wrk -t4 -c100 -d30s \
  -s post.lua \
  https://your-domain.com/api/readings/interpret
```

## Troubleshooting

### Build Failures

**Error**: "Failed to compile"

**Solutions**:

1. Check Node.js version: `node --version` (requires v18+)
2. Clear cache: `rm -rf .next node_modules && npm install`
3. Check for TypeScript errors: `npm run type-check`
4. Review build logs for specific error messages

### API Errors

**Error**: "DeepSeek API connection failed"

**Solutions**:

1. Verify `DEEPSEEK_API_KEY` is set and valid
2. Check if API quota is exceeded
3. Verify network connectivity from server to api.deepseek.com
4. Check `/api/health` endpoint for dependency status

**Error**: "Request timeout"

**Solutions**:

1. Check server resources (CPU, memory)
2. Review slow query logs
3. Check rate limiting isn't blocking requests
4. Verify API response times

### Memory Issues

**Error**: "JavaScript heap out of memory"

**Solutions**:

1. Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=2048`
2. Review reading history size (max 1000 entries)
3. Check for memory leaks in custom code
4. Monitor with `/api/health` endpoint

### Performance Issues

**Problem**: Slow API responses

**Solutions**:

1. Check `/api/metrics` for average interpretation time
2. Review cache hit rates
3. Monitor DeepSeek API response times
4. Check network latency to API endpoint
5. Consider implementing additional caching

## Monitoring Resources

- **Vercel Analytics**: Built-in performance monitoring
- **UptimeRobot**: Free uptime monitoring
- **Sentry**: Error tracking and reporting
- **Datadog**: Comprehensive application monitoring
- **New Relic**: Performance monitoring and insights
- **Prometheus + Grafana**: Open-source metrics and dashboards

## Support and Escalation

When issues arise in production:

1. **Check `/api/health`** - Identify which dependencies are affected
2. **Review deployment logs** - Look for recent changes
3. **Check `/api/metrics`** - Monitor performance metrics
4. **Review error logs** - Use platform-specific logging (Vercel, Railway, etc.)
5. **Rollback if necessary** - Revert to last known working deployment

## Conclusion

Your Lenormand Intelligence API is now ready for production deployment. Follow this guide for a smooth deployment experience and maintain high uptime and performance in production.

For additional support, refer to:

- `AGENT_ARCHITECTURE.md` - System architecture
- `API_DOCUMENTATION.md` - API endpoint reference
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment verification
