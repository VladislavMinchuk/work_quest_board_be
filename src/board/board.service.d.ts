import { RedisService } from '../redis/redis.service';
import { CellData, AuthUser } from './types/board.types';
export declare class BoardService {
    private readonly redisService;
    private readonly REDIS_HASH_KEY;
    constructor(redisService: RedisService);
    private getDefaultCell;
    getFullBoard(): Promise<Record<string, CellData>>;
    resetBoard(user: AuthUser): Promise<Record<string, CellData>>;
    updateTask(user: AuthUser, periodId: string, participantId: string, location: 'ppd' | 'field', taskKey: string, value: string): Promise<CellData>;
}
