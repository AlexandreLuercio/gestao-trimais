// SYSTEM VERSION
export const APP_VERSION = '1.4.9';

export enum Status {
  Aberto = 'Abertas',
  EmAndamento = 'Em Andamento',
  EmAtraso = 'Em Atraso',
  Concluido = 'Concluídas',
}

export enum Area {
  Manutencao = 'Manutenção',
  Limpeza = 'Limpeza',
  Seguranca = 'Segurança',
  Marketing = 'Marketing',
  Financeiro = 'Financeiro',
  Estacionamento = 'Estacionamento',
  Comercial = 'Comercial',
  Administrativo = 'Administrativo',
  Superintendencia = 'Superintendência',
  Diretoria = 'Diretoria',
}

export enum Role {
  Admin = 'Administrador',
  Diretor = 'Diretor',
  Gestor = 'Gestor',
  Monitor = 'Monitor',
}

export enum Complexity {
  Simples = 'Simples',
  Media = 'Média',
  Alta = 'Alta',
}

export type UserStatus = 'Ativo' | 'Pendente' | 'Bloqueado' | 'Provisorio' | 'Excluido';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  whatsapp?: string;
  role: Role;
  allowedAreas: Area[];
  status: UserStatus;
  invitedBy?: string;
  area?: Area;
}

export interface OccurrenceUpdate {
  text: string;
  timestamp: string;
  authorName: string;
}

export interface DeadlineHistory {
    deadline: string;
    setAt: string;
    setBy: string;
}

export interface Occurrence {
  id: string;
  uniqueId?: string;
  createdBy: string;
  creatorName: string;
  title: string;
  description: string;
  area: Area;
  status: Status;
  photos: string[];
  audioUrl?: string;
  timestamp: string;
  location: string;
  complexity?: Complexity;
  assigneeId?: string;
  estimatedCompletion?: string;
  deadlineHistory?: DeadlineHistory[];
  updatesLog?: OccurrenceUpdate[];
  deletedAt?: string;
  isUrgent?: boolean;
}

export type FeedbackType = 'bug' | 'sugestao' | 'elogio';

export interface FeedbackComment {
    author: string;
    text: string;
    timestamp: string;
    isAdmin: boolean;
}

export interface SystemFeedback {
  id: string;
  userId: string;
  userName: string;
  userRole: Role;
  userAreas?: Area[];
  type: FeedbackType;
  content: string;
  timestamp: string;
  isRead: boolean;
  comments?: FeedbackComment[];
}

export interface AppNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'new' | 'update' | 'alert' | 'info';
  occurrenceId?: string;
}

export const getNormalizedStatus = (status: string): Status => {
    const s = status ? status.trim() : '';
    if (s === 'Aberto' || s === 'Abertas') return Status.Aberto;
    if (s === 'Concluido' || s === 'Concluído' || s === 'Concluídas') return Status.Concluido;
    if (s === 'Em Andamento') return Status.EmAndamento;
    if (s === 'Em Atraso') return Status.EmAtraso;
    return s as Status;
};