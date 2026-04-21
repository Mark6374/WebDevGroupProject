import { Component, OnInit } from '@angular/core';
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
export class TopupComponent implements OnInit {
  amount: number | null = null;
  loading = false;
  successMsg = '';
  errorMsg = '';
  showOverlay = false;
  lastAmount = 0;
  balance = 0;
  selectedMethod = 'card';

  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http.get<any>(`${this.apiUrl}/crypto/wallet/`).subscribe({
      next: (data) => { this.balance = data.balance || 0; },
      error: () => {}
    });
  }

  goBack() {
    this.router.navigate(['/wallet']);
  }

  quickSet(val: number) {
    this.amount = val;
  }

  selectMethod(method: string) {
    this.selectedMethod = method;
  }

  get feeText(): string {
    if (!this.amount || this.amount <= 0) return '₸0 (0%)';
    const percent = this.selectedMethod === 'card' ? 1.5 : this.selectedMethod === 'crypto' ? 0 : 0.5;
    const fee = Math.round(this.amount * percent / 100);
    return percent === 0 ? 'Free' : `₸${fee.toLocaleString()} (${percent}%)`;
  }

  formatCard() {
    let v = this.cardNumber.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = v.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry() {
    let v = this.cardExpiry.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
    this.cardExpiry = v;
  }

  submit() {
    if (!this.amount || this.amount <= 0) {
      this.errorMsg = 'Please enter an amount';
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.http.post<any>(`${this.apiUrl}/topup/`, { amount: this.amount }).subscribe({
      next: (res) => {
        this.lastAmount = this.amount!;
        this.balance = parseFloat(res.new_balance);
        this.showOverlay = true;
        this.loading = false;
        setTimeout(() => {
          this.showOverlay = false;
          this.router.navigate(['/wallet']);
        }, 2000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Error';
        this.loading = false;
      }
    });
  }
}