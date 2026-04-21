import { Component, OnInit, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';

interface CategoryStat {
  name: string;
  amount: number;
  percent: number;
  color: string;
}

interface DayStat {
  date: string;
  label: string;
  income: number;
  expense: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './statistics.html',
  styleUrls: ['./statistics.css'],
})
export class StatisticsComponent implements OnInit {
  loading = true;
  errorMessage = '';

  transactions: any[] = [];
  categories: any[] = [];

  totalIncome  = 0;
  totalExpense = 0;
  savingsRate  = 0;
  avgDaily     = 0;
  biggestExpense: any = null;
  biggestIncome: any  = null;

  incomeByCategory:  CategoryStat[] = [];
  expenseByCategory: CategoryStat[] = [];
  dailyStats: DayStat[] = [];

  // chart interaction
  hoveredBar: number | null = null;
  activeDonut: 'income' | 'expense' = 'expense';

  readonly COLORS = [
    '#00d4aa','#7c3aed','#f59e0b','#3b82f6',
    '#ec4899','#10b981','#f97316','#8b5cf6',
    '#06b6d4','#84cc16',
  ];

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;

    this.http.get<any[]>(`${this.apiUrl}/categories/`).subscribe({
      next: (cats) => {
        this.categories = cats;
        this.http.get<any[]>(`${this.apiUrl}/transactions/`).subscribe({
          next: (txs) => {
            this.transactions = txs.filter(t => t.transaction_type !== 'crypto');
            this.compute();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loading = false; this.errorMessage = 'Error loading transactions'; }
        });
      },
      error: () => { this.loading = false; this.errorMessage = 'Error loading categories'; }
    });
  }

  private compute() {
    const income  = this.transactions.filter(t => t.transaction_type === 'income');
    const expense = this.transactions.filter(t => t.transaction_type === 'expense');

    this.totalIncome  = income.reduce((s, t)  => s + parseFloat(t.amount), 0);
    this.totalExpense = expense.reduce((s, t) => s + parseFloat(t.amount), 0);
    this.savingsRate  = this.totalIncome > 0
      ? Math.round(((this.totalIncome - this.totalExpense) / this.totalIncome) * 100)
      : 0;

    this.biggestExpense = expense.reduce((max, t) =>
      !max || parseFloat(t.amount) > parseFloat(max.amount) ? t : max, null);
    this.biggestIncome  = income.reduce((max, t) =>
      !max || parseFloat(t.amount) > parseFloat(max.amount) ? t : max, null);

    this.incomeByCategory  = this.buildCategoryStats(income);
    this.expenseByCategory = this.buildCategoryStats(expense);

    this.dailyStats = this.buildDailyStats();

    if (this.dailyStats.length > 0) {
      this.avgDaily = Math.round(
        this.dailyStats.reduce((s, d) => s + d.expense, 0) / this.dailyStats.length
      );
    }
  }

  private buildCategoryStats(txs: any[]): CategoryStat[] {
    const total = txs.reduce((s, t) => s + parseFloat(t.amount), 0);
    if (total === 0) return [];

    const map: Record<number, number> = {};
    txs.forEach(t => {
      map[t.category] = (map[t.category] || 0) + parseFloat(t.amount);
    });

    return Object.entries(map)
      .map(([catId, amount], i) => ({
        name:    this.getCatName(parseInt(catId)),
        amount,
        percent: Math.round((amount / total) * 100),
        color:   this.COLORS[i % this.COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }

  private buildDailyStats(): DayStat[] {
    const days: Record<string, DayStat> = {};

    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-En', { day: 'numeric', month: 'short' });
      days[key] = { date: key, label, income: 0, expense: 0 };
    }

    this.transactions.forEach(t => {
      const key = t.date?.split('T')[0] || t.date;
      if (days[key]) {
        if (t.transaction_type === 'income')  days[key].income  += parseFloat(t.amount);
        if (t.transaction_type === 'expense') days[key].expense += parseFloat(t.amount);
      }
    });

    return Object.values(days);
  }

  get maxBarValue(): number {
    const max = Math.max(...this.dailyStats.map(d => Math.max(d.income, d.expense)), 1);
    return max;
  }

  barHeight(val: number): number {
    return Math.round((val / this.maxBarValue) * 100);
  }

  donutPath(stats: CategoryStat[], index: number): string {
    const cx = 80, cy = 80, r = 60, innerR = 36;
    let startAngle = -Math.PI / 2;

    for (let i = 0; i < index; i++) {
      startAngle += (stats[i].percent / 100) * 2 * Math.PI;
    }

    const sweep = (stats[index].percent / 100) * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    const gap = 0.03;

    const x1 = cx + r * Math.cos(startAngle + gap);
    const y1 = cy + r * Math.sin(startAngle + gap);
    const x2 = cx + r * Math.cos(endAngle - gap);
    const y2 = cy + r * Math.sin(endAngle - gap);
    const ix1 = cx + innerR * Math.cos(endAngle - gap);
    const iy1 = cy + innerR * Math.sin(endAngle - gap);
    const ix2 = cx + innerR * Math.cos(startAngle + gap);
    const iy2 = cy + innerR * Math.sin(startAngle + gap);
    const large = sweep > Math.PI ? 1 : 0;

    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix1.toFixed(2)},${iy1.toFixed(2)} A${innerR},${innerR} 0 ${large},0 ${ix2.toFixed(2)},${iy2.toFixed(2)} Z`;
  }

  getCatName(id: number): string {
    return this.categories.find(c => c.id === id)?.name ?? '—';
  }

  fmt(n: number): string {
    return '₸' + Math.round(n).toLocaleString('ru-RU');
  }

  get activeDonutStats(): CategoryStat[] {
    return this.activeDonut === 'income' ? this.incomeByCategory : this.expenseByCategory;
  }

  get activeDonutTotal(): number {
    return this.activeDonut === 'income' ? this.totalIncome : this.totalExpense;
  }
}