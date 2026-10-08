import axios from 'axios';

type ApiErrorBody = {
  detail?: unknown;
  [field: string]: unknown;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data;
  if (data?.detail) {
    return formatErrorValue(data.detail);
  }

  if (data) {
    const fieldErrors = Object.entries(data)
      .filter(([field]) => field !== 'detail')
      .flatMap(([field, value]) => {
        const message = formatErrorValue(value);
        return message ? [`${field}: ${message}`] : [];
      });
    if (fieldErrors.length) return fieldErrors.join('\n');
  }

  return error.message || fallback;
}

function formatErrorValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatErrorValue).filter(Boolean).join('\n');
  return '';
}
