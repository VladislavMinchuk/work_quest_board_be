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
exports.BoardService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let BoardService = class BoardService {
    constructor(redisService) {
        this.redisService = redisService;
        this.REDIS_HASH_KEY = 'workquest:board_matrix';
    }
    getDefaultCell(participantId) {
        const defaultStandard = {
            scrapping: 'not_started',
            invoices_breakdown: 'not_started',
            report_card: 'not_started',
            waybills: 'not_started',
            write_off_act: 'not_started',
        };
        const defaultP6 = {
            scrapping: 'not_started',
            menu_reqs: 'not_started',
            write_off_act: 'not_started',
        };
        if (participantId === 'p6') {
            return { ppd: defaultP6 };
        }
        if (participantId === 'p5') {
            return { ppd: defaultStandard };
        }
        return {
            ppd: { ...defaultStandard },
            field: { ...defaultStandard },
        };
    }
    async getFullBoard() {
        const rawData = await this.redisService.hgetall(this.REDIS_HASH_KEY);
        const fullBoard = {};
        const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
        for (let month = 1; month <= 12; month++) {
            for (let week = 1; week <= 4; week++) {
                const periodId = `${month}.${week}`;
                for (const pId of participants) {
                    const key = `${periodId}_${pId}`;
                    fullBoard[key] = rawData[key] || this.getDefaultCell(pId);
                }
            }
        }
        return fullBoard;
    }
    async resetBoard(user) {
        if (user.role !== 'admin') {
            throw new common_1.ForbiddenException('Тільки Адміністратор може скинути борд');
        }
        await this.redisService.del(this.REDIS_HASH_KEY);
        return this.getFullBoard();
    }
    async updateTask(user, periodId, participantId, location, taskKey, value) {
        if (user.role === 'viewer') {
            throw new common_1.ForbiddenException('Глядачі не мають прав для редагування');
        }
        if (user.role === 'editor' && user.participantId !== participantId) {
            throw new common_1.ForbiddenException(`Ви можете редагувати тільки власні комірки (${user.participantId})`);
        }
        if ((participantId === 'p5' || participantId === 'p6') && location === 'field') {
            throw new common_1.ForbiddenException(`Учасник ${participantId} не має локації "Поле"`);
        }
        const cellKey = `${periodId}_${participantId}`;
        let cell = await this.redisService.hget(this.REDIS_HASH_KEY, cellKey);
        if (!cell) {
            cell = this.getDefaultCell(participantId);
        }
        if (!cell[location]) {
            throw new common_1.ForbiddenException(`Локація ${location} відсутня для цієї комірки`);
        }
        cell[location][taskKey] = value;
        cell.updatedAt = new Date().toISOString().split('T')[0];
        cell.lastUpdatedBy = user.name;
        await this.redisService.hset(this.REDIS_HASH_KEY, cellKey, cell);
        return cell;
    }
};
exports.BoardService = BoardService;
exports.BoardService = BoardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], BoardService);
//# sourceMappingURL=board.service.js.map