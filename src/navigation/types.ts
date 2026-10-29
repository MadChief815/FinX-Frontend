import type { MonthListItem } from '../api/adapters/months.adapter';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MonthsStackParamList = {
  MonthList: undefined;
  MonthCreate: undefined;
  MonthDetail: {
    month: MonthListItem;
  };
  SpendCreate: {
    monthId: number;
  };
  SubPage: {
    monthId?: number;
    subId?: number;
  };
  SubSpendCreate: {
    subPageId?: number;
  } | undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
};

export type LoansStackParamList = {
  Loans: undefined;
};

export type IncomeStackParamList = {
  Income: undefined;
};

export type AppTabsParamList = {
  Dashboard: undefined;
  Months: undefined;
  Loans: undefined;
  Income: undefined;
  Trash: undefined;
};