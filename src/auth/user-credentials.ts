import { AuthUser } from '../board/types/board.types';

export interface UserAccount extends AuthUser {
  passwordHash: string; // У продакшні використовувати bcrypt
}

export const USERS_DATABASE: Record<string, UserAccount> = {
  'admin@workquest.ua': {
    id: 'user_admin',
    name: 'Адміністратор',
    email: 'admin@workquest.ua',
    role: 'admin',
    passwordHash: '$2a$12$tcn63iKAK6j3kVYz8YHYIeNCbxbm6/Bh61Ei0QWIwOfKhJkNQyLla', // 12
    avatarColor: 'from-amber-500 to-red-600',
    avatarIcon: 'ShieldAlert',
  },
  'p1@workquest.ua': {
    id: 'user_p1',
    name: 'Олександр К.',
    email: 'p1@workquest.ua',
    role: 'editor',
    participantId: 'p1',
    passwordHash: '$2a$12$hkydaOWYO6H4aaAkRHk2eeZChK/yw4nqnN4u5PiuT/n6csTV8IZru',
    avatarColor: 'from-emerald-500 to-teal-600',
    avatarIcon: 'Zap',
  },
  'p2@workquest.ua': {
    id: 'user_p2',
    name: 'Дмитро М.',
    email: 'p2@workquest.ua',
    role: 'editor',
    participantId: 'p2',
    passwordHash: '$2a$12$0hgtvlYUUw78PRpznE533ueMVtALP3xnabAPTrkFaTpQJ/IUCo.9W',
    avatarColor: 'from-blue-500 to-indigo-600',
    avatarIcon: 'Award',
  },
  'p3@workquest.ua': {
    id: 'user_p3',
    name: 'Ірина П.',
    email: 'p3@workquest.ua',
    role: 'editor',
    participantId: 'p3',
    passwordHash: '$2a$12$eZr5czbSj1yjDrH3ABeZMu3MbspNu3SIgAB7Ltws0C87iEUfUqMmm',
    avatarColor: 'from-purple-500 to-pink-600',
    avatarIcon: 'Target',
  },
  'p4@workquest.ua': {
    id: 'user_p4',
    name: 'Сергій Т.',
    email: 'p4@workquest.ua',
    role: 'editor',
    participantId: 'p4',
    passwordHash: '$2a$12$DLxi16Nks3hTPsCCT2Gksu5NFmpiIAwsJkeaUJHZYcof7mqhCOIra',
    avatarColor: 'from-orange-500 to-amber-600',
    avatarIcon: 'Activity',
  },
  'p5@workquest.ua': {
    id: 'user_p5',
    name: 'Анна В.',
    email: 'p5@workquest.ua',
    role: 'editor',
    participantId: 'p5',
    passwordHash: '$2a$12$y/twcR.ecZVoucZXXbr/mOFVhPhhbmU3Fuj3YX1MrYC9tfP5Sl07q',
    avatarColor: 'from-cyan-500 to-blue-600',
    avatarIcon: 'CheckCircle2',
  },
  'p6@workquest.ua': {
    id: 'user_p6',
    name: 'Михайло Б.',
    email: 'p6@workquest.ua',
    role: 'editor',
    participantId: 'p6',
    passwordHash: '$2a$12$0aWQV/JxBEkrKrk.I4OIJO04F2/mV7OJ0K.ndoJitmDOIbUoWewD2',
    avatarColor: 'from-violet-500 to-purple-600',
    avatarIcon: 'FileText',
  },
  'viewer@workquest.ua': {
    id: 'user_viewer',
    name: 'Глядач',
    email: 'viewer@workquest.ua',
    role: 'viewer',
    passwordHash: '$2a$12$nUKi7PAlzUKdmEExC.yXTOX8U/eOHOSpMKxs8vCO.vWj7fNkRJm9G',
    avatarColor: 'from-slate-500 to-gray-600',
    avatarIcon: 'Eye',
  },
};