import { JwtService } from '@nestjs/jwt';
import { AuthUser } from '../board/types/board.types';
export declare class AuthService {
    private readonly jwtService;
    constructor(jwtService: JwtService);
    login(email: string, pass: string): Promise<{
        token: string;
        user: AuthUser;
    }>;
    verifyToken(token: string): any;
}
