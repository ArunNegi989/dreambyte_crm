export type TaskStatus = "pending" | "approved" | "rejected";
export type TaskFrequency = "weekly" | "monthly";
export type DeliveryStatus = "delivered" | "not_delivered";

export interface TaskChange {
  id: string;
  changedAt: string;
  changedBy: string;
  note: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // employee id
  frequency: TaskFrequency;
  dueDate: string;
  status: TaskStatus;
  deliveryStatus: DeliveryStatus;
  changes: TaskChange[];
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  joinDate: string;
  avatar?: string;
}

export interface EmployeeWithStats extends Employee {
  totalTasks: number;
  approvedTasks: number;
  pendingTasks: number;
  rejectedTasks: number;
  tasks: Task[];
}

export interface DashboardStats {
  totalEmployees: number;
  totalTasks: number;
  pendingTasks: number;
  approvedTasks: number;
  rejectedTasks: number;
}