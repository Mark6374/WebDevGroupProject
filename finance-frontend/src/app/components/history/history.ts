import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';

type FilterType = 'all' | 'income' | 'expense' | 'crypto';

interface HistoryItem {
  id: string | number;
  type: 'income' | 'expense' | 'crypto';
  description: string;
  amount_kzt: number;
  date: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
})
export class HistoryComponent implements OnInit {
  allItems: HistoryItem[] = [];
  filter: FilterType = 'all';
  loading = true;
  errorMessage = '';
  categories: any[] = [];

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.errorMessage = '';
    this.allItems = [];

    this.http.get<any[]>(`${this.apiUrl}/categories/`).subscribe({
      next: (cats) => {
        this.categories = cats;
        this.loadTransactions();
      },
      error: () => {
        this.categories = [];
        this.loadTransactions();
      },
    });
  }

  private loadTransactions() {
    this.http.get<any[]>(`${this.apiUrl}/transactions/`).subscribe({
      next: (txs) => {
        const regular: HistoryItem[] = txs.map((t: any) => ({
          id: t.id,
          type: t.transaction_type as 'income' | 'expense' | 'crypto',
          description: t.description || this.getCatName(t.category),
          amount_kzt: parseFloat(t.amount),
          date: t.date,
        }));
        this.allItems = [...regular];
        this.loadCryptoHistory();
      },
      error: () => {
        this.loadCryptoHistory();
      },
    });
  }

  private loadCryptoHistory() {
    this.http.get<any>(`${this.apiUrl}/crypto/wallet/`).subscribe({
      next: (wallet) => {
        const cryptoTxs: HistoryItem[] = (wallet.transactions || []).map((t: any) => ({
          id: `c-${t.id}`,
          type: 'crypto' as const,
          description: `Куплено ${parseFloat(t.amount_coin).toFixed(4)} ${t.symbol} по $${parseFloat(t.price_usd).toFixed(2)}`,
          amount_kzt: parseFloat(t.cost_kzt),
          date: t.date,
        }));

        this.allItems = [...this.allItems, ...cryptoTxs].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filtered(): HistoryItem[] {
    if (this.filter === 'all') return this.allItems;
    return this.allItems.filter((i) => i.type === this.filter);
  }

  get totalIncome(): number {
    return this.allItems.filter(i => i.type === 'income').reduce((s, i) => s + i.amount_kzt, 0);
  }

  get totalExpense(): number {
    return this.allItems.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount_kzt, 0);
  }

  get totalCrypto(): number {
    return this.allItems.filter(i => i.type === 'crypto').reduce((s, i) => s + i.amount_kzt, 0);
  }

  setFilter(f: FilterType) {
    this.filter = f;
    this.cdr.detectChanges();
  }

  private getCatName(id: number): string {
    return this.categories.find(c => c.id === id)?.name ?? '—';
  }
}