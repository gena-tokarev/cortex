import { ServiceUnavailableException } from '@nestjs/common';
import type { RedisService } from '../../common/redis/redis.service';
import type { PrismaService } from '../../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const queryRaw = jest.fn();
  const ping = jest.fn();
  const prisma = {
    $queryRaw: queryRaw,
  } as unknown as PrismaService;
  const redis = {
    getClient: () => ({ ping }),
  } as unknown as RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok when Postgres and Redis are reachable', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    ping.mockResolvedValue('PONG');

    await expect(
      new HealthController(prisma, redis).check(),
    ).resolves.toEqual({ status: 'ok' });
  });

  it('returns a generic unavailable response when a dependency fails', async () => {
    queryRaw.mockRejectedValue(new Error('database connection failed'));
    ping.mockResolvedValue('PONG');

    await expect(
      new HealthController(prisma, redis).check(),
    ).rejects.toEqual(
      new ServiceUnavailableException({ status: 'unavailable' }),
    );
  });
});
