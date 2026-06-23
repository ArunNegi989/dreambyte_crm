export interface EmployeeProfile {
    id: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    department: string;
    joinDate: string;
    initials: string;
  }
  
  export const MOCK_PROFILE: EmployeeProfile = {
    id: 'EMP1001',
    name: 'Nisha Kapoor',
    role: 'Content Strategist',
    email: 'nisha.kapoor@dreambyte.in',
    phone: '+91 98765 43210',
    department: 'Creative & Content',
    joinDate: '2023-03-15',
    initials: 'NK',
  };