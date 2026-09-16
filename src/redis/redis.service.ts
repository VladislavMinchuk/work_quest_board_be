import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      url: this.configService.get<string>('UPSTASH_REDIS_REST_URL'),
      token: this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    return (await this.client.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.client.set(key, value);
  }

  async hget<T>(hashKey: string, field: string): Promise<T | null> {
    return (await this.client.hget<T>(hashKey, field)) ?? null;
  }

  async hgetall<T extends Record<string, any>>(hashKey: string): Promise<T> {
    const data = await this.client.hgetall(hashKey);
    return (data as T) || ({} as T);
  }

  async hset<T>(hashKey: string, field: string, value: T): Promise<void> {
    await this.client.hset(hashKey, { [field]: value });
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}