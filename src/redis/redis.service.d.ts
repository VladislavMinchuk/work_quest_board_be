import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit {
    private readonly configService;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    hget<T>(hashKey: string, field: string): Promise<T | null>;
    hgetall<T extends Record<string, any>>(hashKey: string): Promise<T>;
    hset<T>(hashKey: string, field: string, value: T): Promise<void>;
    del(key: string): Promise<void>;
}
