import { apiRequest, persistSessionFromResponse } from '@/lib/api';
import { appendImageToFormData } from '@/lib/multipart';
import type {
  AcademicDepartment,
  AcademicSession,
  LoginResponse,
  RegisterResponse,
  StudentData,
} from '@/lib/types';

export async function studentLogin(data: { email: string; password: string }) {
  const { data: res, sessionId } = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: data,
    skipAuth: true,
  });
  await persistSessionFromResponse(sessionId);
  return res;
}

export async function studentRegister(data: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rollNumber: number;
  academicDepartment: AcademicDepartment;
  session: string;
  phone: string;
}) {
  const { data: res, sessionId } = await apiRequest<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: data,
    skipAuth: true,
  });
  await persistSessionFromResponse(sessionId);
  return res;
}

export async function logout() {
  const { data } = await apiRequest<object>('/auth/logout', { method: 'POST' });
  return data;
}

export async function logoutAll() {
  const { data } = await apiRequest<null>('/auth/logout-all', { method: 'POST' });
  return data;
}

export async function getAcademicSessions() {
  const { data } = await apiRequest<{ sessions: AcademicSession[] }>('/auth/sessions', {
    skipAuth: true,
  });
  return data;
}

export async function getMyProfile() {
  const { data } = await apiRequest<{ profile: StudentData }>('/profile/me');
  return data;
}

export async function updateProfile(data: { name?: string; phone?: string }) {
  const { data: res } = await apiRequest<Record<string, string>>('/profile/update', {
    method: 'PATCH',
    body: data,
  });
  return res;
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const { data: res } = await apiRequest<null>('/profile/change-password', {
    method: 'PATCH',
    body: data,
  });
  return res;
}

export async function uploadAvatar(imageUri: string) {
  const formData = new FormData();
  appendImageToFormData(formData, 'avatar', imageUri);

  const { data: res } = await apiRequest<{ avatarUrl: string }>('/profile/upload-image', {
    method: 'POST',
    formData,
  });
  return res;
}
