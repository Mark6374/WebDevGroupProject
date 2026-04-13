import { Component, OnInit } from '@angular/core';  
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { TransactionService } from '../../services/transaction';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  transactions: any[] = [];
  categories: any[] = [];
  summary = { total_income: 0, total_expense: 0, balance: 0 };
  
  newTransaction = {
    amount: null as number | null,
    description: '',
    category: null as number | null,
    transaction_type: 'expense'
  };

  errorMessage = '';

  constructor(
    private transactionService: TransactionService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.transactionService.getTransactions().subscribe({
      next: (data) => this.transactions = data,
      error: () => this.showError('Failed to load transactions')
    });

    this.transactionService.getSummary().subscribe({
      next: (data) => this.summary = data,
      error: () => this.showError('Failed to load summary')
    });

    this.transactionService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: () => this.showError('Failed to load categories')
    });
  }

  addTransaction() {
    if (!this.newTransaction.amount || !this.newTransaction.category) {
      this.showError('Please fill amount and category');
      return;
    }

    this.transactionService.addTransaction(this.newTransaction).subscribe({
      next: () => {
        this.loadData();
        this.newTransaction = { amount: null, description: '', category: null, transaction_type: 'expense' };
      },
      error: () => this.showError('Failed to add transaction')
    });
  }

  deleteTransaction(id: number) {
    if (confirm('Are you sure?')) {
      this.transactionService.deleteTransaction(id).subscribe({
        next: () => this.loadData(),
        error: () => this.showError('Failed to delete transaction')
      });
    }
  }

  logout() {
    this.authService.logout();
  }

  private showError(message: string) {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 3000);
  }

  getCategoryName(categoryId: number): string {
    const cat = this.categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Unknown';
  }
}