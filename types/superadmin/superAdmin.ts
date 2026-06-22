export type EmployeeRole = "employee" | "admin" | "super_admin";
export type TaskStatus = "pending" | "approved" | "rejected" | "completed";
export type TaskFrequency = "weekly" | "monthly" | "one_time";
export type DeliveryStatus = "delivered" | "not_delivered";

export interface Brand {
  id: string;
  name: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  status: "active" | "inactive";
  createdAt: string;
  logo?: string;
}

export interface Employee {
  id: string;
  employeeId: string; // DBS-2021-YYYY
  name: string;
  email: string;
  phone: string;
  dob: string;
  department: string;
  role: EmployeeRole;
  password: string;
  joinDate: string;
  avatar?: string;
  isActive: boolean;
}

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
  assignedBy: "admin" | "super_admin";
  brandId?: string; // which brand this task is for
  frequency: TaskFrequency;
  dueDate: string;
  status: TaskStatus;
  deliveryStatus: DeliveryStatus;
  rejectRemark?: string;
  changes: TaskChange[];
  createdAt: string;
}

export interface SADashboardStats {
  totalEmployees: number;
  totalTasksAllotted: number;
  totalTasksCompleted: number;
  totalTasksRejected: number;
  totalTasksPending: number;
  totalBrands: number;
}