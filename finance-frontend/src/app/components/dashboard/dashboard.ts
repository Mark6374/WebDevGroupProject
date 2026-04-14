import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { TransactionService } from '../../services/transaction';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
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
      next: (data) => {
        console.log('✅ Транзакции загружены:', data);
        this.transactions = data;
      },
      error: () => this.showError('Failed to load transactions')
    });

    
    this.transactionService.getSummary().subscribe({
      next: (data) => {
        console.log('✅ Сводка загружена:', data);
        this.summary = data;
      },
      error: () => this.showError('Failed to load summary')
    });

    
    this.transactionService.getCategories().subscribe({
      next: (data) => {
        console.log('✅ Категории загружены:', data);
        this.categories = [...data];  
        console.log('📋 this.categories после присвоения:', this.categories);
      },
      error: (err) => {
        console.error('❌ Ошибка загрузки категорий:', err);
        this.showError('Failed to load categories');
      }
    });
  }

  addTransaction() {
  if (!this.newTransaction.amount || !this.newTransaction.category) {
    this.showError('Please fill amount and category');
    return;
  }

  const transactionToAdd = { ...this.newTransaction };
  
  this.transactionService.addTransaction(transactionToAdd).subscribe({
    next: () => {
      
      this.loadData();
      
      
      this.newTransaction = { 
        amount: null, 
        description: '', 
        category: null, 
        transaction_type: 'expense' 
      };
    },
    error: () => this.showError('Failed to add transaction')
  });
}

  deleteTransaction(id: number) {
  if (confirm('Are you sure?')) {
    
    const transactionToDelete = this.transactions.find(t => t.id === id);
    
    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        
        this.transactions = this.transactions.filter(t => t.id !== id);
        
        
        if (transactionToDelete) {
          if (transactionToDelete.transaction_type === 'income') {
            this.summary.total_income -= transactionToDelete.amount;
          } else {
            this.summary.total_expense -= transactionToDelete.amount;
          }
          this.summary.balance = this.summary.total_income - this.summary.total_expense;
        }
      },
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