import api from '../../services/api';

export interface SpendResponse {
  id: number;
  month_page: number;
  title: string;
  amount: string;
  is_completed: boolean;
  has_subpage: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpendsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SpendResponse[];
}

export interface SpendPayload {
  month_page: number;
  title: string;
  amount: string;
  is_completed: boolean;
}

export interface SpendUpdatePayload {
  title: string;
  amount: string;
  is_completed: boolean;
}

export async function getSpends(monthId: number): Promise<SpendsResponse> {
  const response = await api.get<SpendsResponse>('finance/spends/', {
    params: { month_page: monthId },
  });
  return response.data;
}

export async function getSpend(spendId: number): Promise<SpendResponse> {
  const response = await api.get<SpendResponse>(`finance/spends/${spendId}/`);
  return response.data;
}

export async function addSpend(payload: SpendPayload): Promise<SpendResponse> {
  const response = await api.post<SpendResponse>('finance/spends/', payload);
  return response.data;
}

export async function updateSpend(
  spendId: number,
  payload: Partial<SpendUpdatePayload>,
): Promise<SpendResponse> {
  const response = await api.patch<SpendResponse>(
    `finance/spends/${spendId}/`,
    payload,
  );
  return response.data;
}

export async function deleteSpend(spendId: number): Promise<void> {
  await api.delete(`finance/spends/${spendId}/`);
}
