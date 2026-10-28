import {
  deductMonth as deductMonthService,
  getMonths as getMonthsService,
} from '../services/months.service';
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
