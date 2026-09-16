export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  participantId?: string;
  avatarColor?: string;
  avatarIcon?: string;
}

export type ScrappingStatus = 'not_started' | 'in_progress' | 'done';
export type InvoicesBreakdownStatus = 'not_started' | 'in_progress' | 'done';
export type ReportCardStatus = 'not_started' | 'in_progress' | 'done';
export type WaybillsStatus = 'not_started' | 'collecting' | 'on_desk';
export type WriteOffActStatus = 'not_started' | 'in_progress' | 'signed';
export type MenuReqsStatus = 'not_started' | 'in_progress' | 'done';

export type LocationKey = 'ppd' | 'field';

export interface StandardLocationTasks {
  scrapping: ScrappingStatus;
  invoices_breakdown: InvoicesBreakdownStatus;
  report_card: ReportCardStatus;
  waybills: WaybillsStatus;
  write_off_act: WriteOffActStatus;
}

export interface P6LocationTasks {
  scrapping: ScrappingStatus;
  menu_reqs: MenuReqsStatus;
  write_off_act: WriteOffActStatus;
}

export interface CellData {
  ppd: StandardLocationTasks | P6LocationTasks;
  field?: StandardLocationTasks;
  notes?: string;
  updatedAt?: string;
  lastUpdatedBy?: string;
}

export interface PresenceUser {
  userId: string;
  name: string;
  role: UserRole;
  participantId?: string;
  color?: string;
  lastSeen: number;
}