# Feedback System Integration Guide

## Quick Start

Your feedback system is ready to use. Here's how to integrate it into your UI.

## 1. Record Feedback

After a reading is displayed, add thumbs up/down buttons:

```typescript
async function submitFeedback(isHelpful: boolean, readingId: string) {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      isHelpful,
      readingId,
      spreadId: "three-card", // current spread
      question: userQuestion, // optional
      readingText: aiResponse, // optional
    }),
  });

  const data = await response.json();
  console.log("Feedback recorded:", data.feedbackId);
}
```

## 2. View System Performance

Check how your variants are performing:

```typescript
async function getOptimizationStatus() {
  const response = await fetch("/api/feedback/analytics");
  const data = await response.json();

  console.log("System helpfulness:", data.optimization.systemHelpfulnessRate);
  console.log("Top variants:", data.optimization.metrics.topPerformingVariants);
}
```

## 3. Database Schema

### Feedback Table

```
- id (UUID, primary key)
- isHelpful (boolean)
- readingId (UUID, foreign key)
- spreadId (text)
- promptVariant (text, nullable)
- promptTemperature (float, nullable)
- question (text, nullable)
- readingText (text, nullable)
- createdAt (timestamp)
```

### PromptVariant Table

```
- id (UUID, primary key)
- name (text) - e.g., "v1_baseline", "v2_detailed"
- spreadId (text)
- temperature (float)
- promptTemplate (text)
- isActive (boolean)
- helpfulCount (int)
- unhelpfulCount (int)
- helpfulnessRate (float) - 0-100
- totalReadingsGenerated (int)
- createdAt, updatedAt
```

### OptimizationMetrics Table

```
- id (UUID, primary key)
- spreadId (text)
- periodStartDate (timestamp)
- periodEndDate (timestamp)
- totalFeedbackCollected (int)
- helpfulCount (int)
- unhelpfulCount (int)
- helpfulnessRate (float)
- bestPerformingVariant (text, nullable)
- improvementSinceLastPeriod (float, nullable)
```

## 4. Workflow

### Initial Setup

1. Create a base prompt variant (e.g., "v1_baseline") in `prompt_variants` table
2. When generating readings, set `promptVariant = "v1_baseline"`

### Collecting Feedback

1. User rates reading (👍 or 👎)
2. `POST /api/feedback` records the vote
3. System updates `promptVariant` stats automatically

### Analyzing Performance

1. `GET /api/feedback/analytics` shows overall helpfulness
2. Run queries to find best variants per spread type
3. Create new variants with different instructions/temperature

### Optimizing

1. Route more traffic to high-performing variants
2. Test new variants alongside existing ones
3. Monitor helpfulness trends over time

## 5. Example Queries

Get top variants for a spread:

```sql
SELECT name, helpfulness_rate
FROM prompt_variants
WHERE spread_id = 'three-card'
  AND is_active = true
ORDER BY helpfulness_rate DESC;
```

Get recent feedback:

```sql
SELECT * FROM feedback
WHERE spread_id = 'three-card'
ORDER BY created_at DESC
LIMIT 50;
```

Get helpfulness trend:

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  SUM(CASE WHEN is_helpful THEN 1 ELSE 0 END)::float / COUNT(*) * 100 as helpfulness_rate
FROM feedback
WHERE spread_id = 'three-card'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 6. Next Steps

1. **Add feedback buttons to UI** - Call `submitFeedback()` on 👍/👎 click
2. **Track prompt variants** - Record which variant generated each reading
3. **Monitor analytics** - Check `/api/feedback/analytics` periodically
4. **Test new variants** - Create v2, v3, etc with different prompts
5. **Optimize based on data** - Route traffic to winners

## Production Checklist

- [ ] Feedback buttons integrated in UI
- [ ] `readingId` captured with each reading
- [ ] `spreadId` set correctly for tracking
- [ ] Analytics dashboard accessible to team
- [ ] Daily monitoring of helpfulness rate
- [ ] New variants tested weekly
- [ ] Database backups verified
