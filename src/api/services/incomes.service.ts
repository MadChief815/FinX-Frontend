import api from '../../services/api';

export interface IncomeResponse {
  id: number;
  title: string;
  amount: string;
  expected_date: string;
  is_received: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncomesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: IncomeResponse[];
}

export interface IncomePayload {
  title: string;
  amount: string;
  expected_date: string;
  is_received: boolean;
}

export async function getIncomes(): Promise<IncomesResponse> {
  const response = await api.get<IncomesResponse>('finance/incomes/');
  return response.data;
}

export async function getIncome(incomeId: number): Promise<IncomeResponse> {
  const response = await api.get<IncomeResponse>(`finance/incomes/${incomeId}/`);
  return response.data;
}

export async function createIncome(payload: IncomePayload): Promise<void> {
  await api.post('finance/incomes/', payload);
}

export async function updateIncome(
  incomeId: number,
  payload: IncomePayload,
): Promise<void> {
  await api.patch(`finance/incomes/${incomeId}/`, payload);
}

export async function deleteIncome(incomeId: number): Promise<void> {
  await api.delete(`finance/incomes/${incomeId}/`);
}
