# 🔍 Deployment Debug Guide

## Quick Debug Steps

After deploying your app, follow these steps to debug AI issues:

### 1. Check Environment Variables
Visit: `https://your-domain.com/env-check`

This will show you:
- ✅ Which environment variables are set
- 🔍 Debug values (API keys are partially masked)
- 📋 Instructions for missing variables

### 2. Use Debug Endpoints
The `/env-check` page now includes debug buttons that open:

#### `/api/debug/env`
Shows all environment variables and deployment info:
```json
{
  "timestamp": "2024-11-02T16:20:00.000Z",
  "environment": {
    "DEEPSEEK_API_KEY": "sk-7ae889...9d4",
    "DEEPSEEK_BASE_URL": "https://api.deepseek.com/v1",
    "NODE_ENV": "production",
    "VERCEL_URL": "your-app.vercel.app",
    "VERCEL_ENV": "production"
  }
}
```

#### `/api/debug/ai`
Shows AI configuration status:
```json
{
  "deepseek": {
    "available": true,
    "apiKeySet": true,
    "baseUrl": "https://api.deepseek.com/v1",
    "apiKeyLength": 48
  }
}
```

#### `/api/debug/test-ai`
Tests actual AI call:
```json
{
  "success": true,
  "responseTime": 2341,
  "result": {
    "storyline": "The Rider comes to you on swift hooves...",
    "risk": "Trust the cards' gentle guidance",
    "timing": "When the moment feels right",
    "action": "Breathe deeply and listen"
  }
}
```

### 3. Common Issues & Solutions

#### ❌ "AI Analysis Unavailable"
**Check**: `/api/debug/ai` shows `available: false`
**Fix**: Add `DEEPSEEK_API_KEY` to deployment environment variables

#### ❌ "Failed to generate AI interpretation"
**Check**: `/api/debug/test-ai` shows `success: false`
**Fix**: 
1. Verify API key is valid
2. Check `DEEPSEEK_BASE_URL` includes `/v1`
3. Check deployment logs for API errors

#### ❌ Environment variables not showing
**Check**: `/api/debug/env` shows `NOT_SET`
**Fix**: 
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site settings → Build & deploy → Environment
- **Railway**: Project → Variables tab

### 4. Environment Variable Setup

#### For Vercel (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add these variables:
   ```
   DEEPSEEK_API_KEY=sk-7ae88917fa654723b43323e950abd9d4
   DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
   ```
4. **Redeploy** your application

#### For Other Platforms
See `DEPLOYMENT.md` for detailed instructions

### 5. Verification Checklist

After deployment, verify:

- [ ] `/env-check` shows all green checkmarks
- [ ] `/api/debug/ai` shows `"available": true`
- [ ] `/api/debug/test-ai` shows `"success": true`
- [ ] AI analysis works in `/read/new` flow

### 6. If Still Not Working

1. **Check deployment logs** for any errors
2. **Verify API key** is valid and active
3. **Test locally** with same environment variables
4. **Contact support** if issues persist

The debug tools will help you identify exactly where the issue is occurring! 🔧