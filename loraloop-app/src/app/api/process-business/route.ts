import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

const mockSupabase = {
  from: () => ({
    insert: (arr: any[]) => ({ select: () => ({ single: async () => localDb.insert(arr[0]) }) }),
    update: (obj: any) => ({ eq: async (field: string, val: string) => localDb.update(val, obj) })
  })
};

export async function POST(req: Request) {
  try {
    const { url, businessName } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const supabase = mockSupabase;
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const hostName = businessName || new URL(normalizedUrl).hostname.replace('www.', '');

    // Step 1: Insert the business row
    const { data, error } = await supabase
      .from('businesses')
      .insert([
        {
          business_name: hostName,
          website: normalizedUrl,
          status: 'scraping',
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const businessId = data.id;

    // Step 2: Kick off the pipeline asynchronously using the existing extract-dna route
    // We call it internally via fetch to localhost
    const origin = req.headers.get('origin') || req.headers.get('host') || 'localhost:3000';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const baseUrl = origin.startsWith('http') ? origin : `${protocol}://${origin}`;

    // Fire and forget — don't await
    runPipeline(baseUrl, normalizedUrl, businessId, supabase).catch((err) => {
      console.error("[process-business] Pipeline error:", err);
    });

    return NextResponse.json({ success: true, businessId });
    
  } catch (error: any) {
    console.error("Internal API error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runPipeline(baseUrl: string, websiteUrl: string, businessId: string, supabase: any) {
  try {
    // Call the existing extract-dna endpoint which does the heavy lifting
    console.log(`[pipeline] Starting for ${websiteUrl} (business: ${businessId})`);
    
    await supabase.from('businesses').update({ status: 'scraping' }).eq('id', businessId);

    const response = await fetch(`${baseUrl}/api/extract-dna`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: websiteUrl }),
    });

    if (!response.ok) {
      throw new Error(`extract-dna returned ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.dna) {
      throw new Error('No DNA returned from extraction');
    }

    // Update status to enriching
    await supabase.from('businesses').update({ status: 'enriching' }).eq('id', businessId);

    const dna = result.dna;
    const docs = result.documents || {};

    // Map the DNA to our schema
    const enrichedData = {
      businessOverview: dna.businessOverview || '',
      brandValues: dna.brandValue ? dna.brandValue.split(',').map((v: string) => v.trim()) : [],
      brandAesthetic: dna.brandAesthetic || '',
      brandTone: dna.toneOfVoice || '',
      tagline: dna.tagline || '',
      enrichedAt: new Date().toISOString(),
    };

    const brandGuidelines = {
      colors: [
        { name: 'Primary', hex: dna.colors?.primary || '#333333', usage: 'primary' },
        { name: 'Secondary', hex: dna.colors?.secondary || '#666666', usage: 'secondary' },
        { name: 'Background', hex: dna.colors?.background || '#FFFFFF', usage: 'background' },
        { name: 'Accent', hex: dna.colors?.accent || '#0066ff', usage: 'accent' },
      ],
      logos: dna.logoUrl ? [{ url: dna.logoUrl, type: 'primary', description: 'Main logo' }] : [],
      typography: [
        { family: dna.typography?.headingFont || 'Inter', usage: 'headings', weights: ['400', '700'] },
        { family: dna.typography?.bodyFont || 'Inter', usage: 'body', weights: ['400', '500'] },
      ],
      images: dna.images || [],
    };

    const scrapedData = {
      url: websiteUrl,
      content: {
        title: dna.brandName || '',
        description: dna.businessOverview || '',
        headings: [],
        paragraphs: [],
      },
      images: (dna.images || []).map((url: string) => ({ url, alt: '' })),
      metadata: {},
    };

    // Update status to generating
    await supabase.from('businesses').update({ status: 'generating' }).eq('id', businessId);

    // Save everything
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        business_name: dna.brandName || 'Unknown',
        scraped_data: scrapedData,
        enriched_data: enrichedData,
        brand_guidelines: brandGuidelines,
        business_profile: docs.businessProfile || 'No business profile generated.',
        market_research: docs.marketResearch || 'No market research generated.',
        social_strategy: docs.strategy || 'No social strategy generated.',
        status: 'completed',
      })
      .eq('id', businessId);

    if (updateError) {
      throw updateError;
    }

    console.log(`[pipeline] ✅ Completed for ${dna.brandName} (${businessId})`);

  } catch (err: any) {
    console.error(`[pipeline] ❌ Failed:`, err.message);
    await supabase
      .from('businesses')
      .update({ status: 'failed', error_message: err.message })
      .eq('id', businessId);
  }
}
