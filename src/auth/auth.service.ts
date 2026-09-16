import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USERS_DATABASE } from './user-credentials';
import { AuthUser } from '../board/types/board.types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, pass: string) {
    const user = USERS_DATABASE[email];
    
    // Перевірка пароля (для редакторів p1-p6 за замовчуванням пароль дорівнює їх email або загальному ключу, для Адміна: Prod++tt)
    const expectedPassword = user?.passwordHash || 'WorkQuest2026';

    if (!user || pass !== expectedPassword) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      participantId: user.participantId,
      name: user.name,
    };

    const { passwordHash, ...userProfile } = user;

    return {
      token: this.jwtService.sign(payload),
      user: userProfile as AuthUser,
    };
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token);
  }
}