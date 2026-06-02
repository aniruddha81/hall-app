import { apiRequest, type ApiFetchOptions } from '@/lib/api';
import { appendImageToFormData } from '@/lib/multipart';
import {
  getDuePaymentReturnUrl,
  openPaymentGateway,
  type PaymentGatewayOutcome,
} from '@/lib/payment-gateway';
import type {
  AcademicDepartment,
  FinancePaymentMethod,
  SeatApplication,
  StudentDue,
} from '@/lib/types';

type RawStudentDue = {
  id: string;
  studentId: string;
  hall: StudentDue['hall'];
  type: StudentDue['dueType'];
  amount: number;
  status: StudentDue['dueStatus'];
  paidAt: string | null;
  createdAt: string;
};

type RawSeatApplication = Omit<SeatApplication, 'seatCharge'> & {
  seatCharge?: RawStudentDue | null;
};

function mapDue(raw: RawStudentDue): StudentDue {
  return {
    id: raw.id,
    studentId: raw.studentId,
    dueType: raw.type,
    hall: raw.hall,
    amount: raw.amount,
    dueStatus: raw.status,
    paidAt: raw.paidAt,
    createdAt: raw.createdAt,
  };
}

function mapApplication(raw: RawSeatApplication): SeatApplication {
  return {
    ...raw,
    seatCharge: raw.seatCharge ? mapDue(raw.seatCharge) : null,
  };
}

export async function applyForSeat(data: {
  academicDepartment: AcademicDepartment;
  session: string;
}) {
  const { data: res } = await apiRequest<SeatApplication>('/admission/apply', {
    method: 'POST',
    body: data,
  });
  return res;
}

export async function getMyApplicationStatus(options?: ApiFetchOptions) {
  const { data: res } = await apiRequest<RawSeatApplication | null>('/admission/my-status', {
    signal: options?.signal,
  });
  return res.data ? mapApplication(res.data) : null;
}

export async function getMyDues(options?: ApiFetchOptions) {
  const { data: res } = await apiRequest<{ dues: RawStudentDue[]; totalUnpaid: number }>(
    '/finance/my-dues',
    { signal: options?.signal },
  );
  return {
    dues: (res.data?.dues ?? []).map(mapDue),
    totalUnpaid: res.data?.totalUnpaid ?? 0,
  };
}

export type PayMyDueResult =
  | { kind: 'immediate' }
  | { kind: 'gateway'; outcome: PaymentGatewayOutcome };

export async function payMyDue(
  dueId: string,
  data: { method: FinancePaymentMethod; receiptUri?: string | null },
): Promise<PayMyDueResult> {
  if (data.method === 'BANK') {
    if (!data.receiptUri) {
      throw new Error('Bank receipt image is required for BANK payments');
    }
    const formData = new FormData();
    formData.append('method', data.method);
    appendImageToFormData(formData, 'receiptImage', data.receiptUri);

    await apiRequest(`/finance/my-dues/pay/${dueId}`, {
      method: 'POST',
      formData,
    });
    return { kind: 'immediate' };
  }

  const { data: res } = await apiRequest(`/finance/my-dues/pay/${dueId}`, {
    method: 'POST',
    body: {
      method: data.method,
      returnUrl: getDuePaymentReturnUrl(),
    },
  });

  const payload = res.data;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'gatewayUrl' in payload &&
    typeof (payload as { gatewayUrl: string }).gatewayUrl === 'string'
  ) {
    const outcome = await openPaymentGateway(
      (payload as { gatewayUrl: string }).gatewayUrl,
      getDuePaymentReturnUrl(),
    );
    return { kind: 'gateway', outcome };
  }

  return { kind: 'immediate' };
}

export async function reportDamage(data: {
  locationDescription: string;
  assetDetails: string;
  imageUri: string;
}) {
  const formData = new FormData();
  formData.append('locationDescription', data.locationDescription);
  formData.append('assetDetails', data.assetDetails);
  appendImageToFormData(formData, 'image', data.imageUri);

  const { data: res } = await apiRequest('/inventory/damage', {
    method: 'POST',
    formData,
  });
  return res;
}
