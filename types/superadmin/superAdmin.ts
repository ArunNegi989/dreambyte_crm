export type EmployeeRole = "employee" | "admin" | "super_admin";
export type TaskStatus = "pending" | "approved" | "rejected" | "completed" | "changes_requested";
export type TaskFrequency = "weekly" | "monthly" | "one_time";
export type DeliveryStatus = "delivered" | "not_delivered";

export interface Brand {
  _id: string;
  name: string;
  industry: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

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
  resolved: boolean;
  employeeResponse: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: string | { _id: string; name: string; employeeId: string; department: string; role: string };
  assignedBy: "admin" | "super_admin";
  brandId?: string | Brand | null;
  frequency: TaskFrequency;
  dueDate: string;
  status: TaskStatus;
  deliveryStatus: DeliveryStatus;
  deliveryNote?: string;
  // Employee-entered start time — set once on first submission, never overwritten.
  startedAt?: string | null;
  // Updated on every submit/resubmit — used for time-taken calculation.
  deliveredAt?: string | null;
  rejectRemark?: string;
  changes: TaskChange[];
  createdAt: string;
  updatedAt: string;
}

export interface SADashboardStats {
  totalEmployees: number;
  totalTasksAllotted: number;
  totalTasksCompleted: number;
  totalTasksRejected: number;
  totalTasksPending: number;
  totalBrands: number;
}