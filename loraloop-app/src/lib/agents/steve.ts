/**
 * STEVE - Image Agent
 * Uses knowledge base brand images, logo, and guidelines to build image prompts
 */

import { BrandVoice, ClaraOutput, Platform, SteveOutput, PLATFORM_DIMENSIONS } from '@/types/agents';
import { callGemini } from '../gemini';
import { getPrimaryColors } from '../brandVoiceEngine';

export interface SteveInput {
  claraOutput: ClaraOutput;
  brandVoice: BrandVoice;
  businessName: string;
  platform: Platform;
  style?: string;
  imageType?: string;
  referenceImages?: string[]; // Brand images from knowledge base
  logoUrl?: string;           // Brand logo from knowledge base
}

export async function runSteve(input: SteveInput): Promise<SteveOutput> {
  const {
    claraOutput,
    brandVoice,
    businessName,
    platform,
    style = 'professional',
    imageType = 'branded',
    referenceImages = [],
    logoUrl,
  } = input;

  const dimensions = PLATFORM_DIMENSIONS[platform];
  const { primary, secondary, accent } = getPrimaryColors(brandVoice);

  // Build brand reference section from KB data
  const brandReferenceSection = buildBrandReferenceSection({
    logoUrl,
    referenceImages,
    brandVoice,
    primary,
    secondary,
    accent,
  });

  const prompt = `Create a ${style} ${imageType} image for ${businessName}.

BRAND GUIDELINES (from knowledge base):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${brandReferenceSection}

CONTENT TO VISUALIZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hook: "${claraOutput.hook}"
Message: "${claraOutput.coreMessage}"
Platform: ${platform} (${dimensions.width}x${dimensions.height}px, ratio ${dimensions.ratio})

TEXT OVERLAYS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${claraOutput.textOverlays.map((o) => `• ${o.placement.toUpperCase()} | ${o.size} | "${o.text}"`).join('\n')}

VISUAL DIRECTION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Aesthetic: ${brandVoice.aesthetic}
- Tone: ${brandVoice.tone}
- Values: ${brandVoice.values.join(', ')}
- Typography: ${brandVoice.fonts.headingFont} for headlines, ${brandVoice.fonts.bodyFont} for body
- Tagline: "${brandVoice.tagline}"

Generate a stunning, on-brand ${platform} image that stops scrollers. Professional, polished, ${dimensions.width}x${dimensions.height}px ready.`;

  try {
    const result = await callGemini({
      taskType: 'steve-design',
      prompt,
      mimeType: 'application/json',
      minLength: 100,
    });

    const imageUrl = result.text.includes('http') ? result.text.split('\n')[0] : undefined;

    return buildSteveOutput(prompt, imageUrl, brandVoice, claraOutput, platform, dimensions, primary, secondary, accent);
  } catch (error) {
    console.warn('[STEVE] Image generation failed, returning prompt');
    return buildSteveOutput(prompt, undefined, brandVoice, claraOutput, platform, dimensions, primary, secondary, accent);
  }
}

function buildBrandReferenceSection(input: {
  logoUrl?: string;
  referenceImages: string[];
  brandVoice: BrandVoice;
  primary: string;
  secondary: string;
  accent: string;
}): string {
  const { logoUrl, referenceImages, brandVoice, primary, secondary, accent } = input;
  const lines: string[] = [];

  lines.push(`Color Palette:`);
  lines.push(`  Primary: ${primary}`);
  lines.push(`  Secondary: ${secondary}`);
  lines.push(`  Accent: ${accent}`);
  if (brandVoice.colors.background) lines.push(`  Background: ${brandVoice.colors.background}`);

  if (logoUrl) {
    lines.push(`Logo: ${logoUrl} — preserve brand mark placement, top-left or watermark corner`);
  }

  if (referenceImages.length > 0) {
    lines.push(`Brand Visual References (match this aesthetic style):`);
    referenceImages.slice(0, 3).forEach((url, i) => {
      lines.push(`  ${i + 1}. ${url}`);
    });
    lines.push(`  → Match the visual style, composition, and mood of these brand images`);
  }

  return lines.join('\n');
}

function buildSteveOutput(
  prompt: string,
  imageUrl: string | undefined,
  brandVoice: BrandVoice,
  claraOutput: ClaraOutput,
  platform: Platform,
  dimensions: { width: number; height: number; ratio: string },
  primary: string,
  secondary: string,
  accent: string,
): SteveOutput {
  return {
    prompt: {
      prompt,
      style: brandVoice.aesthetic,
      composition: `${platform}-optimized ${dimensions.width}x${dimensions.height}`,
      colors: `Primary: ${primary}, Secondary: ${secondary}, Accent: ${accent}`,
      textOverlay: claraOutput.textOverlays.map((o) => `${o.placement}: "${o.text}"`).join(' | '),
      aspectRatio: dimensions.ratio as 'custom' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2',
      platform,
      brandColors: brandVoice.colors,
      brandFonts: brandVoice.fonts,
      metadata: { platform, dimensions: `${dimensions.width}x${dimensions.height}` },
    },
    imageUrl,
    generatedAt: new Date().toISOString(),
  };
}
