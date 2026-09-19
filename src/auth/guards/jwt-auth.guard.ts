import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USERS_DATABASE } from '../user-credentials';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Токен авторизації відсутній або має невірний формат');
    }

    const token = authHeader.split(' ')[1];

    try {
      // 1. Перевіряємо підпис та валідність токена
      const payload = await this.jwtService.verifyAsync(token);

      // 2. Шукаємо користувача в USERS_DATABASE за email або id з payload
      const foundUser = Object.values(USERS_DATABASE).find(
        (u) => u.email === payload.email || u.id === payload.sub,
      );

      if (!foundUser) {
        throw new UnauthorizedException('Користувача з цього токена не знайдено');
      }

      // 3. Записуємо користувача в об'єкт запиту для Controllers / Services
      request.user = { ...foundUser };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Недійсний або прострочений токен');
    }
  }
}