# Lenormand Intelligence API Documentation

## Overview

The Lenormand Intelligence API provides AI-powered Lenormand card readings using Marie-Anne Lenormand's authentic style. Readings include story interpretation, actionable tasks, and deadline calculations.

**Base URL:** `/api/readings`

## Authentication

No authentication required for current implementation. Future versions may require API keys.

---

## Endpoints

### POST /api/readings/interpret

Generate a Lenormand card reading with AI interpretation.

#### Request

```http
POST /api/readings/interpret
Content-Type: application/json

{
  "question": "Will this conflict resolve?",
  "cards": [
    { "id": 6, "name": "Clouds", "position": 0 },
    { "id": 8, "name": "Coffin", "position": 1 },
    { "id": 22, "name": "Paths", "position": 2 }
  ],
  "spreadId": "sentence-3"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `question` | string | Yes | The client's question (1-500 characters) |
| `cards` | array | Yes | Array of card objects (1-36 cards) |
| `cards[].id` | number | Yes | Card ID (1-36) |
| `cards[].name` | string | Yes | Card name (e.g., "Clouds", "Rider") |
| `cards[].position` | number | Optional | Card position in spread |
| `spreadId` | string | Optional | Spread type (default: "sentence-3") |

#### Spread Types

| Spread ID | Cards | Type | Description |
|-----------|-------|------|-------------|
| `single-card` | 1 | Quick Reading | Single card insight |
| `sentence-3` | 3 | 3-Card | Three cards as flowing sentence |
| `past-present-future` | 3 | 3-Card | Timeline reading |
| `yes-no-maybe` | 3 | 3-Card | Binary decision guidance |
| `situation-challenge-advice` | 3 | 3-Card | Problem-solving spread |
| `mind-body-spirit` | 3 | 3-Card | Holistic balance reading |
| `sentence-5` | 5 | 5-Card | Five cards flowing sentence |
| `structured-reading` | 5 | 5-Card | Detailed situation analysis |
| `week-ahead` | 7 | 7-Card | 7-day forecast |
| `relationship-double-significator` | 7 | 7-Card | Love and partnership |
| `comprehensive` | 9 | 9-Card | Master spread (3x3) |
| `grand-tableau` | 36 | 36-Card | Full deck reading |

#### Response

```json
{
  "reading": "A fog of confusion (Clouds) has settled over your situation (Coffin), leaving you at a crossroads (Paths). The tension feels final—cut what's not working and choose your path forward. Make your decision and document it by Friday evening.",
  "deadline": "by Friday evening",
  "task": "Choose one path and commit before the deadline",
  "timingDays": 2
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `reading` | string | The narrative reading in Marie-Anne's voice |
| `deadline` | string | Action deadline ("by Thursday evening" or "by Friday evening") |
| `task` | string | Specific actionable task for the client |
| `timingDays` | number | Days until deadline (based on outcome card pip) |

#### Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Reading generated successfully |
| `400` | Bad Request | Invalid cards, missing question, JSON parse error |
| `500` | Server Error | AI service unavailable, internal error |

#### Error Responses

**Invalid Request:**
```json
{
  "error": "Cards must be provided as an array"
}
```

**Missing Question:**
```json
{
  "error": "Question must be a non-empty string"
}
```

**Too Many Cards:**
```json
{
  "error": "Maximum 36 cards allowed"
}
```

**Server Error:**
```json
{
  "error": "An unexpected error occurred while generating the reading",
  "requestId": "a1b2c3d4e5"
}
```

---

## Card Reference

All 36 Lenormand cards:

| ID | Name | Meaning |
|----|------|---------|
| 1 | Rider | News, messages, movement |
| 2 | Clover | Good fortune, small blessings |
| 3 | Ship | Journey, travel, distance |
| 4 | House | Home, stability, foundation |
| 5 | Tree | Growth, health, roots |
| 6 | Clouds | Confusion, obstacles, unclear |
| 7 | Snake | Deception, complications, wisdom |
| 8 | Coffin | Endings, transformation, completion |
| 9 | Bouquet | Gifts, celebration, gratitude |
| 10 | Scythe | Sharp decisions, cutting away |
| 11 | Whip | Conflict, tension, stimulation |
| 12 | Birds | Conversation, communication, worry |
| 13 | Child | Innocence, new beginning, youth |
| 14 | Fox | Strategy, cunning, caution |
| 15 | Bear | Strength, authority, power |
| 16 | Stars | Hope, guidance, inspiration |
| 17 | Stork | Change, transition, movement |
| 18 | Dog | Loyalty, friendship, ally |
| 19 | Tower | Authority, institution, conflict |
| 20 | Garden | Social, public, presentation |
| 21 | Mountain | Obstacle, challenge, difficulty |
| 22 | Crossroads | Choice, decision, multiple paths |
| 23 | Mice | Loss, erosion, small problems |
| 24 | Heart | Love, emotion, passion |
| 25 | Ring | Commitment, agreement, binding |
| 26 | Book | Secrets, knowledge, mystery |
| 27 | Letter | Message, document, communication |
| 28 | Man/Gentleman | Significant male figure |
| 29 | Woman/Lady | Significant female figure |
| 30 | Lily | Peace, calm, purity |
| 31 | Sun | Success, clarity, warmth |
| 32 | Moon | Intuition, feeling, cycles |
| 33 | Key | Solution, success, breakthrough |
| 34 | Fish | Money, abundance, flow |
| 35 | Anchor | Stability, security, grounding |
| 36 | Cross | Burden, fate, spiritual lesson |

---

## Examples

### Example 1: Simple 3-Card Reading

**Request:**
```bash
curl -X POST http://localhost:3000/api/readings/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Will this relationship work out?",
    "cards": [
      { "id": 24, "name": "Heart", "position": 0 },
      { "id": 11, "name": "Whip", "position": 1 },
      { "id": 31, "name": "Sun", "position": 2 }
    ],
    "spreadId": "sentence-3"
  }'
```

**Response:**
```json
{
  "reading": "Your heart is strong (Heart), but there's tension to work through (Whip). The sun breaks through—this can be resolved with honest conversation. Express your feelings clearly and commit to the resolution by Friday evening.",
  "deadline": "by Friday evening",
  "task": "Express your feelings or declare your position before Friday",
  "timingDays": 1
}
```

### Example 2: Week-Ahead 7-Card Reading

**Request:**
```bash
curl -X POST http://localhost:3000/api/readings/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What does this week hold for me?",
    "cards": [
      { "id": 21, "name": "Mountain", "position": 0 },
      { "id": 2, "name": "Clover", "position": 1 },
      { "id": 33, "name": "Key", "position": 2 },
      { "id": 27, "name": "Letter", "position": 3 },
      { "id": 31, "name": "Sun", "position": 4 },
      { "id": 3, "name": "Ship", "position": 5 },
      { "id": 25, "name": "Ring", "position": 6 }
    ],
    "spreadId": "week-ahead"
  }'
```

**Response:**
```json
{
  "reading": "Monday brings a mountain—don't let obstacles stop you. Small luck (Clover) arrives Tuesday, bringing the key (Key) to your next move. A message arrives Wednesday (Letter) that shifts everything. By Thursday, clarity breaks through (Sun) and you're moving forward (Ship). Finalize your commitment by Friday (Ring). Make the call or send word by Friday evening.",
  "deadline": "by Friday evening",
  "task": "Sign the document or confirm the commitment before Friday",
  "timingDays": 5
}
```

### Example 3: Error Response

**Request (Invalid - no question):**
```bash
curl -X POST http://localhost:3000/api/readings/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "cards": [
      { "id": 1, "name": "Rider" }
    ]
  }'
```

**Response:**
```json
{
  "error": "Question must be a non-empty string"
}
```

---

## Deadline Calculation

Deadlines are calculated based on the outcome card's pip value (1-10):

| Pip Value | Deadline | Days |
|-----------|----------|------|
| 1-4 | Thursday evening | 3-4 days |
| 5-8 | Friday evening | 5-6 days |
| 9-10 | Friday evening | 8-10 days |
| 11-36 (courts/high cards) | Friday evening | Varies |

Special rules:
- Cards > 30 (courts) = 4 days → Thursday evening
- Cards 10, 20, 30 = 10 days → Friday evening
- Maximum deadline: 14 days (capped)

---

## Task Generation

Tasks are generated based on the outcome card and spread beat. Each card has contextually appropriate tasks:

| Card | Task |
|------|------|
| Ring | Sign the document or confirm the commitment |
| Letter | Send the message, text, or email |
| Rider | Deliver the news or send word |
| Key | Act on the solution or unlock the next step |
| Sun | Take the win and step into the light |
| ... | (See taskGen.ts for complete mapping) |

---

## Card Reference Format

All readings for 9+ card spreads enforce the **(CardName)** format to maintain clarity:

Example: "A fog of confusion **(Clouds)** has settled over your situation..."

This ensures clients always know exactly which cards are influencing their reading.

---

## Rate Limiting

Currently no rate limiting implemented. Future versions may include:
- Per-IP rate limits (100 requests/hour)
- Per-user rate limits with API keys

---

## Response Caching

Response caching is available for identical requests (same cards + spread):
- Cached responses expire after 1 hour
- Controlled by `Cache-Control: public, max-age=3600` headers

---

## Performance

Typical response times:
- Simple 3-card reading: 200-500ms
- 5-card reading: 300-600ms
- 9-card reading: 400-800ms
- 36-card reading: 500-1000ms

(Times vary based on AI service availability)

---

## Logging & Debugging

Each request generates a unique `requestId` for debugging. Log entries include:
- Request ID
- Timestamp
- Request duration
- Card count
- Spread type
- Any errors or warnings

Example from logs:
```
[INFO] [a1b2c3d4e5] POST /api/readings/interpret - Request received
[INFO] [a1b2c3d4e5] Validation passed, calling getAIReading
[INFO] [a1b2c3d4e5] Reading generated successfully (duration: 450ms)
```

---

## Error Handling

The API implements comprehensive error handling:

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid card IDs/names
   - Question too long/short
   - Too many/few cards

2. **JSON Errors** (400)
   - Invalid JSON in request body
   - Malformed request

3. **Server Errors** (500)
   - AI service unavailable
   - Unexpected internal error
   - Includes `requestId` for debugging

All errors include specific error messages for API clients.

---

## Future Enhancements

Planned API improvements:
- Streaming responses for real-time reading generation
- Response caching with Redis
- Rate limiting and API keys
- Reading history tracking
- Batch reading generation
- Card combination analysis
- Accuracy tracking and feedback

---

## Support

For issues, feature requests, or questions about the API:
- Check logs with request ID
- Verify card IDs are 1-36
- Ensure question is non-empty string
- Confirm JSON is valid

---

## Version

**Current Version:** 1.0.0  
**Last Updated:** 2024-11-23  
**Status:** Production Ready ✅

