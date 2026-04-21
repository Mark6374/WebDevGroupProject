import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar';
import { RANK_CONFIG } from '../../models/transaction.model';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css'],
})
export class WalletComponent implements OnInit {
  holdings: any[] = [];
  transactions: any[] = [];
  xp = 0;
  rank = 'bronze';
  balance = 0;
  loading = true;
  errorMessage = '';

  private apiUrl = 'http://localhost:8000/api';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWallet();
  }

  loadWallet() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(`${this.apiUrl}/crypto/wallet/`).subscribe({
      next: (data) => {
        this.holdings = data.holdings||[];
        this.transactions = data.transactions||[];
        this.xp= data.xp||0;
        this.rank = data.rank||'bronze';
        this.balance=data.balance||0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = 'Ошибка ' + err.status + ': ' + (err?.error?.detail || err?.error?.error);
        this.loading = false;
      },
    });
  }
  
  goToTopup() {
  this.router.navigate(['/topup']);
}

  get totalInvested(): number {
    return this.holdings.reduce((s: number, h: any) => s + parseFloat(h.invested_usd || 0), 0);
  }

  get rankConfig() {
    return RANK_CONFIG[this.rank] || RANK_CONFIG['bronze'];
  }

  get rankProgress(): number {
    const r = this.rankConfig;
    const range = r.maxXp - r.minXp;
    if (range <= 0) return 100;
    return Math.min(100, ((this.xp - r.minXp) / range) * 100);
  }

  get nextRankLabel(): string {
    const ranks = Object.keys(RANK_CONFIG);
    const idx = ranks.indexOf(this.rank);
    if (idx >= 0 && idx < ranks.length - 1) {
      const next = RANK_CONFIG[ranks[idx + 1]];
      return `To "${next.label}": ${next.minXp - this.xp} XP`;
    }
    return 'Max rank! ';
  }

  coinEmoji(sym: string): string {
    const map: Record<string, string> = { BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: '♦', XRP: '✕', ADA: '₳' };
    return map[sym] ?? '🪙';
  }
}