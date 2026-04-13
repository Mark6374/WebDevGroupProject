export interface Transaction {
  id?: number;
  amount: number;
  description: string;
  category: number;
  transaction_type: 'income' | 'expense';
  date?: string;
}

export interface Category {
  id: number;
  name: string;
  type: string;
}

export interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
}