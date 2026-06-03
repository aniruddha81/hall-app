import { apiRequest, type ApiFetchOptions } from '@/lib/api';
import { appendImageToFormData } from '@/lib/multipart';
import type { MealMenu, MealToken, PaymentMethod } from '@/lib/types';
import {
  getMealPaymentReturnUrl,
  openPaymentGateway,
  type PaymentGatewayOutcome,
} from '@/lib/payment-gateway';

type RawMealToken = MealToken & { tokenId?: string; cancelledAt?: string | null };

function mapMealToken(raw: RawMealToken): MealToken {
  return {
    id: raw.id ?? raw.tokenId ?? '',
    menuId: raw.menuId ?? '',
    hall: raw.hall,
    mealDate: raw.mealDate,
    mealType: raw.mealType,
    quantity: raw.quantity,
    totalAmount: raw.totalAmount,
    status: raw.cancelledAt ? 'CANCELLED' : (raw.status ?? 'ACTIVE'),
    menuDescription: raw.menuDescription,
    price: raw.price,
  };
}

export async function getTomorrowMenus(options?: ApiFetchOptions) {
  const { data: res } = await apiRequest<{ lunch?: MealMenu[]; dinner?: MealMenu[] }>(
    '/dining/tomorrow-menus',
    { signal: options?.signal },
  );
  return {
    menus: {
      lunch: res.data?.lunch ?? [],
      dinner: res.data?.dinner ?? [],
    },
  };
}

function normalizeActiveTokensPayload(
  payload: RawMealToken[] | { tokens?: RawMealToken[] } | null | undefined,
): RawMealToken[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object' && Array.isArray(payload.tokens)) {
    return payload.tokens;
  }
  return [];
}

export async function getMyActiveTokens(options?: ApiFetchOptions) {
  const { data: res } = await apiRequest<
    RawMealToken[] | { tokens?: RawMealToken[] }
  >('/dining/my-active-tokens', {
    signal: options?.signal,
  });
  return { tokens: normalizeActiveTokensPayload(res.data).map(mapMealToken) };
}

export type BookMealTokensResult =
  | { kind: 'immediate' }
  | { kind: 'gateway'; outcome: PaymentGatewayOutcome };

export async function bookMealTokens(data: {
  menuId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  receiptUri?: string | null;
}): Promise<BookMealTokensResult> {
  if (data.paymentMethod === 'BANK') {
    if (!data.receiptUri) {
      throw new Error('Bank receipt image is required for BANK payments');
    }
    const formData = new FormData();
    formData.append('menuId', data.menuId);
    formData.append('quantity', String(data.quantity));
    formData.append('paymentMethod', data.paymentMethod);
    appendImageToFormData(formData, 'receiptImage', data.receiptUri);

    await apiRequest('/dining/book-tokens', {
      method: 'POST',
      formData,
    });
    return { kind: 'immediate' };
  }

  const { data: res } = await apiRequest('/dining/book-tokens', {
    method: 'POST',
    body: {
      menuId: data.menuId,
      quantity: data.quantity,
      paymentMethod: data.paymentMethod,
      returnUrl: getMealPaymentReturnUrl(),
    },
  });

  if (isPendingGatewayRedirect(res.data)) {
    const outcome = await openPaymentGateway(
      res.data.gatewayUrl,
      getMealPaymentReturnUrl(),
    );
    return { kind: 'gateway', outcome };
  }

  return { kind: 'immediate' };
}

export async function cancelMealToken(tokenId: string) {
  const { data } = await apiRequest(`/dining/cancel-token/${tokenId}`, { method: 'PATCH' });
  return data;
}

function isPendingGatewayRedirect(data: unknown): data is { gatewayUrl: string; status?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'gatewayUrl' in data &&
    typeof (data as { gatewayUrl: string }).gatewayUrl === 'string'
  );
}
