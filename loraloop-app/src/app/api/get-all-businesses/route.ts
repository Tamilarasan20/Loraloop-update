import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allRecords = localDb.getAll();
    const businesses = Object.values(allRecords)
      .map((b: any) => ({
        id: b.id,
        business_name: b.business_name,
        website: b.website,
        created_at: b.created_at || new Date().toISOString(),
        status: b.status,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ businesses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
