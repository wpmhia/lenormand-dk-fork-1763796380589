# Environment Variables for Deployment

## Required for AI Features

To enable AI-powered Lenormand readings, you must set these environment variables in your deployment platform:

### DEEPSEEK_API_KEY
- **Description**: API key for DeepSeek AI service for Lenormand reading interpretations
- **Required**: Optional (AI features disabled if not provided)
- **How to get**: 
  1. Sign up at [DeepSeek](https://platform.deepseek.com)
  2. Navigate to API Keys section
  3. Create a new API key
  4. Copy the key (starts with `sk-`)

### DEEPSEEK_BASE_URL
- **Description**: Base URL for DeepSeek API
- **Required**: Optional (defaults to https://api.deepseek.com/v1)
- **Default**: `https://api.deepseek.com/v1`

## Deployment Instructions

### Vercel
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `DEEPSEEK_API_KEY` with your DeepSeek API key
4. Add `DEEPSEEK_BASE_URL` (optional) with `https://api.deepseek.com/v1`
5. Redeploy your application

### Netlify
1. Go to Site settings → Build & deploy → Environment
2. Add `DEEPSEEK_API_KEY` with your DeepSeek API key
3. Add `DEEPSEEK_BASE_URL` (optional) with `https://api.deepseek.com/v1`
4. Redeploy your application

### Railway
1. Go to your Railway project
2. Navigate to Variables tab
3. Add `DEEPSEEK_API_KEY` with your DeepSeek API key
4. Add `DEEPSEEK_BASE_URL` (optional) with `https://api.deepseek.com/v1`
5. Redeploy your application

## Testing

After deployment, you can test if AI is working by:
1. Visiting `/env-check` to verify environment variables
2. Starting a new reading at `/read/new`
3. Drawing cards and checking if AI analysis appears

## Troubleshooting

If AI Analysis shows "Unavailable":
1. Check that `DEEPSEEK_API_KEY` is set correctly
2. Verify the API key is valid and active
3. Check deployment logs for any API errors
4. Ensure `DEEPSEEK_BASE_URL` includes `/v1` suffix if manually set

The app will gracefully degrade without AI - users can still get readings, just without AI interpretations.