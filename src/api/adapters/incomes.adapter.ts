import {
  createIncome as createIncomeService,
  deleteIncome as deleteIncomeService,
  getIncome as getIncomeService,
  getIncomes as getIncomesService,
  updateIncome as updateIncomeService,
} from '../services/incomes.service';
import type {
  IncomePayload,
  IncomeResponse,
} from '../services/incomes.service';

export type { IncomePayload } from '../services/incomes.service';

export interface Income {
  id: number;
  title: string;
  amount: string;
  expectedDate: string;
  isReceived: boolean;
  createdAt: string;
  updatedAt: string;
}

function toIncome(income: IncomeResponse): Income {
  return {
    id: income.id,
    title: income.title,
    amount: income.amount,
    expectedDate: income.expected_date,
    isReceived: income.is_received,
    createdAt: income.created_at,
    updatedAt: income.updated_at,
  };
}

export async function getIncomes(): Promise<Income[]> {
  const response = await getIncomesService();
  return response.results.map(toIncome);
}

export async function getIncome(incomeId: number): Promise<Income> {
  return toIncome(await getIncomeService(incomeId));
}

export async function createIncome(payload: IncomePayload): Promise<void> {
  await createIncomeService(payload);
}

export async function updateIncome(
  incomeId: number,
  payload: IncomePayload,
): Promise<void> {
  await updateIncomeService(incomeId, payload);
}

export async function deleteIncome(incomeId: number): Promise<void> {
  await deleteIncomeService(incomeId);
}
