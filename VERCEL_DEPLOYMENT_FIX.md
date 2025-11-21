# Vercel Deployment Fix

## Issue: "routes-manifest.json couldn't be found"

This error occurs when Vercel doesn't properly detect your project as a Next.js application.

## Solution 1: Remove vercel.json (Recommended)

Vercel's auto-detection works best for Next.js projects:

```bash
# Backup current config
mv vercel.json vercel.json.backup

# Deploy without vercel.json
git add .
git commit -m "Remove vercel.json for auto-detection"
git push
```

## Solution 2: Explicit Next.js Configuration

If you need custom configuration, use this minimal setup:

```json
{
  "framework": "nextjs",
  "functions": {
    "app/api/readings/interpret/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## Solution 3: Vercel Dashboard Settings

1. Go to your Vercel project dashboard
2. Navigate to **Settings → General**
3. Under **Framework Preset**, select **Next.js**
4. Under **Build Command**, ensure: `npm run build`
5. Under **Output Directory**, leave blank (Vercel auto-detects `.next`)
6. Under **Install Command**, ensure: `npm install`

## Solution 4: Clean Redeploy

```bash
# Clean everything
rm -rf .next node_modules
npm install

# Fresh build
npm run build

# Deploy
vercel --prod
```

## Verification

After deployment, check:
1. Homepage loads at your domain
2. `/env-check` shows environment status
3. AI features work (if API keys configured)
4. No 404 errors on static assets

## Why This Happens

- Vercel expects Next.js projects to have specific structure
- Custom `vercel.json` can interfere with auto-detection
- The `routes-manifest.json` is generated in `.next/` during build
- Vercel needs to know this is a Next.js app to look in the right place

## Best Practice

For most Next.js projects, **no vercel.json is needed**. Vercel's auto-detection handles:
- Framework detection
- Build commands
- Output directories
- Static file serving
- API routes

Only use `vercel.json` when you need:
- Custom function timeouts
- Environment-specific settings
- Custom headers/redirects
- Edge functions