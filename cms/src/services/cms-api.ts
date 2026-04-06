import type { AuthProfile } from '../store/auth-store';
import type { CmsRecord } from '../types/cms';
import { apiClient } from '../lib/api-client';

interface ListOptions {
  limit?: number;
  skip?: number;
  order?: string[];
  includeRelations?: string[];
  where?: Record<string, unknown>;
}

interface CountResponse {
  count: number;
}

interface LoginPayload {
  credential: string;
  secret: string;
}

interface LoginResponse {
  token: string;
}

interface UploadLandingAssetPayload {
  data: string;
  fileName: string;
  mimeType: string;
  locale?: string;
  title?: string;
  alt?: string;
}

interface ViToEnTranslateResponse {
  translations: string[];
}

export async function loginCms(payload: LoginPayload) {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<AuthProfile>('/auth/me');
  return data;
}

export async function pingAuth() {
  const { data } = await apiClient.get<boolean>('/auth/ping');
  return data;
}

export async function fetchCollection(endpoint: string, options: ListOptions = {}) {
  const filter: Record<string, unknown> = {
    limit: options.limit ?? 10,
    skip: options.skip ?? 0,
    order: options.order ?? ['createdDate DESC'],
  };

  if (options.includeRelations && options.includeRelations.length > 0) {
    filter.include = options.includeRelations.map((relation) => ({ relation }));
  }

  if (options.where && Object.keys(options.where).length > 0) {
    filter.where = options.where;
  }

  const { data } = await apiClient.get<CmsRecord[]>(endpoint, {
    params: {
      filter: JSON.stringify(filter),
    },
  });

  return data;
}

export async function fetchCount(endpoint: string, where?: Record<string, unknown>) {
  const params = where ? { where: JSON.stringify(where) } : undefined;
  const { data } = await apiClient.get<CountResponse>(endpoint, { params });
  return data.count;
}

export async function createResource(endpoint: string, payload: Record<string, unknown>) {
  const { data } = await apiClient.post(endpoint, payload);
  return data;
}

export async function updateResource(endpoint: string, id: string, payload: Record<string, unknown>) {
  await apiClient.patch(`${endpoint}/${id}`, payload);
}

export async function deleteResource(endpoint: string, id: string, payload?: Record<string, unknown>) {
  await apiClient.delete(`${endpoint}/${id}`, {
    data: payload,
  });
}

export async function uploadLandingAsset(payload: UploadLandingAssetPayload) {
  const { data } = await apiClient.post<CmsRecord>('/lad-assets/upload-base64', payload);
  return data;
}

export async function translateViToEnTexts(texts: string[]) {
  if (texts.length === 0) {
    return [];
  }

  const { data } = await apiClient.post<ViToEnTranslateResponse>('/lad-tools/translate-vi-to-en', { texts });
  return Array.isArray(data.translations) ? data.translations : [];
}
