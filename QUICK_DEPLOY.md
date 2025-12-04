# ⚡ Quick Deploy Guide

## 🚀 Deploy in 3 Steps

### Step 1: Set Environment Variables
Add these to your deployment platform (Vercel/Netlify/Railway):

```bash
DATABASE_URL="postgresql://neondb_owner:npg_yumU9dK7FVCS@ep-small-morning-ag14x7pa-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Optional (for AI features)
DEEPSEEK_API_KEY="your-api-key"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

### Step 2: Deploy

**Vercel (Recommended)**
```bash
npx vercel --prod
```

**Or push to GitHub**
```bash
git push origin main
```

### Step 3: Verify
```bash
./verify-production.sh https://your-app-url.com
```

---

## ✅ Pre-Deploy Checklist
- [ ] Environment variables set in platform
- [ ] DATABASE_URL points to your Neon database
- [ ] Code committed to Git

## ✅ Post-Deploy Checklist
- [ ] Visit `/api/health` - should return `{"status":"ok"}`
- [ ] Test homepage loads
- [ ] Create a test reading
- [ ] Check mobile view

---

## 🎯 Build Info
- **Framework**: Next.js 14.2.31
- **Database**: Neon PostgreSQL
- **Pages**: 58 (40 static, 18 dynamic)
- **API Routes**: 18 serverless functions
- **Build Time**: ~30-45 seconds

---

## 📚 Full Documentation
See `DEPLOYMENT_READY.md` for complete guide.

---

**Status**: ✅ Production Ready  
**Last Updated**: December 4, 2024
