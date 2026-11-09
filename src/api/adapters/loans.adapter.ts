import {
  createLoan as createLoanService,
  deleteLoan as deleteLoanService,
  getLoan as getLoanService,
  getLoans as getLoansService,
  updateLoan as updateLoanService,
} from '../services/loans.service';
import type {
  LoanPayload,
  LoanResponse,
} from '../services/loans.service';

export interface Loan {
  id: number;
  personName: string;
  amount: string;
  type: LoanType;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export type LoanUpdatePayload = LoanPayload;
export type LoanType = LoanPayload['type'];
export type LoanStatus = LoanPayload['status'];

function toLoan(loan: LoanResponse): Loan {
  return {
    id: loan.id,
    personName: loan.person_name,
    amount: loan.amount,
    type: loan.type,
    status: loan.status,
    createdAt: loan.created_at,
    updatedAt: loan.updated_at,
  };
}

export async function getLoans(): Promise<Loan[]> {
  const response = await getLoansService();
  return response.results.map(toLoan);
}

export async function getLoan(loanId: number): Promise<Loan> {
  return toLoan(await getLoanService(loanId));
}

export async function createLoan(payload: LoanUpdatePayload): Promise<void> {
  await createLoanService(payload);
}

export async function updateLoan(
  loanId: number,
  payload: LoanUpdatePayload,
): Promise<void> {
  await updateLoanService(loanId, payload);
}

export async function deleteLoan(loanId: number): Promise<void> {
  await deleteLoanService(loanId);
}
