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

export interface CryptoHolding {
  id?: number;
  symbol: string;
  amount: number;
  invested_usd: number;
}

export interface CryptoTransaction {
  id?: number;
  symbol: string;
  amount_coin: number;
  price_usd: number;
  cost_kzt: number;
  date?: string;
}

export interface CryptoPrice {
  usd: number;
  usd_24h_change: number;
}

export interface CryptoPricesMap {
  [coinId: string]: CryptoPrice;
}

export interface WalletData {
  holdings: CryptoHolding[];
  transactions: CryptoTransaction[];
  xp: number;
  rank: string;
  balance: number;
}

export interface UserProfile {
  xp: number;
  balance: number;
  rank: string;
}

export const RANK_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string; minXp: number; maxXp: number }> = {
  bronze:{icon: '🥉', color: '#cd7c3a', bg: 'rgba(205,124,58,0.15)',  label: 'Bronze',  minXp: 0,maxXp: 500  },
  silver:{icon: '🥈', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', label: 'Silver', minXp: 500, maxXp: 1500 },
  gold:{icon: '🥇', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  label: 'Gold',  minXp: 1500, maxXp: 3500 },
  platinum:{icon: '💜', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', label: 'Platinum', minXp: 3500, maxXp: 7000 },
  diamond:{icon: '💎', color: '#00d4aa', bg: 'rgba(0,212,170,0.15)',   label: 'Diamond',   minXp: 7000, maxXp: 15000 },
};

export const COINS = [
  {id: 'bitcoin',sym: 'BTC', name: 'Bitcoin'},
  {id: 'ethereum', sym: 'ETH', name: 'Ethereum'},
  {id: 'solana', sym: 'SOL', name: 'Solana'},
  {id: 'binancecoin', sym: 'BNB', name: 'BNB'},
  {id: 'ripple', sym: 'XRP', name: 'XRP'},
  {id: 'cardano',sym: 'ADA', name: 'Cardano'},
];