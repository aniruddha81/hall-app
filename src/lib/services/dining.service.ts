import { apiRequest } from '@/lib/api';
import type { MealMenu, MealToken, PaymentMethod } from '@/lib/types';
import * as WebBrowser from 'expo-web-browser';

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

export async function getTomorrowMenus() {
  const { data: res } = await apiRequest<{ lunch?: MealMenu[]; dinner?: MealMenu[] }>(
    '/dining/tomorrow-menus',
  );
  return {
    menus: {
      lunch: res.data?.lunch ?? [],
      dinner: res.data?.dinner ?? [],
    },
  };
}

export async function getMyActiveTokens() {
  const { data: res } = await apiRequest<{ tokens: RawMealToken[] }>('/dining/my-active-tokens');
  return { tokens: (res.data?.tokens ?? []).map(mapMealToken) };
}

export async function bookMealTokens(data: {
  menuId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  receiptUri?: string | null;
}) {
  if (data.paymentMethod === 'BANK') {
    if (!data.receiptUri) {
      throw new Error('Bank receipt image is required for BANK payments');
    }
    const formData = new FormData();
    formData.append('menuId', data.menuId);
    formData.append('quantity', String(data.quantity));
    formData.append('paymentMethod', data.paymentMethod);
    formData.append('receiptImage', {
      uri: data.receiptUri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);

    const { data: res } = await apiRequest('/dining/book-tokens', {
      method: 'POST',
      formData,
    });
    return res;
  }

  const { data: res } = await apiRequest('/dining/book-tokens', {
    method: 'POST',
    body: {
      menuId: data.menuId,
      quantity: data.quantity,
      paymentMethod: data.paymentMethod,
    },
  });

  if (isPendingGatewayRedirect(res.data)) {
    await WebBrowser.openBrowserAsync(res.data.gatewayUrl);
  }

  return res;
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
