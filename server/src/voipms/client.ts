import { config } from '../config';
import type { VoipMsResponse } from './types';

export class VoipMsApiError extends Error {
  constructor(public readonly status: string, public readonly method: string) {
    super(`voip.ms API error calling ${method}: ${status}`);
  }
}

const BASE_URL = 'https://voip.ms/api/v1/rest.php';

export async function request<T extends VoipMsResponse>(
  method: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(BASE_URL);
  url.searchParams.set('api_username', config.voipms.apiUsername);
  url.searchParams.set('api_password', config.voipms.apiPassword);
  url.searchParams.set('method', method);
  url.searchParams.set('content_type', 'json');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    throw new Error(`voip.ms HTTP error calling ${method}: ${res.status}`);
  }
  const body = (await res.json()) as T;
  if (body.status !== 'success') {
    throw new VoipMsApiError(body.status, method);
  }
  return body;
}
