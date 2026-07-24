import axios from 'axios';
import {
  cleanupAuthFixtureUsers,
  createAuthFixtureUser,
} from '../support/fixtures';

const EMAIL_FIXTURE_PREFIX = 'e2e-email';

describe('Email and Token Auth API flow', () => {
  beforeEach(async () => {
    await cleanupAuthFixtureUsers(EMAIL_FIXTURE_PREFIX);
  });

  afterAll(async () => {
    await cleanupAuthFixtureUsers(EMAIL_FIXTURE_PREFIX);
  });

  it('should login, return profile, rotate refresh token, and reject revoked refresh token', async () => {
    const fixtureUser = await createAuthFixtureUser(EMAIL_FIXTURE_PREFIX);

    const login = await axios.post(
      '/api/auth/email/login',
      {
        email: fixtureUser.email,
        password: fixtureUser.password,
      },
      {
        headers: {
          'x-auth-platform': 'native',
        },
      },
    );

    expect(login.status).toBe(201);
    expect(login.data.user.email).toBe(fixtureUser.email);
    expect(login.data.tokens.accessToken).toEqual(expect.any(String));
    expect(login.data.tokens.refreshToken).toEqual(expect.any(String));

    const accessToken = login.data.tokens.accessToken as string;
    const initialRefreshToken = login.data.tokens.refreshToken as string;

    const me = await axios.get('/api/auth/me', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    expect(me.status).toBe(200);
    expect(me.data.user.email).toBe(fixtureUser.email);

    const meWithoutToken = await axios.get('/api/auth/me', {
      validateStatus: () => true,
    });
    expect(meWithoutToken.status).toBe(401);
    expect(meWithoutToken.data.code).toBe('AUTH_MISSING_BEARER_TOKEN');

    const adminHealth = await axios.get('/api/auth/admin/health', {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });
    expect(adminHealth.status).toBe(200);
    expect(adminHealth.data).toEqual({ status: 'ok' });

    const refreshed = await axios.post(
      '/api/auth/refresh',
      {
        refreshToken: initialRefreshToken,
      },
      {
        headers: {
          'x-auth-platform': 'native',
        },
      },
    );

    expect(refreshed.status).toBe(201);
    expect(refreshed.data.tokens.accessToken).toEqual(expect.any(String));
    expect(refreshed.data.tokens.refreshToken).toEqual(expect.any(String));
    expect(refreshed.data.tokens.refreshToken).not.toBe(initialRefreshToken);

    const rotatedRefreshToken = refreshed.data.tokens.refreshToken as string;

    const logout = await axios.post(
      '/api/auth/logout',
      {
        refreshToken: rotatedRefreshToken,
      },
      {
        headers: {
          'x-auth-platform': 'native',
        },
      },
    );
    expect(logout.status).toBe(200);
    expect(logout.data).toEqual({ success: true });

    const refreshAfterLogout = await axios.post(
      '/api/auth/refresh',
      {
        refreshToken: rotatedRefreshToken,
      },
      {
        headers: {
          'x-auth-platform': 'native',
        },
        validateStatus: () => true,
      },
    );

    expect(refreshAfterLogout.status).toBe(401);
    expect(refreshAfterLogout.data.code).toBe('AUTH_INVALID_REFRESH_TOKEN');
  });

  it('should create a cookie session for web and use it for me, refresh, and logout', async () => {
    const fixtureUser = await createAuthFixtureUser(EMAIL_FIXTURE_PREFIX);

    const login = await axios.post(
      '/api/auth/email/login',
      {
        email: fixtureUser.email,
        password: fixtureUser.password,
      },
      {
        headers: {
          'x-auth-platform': 'web',
        },
      },
    );

    expect(login.status).toBe(201);
    expect(login.data.user.email).toBe(fixtureUser.email);
    expect(login.data.tokens).toBeUndefined();

    const setCookieHeaders = login.headers['set-cookie'] ?? [];
    expect(setCookieHeaders.length).toBeGreaterThanOrEqual(2);

    const cookieHeader = setCookieHeaders
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

    const me = await axios.get('/api/auth/me', {
      headers: {
        cookie: cookieHeader,
      },
    });

    expect(me.status).toBe(200);
    expect(me.data.user.email).toBe(fixtureUser.email);

    const refreshed = await axios.post(
      '/api/auth/refresh',
      {},
      {
        headers: {
          cookie: cookieHeader,
          'x-auth-platform': 'web',
        },
      },
    );

    expect(refreshed.status).toBe(201);
    expect(refreshed.data.tokens).toBeUndefined();

    const refreshedCookies = refreshed.headers['set-cookie'] ?? [];
    expect(refreshedCookies.length).toBeGreaterThanOrEqual(2);

    const rotatedCookieHeader = refreshedCookies
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

    const logout = await axios.post(
      '/api/auth/logout',
      {},
      {
        headers: {
          cookie: rotatedCookieHeader,
          'x-auth-platform': 'web',
        },
      },
    );

    expect(logout.status).toBe(200);
    expect(logout.data).toEqual({ success: true });
    expect(logout.headers['set-cookie'] ?? []).toHaveLength(2);

    const refreshAfterLogout = await axios.post(
      '/api/auth/refresh',
      {},
      {
        headers: {
          cookie: rotatedCookieHeader,
          'x-auth-platform': 'web',
        },
        validateStatus: () => true,
      },
    );

    expect(refreshAfterLogout.status).toBe(401);

    const clearedCookieHeader = (logout.headers['set-cookie'] ?? [])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

    const meAfterCookieClear = await axios.get('/api/auth/me', {
      headers: {
        cookie: clearedCookieHeader,
      },
      validateStatus: () => true,
    });

    expect(meAfterCookieClear.status).toBe(401);
  });
});
