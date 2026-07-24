import { BadRequestException } from '@nestjs/common';
import { AuthProvider } from '@prisma/client';
import type { Profile } from 'passport-google-oauth20';
import type { IdentityService } from '../../identity/identity.service';
import type { IdentityUser } from '../../identity/identity.types';
import { GoogleExternalAuthService } from './google-external-auth.service';

describe('GoogleExternalAuthService', () => {
  let identityService: jest.Mocked<IdentityService>;
  let service: GoogleExternalAuthService;

  beforeEach(() => {
    identityService = {
      findUserByIdentity: jest.fn(),
      createUserWithIdentity: jest.fn(),
      normalizeEmail: jest.fn((email: string) => email.toLowerCase().trim()),
    } as unknown as jest.Mocked<IdentityService>;

    service = new GoogleExternalAuthService(identityService);
  });

  it('reuses an existing Google-linked user', async () => {
    const existingUser: IdentityUser = {
      id: 'user-1',
      email: 'existing@focoris.local',
      roles: [],
    };
    const profile = createGoogleProfile({
      id: 'google-user-1',
      emails: [{ value: 'existing@focoris.local', verified: true }],
    });

    identityService.findUserByIdentity.mockResolvedValue(existingUser);

    await expect(service.resolveUser(profile)).resolves.toBe(existingUser);

    expect(identityService.findUserByIdentity).toHaveBeenCalledWith(
      AuthProvider.google,
      'google-user-1',
    );
    expect(identityService.createUserWithIdentity).not.toHaveBeenCalled();
  });

  it('creates a new user from the verified Google email', async () => {
    const createdUser: IdentityUser = {
      id: 'user-2',
      email: 'verified@focoris.local',
      roles: [],
    };
    const profile = createGoogleProfile({
      id: 'google-user-2',
      displayName: 'Verified User',
      emails: [
        { value: 'first@focoris.local', verified: false },
        { value: 'verified@focoris.local', verified: true },
      ],
    });

    identityService.findUserByIdentity.mockResolvedValue(null);
    identityService.createUserWithIdentity.mockResolvedValue(createdUser);

    await expect(service.resolveUser(profile)).resolves.toBe(createdUser);

    expect(identityService.createUserWithIdentity).toHaveBeenCalledWith({
      email: 'verified@focoris.local',
      identity: {
        provider: AuthProvider.google,
        providerUserId: 'google-user-2',
        email: 'verified@focoris.local',
        emailVerified: true,
        displayName: 'Verified User',
      },
    });
  });

  it('rejects a Google profile without any email', async () => {
    const profile = createGoogleProfile({
      id: 'google-user-3',
      emails: [],
    });

    identityService.findUserByIdentity.mockResolvedValue(null);

    await expect(service.resolveUser(profile)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.resolveUser(profile)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: 'AUTH_INVALID_CREDENTIALS',
      }),
    });
  });
});

function createGoogleProfile(input: {
  id: string;
  displayName?: string;
  emails: Array<{ value: string; verified?: boolean }>;
}): Profile {
  return {
    provider: 'google',
    id: input.id,
    displayName: input.displayName ?? 'Google User',
    username: undefined,
    name: undefined,
    emails: input.emails,
    photos: [],
    profileUrl: undefined,
    _raw: '',
    _json: {},
  } as Profile;
}
