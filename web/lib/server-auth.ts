import { NextResponse } from 'next/server';

export function appendAuthApiSetCookies(
  authApiResponse: Response,
  nextResponse: NextResponse,
): void {
  const cookieHeaders = (
    authApiResponse.headers as Headers & {
      getSetCookie?: () => string[];
    }
  ).getSetCookie?.();

  if (cookieHeaders && cookieHeaders.length > 0) {
    for (const cookie of cookieHeaders) {
      nextResponse.headers.append('set-cookie', cookie);
    }

    return;
  }

  const fallbackCookieHeader = authApiResponse.headers.get('set-cookie');

  if (fallbackCookieHeader) {
    nextResponse.headers.append('set-cookie', fallbackCookieHeader);
  }
}
