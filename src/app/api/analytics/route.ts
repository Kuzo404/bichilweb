import { NextResponse } from 'next/server';

const DJANGO_API = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${DJANGO_API}/analytics/track/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok' });
  } catch {
    // Silently fail - analytics should not break the site
    return NextResponse.json({ status: 'ok' });
  }
}
