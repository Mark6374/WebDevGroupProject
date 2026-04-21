import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-topup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topup.html',
  styleUrls: ['./topup.css']
})
export class TopupComponent {
  amount: number | null = null;
  loading = false;
  successMsg = '';
  errorMsg = '';
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  goBack() {
    this.router.navigate(['/wallet']);
  }

  quickSet(val: number) {
    this.amount = val;
  }

  submit() {
    if (!this.amount || this.amount <= 0) {
      this.errorMsg = 'Сома енгіз';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.http.post<any>(`${this.apiUrl}/topup/`, { amount: this.amount }).subscribe({
      next: (res) => {
        this.successMsg = `₸${this.amount?.toLocaleString()} сәтті толтырылды!`;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/wallet']), 1500);
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Қате болды';
        this.loading = false;
      }
    });
  }
}