/**
 * POST /api/create
 *
 * Natural language content creation endpoint.
 * Just send a plain text message like:
 *   "create instagram post about our new product launch"
 *   "make a linkedin image post about sustainability"
 *   "twitter post about Q2 results"
 */

import { NextResponse } from 'next/server';
import { Platform } from '@/types/agents';
import { orchestrateContent } from '@/lib/agents/orchestrator';

export const maxDuration = 120;

type ContentType = 'image' | 'video' | 'text';

interface ParsedRequest {
  platform: Platform;
  contentTypes: ContentType[];
  goal: string;
  preferences: {
    style: string;
    imageType: string;
    tone?: string;
  };
}

function parseNaturalLanguage(message: string): ParsedRequest {
  const lower = message.toLowerCase();

  // Platform detection
  let platform: Platform = 'instagram';
  if (lower.includes('twitter') || lower.includes('tweet') || lower.includes('x post')) platform = 'twitter';
  else if (lower.includes('linkedin') || lower.includes('linked in')) platform = 'linkedin';
  else if (lower.includes('tiktok') || lower.includes('tik tok')) platform = 'tiktok';
  else if (lower.includes('blog') || lower.includes('article')) platform = 'blog';
  else if (lower.includes('insta')) platform = 'instagram';

  // Content type detection — always include text; add image if requested
  const contentTypes: ContentType[] = ['text'];
  if (
    lower.includes('image') ||
    lower.includes('photo') ||
    lower.includes('picture') ||
    lower.includes('visual') ||
    lower.includes('banner') ||
    lower.includes('graphic')
  ) {
    contentTypes.push('image');
  }

  // Style detection from message keywords
  let style = 'professional modern';
  if (lower.includes('nature') || lower.includes('eco') || lower.includes('green') || lower.includes('organic')) {
    style = 'natural organic earthy';
  } else if (lower.includes('bold') || lower.includes('vibrant') || lower.includes('bright') || lower.includes('exciting')) {
    style = 'bold vibrant high-energy';
  } else if (lower.includes('minimal') || lower.includes('clean') || lower.includes('simple') || lower.includes('white')) {
    style = 'minimalist clean white-space';
  } else if (lower.includes('luxury') || lower.includes('premium') || lower.includes('elegant')) {
    style = 'luxury premium elegant';
  } else if (lower.includes('playful') || lower.includes('fun') || lower.includes('casual')) {
    style = 'playful casual fun';
  }

  // Image type from keywords
  let imageType = 'modern branded';
  if (lower.includes('nature') || lower.includes('landscape') || lower.includes('outdoor') || lower.includes('forest') || lower.includes('sky')) {
    imageType = 'nature landscape with brand overlay';
  } else if (lower.includes('product') || lower.includes('showcase') || lower.includes('launch')) {
    imageType = 'product showcase hero';
  } else if (lower.includes('lifestyle') || lower.includes('people') || lower.includes('team')) {
    imageType = 'lifestyle people-focused';
  } else if (lower.includes('abstract') || lower.includes('geometric') || lower.includes('pattern')) {
    imageType = 'abstract geometric design';
  } else if (lower.includes('announcement') || lower.includes('announce') || lower.includes('launch')) {
    imageType = 'announcement bold typography';
  }

  // Tone override
  let tone: string | undefined;
  if (lower.includes('inspirational') || lower.includes('inspire') || lower.includes('motivat')) {
    tone = 'inspirational and motivating';
  } else if (lower.includes('educational') || lower.includes('informative') || lower.includes('tips')) {
    tone = 'educational and informative';
  } else if (lower.includes('funny') || lower.includes('humor') || lower.includes('witty')) {
    tone = 'witty and humorous';
  } else if (lower.includes('professional') || lower.includes('thought leader')) {
    tone = 'professional thought-leading';
  }

  // Clean goal: strip platform/format keywords to get the core idea
  const stopWords = /\b(create|make|generate|write|build|insta(gram)?|twitter|tweet|linkedin|tiktok|blog|post|image|photo|picture|visual|banner|graphic|for me|please)\b/gi;
  const goal = message.replace(stopWords, '').replace(/\s+/g, ' ').trim() || message;

  return {
    platform,
    contentTypes,
    goal,
    preferences: { style, imageType, ...(tone ? { tone } : {}) },
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept either { message: "..." } or { text: "..." } or plain string in body
    const rawMessage: string =
      body.message || body.text || body.prompt || body.goal || '';

    if (!rawMessage.trim()) {
      return NextResponse.json(
        { error: 'Send a message describing what you want to create. E.g. { "message": "create instagram post about our new product launch" }' },
        { status: 400 }
      );
    }

    const parsed = parseNaturalLanguage(rawMessage);

    console.log('[CREATE] Natural language request:', {
      input: rawMessage,
      platform: parsed.platform,
      contentTypes: parsed.contentTypes,
      goal: parsed.goal,
    });

    const result = await orchestrateContent({
      businessId: body.businessId,
      goal: parsed.goal,
      platform: parsed.platform,
      contentTypes: parsed.contentTypes,
      useMockData: body.useMockData ?? !body.businessId,
      preferences: parsed.preferences,
    });

    return NextResponse.json({
      ...result,
      _parsed: {
        originalMessage: rawMessage,
        detectedPlatform: parsed.platform,
        detectedContentTypes: parsed.contentTypes,
        detectedStyle: parsed.preferences.style,
        detectedImageType: parsed.preferences.imageType,
      },
    });
  } catch (error) {
    console.error('[CREATE] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Content creation failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/create',
    description: 'Natural language content creation. Just describe what you want.',
    examples: [
      { message: 'create instagram post about our new product launch' },
      { message: 'make a linkedin image post about sustainability' },
      { message: 'twitter post about Q2 results with bold style' },
      { message: 'tiktok post for our summer collection' },
      { message: 'create nature image post for instagram' },
    ],
    optional: {
      businessId: 'Supabase business UUID — uses your real KB data',
      useMockData: 'true/false — force mock data (default: true if no businessId)',
    },
  });
}
