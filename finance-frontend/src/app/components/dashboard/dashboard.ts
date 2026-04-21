import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { NavbarComponent } from '../navbar/navbar';
import { RANK_CONFIG } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  transactions: any[] = [];
  categories: any[] = [];
  summary = { total_income: 0, total_expense: 0, balance: 0 };
  profile = { xp: 0, rank: 'bronze', balance: 0 };
  errorMessage = '';
  successMessage = '';

  newTransaction = {
    amount: null as number | null,
    description: '',
    category: null as number | null,
    transaction_type: 'expense',
  };

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public router: Router
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loadCategories();
    this.loadTransactions();
    this.loadSummary();
    this.loadProfile();
  }

  loadCategories() {
    this.http.get<any[]>(`${this.apiUrl}/categories/`).subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: (err) => this.showError('Categories: ' + err.status),
    });
  }

  loadTransactions() {
    this.http.get<any[]>(`${this.apiUrl}/transactions/`).subscribe({
      next: (data) => {
        this.transactions = data.filter((t: any) => t.transaction_type !== 'crypto');
        this.cdr.detectChanges();
      },
      error: (err) => this.showError('Transactions: ' + err.status),
    });
  }

  loadSummary() {
    this.http.get<any>(`${this.apiUrl}/summary/`).subscribe({
      next: (data) => {
        this.summary = data;
        this.cdr.detectChanges();
      },
      error: (err) => this.showError('Summary: ' + err.status),
    });
  }

  loadProfile() {
    this.http.get<any>(`${this.apiUrl}/crypto/wallet/`).subscribe({
      next: (data) => {
        this.profile = data;
        this.summary.balance = parseFloat(data.balance);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  addTransaction() {
    if (!this.newTransaction.amount || !this.newTransaction.category) {
      this.showError('Please specify the amount and category');
      return;
    }
    this.http.post<any>(`${this.apiUrl}/transactions/`, { ...this.newTransaction }).subscribe({
      next: () => {
        this.newTransaction = { amount: null, description: '', category: null, transaction_type: 'expense' };
        this.loadAll();
        this.showSuccess('Transaction added!');
      },
      error: (err) => this.showError('Error adding transaction: ' + err.status),
    });
  }

  deleteTransaction(id: number) {
    if (!confirm('Delete transaction?')) return;
    this.http.delete(`${this.apiUrl}/transactions/${id}/`).subscribe({
      next: () => {
        this.transactions = this.transactions.filter((t) => t.id !== id);
        this.loadSummary();
        this.loadProfile();
        this.cdr.detectChanges();
      },
      error: (err) => this.showError('Error deleting transaction: ' + err.status),
    });
  }

  logout() {
    this.authService.logout();
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find((c) => c.id === id);
    return cat ? cat.name : '—';
  }

  get rankConfig() {
    return RANK_CONFIG[this.profile.rank] || RANK_CONFIG['bronze'];
  }

  get rankProgress(): number {
    const r = this.rankConfig;
    const range = r.maxXp - r.minXp;
    if (range <= 0) return 100;
    return Math.min(100, ((this.profile.xp - r.minXp) / range) * 100);
  }

  get nextRankLabel(): string {
    const ranks = Object.keys(RANK_CONFIG);
    const idx = ranks.indexOf(this.profile.rank);
    if (idx >= 0 && idx < ranks.length - 1) {
      const next = RANK_CONFIG[ranks[idx + 1]];
      return `To "${next.label}": ${next.minXp - this.profile.xp} XP`;
    }
    return 'Maximum rank!';
  }

  get username(): string {
    return localStorage.getItem('username') || 'user';
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = ''), 4000);
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 2500);
  }
}