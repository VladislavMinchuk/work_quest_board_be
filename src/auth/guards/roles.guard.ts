import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../roles.decorator';
import { USERS_DATABASE, UserAccount } from '../user-credentials';
import { AuthUser } from '../../board/types/board.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Отримуємо список дозволених ролей з метаданих @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Якщо біля ендпоінту немає декоратора @Roles(), пропускаємо далі
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Витягуємо об'єкт користувача з сесії (HTTP або WS)
    let userFromContext: Partial<AuthUser> | undefined;

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      userFromContext = request.user;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      userFromContext = client.data?.user;
    }

    if (!userFromContext) {
      throw new UnauthorizedException('Неавторизований доступ. Користувача не знайдено');
    }

    // 3. Знаходимо повні дані користувача в USERS_DATABASE за email або id
    const foundUser = Object.values(USERS_DATABASE).find(
      (u: UserAccount) =>
        (userFromContext.email && u.email === userFromContext.email) ||
        (userFromContext.id && u.id === userFromContext.id),
    );

    // Беремо роль з бази даних або з контексту авторизації
    const userRole = foundUser?.role || userFromContext.role;

    if (!userRole) {
      throw new ForbiddenException('Не вдалося визначити роль користувача');
    }

    // 4. Перевіряємо, чи належить роль користувача до дозволених
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Доступ заборонено. Необхідні ролі: [${requiredRoles.join(', ')}]. Ваша роль: ${userRole}`,
      );
    }

    // Зберігаємо актуальні дані користувача з бази в контексті для подальшого використання у controllers/gateways
    if (foundUser) {
      if (context.getType() === 'http') {
        const request = context.switchToHttp().getRequest();
        request.user = { ...foundUser };
      } else if (context.getType() === 'ws') {
        const client = context.switchToWs().getClient();
        client.data.user = { ...foundUser };
      }
    }

    return true;
  }
}