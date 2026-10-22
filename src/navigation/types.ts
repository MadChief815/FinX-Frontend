export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MonthsStackParamList = {
  MonthList: undefined;
  MonthCreate: undefined;
  MonthDetail: {
    monthId?: string | number;
  };
  SpendCreate: {
    monthId?: string | number;
  };
  SubPage: {
    monthId?: string | number;
    subId?: string;
  };
  SubSpendCreate: {
    monthId?: string | number;
    subId?: string;
  };
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