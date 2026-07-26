import { NextResponse } from 'next/server';
import {
  AUTH_PLATFORM_HEADER,
  getAuthApiBaseUrl,
  WEB_AUTH_PLATFORM,
} from '@/lib/auth';
import { appendAuthApiSetCookies } from '@/lib/server-auth';

interface ExchangeRequestBody {
  code?: string;
}

export async function POST(request: Request) {
  let body: ExchangeRequestBody;

  try {
    body = (await request.json()) as ExchangeRequestBody;
  } catch {
    return NextResponse.json(
      { message: 'Invalid request body.' },
      { status: 400 },
    );
  }

  if (!body.code) {
    return NextResponse.json({ message: 'Missing code.' }, { status: 400 });
  }

  const response = await fetch(
    `${getAuthApiBaseUrl()}/api/external-auth/exchange`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [AUTH_PLATFORM_HEADER]: WEB_AUTH_PLATFORM,
      },
      body: JSON.stringify({ code: body.code }),
      cache: 'no-store',
    },
  );

  const payload = (await response.json()) as unknown;
  const nextResponse = NextResponse.json(payload, { status: response.status });
  appendAuthApiSetCookies(response, nextResponse);
  return nextResponse;
}
