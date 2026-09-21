import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoardService } from './board.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser, LocationKey, PresenceUser } from './types/board.types';

@WebSocketGateway({
  path: '/ws',
  cors: { origin: process.env.FRONTEND_URL || '*' },
})
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Мапа для збереження активних користувачів у пам'яті сервера (Presence)
  private activeSessions = new Map<string, { user: AuthUser; socketId: string; lastSeen: number }>();

  constructor(
    private readonly boardService: BoardService,
    private readonly authService: AuthService,
  ) {}
  
  // Викликається автоматично при КОЖНОМУ новому підключенні
  async handleConnection(client: Socket) {
    try {
      // 1. Отримуємо токен з handshake.auth або headers
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!token) {
        client.emit('ERROR', { message: 'Токен авторизації відсутній!' });
        return client.disconnect();
      }

      // 2. Декодуємо та перевіряємо токен
      const user = this.authService.verifyToken(token);

      // 3. ЗБЕРІГАЄМО користувача у даній сокет-сесії
      client.data.user = user;

      // 4. Додаємо до списку онлайн-користувачів
      this.activeSessions.set(client.id, {
        user,
        socketId: client.id,
        lastSeen: Date.now(),
      });

      this.broadcastPresence();
      
      this.handleSeedDefaultBoard(client);
    } catch (error) {
      client.emit('ERROR', { message: 'Недійсний токен!' });
      
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.activeSessions.delete(client.id);
    this.broadcastPresence();
  }

  private broadcastPresence() {
    const presenceList: PresenceUser[] = Array.from(this.activeSessions.values()).map(
      (s) => ({
        userId: s.user.id,
        name: s.user.name,
        role: s.user.role,
        participantId: s.user.participantId,
        color: s.user.avatarColor || 'bg-emerald-600',
        lastSeen: s.lastSeen,
      }),
    );

    this.server.emit('PRESENCE_UPDATE', { activeUsers: presenceList });
  }

  // Клієнт -> Сервер: Оновлення статусу завдання
  @SubscribeMessage('UPDATE_TASK')
  async handleUpdateTask(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      periodId: string;
      participantId: string;
      location: LocationKey;
      taskKey: string;
      value: string;
      notes?: string;
      updatedAt: string;
      updatedBy: string;
    },
  ) {
    
    const user: AuthUser = client.data.user;

    if (!user) {
      return client.emit('ERROR', { message: 'Неавторизоване підключення' });
    }

    try {
      // Оновлюємо стейт в сервісі з перевіркою RBAC та записом в Upstash Redis
      await this.boardService.updateTask(
        user,
        payload.periodId,
        payload.participantId,
        payload.location,
        payload.taskKey,
        payload.value,
        payload.notes,
        payload.updatedAt,
        payload.updatedBy
      );

      // 3. Сервер -> Усім клієнтам: Сповіщення про оновлення
      this.server.emit('TASK_UPDATED', {
        periodId: payload.periodId,
        participantId: payload.participantId,
        location: payload.location,
        taskKey: payload.taskKey,
        value: payload.value,
        notes: payload.notes,
        updatedAt: payload.updatedAt,
        updatedBy: user.id,
        updatedByName: user.name,
        timestamp: Date.now(),
      });
    } catch (error) {
      client.emit('ERROR', {
        message: error instanceof Error ? error.message : 'Помилка оновлення',
      });
    }
  }
  
  @SubscribeMessage('BOARD_STATE')
  async handleSeedDefaultBoard(@ConnectedSocket() client: Socket) {
    const user: AuthUser = client.data.user;

    try {
      // Отримуємо оновлену матрицю та розсилаємо ВСІМ підключеним клієнтам
      const fullBoard = await this.boardService.getFullBoard();
      this.server.emit('BOARD_MUTATED', fullBoard);

      return { status: 'ok', ...fullBoard };
    } catch (error) {
      client.emit('ERROR', {
        event: 'BOARD_STATE',
        message: error instanceof Error ? error.message : 'Помилка при отриманні стану борду',
      });
    }
  }
}