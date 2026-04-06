import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: unknown) {
  if (!value) {
    return '-';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateInput(value: unknown) {
  if (!value) {
    return '';
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toApiDateTime(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return '';
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toISOString();
}

export function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const maybeAxios = error as {
      response?: {
        data?: {
          error?: {
            message?: string;
          };
          message?: string;
        };
        statusText?: string;
      };
      message?: string;
    };

    if (maybeAxios.response?.data?.error?.message) {
      return maybeAxios.response.data.error.message;
    }

    if (maybeAxios.response?.data?.message) {
      return maybeAxios.response.data.message;
    }

    if (maybeAxios.message) {
      return maybeAxios.message;
    }

    if (maybeAxios.response?.statusText) {
      return maybeAxios.response.statusText;
    }
  }

  return 'Đã có lỗi xảy ra.';
}

export function joinNames(items: unknown, fallback = '-') {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback;
  }

  const names = items
    .map((item) => {
      if (item && typeof item === 'object' && 'name' in item) {
        return String((item as { name: unknown }).name);
      }
      return null;
    })
    .filter((name): name is string => Boolean(name));

  return names.length > 0 ? names.join(', ') : fallback;
}
