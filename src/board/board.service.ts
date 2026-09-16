import { Injectable, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  CellData,
  AuthUser,
  StandardLocationTasks,
  P6LocationTasks,
} from './types/board.types';

@Injectable()
export class BoardService {
  private readonly REDIS_HASH_KEY = 'workquest:board_matrix';

  constructor(private readonly redisService: RedisService) {}

  // Генерація початкових значень комірки
  private getDefaultCell(participantId: string): CellData {
    const defaultStandard: StandardLocationTasks = {
      scrapping: 'not_started',
      invoices_breakdown: 'not_started',
      report_card: 'not_started',
      waybills: 'not_started',
      write_off_act: 'not_started',
    };

    const defaultP6: P6LocationTasks = {
      scrapping: 'not_started',
      menu_reqs: 'not_started',
      write_off_act: 'not_started',
    };

    // p6: 3 завдання тільки в ППД
    if (participantId === 'p6') {
      return { ppd: defaultP6 };
    }

    // p5: 5 завдань тільки в ППД
    if (participantId === 'p5') {
      return { ppd: defaultStandard };
    }

    // p1..p4: 5 завдань в ППД та 5 у Полі
    return {
      ppd: { ...defaultStandard },
      field: { ...defaultStandard },
    };
  }

  // Отримати весь борд (288 комірок)
  async getFullBoard(): Promise<Record<string, CellData>> {
    const rawData = await this.redisService.hgetall<Record<string, CellData>>(
      this.REDIS_HASH_KEY,
    );

    // Створення повного каркаса, якщо Redis ще порожній
    const fullBoard: Record<string, CellData> = {};
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

  // Скидання борду (Доступно тільки ADMIN)
  async resetBoard(user: AuthUser): Promise<Record<string, CellData>> {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Тільки Адміністратор може скинути борд');
    }
    await this.redisService.del(this.REDIS_HASH_KEY);
    return this.getFullBoard();
  }

  // Мутація конкретного завдання
  async updateTask(
    user: AuthUser,
    periodId: string,
    participantId: string,
    location: 'ppd' | 'field',
    taskKey: string,
    value: string,
  ): Promise<CellData> {
    // 1. RBAC Перевірка
    if (user.role === 'viewer') {
      throw new ForbiddenException('Глядачі не мають прав для редагування');
    }
    if (user.role === 'editor' && user.participantId !== participantId) {
      throw new ForbiddenException(
        `Ви можете редагувати тільки власні комірки (${user.participantId})`,
      );
    }

    // 2. Валідація локацій
    if ((participantId === 'p5' || participantId === 'p6') && location === 'field') {
      throw new ForbiddenException(`Учасник ${participantId} не має локації "Поле"`);
    }

    // 3. Зчитування поточного стану
    const cellKey = `${periodId}_${participantId}`;
    let cell = await this.redisService.hget<CellData>(this.REDIS_HASH_KEY, cellKey);
    if (!cell) {
      cell = this.getDefaultCell(participantId);
    }

    // 4. Оновлення значення
    if (!cell[location]) {
      throw new ForbiddenException(`Локація ${location} відсутня для цієї комірки`);
    }

    cell[location][taskKey] = value;
    cell.updatedAt = new Date().toISOString().split('T')[0];
    cell.lastUpdatedBy = user.name;

    // 5. Фіксація в Upstash Redis
    await this.redisService.hset(this.REDIS_HASH_KEY, cellKey, cell);

    return cell;
  }
}