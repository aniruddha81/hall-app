import { API_BASE_URL } from '@/lib/config';
import {
  clearAuthStorage,
  extractSessionIdFromHeaders,
  getSessionId,
  saveSessionId,
} from '@/lib/auth-storage';
import type { ApiResponse } from '@/lib/types';

type ApiErrorBody = {
  message?: string;
  errors?: { message?: string }[];
};

export class ApiError extends Error {
  status: number;
  retryAfterSec?: number;

  constructor(status: number, message: string, retryAfterSec?: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
    this.retryAfterSec = retryAfterSec;
  }
}

export type ApiFetchOptions = {
  signal?: AbortSignal;
};

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  formData?: FormData;
  skipAuth?: boolean;
  signal?: AbortSignal;
};

export function isRequestAborted(error: unknown): boolean {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  ) {
    return true;
  }
  return false;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function buildHeaders(options: RequestOptions): Promise<Headers> {
  const headers = new Headers(options.headers);

  if (!options.formData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const sessionId = await getSessionId();
    if (sessionId) {
      headers.set('Authorization', `Bearer ${sessionId}`);
    }
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: ApiResponse<T>; sessionId?: string }> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = await buildHeaders(options);

  const { signal: requestSignal, ...restOptions } = options;
  const signal = requestSignal;

  const init: RequestInit = {
    ...restOptions,
    headers,
    signal,
    body: options.formData
      ? options.formData
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  };

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isRequestAborted(error)) {
      throw error;
    }
    throw new ApiError(0, 'Network request failed. Check your connection and API URL.');
  }
  const sessionId = extractSessionIdFromHeaders(response.headers);

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const raw = await response.text();

  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  let payload: ApiResponse<T> | ApiErrorBody;
  try {
    if (!raw.trim()) {
      throw new Error('Empty response body');
    }
    if (raw.trimStart().startsWith('<')) {
      throw new Error('Server returned HTML instead of JSON');
    }
    payload = JSON.parse(raw) as ApiResponse<T>;
  } catch (parseError) {
    if (signal?.aborted || isRequestAborted(parseError)) {
      throw new DOMException('Aborted', 'AbortError');
    }
    throw new ApiError(
      response.status,
      raw.trimStart().startsWith('<')
        ? 'Server returned an invalid response. Check API URL and endpoint.'
        : 'Invalid server response',
    );
  }

  if (!response.ok) {
    const message =
      (payload as ApiResponse<T>).message ??
      (payload as ApiErrorBody).message ??
      'Request failed';

    if (response.status === 401 && !options.skipAuth) {
      await clearAuthStorage();
      onUnauthorized?.();
    }

    const retryAfterSec =
      typeof (payload as ApiResponse<T>).data === 'object' &&
      (payload as ApiResponse<T>).data !== null &&
      'retryAfterSec' in ((payload as ApiResponse<T>).data as object)
        ? Number(
            ((payload as ApiResponse<T>).data as { retryAfterSec?: number })
              .retryAfterSec,
          )
        : undefined;

    throw new ApiError(
      response.status,
      message,
      Number.isFinite(retryAfterSec) && retryAfterSec! > 0
        ? retryAfterSec
        : undefined,
    );
  }

  return { data: payload as ApiResponse<T>, sessionId: sessionId ?? undefined };
}

export function getApiOtpRetryAfterSec(error: unknown): number | null {
  if (error instanceof ApiError && error.status === 429 && error.retryAfterSec) {
    return error.retryAfterSec;
  }
  return null;
}

export function getApiErrorMessage(error: unknown): string {
  if (isRequestAborted(error)) {
    return '';
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export async function persistSessionFromResponse(sessionId?: string) {
  if (sessionId) {
    await saveSessionId(sessionId);
  }
}
