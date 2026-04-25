/**
 * Brand Voice Engine - Extract consistent brand voice from knowledge base
 */

import { BusinessKnowledgeBase, BrandVoice } from '@/types/agents';

export function extractBrandVoice(kb: BusinessKnowledgeBase): BrandVoice {
  const { enrichedData, brandGuidelines } = kb;

  return {
    tone: enrichedData.toneOfVoice,
    vocabulary: enrichedData.brandValues,
    colors: brandGuidelines.colors,
    fonts: brandGuidelines.typography,
    imageStyle: enrichedData.brandAesthetic,
    videoStyle: enrichedData.brandAesthetic,
    tagline: enrichedData.tagline,
    values: enrichedData.brandValues,
    aesthetic: enrichedData.brandAesthetic,
  };
}

export function generateBrandVoiceSummary(voice: BrandVoice): string {
  const colorsList = Object.entries(voice.colors)
    .map(([key, value]) => `${key}: ${value}`)
    .filter(([, v]) => v)
    .slice(0, 3)
    .join(', ');

  return `Tone: ${voice.tone}; Colors: ${colorsList}; Values: ${voice.values.join(', ')}`;
}

export function buildBrandContext(voice: BrandVoice, businessName: string): string {
  return `
# Brand Context for ${businessName}
## Voice: ${voice.tone}
## Values: ${voice.values.join(', ')}
## Aesthetic: ${voice.aesthetic}
  `;
}

export function getPrimaryColors(voice: BrandVoice): { primary: string; secondary: string; accent: string } {
  return {
    primary: voice.colors.primary || '#000000',
    secondary: voice.colors.secondary || '#666666',
    accent: voice.colors.accent || '#FF6B35',
  };
}

export function buildImageBrandGuideline(voice: BrandVoice): string {
  const { primary, secondary, accent } = getPrimaryColors(voice);
  return `Style: ${voice.aesthetic}; Tone: ${voice.tone}; Colors: ${primary}, ${secondary}, ${accent}`;
}

export function getPlatformToneAdjustment(platform: 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'blog', baseTone: string): string {
  const adjustments: Record<string, string> = {
    instagram: 'Visual, storytelling-focused, emoji-friendly',
    twitter: 'Concise, witty, engaging',
    linkedin: 'Professional, thought-leading',
    tiktok: 'Trendy, energetic, authentic',
    blog: 'In-depth, educational',
  };
  return `${baseTone} - ${adjustments[platform]}`;
}
