import api from '../../services/api';

export type LoanType = 'lent' | 'borrowed';
export type LoanStatus = 'active' | 'paid';

export interface LoanResponse {
  id: number;
  person_name: string;
  amount: string;
  type: LoanType;
  status: LoanStatus;
  created_at: string;
  updated_at: string;
}

export interface LoansResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LoanResponse[];
}

export interface LoanPayload {
  person_name: string;
  amount: string;
  type: LoanType;
  status: LoanStatus;
}

export async function getLoans(): Promise<LoansResponse> {
  const response = await api.get<LoansResponse>('finance/loans/');
  return response.data;
}

export async function getLoan(loanId: number): Promise<LoanResponse> {
  const response = await api.get<LoanResponse>(`finance/loans/${loanId}/`);
  return response.data;
}

export async function createLoan(payload: LoanPayload): Promise<void> {
  await api.post('finance/loans/', payload);
}

export async function updateLoan(
  loanId: number,
  payload: LoanPayload,
): Promise<void> {
  await api.patch(`finance/loans/${loanId}/`, payload);
}

export async function deleteLoan(loanId: number): Promise<void> {
  await api.delete(`finance/loans/${loanId}/`);
}
