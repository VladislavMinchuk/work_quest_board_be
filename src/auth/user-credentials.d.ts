import { AuthUser } from '../board/types/board.types';
export interface UserAccount extends AuthUser {
    passwordHash: string;
}
export declare const USERS_DATABASE: Record<string, UserAccount>;
