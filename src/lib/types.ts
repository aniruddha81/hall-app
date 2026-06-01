// Mirrors web/lib/types.ts — keep in sync with backend enums

export const ACADEMIC_DEPARTMENTS = [
  'CSE',
  'EEE',
  'ME',
  'CE',
  'IPE',
  'ECE',
  'ETE',
  'BME',
  'MTE',
  'URP',
  'ChE',
  'Arch',
] as const;

export const HALLS = [
  'ZIA_HALL',
  'SELIM_HALL',
  'HAMID_HALL',
  'SHAHIDUL_HALL',
  'TIN_SHED_HALL',
  'FAZLUL_HUQ_HALL',
] as const;

export const PAYMENT_METHODS = ['BKASH', 'NAGAD', 'ROCKET', 'BANK', 'CASH'] as const;
export const FINANCE_PAYMENT_METHODS = ['CASH', 'BANK', 'ONLINE'] as const;

export type AcademicDepartment = (typeof ACADEMIC_DEPARTMENTS)[number];
export type Hall = (typeof HALLS)[number];
export type MealType = 'LUNCH' | 'DINNER';
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type FinancePaymentMethod = (typeof FINANCE_PAYMENT_METHODS)[number];

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  errors?: unknown[];
}

export interface StudentData {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  academicDepartment: AcademicDepartment;
  rollNumber: string;
  session: string;
  hall: Hall | null;
  roomId: string | null;
  status: string | null;
  isAllocated: boolean;
}

export interface LoginResponse {
  student_data: StudentData;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  requiresVerification: boolean;
  otpExpiresInSec: number;
  resendCooldownSec: number;
}

export interface OtpResendResponse {
  otpExpiresInSec: number;
  resendCooldownSec: number;
}

export interface AcademicSession {
  id: string;
  label: string;
  isActive?: boolean;
}

export interface MealMenu {
  id: string;
  hall: Hall;
  mealDate: string;
  mealType: MealType;
  menuDescription: string;
  price: number;
  totalTokens: number;
  bookedTokens: number;
  availableTokens: number;
}

export interface MealToken {
  id: string;
  menuId: string;
  hall: Hall;
  mealDate: string;
  mealType: MealType;
  quantity: number;
  totalAmount: number;
  status: 'ACTIVE' | 'CANCELLED' | 'CONSUMED';
  menuDescription?: string;
  price?: number;
}

export interface StudentDue {
  id: string;
  studentId: string;
  dueType: 'RENT' | 'FINE' | 'OTHER';
  hall: Hall;
  amount: number;
  dueStatus: 'UNPAID' | 'PAID';
  paidAt: string | null;
  createdAt: string;
}

export interface SeatApplication {
  id: string;
  hall: Hall;
  academicDepartment: AcademicDepartment;
  session: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
  seatCharge?: StudentDue | null;
}
