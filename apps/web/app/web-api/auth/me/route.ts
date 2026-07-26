import { NextResponse } from 'next/server';
import { getAuthApiBaseUrl } from '@/lib/auth';

export async function GET(request: Request) {
  const response = await fetch(`${getAuthApiBaseUrl()}/api/auth/me`, {
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  });

  const payload = (await response.json()) as unknown;
  return NextResponse.json(payload, { status: response.status });
}
