import { NextResponse } from 'next/server';
import {
  AUTH_PLATFORM_HEADER,
  getAuthApiBaseUrl,
  WEB_AUTH_PLATFORM,
} from '@/lib/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const redirectUri = `${origin}/auth/callback`;
  const startUrl = new URL(`${getAuthApiBaseUrl()}/api/external-auth/google`);

  startUrl.searchParams.set('redirectUri', redirectUri);

  const response = await fetch(startUrl, {
    headers: {
      [AUTH_PLATFORM_HEADER]: WEB_AUTH_PLATFORM,
    },
    redirect: 'manual',
    cache: 'no-store',
  });

  const location = response.headers.get('location');

  if (location) {
    return NextResponse.redirect(location, { status: response.status });
  }

  return NextResponse.json(await response.json(), { status: response.status });
}
