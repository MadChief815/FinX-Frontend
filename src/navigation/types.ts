export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MonthsStackParamList = {
  MonthList: undefined;
  MonthCreate: undefined;
  MonthDetail: {
    monthId?: string;
  };
  SpendCreate: {
    monthId?: string;
  };
  SubPage: {
    monthId?: string;
    subId?: string;
  };
  SubSpendCreate: {
    monthId?: string;
    subId?: string;
  };
};