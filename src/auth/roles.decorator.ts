import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Декоратор для вказування дозволених ролей
 * Приклад: @Roles('admin', 'editor')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);