import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { USERS_DATABASE } from '../user-credentials';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    // Отримуємо токен з handshake.auth або з заголовка
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new WsException('Необхідна авторизація. Токен відсутній');
    }

    try {
      // 1. Декодуємо та валідуємо токен
      const payload = await this.jwtService.verifyAsync(token);
      
      console.log('Payload from token:', payload);

      // 2. Знаходимо обліковий запис у USERS_DATABASE
      const foundUser = Object.values(USERS_DATABASE).find(
        (u) => u.email === payload.email || u.id === payload.sub,
      );

      if (!foundUser) {
        throw new WsException('Користувача не знайдено');
      }

      // 3. Зберігаємо користувача в даній сокет-сесії
      client.data.user = { ...foundUser };
      return true;
    } catch (error) {
      throw new WsException('Недійсний або прострочений токен');
    }
  }
}