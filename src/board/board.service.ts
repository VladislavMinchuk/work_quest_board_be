import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import {
  CellData,
  AuthUser,
  StandardLocationTasks,
  P6LocationTasks,
  LocationKey,
} from './types/board.types';
import { parseAndValidatePeriod, validateParticipantAndLocation, validateTaskAndValue } from './utils/board-validation.util';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);
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
      notes: '',
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: 'System',
    };

    const defaultP6: P6LocationTasks = {
      scrapping: 'not_started',
      menu_reqs: 'not_started',
      write_off_act: 'not_started',
      notes: '',
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: 'System',
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

  // Отримати весь борд (288 комірок) з обробкою збоїв Redis
  async getFullBoard(): Promise<Record<string, CellData>> {
    let rawData: Record<string, CellData> | null = null;

    try {
      rawData = await this.redisService.hgetall<Record<string, CellData>>(
        this.REDIS_HASH_KEY,
      );
    } catch (error) {
      // Якщо Redis недоступний, логуємо помилку і продовжуємо з порожнім об'єктом,
      // щоб згенерувати дефолтну матрицю без "падіння" сервера
      this.logger.error('Помилка при зчитуванні матриці з Redis:', error);
    }
    
    // if (!rawData || Object.keys(rawData).length === 0) {
    //   this.logger.error('Помилка при зчитуванні матриці з Redis:', rawData);
    //   throw new InternalServerErrorException('Не вдалося сформувати дані дошки');
    // }
    
    const fullBoard: Record<string, CellData> = {};
    const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    
    try {
      for (let month = 1; month <= 12; month++) {
        for (let week = 1; week <= 4; week++) {
          const periodId = `${month}.${week}`;
          for (const pId of participants) {
            const key = `${periodId}_${pId}`;
            fullBoard[key] = (rawData && rawData[key]) || this.getDefaultCell(pId);
          }
        }
      }
      return fullBoard;
    } catch (error) {
      this.logger.error('Помилка формування масиву борду:', error);
      throw new InternalServerErrorException('Не вдалося сформувати дані дошки');
    }
  }

  // Скидання борду (Доступно тільки ADMIN)
  async resetBoard(user: AuthUser): Promise<Record<string, CellData>> {
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Тільки Адміністратор може скинути борд');
    }

    try {
      await this.redisService.del(this.REDIS_HASH_KEY);
    } catch (error) {
      this.logger.error('Помилка видалення ключа Redis під час скидання:', error);
      throw new InternalServerErrorException(
        'Не вдалося очистити кеш дошки в Redis',
      );
    }

    return this.getFullBoard();
  }

  // Мутація конкретного завдання
  async updateTask(
    user: AuthUser,
    periodId: string,
    participantId: string,
    location: LocationKey,
    taskKey: string,
    value: string,
    notes?: string,
    updatedAt?: string,
    updatedBy?: string
  ): Promise<CellData> {
    // 1. Авторизація та RBAC
    if (!user) {
      throw new ForbiddenException('Неавторизований користувач');
    }

    if (user.role === 'viewer') {
      throw new ForbiddenException('Глядачі не мають прав для редагування');
    }

    if (user.role === 'editor' && user.participantId !== participantId) {
      throw new ForbiddenException(
        `Ви можете редагувати тільки власні комірки (${user.participantId})`,
      );
    }
    
    validateTaskAndValue(taskKey, value);
    
    const validatePeriodId = parseAndValidatePeriod(periodId);

    // 2. Валідація бізнес-правил та локацій
    validateParticipantAndLocation(participantId, location);

    const cellKey = `${validatePeriodId}_${participantId}`;
    let cell: CellData | null = null;

    // 3. Зчитування поточного стану з Redis
    try {
      cell = await this.redisService.hget<CellData>(
        this.REDIS_HASH_KEY,
        cellKey,
      );
    } catch (error) {
      this.logger.error(`Помилка під час hget для комірки ${cellKey}:`, error);
      // Спадкова деградація: формуємо структуру за замовчуванням
      cell = null;
    }

    if (!cell) {
      cell = this.getDefaultCell(participantId);
    }

    // 4. Модифікація та перевірка наявності таски
    if (!cell[location]) {
      throw new BadRequestException(
        `Локація "${location}" відсутня для комірки ${cellKey}`,
      );
    }

    if (!(taskKey in cell[location])) {
      throw new BadRequestException(
        `Завдання "${taskKey}" відсутнє в локації "${location}" для ${participantId}`,
      );
    }

    cell[location][taskKey] = value;
    cell[location].updatedAt = new Date().toISOString().split('T')[0];
    cell[location].updatedBy = user.name || 'Unknown';

    // 5. Запис у Redis
    try {
      await this.redisService.hset(this.REDIS_HASH_KEY, cellKey, cell);
    } catch (error) {
      this.logger.error(`Помилка запису оновлень у Redis для ${cellKey}:`, error);
      throw new InternalServerErrorException(
        'Не вдалося зберегти нові дані у кеш. Спробуйте ще раз.',
      );
    }

    return cell;
  }
  
  // Створення чистої дефолтної матриці в Redis (Тільки ADMIN)
  async seedDefaultBoard(user: AuthUser): Promise<{ message: string; count: number }> {
    // 1. Перевірка ролі користувача
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Тільки Адміністратор може ініціалізувати дефолтний борд');
    }

    const participants = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    const defaultData: Record<string, string> = {};
    let totalCells = 0;

    // 2. Генерація 288 дефолтних комірок (12 місяців * 4 тижні * 6 учасників)
    for (let month = 1; month <= 12; month++) {
      for (let week = 1; week <= 4; week++) {
        const periodId = `${month}.${week}`;
        for (const pId of participants) {
          const key = `${periodId}_${pId}`;
          const cellData = this.getDefaultCell(pId);
          defaultData[key] = JSON.stringify(cellData);
          totalCells++;
        }
      }
    }

    try {
      // 3. Очищаємо стару матрицю та заново заповнюємо за один крок
      await this.redisService.del(this.REDIS_HASH_KEY);

      // Записуємо всі 288 комірок у Redis Hash
      for (const [key, value] of Object.entries(defaultData)) {
        await this.redisService.hset(this.REDIS_HASH_KEY, key, JSON.parse(value));
      }

      this.logger.log(`Адміністратор ${user.name || user.participantId} створив новий дефолтний борд (${totalCells} комірок).`);

      return {
        message: 'Чистий дефолтний борд успішно створено в Redis',
        count: totalCells,
      };
    } catch (error) {
      this.logger.error('Помилка при збереженні дефолтного борду в Redis:', error);
      throw new InternalServerErrorException('Не вдалося ініціалізувати дефолтний борд у кеші');
    }
  }
}