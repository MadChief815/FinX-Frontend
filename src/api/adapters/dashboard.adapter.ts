import {
  getDashboard as getDashboardService,
  patchDashboard as patchDashboardService,
} from '../services/dashboard.service';
import type { DashboardMonthResponse } from '../services/dashboard.service';

export interface DashboardAccountAmounts {
  bank: number;
  cash: number;
  fixedDeposit: number;
  flexibleSavings: number;
}

export interface DashboardMonth {
  month: string;
  total: number;
  spent: number;
  toSpend: number;
}

export interface DashboardData extends DashboardAccountAmounts {
  totalAvailable: number;
  loanTotal: number;
  incomeTotal: number;
  months: DashboardMonth[];
}

export const EMPTY_DASHBOARD_DATA: DashboardData = {
  bank: 0,
  cash: 0,
  fixedDeposit: 0,
  flexibleSavings: 0,
  totalAvailable: 0,
  loanTotal: 0,
  incomeTotal: 0,
  months: [],
};

const toAmount = (value: number | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

function toDashboardMonth(
  [month, details]: [string, DashboardMonthResponse],
): DashboardMonth {
  return {
    month,
    total: toAmount(details.total),
    spent: toAmount(details.spent),
    toSpend: toAmount(details.to_spend),
  };
}

export async function getDashboard(): Promise<DashboardData> {
  const response = await getDashboardService();

  return {
    bank: toAmount(response.bank_money),
    cash: toAmount(response.cash_money),
    fixedDeposit: toAmount(response.fixed_deposit_money),
    flexibleSavings: toAmount(response.flexible_savings_money),
    totalAvailable: toAmount(response.total_available),
    loanTotal: toAmount(response.loan_total),
    incomeTotal: toAmount(response.income_total),
    months: Object.entries(response.months ?? {}).map(toDashboardMonth),
  };
}

export async function updateDashboardAmounts(
  amounts: Partial<DashboardAccountAmounts>,
): Promise<void> {
  await patchDashboardService({
    ...(amounts.bank !== undefined && { bank_money: amounts.bank }),
    ...(amounts.cash !== undefined && { cash_money: amounts.cash }),
    ...(amounts.fixedDeposit !== undefined && {
      fixed_deposit_money: amounts.fixedDeposit,
    }),
    ...(amounts.flexibleSavings !== undefined && {
      flexible_savings_money: amounts.flexibleSavings,
    }),
  });
}
