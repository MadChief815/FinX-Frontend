import {
  createMonth as createMonthService,
  deleteMonth as deleteMonthService,
  deductMonth as deductMonthService,
  getMonths as getMonthsService,
  updateMonth as updateMonthService,
} from '../services/months.service';
import type { MonthUpdatePayload } from '../services/months.service';
import type { MonthResponse } from '../services/months.service';

export interface MonthListItem {
  id: number;
  title: string;
  month: number;
  year: number;
  isCompleted: boolean;
  total: number;
  spent: number;
  toSpend: number;
}

const toAmount = (value: number | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

function toMonthListItem(month: MonthResponse): MonthListItem {
  return {
    id: month.id,
    title: month.title,
    month: month.month,
    year: month.year,
    isCompleted: month.is_completed,
    total: toAmount(month.totals?.total),
    spent: toAmount(month.totals?.spent),
    toSpend: toAmount(month.totals?.to_spend),
  };
}

export async function createMonth(
  payload: MonthUpdatePayload,
): Promise<MonthListItem> {
  return toMonthListItem(await createMonthService(payload));
}

export async function getMonths(): Promise<MonthListItem[]> {
  const response = await getMonthsService();
  return response.results.map(toMonthListItem);
}

export async function deductMonth(
  monthId: number,
  source: string,
): Promise<void> {
  await deductMonthService(monthId, source);
}

export async function updateMonth(
  monthId: number,
  payload: MonthUpdatePayload,
): Promise<void> {
  await updateMonthService(monthId, payload);
}

export async function deleteMonth(monthId: number): Promise<void> {
  await deleteMonthService(monthId);
}
