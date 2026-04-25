import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

const ALLOWED_FIELDS = ['business_profile', 'market_research', 'social_strategy', 'enriched_data', 'brand_guidelines', 'brand_memory'];

export async function PUT(req: Request) {
  try {
    const { id, field, content } = await req.json();

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    if (!field || !ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ error: `field must be one of: ${ALLOWED_FIELDS.join(', ')}` }, { status: 400 });
    }

    const { error } = localDb.update(id, { [field]: content ?? null });

    if (error) {
      console.error('[update-business]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
