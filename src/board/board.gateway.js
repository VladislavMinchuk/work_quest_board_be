"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const board_service_1 = require("./board.service");
const auth_service_1 = require("../auth/auth.service");
let BoardGateway = class BoardGateway {
    constructor(boardService, authService) {
        this.boardService = boardService;
        this.authService = authService;
        this.activeSessions = new Map();
    }
    handleDisconnect(client) {
        this.activeSessions.delete(client.id);
        this.broadcastPresence();
    }
    broadcastPresence() {
        const presenceList = Array.from(this.activeSessions.values()).map((s) => ({
            userId: s.user.id,
            name: s.user.name,
            role: s.user.role,
            participantId: s.user.participantId,
            color: s.user.avatarColor || 'bg-emerald-600',
            lastSeen: s.lastSeen,
        }));
        this.server.emit('PRESENCE_UPDATE', { activeUsers: presenceList });
    }
    async handleAuth(client, payload) {
        try {
            const decoded = this.authService.verifyToken(payload.token);
            client.data.user = decoded;
            this.activeSessions.set(client.id, {
                user: payload.user || decoded,
                socketId: client.id,
                lastSeen: Date.now(),
            });
            this.broadcastPresence();
            return { status: 'authenticated' };
        }
        catch (e) {
            client.emit('ERROR', { message: 'Недійсний токен авторизації' });
            client.disconnect();
        }
    }
    async handleUpdateTask(client, payload) {
        const user = client.data.user;
        if (!user) {
            return client.emit('ERROR', { message: 'Неавторизоване підключення' });
        }
        try {
            await this.boardService.updateTask(user, payload.periodId, payload.participantId, payload.location, payload.taskKey, payload.value);
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
        }
        catch (error) {
            client.emit('ERROR', { message: error.message || 'Помилка оновлення' });
        }
    }
};
exports.BoardGateway = BoardGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], BoardGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('AUTH'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BoardGateway.prototype, "handleAuth", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('UPDATE_TASK'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], BoardGateway.prototype, "handleUpdateTask", null);
exports.BoardGateway = BoardGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: '/ws',
        cors: { origin: '*' },
    }),
    __metadata("design:paramtypes", [board_service_1.BoardService,
        auth_service_1.AuthService])
], BoardGateway);
//# sourceMappingURL=board.gateway.js.map