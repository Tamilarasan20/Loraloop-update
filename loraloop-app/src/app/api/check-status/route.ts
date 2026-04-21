import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
  }

  const data = localDb.get(id);
  const error = !data ? new Error('Not found') : null;

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
