import api from '../../services/api';

export interface SubPagePayload {
  spend: number;
  title: string;
}

export interface SubPageUpdatePayload {
  title: string;
  is_completed: boolean;
}

export interface SubPageResponse {
  id: number;
  spend: number;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubPagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SubPageResponse[];
}

export interface SubSpendResponse {
  id: number;
  sub_page: number;
  title: string;
  amount: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubSpendsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SubSpendResponse[];
}

export interface SubSpendPayload {
  sub_page: number;
  title: string;
  amount: string;
  is_completed: boolean;
}

export interface SubSpendUpdatePayload {
  title: string;
  amount: string;
  is_completed: boolean;
}

export async function createSubPage(payload: SubPagePayload): Promise<void> {
  await api.post('finance/subpages/', payload);
}

export async function getSubPages(spendId: number): Promise<SubPagesResponse> {
  const response = await api.get<SubPagesResponse>('finance/subpages/', {
    params: { spend: spendId },
  });
  return response.data;
}

export async function getSubPage(subPageId: number): Promise<SubPageResponse> {
  const response = await api.get<SubPageResponse>(
    `finance/subpages/${subPageId}/`,
  );
  return response.data;
}

export async function updateSubPage(
  subPageId: number,
  payload: SubPageUpdatePayload,
): Promise<void> {
  await api.patch(`finance/subpages/${subPageId}/`, payload);
}

export async function deleteSubPage(subPageId: number): Promise<void> {
  await api.delete(`finance/subpages/${subPageId}/`);
}

export async function getSubSpends(subPageId: number): Promise<SubSpendsResponse> {
  const response = await api.get<SubSpendsResponse>('finance/subspends/', {
    params: { sub_page: subPageId },
  });
  return response.data;
}

export async function getSubSpend(subSpendId: number): Promise<SubSpendResponse> {
  const response = await api.get<SubSpendResponse>(
    `finance/subspends/${subSpendId}`,
  );
  return response.data;
}

export async function createSubSpend(
  payload: SubSpendPayload,
): Promise<SubSpendResponse> {
  const response = await api.post<SubSpendResponse>('finance/subspends/', payload);
  return response.data;
}

export async function updateSubSpend(
  subSpendId: number,
  payload: SubSpendUpdatePayload,
): Promise<SubSpendResponse> {
  const response = await api.patch<SubSpendResponse>(
    `finance/subspends/${subSpendId}/`,
    payload,
  );
  return response.data;
}

export async function deleteSubSpend(subSpendId: number): Promise<void> {
  await api.delete(`finance/subspends/${subSpendId}/`);
}
