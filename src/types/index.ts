export type UserRole = 'super_admin' | 'maintenance_staff' | 'end_user';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  companyId: number;
}

export interface Company {
  id: number;
  name: string;
}

export interface EquipmentCategory {
  id: number;
  name: string;
  responsibleUserId?: number;
  companyId: number;
  note?: string;
}

export interface Equipment {
  id: number;
  name: string;
  serialNumber?: string;
  categoryId: number;
  maintenanceTeamId?: number;
  technicianUserId?: number;
  companyId: number;
  healthPercentage: number;
  employeeId?: number;
  departmentId?: number;
  location?: string;
  usedIn?: string;
  scrapDate?: string;
  note?: string;
}

export interface MaintenanceTeam {
  id: number;
  name: string;
  companyId: number;
}

export interface WorkCenter {
  id: number;
  name: string;
  companyId: number;
}

export type MaintenanceType = 'corrective' | 'preventive';
export type KanbanState = 'normal' | 'blocked' | 'done';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceStage {
  id: number;
  name: string;
  sequence: number;
  isScrap: boolean;
  isClosed: boolean;
  companyId: number;
}

export interface MaintenanceRequest {
  id: number;
  subject: string;
  description?: string;
  maintenanceType: MaintenanceType;
  equipmentId?: number;
  workCenterId?: number;
  stageId: number;
  kanbanState: KanbanState;
  priority: PriorityLevel;
  requestDate: string;
  scheduledDate?: string;
  duration: number;
  createdByUserId: number;
  technicianUserId?: number;
  maintenanceTeamId?: number;
  companyId: number;
  instruction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRequestActivity {
  id: number;
  requestId: number;
  activityType: string;
  description: string;
  createdByUserId: number;
  createdAt: string;
}
