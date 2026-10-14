import api from '../../services/api';

export interface DashboardMonthResponse {
  total?: number;
  spent?: number;
  to_spend?: number;
}

export interface DashboardResponse {
  bank_money?: number;
  cash_money?: number;
  fixed_deposit_money?: number;
  flexible_savings_money?: number;
  total_available?: number;
  loan_total?: number;
  income_total?: number;
  months?: Record<string, DashboardMonthResponse>;
}

export interface DashboardPatchRequest {
  bank_money?: number;
  cash_money?: number;
  fixed_deposit_money?: number;
  flexible_savings_money?: number;
}

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await api.get<DashboardResponse>('dashboard/');
  return response.data;
}

export async function patchDashboard(
  request: DashboardPatchRequest,
): Promise<void> {
  await api.patch('dashboard/', request);
}
