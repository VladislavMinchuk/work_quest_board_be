import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USERS_DATABASE } from './user-credentials';
import { AuthUser } from '../board/types/board.types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(email: string, pass: string) {
    const user = USERS_DATABASE[email];
    
    const isPasswordValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isPasswordValid) {
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