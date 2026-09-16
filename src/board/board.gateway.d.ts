import { OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BoardService } from './board.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from './types/board.types';
export declare class BoardGateway implements OnGatewayDisconnect {
    private readonly boardService;
    private readonly authService;
    server: Server;
    private activeSessions;
    constructor(boardService: BoardService, authService: AuthService);
    handleDisconnect(client: Socket): void;
    private broadcastPresence;
    handleAuth(client: Socket, payload: {
        token: string;
        user: AuthUser;
    }): Promise<{
        status: string;
    } | undefined>;
    handleUpdateTask(client: Socket, payload: {
        periodId: string;
        participantId: string;
        location: 'ppd' | 'field';
        taskKey: string;
        value: string;
        updatedBy: string;
    }): Promise<boolean | undefined>;
}
