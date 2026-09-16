import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoardService } from './board.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser, PresenceUser } from './types/board.types';

@WebSocketGateway({
  path: '/ws',
  cors: { origin: '*' },
})
export class BoardGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Мапа для збереження активних користувачів у пам'яті сервера (Presence)
  private activeSessions = new Map<string, { user: AuthUser; socketId: string; lastSeen: number }>();

  constructor(
    private readonly boardService: BoardService,
    private readonly authService: AuthService,
  ) {}

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

  // 1. Клієнт -> Сервер: Авторизація одразу після відкриття сокета
  @SubscribeMessage('AUTH')
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { token: string; user: AuthUser },
  ) {
    try {
      const decoded = this.authService.verifyToken(payload.token);
      
      // Зберігаємо сесію
      client.data.user = decoded;
      this.activeSessions.set(client.id, {
        user: payload.user || decoded,
        socketId: client.id,
        lastSeen: Date.now(),
      });

      this.broadcastPresence();
      return { status: 'authenticated' };
    } catch (e) {
      client.emit('ERROR', { message: 'Недійсний токен авторизації' });
      client.disconnect();
    }
  }

  // 2. Клієнт -> Сервер: Оновлення статусу завдання
  @SubscribeMessage('UPDATE_TASK')
  async handleUpdateTask(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      periodId: string;
      participantId: string;
      location: 'ppd' | 'field';
      taskKey: string;
      value: string;
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
      );

      // 3. Сервер -> Усім клієнтам: Сповіщення про оновлення
      this.server.emit('TASK_UPDATED', {
        periodId: payload.periodId,
        participantId: payload.participantId,
        location: payload.location,
        taskKey: payload.taskKey,
        value: payload.value,
        updatedBy: user.id,
        updatedByName: user.name,
        timestamp: Date.now(),
      });
    } catch (error) {
      client.emit('ERROR', { message: error.message || 'Помилка оновлення' });
    }
  }
}