import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import fs from 'fs';
import path from 'path';

const MAX_IMAGES = 25;
const ASSETS_DIR = path.join(process.cwd(), 'public', 'brand-assets');

// Download a remote image and save it to public/brand-assets/{businessId}/
// Returns the public URL path on success, or null on failure.
async function saveImageLocally(
  businessId: string,
  imageUrl: string,
  index: number,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Loraloop/1.0)' },
    });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return null; // skip tiny images

    const raw = res.headers.get('content-type') || 'image/jpeg';
    const contentType = raw.split(';')[0].trim();
    const extMap: Record<string, string> = {
      'image/jpeg':   'jpg',
      'image/jpg':    'jpg',
      'image/png':    'png',
      'image/webp':   'webp',
      'image/gif':    'gif',
      'image/svg+xml':'svg',
      'image/avif':   'avif',
    };
    const ext = extMap[contentType] || 'jpg';

    const dir = path.join(ASSETS_DIR, businessId);
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${index}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buffer);

    // Return URL path relative to /public — Next.js serves these as static files
    return `/brand-assets/${businessId}/${filename}`;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { url, businessName } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostName = businessName || new URL(normalizedUrl).hostname.replace('www.', '');

    const { data, error } = localDb.insert({
      business_name: hostName,
      website: normalizedUrl,
      status: 'scraping',
      created_at: new Date().toISOString(),
    });

    if (error || !data) {
      return NextResponse.json({ error: (error as any)?.message || 'Insert failed' }, { status: 500 });
    }

    const businessId = data.id;

    const origin = req.headers.get('origin') || req.headers.get('host') || 'localhost:3000';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const baseUrl = origin.startsWith('http') ? origin : `${protocol}://${origin}`;

    // Fire and forget
    runPipeline(baseUrl, normalizedUrl, businessId).catch((err) => {
      console.error('[process-business] Pipeline error:', err);
    });

    return NextResponse.json({ success: true, businessId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runPipeline(baseUrl: string, websiteUrl: string, businessId: string) {
  const update = (fields: Record<string, unknown>) => localDb.update(businessId, fields);

  try {
    console.log(`[pipeline] Starting for ${websiteUrl} (${businessId})`);
    update({ status: 'scraping' });

    // ── Phase 1: Scrape + extract DNA ─────────────────────────────────────────
    const dnaRes = await fetch(`${baseUrl}/api/extract-dna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: websiteUrl }),
    });
    if (!dnaRes.ok) throw new Error(`extract-dna returned ${dnaRes.status}`);

    const result = await dnaRes.json();
    if (!result.dna) throw new Error('No DNA returned from extraction');

    const dna   = result.dna;
    const docs  = result.documents || {};

    // ── Phase 2: Save images to local disk ────────────────────────────────────
    update({ status: 'enriching' });

    const rawImages: string[] = (dna.images || [])
      .filter((u: unknown) => typeof u === 'string' && (u as string).startsWith('http'))
      .slice(0, MAX_IMAGES);

    const localImageUrls: string[] = [];
    for (let i = 0; i < rawImages.length; i++) {
      const localUrl = await saveImageLocally(businessId, rawImages[i], i);
      if (localUrl) localImageUrls.push(localUrl);
    }
    console.log(`[pipeline] Saved ${localImageUrls.length}/${rawImages.length} images locally`);

    // ── Phase 3: Assemble and persist ─────────────────────────────────────────
    update({ status: 'generating' });

    const enrichedData = {
      businessOverview: dna.businessOverview || '',
      brandValues: dna.brandValue
        ? dna.brandValue.split(',').map((v: string) => v.trim())
        : [],
      brandAesthetic: dna.brandAesthetic || '',
      brandTone:      dna.toneOfVoice   || '',
      tagline:        dna.tagline        || '',
      enrichedAt:     new Date().toISOString(),
    };

    const brandGuidelines = {
      colors: [
        { name: 'Primary',    hex: dna.colors?.primary    || '#333333', usage: 'primary' },
        { name: 'Secondary',  hex: dna.colors?.secondary  || '#666666', usage: 'secondary' },
        { name: 'Background', hex: dna.colors?.background || '#FFFFFF', usage: 'background' },
        { name: 'Accent',     hex: dna.colors?.accent     || '#0066ff', usage: 'accent' },
      ],
      logos: dna.logoUrl
        ? [{ url: dna.logoUrl, type: 'primary', description: 'Main logo' }]
        : [],
      typography: [
        { family: dna.typography?.headingFont || 'Inter',      usage: 'headings', weights: ['400', '700'] },
        { family: dna.typography?.bodyFont    || 'sans-serif', usage: 'body',     weights: ['400', '500'] },
      ],
      // Use locally saved images; fall back to original URLs if download failed
      images: localImageUrls.length > 0 ? localImageUrls : rawImages,
    };

    update({
      business_name:    dna.brandName    || 'Unknown',
      scraped_data: {
        url: websiteUrl,
        content: { title: dna.brandName || '', description: dna.businessOverview || '' },
        images: rawImages.map((url: string) => ({ url, alt: '' })),
      },
      enriched_data:    enrichedData,
      brand_guidelines: brandGuidelines,
      brand_memory: {
        visual_identity:  dna.visual_identity  || {},
        brand_voice:      dna.brand_voice      || {},
        content_patterns: dna.content_patterns || {},
      },
      business_profile: docs.businessProfile || '',
      market_research:  docs.marketResearch  || '',
      social_strategy:  docs.strategy        || '',
      status: 'completed',
    });

    console.log(`[pipeline] ✅ Completed for ${dna.brandName} (${businessId})`);
  } catch (err: any) {
    console.error(`[pipeline] ❌ Failed:`, err.message);
    localDb.update(businessId, { status: 'failed', error_message: err.message });
  }
}
