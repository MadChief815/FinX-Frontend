import {
  addSpend as addSpendService,
  deleteSpend as deleteSpendService,
  getSpend as getSpendService,
  getSpends as getSpendsService,
  updateSpend as updateSpendService,
} from '../services/spends.service';
import type {
  SpendPayload,
  SpendResponse,
  SpendUpdatePayload,
} from '../services/spends.service';

export interface Spend {
  id: number;
  monthId: number;
  title: string;
  amount: string;
  isCompleted: boolean;
  hasSubpage: boolean;
  createdAt: string;
  updatedAt: string;
}

function toSpend(spend: SpendResponse): Spend {
  return {
    id: spend.id,
    monthId: spend.month_page,
    title: spend.title,
    amount: spend.amount,
    isCompleted: spend.is_completed,
    hasSubpage: spend.has_subpage,
    createdAt: spend.created_at,
    updatedAt: spend.updated_at,
  };
}

export async function getSpends(monthId: number): Promise<Spend[]> {
  const response = await getSpendsService(monthId);
  return response.results.map(toSpend);
}

export async function getSpend(spendId: number): Promise<Spend> {
  return toSpend(await getSpendService(spendId));
}

export async function addSpend(payload: SpendPayload): Promise<Spend> {
  return toSpend(await addSpendService(payload));
}

export async function updateSpend(
  spendId: number,
  payload: SpendUpdatePayload,
): Promise<Spend> {
  return toSpend(await updateSpendService(spendId, payload));
}

export async function deleteSpend(spendId: number): Promise<void> {
  await deleteSpendService(spendId);
}
