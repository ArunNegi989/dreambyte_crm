export type EmployeeRole = "employee" | "admin" | "super_admin";
export type TaskStatus = "pending" | "approved" | "rejected" | "completed" | "changes_requested" | "in_progress";
export type TaskFrequency = "weekly" | "monthly" | "one_time";
export type DeliveryStatus = "delivered" | "not_delivered";

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  department: string;
  role: EmployeeRole;
  joinDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskChange {
  _id: string;
  changedAt: string;
  changedBy: string;
  note: string;
  employeeResponse: string;
  resolved: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: string | { _id: string; name: string; employeeId: string; department: string; role: string };
  assignedBy: "admin" | "super_admin";
  brandId?: string | { _id: string; name: string } | null;
  frequency: TaskFrequency;
  dueDate: string;
  status: TaskStatus;
  deliveryStatus: DeliveryStatus;
  deliveryNote?: string;
  startedAt?: string | null;
  deliveredAt?: string | null;
  rejectRemark?: string;
  changes: TaskChange[];
  createdAt: string;
  updatedAt: string;
  parentTaskId?: string | null;
  hasSubtasks?: boolean;
  department?: string;
  taskType?: string;
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
  // ── NEW: count of tasks Super Admin assigned directly to this admin ──
  adminTasks: number;
}

export interface Brand {
  _id: string;
  name: string;
  industry: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}