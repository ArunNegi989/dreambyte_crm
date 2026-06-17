export type TaskStatus = 'pending' | 'changes_requested' | 'completed';

export type DeliveryState = 'not_delivered' | 'delivered';

export interface TaskChangeRequest {
  id: string;
  adminNote: string;
  employeeResponse: string;
  requestedAt: string;
  resolved: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  brandName: string;
  clientName: string;
  status: TaskStatus;
  deliveryState: DeliveryState;
  remarks: string;
  dueDate: string;
  assignedAt: string;
  submittedAt: string | null;
  changeRequests: TaskChangeRequest[];
}

export interface EmployeeTaskStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  changesRequested: number;
  notDelivered: number;
}

export interface PeriodStats {
  due: number;
  submitted: number;
}

export interface DashboardStats {
  overall: EmployeeTaskStats;
  today: PeriodStats;
  thisWeek: PeriodStats;
  thisMonth: PeriodStats;
}