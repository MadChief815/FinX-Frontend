import {
  createSubPage as createSubPageService,
  createSubSpend as createSubSpendService,
  deleteSubPage as deleteSubPageService,
  deleteSubSpend as deleteSubSpendService,
  getSubPage as getSubPageService,
  getSubPages as getSubPagesService,
  getSubSpend as getSubSpendService,
  getSubSpends as getSubSpendsService,
  updateSubPage as updateSubPageService,
  updateSubSpend as updateSubSpendService,
} from '../services/subpages.service';
import type {
  SubPagePayload,
  SubPageResponse,
  SubPageUpdatePayload,
  SubSpendPayload,
  SubSpendResponse,
  SubSpendUpdatePayload,
} from '../services/subpages.service';

export interface SubPage {
  id: number;
  spendId: number;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubSpend {
  id: number;
  subPageId: number;
  title: string;
  amount: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

function toSubPage(page: SubPageResponse): SubPage {
  return {
    id: page.id,
    spendId: page.spend,
    title: page.title,
    isCompleted: page.is_completed,
    createdAt: page.created_at,
    updatedAt: page.updated_at,
  };
}

function toSubSpend(spend: SubSpendResponse): SubSpend {
  return {
    id: spend.id,
    subPageId: spend.sub_page,
    title: spend.title,
    amount: spend.amount,
    isCompleted: spend.is_completed,
    createdAt: spend.created_at,
    updatedAt: spend.updated_at,
  };
}

export async function createSubPage(payload: SubPagePayload): Promise<void> {
  await createSubPageService(payload);
}

export async function getSubPages(spendId: number): Promise<SubPage[]> {
  const response = await getSubPagesService(spendId);
  return response.results.map(toSubPage);
}

export async function getSubPage(subPageId: number): Promise<SubPage> {
  return toSubPage(await getSubPageService(subPageId));
}

export async function updateSubPage(
  subPageId: number,
  payload: SubPageUpdatePayload,
): Promise<void> {
  await updateSubPageService(subPageId, payload);
}

export async function deleteSubPage(subPageId: number): Promise<void> {
  await deleteSubPageService(subPageId);
}

export async function getSubSpends(subPageId: number): Promise<SubSpend[]> {
  const response = await getSubSpendsService(subPageId);
  return response.results.map(toSubSpend);
}

export async function getSubSpend(subSpendId: number): Promise<SubSpend> {
  return toSubSpend(await getSubSpendService(subSpendId));
}

export async function createSubSpend(payload: SubSpendPayload): Promise<SubSpend> {
  return toSubSpend(await createSubSpendService(payload));
}

export async function updateSubSpend(
  subSpendId: number,
  payload: SubSpendUpdatePayload,
): Promise<SubSpend> {
  return toSubSpend(await updateSubSpendService(subSpendId, payload));
}

export async function deleteSubSpend(subSpendId: number): Promise<void> {
  await deleteSubSpendService(subSpendId);
}
