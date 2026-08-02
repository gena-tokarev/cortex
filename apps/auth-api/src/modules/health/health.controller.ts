import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await Promise.all([
        this.prisma.$queryRaw`SELECT 1`,
        this.redis.getClient().ping(),
      ]);
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }

    return { status: 'ok' };
  }
}
