import { NextResponse } from 'next/server';
import {
  AUTH_PLATFORM_HEADER,
  getAuthApiBaseUrl,
  WEB_AUTH_PLATFORM,
} from '@/lib/auth';
import { appendAuthApiSetCookies } from '@/lib/server-auth';

export async function POST(request: Request) {
  const response = await fetch(`${getAuthApiBaseUrl()}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      cookie: request.headers.get('cookie') ?? '',
      [AUTH_PLATFORM_HEADER]: WEB_AUTH_PLATFORM,
    },
    body: '{}',
    cache: 'no-store',
  });

  const payload = (await response.json()) as unknown;
  const nextResponse = NextResponse.json(payload, { status: response.status });
  appendAuthApiSetCookies(response, nextResponse);
  return nextResponse;
}
