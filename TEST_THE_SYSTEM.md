# 🧪 Testing Loraloop AI Growth Pod Controller

## Quick Test

1. **Start the dev server:**
```bash
cd loraloop-app
npm run dev
```

2. **Run a test request:**
```bash
curl -X POST http://localhost:3000/api/agents/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Create Instagram post announcing our new design services",
    "platform": "instagram",
    "contentTypes": ["image", "text"],
    "useMockData": true,
    "preferences": {
      "style": "modern minimalist",
      "imageType": "service showcase"
    }
  }'
```

## Expected Response

```json
{
  "image": {
    "url": "https://generated-image.jpg or null",
    "prompt": "[Detailed image prompt]",
    "metadata": {
      "platform": "instagram",
      "dimensions": "1080x1350"
    }
  },
  "text": {
    "caption": "Hook message with CTA",
    "hashtags": ["#design", "#strategy", "#launch"],
    "keyPhrases": ["Design", "Strategy", "Innovation"]
  },
  "metadata": {
    "businessName": "TechFlow Studio",
    "platform": "instagram",
    "generatedAt": "2026-04-21T...",
    "brandVoice": "Tone: Professional; Colors: #0066FF",
    "processingTime": 12345,
    "agentDecisions": {...}
  }
}
```

## Test Different Platforms

### Twitter (Concise, Witty)
```bash
curl -X POST http://localhost:3000/api/agents/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Drive engagement on Twitter",
    "platform": "twitter",
    "contentTypes": ["text"],
    "useMockData": true
  }'
```

### LinkedIn (Professional, Thought-Leading)
```bash
curl -X POST http://localhost:3000/api/agents/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Position as industry thought leader",
    "platform": "linkedin",
    "contentTypes": ["text"],
    "useMockData": true
  }'
```

### TikTok (Trendy, Authentic)
```bash
curl -X POST http://localhost:3000/api/agents/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Create viral behind-the-scenes content",
    "platform": "tiktok",
    "contentTypes": ["text"],
    "useMockData": true
  }'
```

## Test with Image Generation

```bash
curl -X POST http://localhost:3000/api/agents/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Create stunning product launch visual",
    "platform": "instagram",
    "contentTypes": ["image", "text"],
    "useMockData": true,
    "preferences": {
      "style": "bold and vibrant",
      "imageType": "product showcase"
    }
  }'
```

## API Documentation

Check what the endpoint supports:
```bash
curl http://localhost:3000/api/agents/orchestrate
```

## Troubleshooting

**Getting 500 error?**
- Check .env.local has GEMINI_API_KEY
- Check dev server is running on port 3000
- Check JSON is valid

**Image not generating?**
- This is normal - image generation may fail due to API quotas
- The endpoint still returns the image prompt for manual generation
- Check console logs for detailed error info

**Want to test with real Supabase data?**
- Add `"businessId": "your-id"` to request body
- Remove or set `"useMockData": false`
- Endpoint will fetch from Supabase

## What's Happening

When you make a request:
1. **LORA** makes strategic decisions
2. **CLARA** writes brand-aligned copy
3. **STEVE** creates image generation prompt (and tries to generate)
4. All output is formatted and returned

Check console logs for detailed agent decisions.

## File Structure

```
loraloop-app/
├── src/
│   ├── types/agents.ts
│   ├── lib/
│   │   ├── agents/ (lora.ts, clara.ts, steve.ts, orchestrator.ts)
│   │   ├── mockData.ts
│   │   ├── brandVoiceEngine.ts
│   │   └── (existing: gemini.ts, supabase.ts)
│   └── app/api/agents/orchestrate/route.ts
└── .env.local (updated with GEMINI_API_KEY)
```

All files are ready to use!
