# 🔍 Vercel AI Troubleshooting Guide

## Current Issue
AI integration failing with 500 error on Vercel despite working locally.

## 🚀 Immediate Debugging Steps

### 1. Test Environment Variables
Visit: `https://your-app.vercel.app/api/debug/env-check`
- Should show `DEEPSEEK_API_KEY: SET (35 chars)`
- If NOT_SET, environment variables aren't configured properly

### 2. Test Direct API Connection  
Visit: `https://your-app.vercel.app/api/debug/deepseek-test`
- Tests DeepSeek API directly without our logic
- Will show exact error from DeepSeek API

### 3. Test Full AI Flow
Visit: `https://your-app.vercel.app/api/debug/test-ai` (POST request)
- Tests our complete AI reading logic
- Shows where the failure occurs

## 🔧 Most Likely Issues & Solutions

### Issue 1: Environment Variables Not Set on Vercel
**Symptoms**: 
- `DEEPSEEK_API_KEY: NOT_SET` in env-check
- 500 errors with "API not configured"

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add both variables:
   ```
   DEEPSEEK_API_KEY=sk-7ae88917fa654723b43323e950abd9d4
   DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
   ```
3. Mark as **sensitive** and set for **Production**
4. **Redeploy** after adding variables

### Issue 2: API Key Invalid/Expired
**Symptoms**:
- `API Error: 401 Unauthorized` in deepseek-test
- "Invalid API key" messages

**Solution**:
1. Generate new DeepSeek API key from https://platform.deepseek.com/
2. Update in Vercel environment variables
3. Redeploy

### Issue 3: Timeout Issues
**Symptoms**:
- `API Error: 408 Request Timeout`
- "Function timeout" in Vercel logs

**Solution**:
1. Upgrade to Vercel Pro (longer timeouts)
2. Or reduce `max_tokens` in API call
3. Enable Fluid Compute in Vercel settings

### Issue 4: Runtime Issues
**Symptoms**:
- "fetch is not defined" errors
- Module import errors

**Solution**:
1. Ensure `vercel.json` has Node.js runtime configured
2. Check `export const runtime = 'nodejs'` in route files

## 📊 Debug Results Interpretation

### env-check Results:
```json
{
  "DEEPSEEK_API_KEY": "SET (35 chars)",  // ✅ Good
  "DEEPSEEK_BASE_URL": "https://api.deepseek.com/v1"  // ✅ Good
}
```

### deepseek-test Results:
```json
{
  "success": true,  // ✅ API working
  "response": "Hello from DeepSeek"  // ✅ Good
}
```

```json
{
  "success": false,
  "error": "401 Unauthorized"  // ❌ API key issue
}
```

### test-ai Results:
```json
{
  "success": true,  // ✅ Full flow working
  "result": { "storyline": "...", "risk": "...", "timing": "...", "action": "..." }
}
```

## 🛠️ Advanced Troubleshooting

### Check Vercel Function Logs
```bash
vercel logs --follow
```

### Test Locally with Production Environment
```bash
# Copy production env vars to .env.local
# Test with: npm run build && npm start
```

### Network Issues
- DeepSeek API might be blocked in some regions
- Vercel's free tier has egress limitations
- Consider using a different API region

## 🎯 Quick Fix Checklist

1. **Environment Variables**: Set in Vercel dashboard ✅
2. **Redeploy**: After setting variables ✅  
3. **Test Endpoints**: env-check → deepseek-test → test-ai ✅
4. **Check Logs**: Vercel logs for detailed errors ✅
5. **API Key**: Verify it's valid and active ✅

## 📞 If Still Failing

1. **Check DeepSeek Status**: https://status.deepseek.com/
2. **Try Different API**: Consider OpenAI or Claude as backup
3. **Contact Support**: Vercel + DeepSeek support teams

---

**Run these tests in order and report the results!** 🧪