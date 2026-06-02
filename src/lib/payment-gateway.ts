import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

export type PaymentGatewayOutcome = 'success' | 'failed' | 'cancelled' | 'dismissed';

/** Deep link SSLCommerz should return to after due payment (expo-router path, no groups). */
export function getDuePaymentReturnUrl(): string {
  return Linking.createURL('/payments');
}

/** Deep link after meal-token SSLCommerz checkout. */
export function getMealPaymentReturnUrl(): string {
  return Linking.createURL('/dining');
}

/** Prefix passed to openAuthSessionAsync so any path under the app scheme closes the browser. */
function getAuthSessionRedirectPrefix(returnUrl: string): string {
  const match = returnUrl.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  return match ? `${match[1]}://` : returnUrl;
}

export function parsePaymentReturnUrl(
  url: string,
): { outcome: Exclude<PaymentGatewayOutcome, 'dismissed'>; tranId?: string } | null {
  const parsed = Linking.parse(url);
  const payment = parsed.queryParams?.payment;
  if (payment !== 'success' && payment !== 'failed' && payment !== 'cancelled') {
    return null;
  }
  const tranId = parsed.queryParams?.tran_id;
  return {
    outcome: payment,
    tranId: typeof tranId === 'string' ? tranId : undefined,
  };
}

/**
 * Opens SSLCommerz in an auth session; closes automatically when the backend
 * redirects to `returnUrl` (hallapp:// or exp:// from Linking.createURL).
 */
export async function openPaymentGateway(
  gatewayUrl: string,
  returnUrl: string,
): Promise<PaymentGatewayOutcome> {
  WebBrowser.maybeCompleteAuthSession();

  const result = await WebBrowser.openAuthSessionAsync(
    gatewayUrl,
    getAuthSessionRedirectPrefix(returnUrl),
  );

  if (result.type === 'success' && result.url) {
    const parsed = parsePaymentReturnUrl(result.url);
    if (parsed) {
      return parsed.outcome;
    }
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return 'dismissed';
  }

  return 'dismissed';
}

export function paymentOutcomeMessage(outcome: PaymentGatewayOutcome): string {
  switch (outcome) {
    case 'success':
      return 'Payment completed successfully.';
    case 'failed':
      return 'Payment failed. Please try again.';
    case 'cancelled':
      return 'Payment was cancelled.';
    case 'dismissed':
      return 'Payment window was closed before completion.';
  }
}
