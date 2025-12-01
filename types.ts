
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
  id: string; // Firestore Document ID
  uid: string; // Firebase Auth User ID
  name: string;
  email: string;
  whatsapp?: string;
  role: Role;
  allowedAreas: Area[]; // Changed from single 'area' to list for Multi-Area support
  area?: Area; // Kept optional for legacy data compatibility during transition
  status: UserStatus;
  invitedBy?: string; // UID of the user who invited them
}

export interface OccurrenceUpdate {
  text: string;
  timestamp: string;
  authorName: string;
}

export interface DeadlineHistory {
    deadline: string; // The target date ISO string
    setAt: string; // When this deadline was set
    setBy: string; // User Name
}

// SubTask interface kept optionally for backward compatibility but logic will be hidden
export interface SubTask {
  id: string;
  title: string;
  status: Status;
  assigneeId: string; 
  estimatedCompletion?: string;
  updatesLog?: OccurrenceUpdate[];
}

export interface Occurrence {
  id: string; // Firestore Document ID
  uniqueId?: string; // Formatted unique ID like 001-24-MAN
  createdBy: string; // UID of the creator
  creatorName: string;
  title: string;
  description: string;
  area: Area;
  status: Status; // This might hold legacy strings 'Aberto' etc from DB
  photos: string[];
  audioUrl?: string;
  timestamp: string;
  location: string;
  complexity?: Complexity;
  assigneeId?: string; // Gestor Auth UID
  estimatedCompletion?: string; // Current active deadline
  deadlineHistory?: DeadlineHistory[]; // Log of all deadlines set
  updatesLog?: OccurrenceUpdate[];
  subTasks?: SubTask[];
  deletedAt?: string; // ISO Timestamp for soft delete
  isUrgent?: boolean; // Flag for urgent priority
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
  userAreas?: Area[]; // Added for detailed tracking
  type: FeedbackType;
  content: string;
  timestamp: string;
  isRead: boolean;
  comments?: FeedbackComment[]; // Chat history
}

export interface AppNotification {
  id: string;
  recipientId: string; // Who receives this notification
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'new' | 'update' | 'alert' | 'info';
  occurrenceId?: string;
}

// Helper to translate legacy status (Aberto) to new plural format (Abertas)
export const getNormalizedStatus = (status: string): Status => {
    // Normalize input to handle potential case sensitivity or whitespace
    const s = status ? status.trim() : '';
    
    if (s === 'Aberto' || s === 'Abertas') return Status.Aberto;
    if (s === 'Concluido' || s === 'Concluído' || s === 'Concluídas') return Status.Concluido;
    if (s === 'Em Andamento') return Status.EmAndamento;
    if (s === 'Em Atraso') return Status.EmAtraso;
    
    // Default fallback
    return s as Status;
};
