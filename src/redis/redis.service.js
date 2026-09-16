"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("@upstash/redis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.client = new redis_1.Redis({
            url: this.configService.get('UPSTASH_REDIS_REST_URL'),
            token: this.configService.get('UPSTASH_REDIS_REST_TOKEN'),
        });
    }
    async get(key) {
        return (await this.client.get(key)) ?? null;
    }
    async set(key, value) {
        await this.client.set(key, value);
    }
    async hget(hashKey, field) {
        return (await this.client.hget(hashKey, field)) ?? null;
    }
    async hgetall(hashKey) {
        const data = await this.client.hgetall(hashKey);
        return data || {};
    }
    async hset(hashKey, field, value) {
        await this.client.hset(hashKey, { [field]: value });
    }
    async del(key) {
        await this.client.del(key);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map