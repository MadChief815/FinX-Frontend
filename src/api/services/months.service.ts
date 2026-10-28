import api from '../../services/api';

export interface MonthTotalsResponse {
  total?: number;
  spent?: number;
  to_spend?: number;
}

export interface MonthResponse {
  id: number;
  title: string;
  month: number;
  year: number;
  is_completed: boolean;
  totals: MonthTotalsResponse;
}

export interface MonthsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: MonthResponse[];
}

export interface MonthUpdatePayload {
  title: string;
  month: number;
  year: number;
}

export async function createMonth(
  payload: MonthUpdatePayload,
): Promise<MonthResponse> {
  const response = await api.post<MonthResponse>('finance/months/', payload);
  return response.data;
}

export async function getMonths(): Promise<MonthsResponse> {
  const response = await api.get<MonthsResponse>('finance/months/');
  return response.data;
}

export async function deductMonth(
  monthId: number,
  source: string,
): Promise<void> {
  await api.post(`finance/months/${monthId}/deduct/`, { source });
}

export async function updateMonth(
  monthId: number,
  payload: MonthUpdatePayload,
): Promise<void> {
  await api.patch(`finance/months/${monthId}/`, payload);
}

export async function deleteMonth(monthId: number): Promise<void> {
  await api.delete(`finance/months/${monthId}/`);
}
