import { NextResponse } from 'next/server';
import {
  AUTH_PLATFORM_HEADER,
  getAuthApiBaseUrl,
  WEB_AUTH_PLATFORM,
} from '@/lib/auth';

export async function GET(request: Request) {
  const origin = getPublicOrigin(request);
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

function getPublicOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  const forwardedProto = getFirstHeaderValue(
    request.headers.get('x-forwarded-proto'),
  );
  const forwardedHost = getFirstHeaderValue(
    request.headers.get('x-forwarded-host'),
  );

  if (
    !forwardedHost ||
    (forwardedProto !== 'http' && forwardedProto !== 'https')
  ) {
    return requestUrl.origin;
  }

  try {
    return new URL(`${forwardedProto}://${forwardedHost}`).origin;
  } catch {
    return requestUrl.origin;
  }
}

function getFirstHeaderValue(value: string | null): string | null {
  return value?.split(',', 1)[0]?.trim() || null;
}
