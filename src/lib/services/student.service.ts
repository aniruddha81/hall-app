import { apiRequest } from '@/lib/api';
import type {
  AcademicDepartment,
  FinancePaymentMethod,
  Hall,
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
  hall: Hall;
  academicDepartment: AcademicDepartment;
  session: string;
}) {
  const { data: res } = await apiRequest<SeatApplication>('/admission/apply', {
    method: 'POST',
    body: data,
  });
  return res;
}

export async function getMyApplicationStatus() {
  const { data: res } = await apiRequest<RawSeatApplication | null>('/admission/my-status');
  return res.data ? mapApplication(res.data) : null;
}

export async function getMyDues() {
  const { data: res } = await apiRequest<{ dues: RawStudentDue[]; totalUnpaid: number }>(
    '/finance/my-dues',
  );
  return {
    dues: (res.data?.dues ?? []).map(mapDue),
    totalUnpaid: res.data?.totalUnpaid ?? 0,
  };
}

export async function payMyDue(
  dueId: string,
  data: { method: FinancePaymentMethod; receiptUri?: string | null },
) {
  if (data.method === 'BANK') {
    if (!data.receiptUri) {
      throw new Error('Bank receipt image is required for BANK payments');
    }
    const formData = new FormData();
    formData.append('method', data.method);
    formData.append('receiptImage', {
      uri: data.receiptUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const { data: res } = await apiRequest(`/finance/my-dues/pay/${dueId}`, {
      method: 'POST',
      formData,
    });
    return res;
  }

  const { data: res } = await apiRequest(`/finance/my-dues/pay/${dueId}`, {
    method: 'POST',
    body: { method: data.method },
  });

  const payload = res.data;
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'gatewayUrl' in payload &&
    typeof (payload as { gatewayUrl: string }).gatewayUrl === 'string'
  ) {
    const { openBrowserAsync } = await import('expo-web-browser');
    await openBrowserAsync((payload as { gatewayUrl: string }).gatewayUrl);
  }

  return res;
}

export async function reportDamage(data: {
  locationDescription: string;
  assetDetails: string;
  imageUri: string;
}) {
  const formData = new FormData();
  formData.append('locationDescription', data.locationDescription);
  formData.append('assetDetails', data.assetDetails);
  formData.append('image', {
    uri: data.imageUri,
    name: 'damage.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const { data: res } = await apiRequest('/inventory/damage', {
    method: 'POST',
    formData,
  });
  return res;
}
