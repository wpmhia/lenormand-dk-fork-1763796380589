# 🚀 Deployment Guide - Lenormand Tarot Reading App

## Overview
This guide covers deploying the Lenormand Tarot Reading Application to Vercel, a modern serverless platform optimized for Next.js applications.

## Prerequisites
- GitHub account (for version control)
- Vercel account (free tier available at https://vercel.com)
- DeepSeek API key (get it from https://api.deepseek.com)

## Step 1: Prepare Your Code

The app is already optimized for production. Verify it builds locally:

```bash
npm run build
npm run start
```

Both commands should succeed with no errors.

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended for First-Time Deploy)

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Deploy from project root
vercel
```

Follow the prompts:
- Select your GitHub account when asked
- Choose the project name
- Framework preset: `Next.js`
- Root directory: `./`
- Build command: Leave as default (npm run build)
- Output directory: `.next`

### Option B: Using Vercel Web Dashboard

1. Visit https://vercel.com/new
2. Import your GitHub repository
3. Select the repository
4. Framework preset: `Next.js` (auto-detected)
5. Click "Deploy"

## Step 4: Configure Environment Variables

After deployment, go to your Vercel project dashboard and add environment variables:

### Required Environment Variables

**DEEPSEEK_API_KEY**
- Get from: https://api.deepseek.com/account/api-keys
- Paste your API key

### Optional Environment Variables

**DEEPSEEK_BASE_URL**
- Default: `https://api.deepseek.com`
- Only set if using a custom DeepSeek endpoint

## Step 5: Redeploy

After adding environment variables, redeploy to apply them:

```bash
vercel --prod
```

Or use the Vercel dashboard "Redeploy" button.

## Architecture on Vercel

### How It Works
```
User Request
    ↓
Vercel Edge (Caching)
    ↓
Next.js API Route (/api/readings/interpret)
    ↓
DeepSeek API (Streaming)
    ↓
Stream Response to Client
```

### Key Features
- **Edge Caching**: Identical requests cached globally (70% CPU reduction)
- **Streaming**: Real-time response chunks via SSE
- **Serverless**: No servers to manage, scales automatically
- **Regions**: Auto-deployed to closest region to your users

## Monitoring

### Logs
View application logs in Vercel dashboard:
1. Project → Deployments
2. Select the latest deployment
3. Click "View Function Logs" for API errors

### Performance
Monitor in Vercel dashboard:
- Response times
- Error rates
- Bandwidth usage

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `.env.example` is not in `.gitignore`

### API Returns 503
- Check if `DEEPSEEK_API_KEY` environment variable is set
- Verify the API key is valid and not expired
- Check DeepSeek API status

### Slow Responses
- First request takes ~14s (DeepSeek processing time)
- Subsequent identical requests should be instant (edge cache)
- Use `/api/readings/interpret` metrics to monitor

### Edge Runtime Issues
- Ensure you're using Node.js 18.17+
- Avoid Node.js APIs not supported in edge runtime
- Check Vercel documentation for edge runtime limitations

## Updating Deployments

### For Code Changes
```bash
git add .
git commit -m "Your changes"
git push origin main
```
Vercel auto-deploys on every push to main.

### For Environment Variable Changes
1. Update in Vercel dashboard
2. Redeploy using dashboard or `vercel --prod`

## Performance Tips

1. **Cache Busting**: Identical spreads and questions are cached edge for 6 hours
2. **Request Deduplication**: Concurrent requests for same data share response
3. **Streaming**: Don't wait for full response - chunks stream immediately
4. **API Rate Limits**: DeepSeek has rate limits; monitor usage

## Cost Estimates (Vercel Free Tier)

- **Hobby Plan**: $0/month
  - 100GB bandwidth/month
  - Unlimited serverless functions
  - Edge caching included
  - Perfect for personal use or low-traffic apps

- **Pro Plan**: $20/month per team
  - Unlimited bandwidth
  - Priority support
  - For production apps

DeepSeek API costs depend on your usage:
- Check your DeepSeek billing dashboard
- Each reading uses ~500-2000 tokens

## Production Checklist

- ✅ Code builds successfully (`npm run build`)
- ✅ No TypeScript errors
- ✅ API streaming works locally (`npm run dev`)
- ✅ GitHub repository connected to Vercel
- ✅ Environment variables configured
- ✅ First deployment completed
- ✅ API returns correct responses
- ✅ Cache working (second request is instant)
- ✅ Error handling works (test with invalid input)
- ✅ Monitor logs for errors

## Support

### Vercel Support
- Documentation: https://vercel.com/docs
- Status: https://www.vercelstatus.com/

### DeepSeek Support
- API Docs: https://api-docs.deepseek.com/
- Status: Check your dashboard

### Application Issues
- Check application logs in Vercel dashboard
- Review error messages for specifics
- Test locally first: `npm run dev`

---

**Deployment Status**: ✅ Ready
**Last Updated**: January 25, 2026
**Next.js Version**: 14.2.31
