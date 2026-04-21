import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar';
import { AuthService } from '../../services/auth';
import { COINS } from '../../models/transaction.model';

interface CoinDisplay {
  id: string;
  sym: string;
  name: string;
  price: number;
  change: number;
}

interface Holding {
  symbol: string;
  amount: number;
  invested_usd: number;
}

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './crypto.html',
  styleUrls: ['./crypto.css'],
})
export class CryptoComponent implements OnInit, OnDestroy {
  coins: CoinDisplay[]  = [];
  holdings: Holding[]   = [];
  selectedCoin: CoinDisplay | null = null;
  mode: 'buy' | 'sell'  = 'buy';
  tradeAmount: number | null = null;
  errorMessage  = '';
  successMessage = '';
  loading  = true;
  trading  = false;

  readonly KZT_PER_USD = 470;
  private apiUrl = 'http://localhost:8000/api';
  private cgUrl  = 'https://api.coingecko.com/api/v3';
  private refreshInterval: any;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchPrices();
    this.loadHoldings();
    this.refreshInterval = setInterval(() => this.fetchPrices(), 60000);
  }

  ngOnDestroy() { clearInterval(this.refreshInterval); }

  fetchPrices() {
    const ids = COINS.map(c => c.id).join(',');
    this.http.get<any>(`${this.cgUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
      .subscribe({
        next: (data) => {
          this.coins = COINS.map(c => ({
            ...c,
            price:  data[c.id]?.usd??0,
            change: data[c.id]?.usd_24h_change??0,
          })).filter(c => c.price > 0);
          this.loading = false;
          if (this.selectedCoin) {
            const updated = this.coins.find(c => c.sym === this.selectedCoin!.sym);
            if (updated) this.selectedCoin = updated;
          }
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); }
      });
  }

  loadHoldings() {
    this.http.get<any>(`${this.apiUrl}/crypto/wallet/`).subscribe({
      next: (data) => {
        this.holdings = (data.holdings || []).map((h: any) => ({
          symbol:h.symbol,
          amount: parseFloat(h.amount),
          invested_usd: parseFloat(h.invested_usd),
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  selectCoin(coin: CoinDisplay) {
    this.selectedCoin = coin;
    this.tradeAmount  = null;
    this.errorMessage = '';
    setTimeout(() => this.drawChart(coin), 50);
    this.cdr.detectChanges();
  }

  setMode(m: 'buy' | 'sell') {
    this.mode        = m;
    this.tradeAmount = null;
    this.errorMessage = '';
  }

  get selectedHolding(): Holding | null {
    if (!this.selectedCoin) return null;
    return this.holdings.find(h => h.symbol === this.selectedCoin!.sym) || null;
  }

  get totalCostUSD(): number {
    if (!this.selectedCoin || !this.tradeAmount) return 0;
    return this.tradeAmount * this.selectedCoin.price;
  }

  get totalCostKZT(): number { return this.totalCostUSD * this.KZT_PER_USD; }

  get profitUSD(): number {
    if (!this.selectedHolding || !this.tradeAmount || !this.selectedCoin) return 0;
    const avgPrice = this.selectedHolding.invested_usd / this.selectedHolding.amount;
    return (this.selectedCoin.price - avgPrice) * this.tradeAmount;
  }

  executeTrade() {
    if (!this.selectedCoin || !this.tradeAmount || this.tradeAmount <= 0) {
      this.showError('Select a coin and enter a valid amount');
      return;
    }

    if (this.mode === 'sell') {
      const h = this.selectedHolding;
      if (!h) { this.showError(`You don't have any ${this.selectedCoin.sym}`); return; }
      if (this.tradeAmount > h.amount) {
        this.showError(`Not enough coins. You have: ${h.amount.toFixed(6)} ${this.selectedCoin.sym}`);
        return;
      }
    }

    this.trading = true;
    const endpoint = this.mode === 'buy' ? 'crypto/buy' : 'crypto/sell';

    this.http.post<any>(`${this.apiUrl}/${endpoint}/`, {
      symbol:    this.selectedCoin.sym,
      amount:    this.tradeAmount,
      price_usd: this.selectedCoin.price,
    }).subscribe({
      next: (res) => {
        this.trading     = false;
        this.tradeAmount = null;
        if (this.mode === 'buy') {
          this.showSuccess(`Purchased! +${res.xp_gained ?? 0} XP`);
        } else {
          const profit = parseFloat(res.profit_usd ?? '0');
          const sign   = profit >= 0 ? '+' : '';
          this.showSuccess(`Sold! ${sign}$${profit.toFixed(2)} | +${res.xp_gained ?? 0} XP`);
        }
        this.loadHoldings();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.trading = false;
        this.showError(err?.error?.error || 'Server error');
        this.cdr.detectChanges();
      },
    });
  }

  drawChart(coin: CoinDisplay) {
    const svgEl = document.getElementById('crypto-chart-svg') as unknown as SVGSVGElement;
    if (!svgEl) return;
    const pts: number[] = [];
    let v = coin.price * (0.85 + Math.random() * 0.1);
    for (let i = 0; i < 24; i++) { v += v * (Math.random() - 0.48) * 0.04; pts.push(v); }
    pts[pts.length - 1] = coin.price;
    const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
    const W = 300, H = 90, pad = 4;
    const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = (val: number) => H - pad - ((val - min) / range) * (H - pad * 2);
    const pathD = pts.map((val, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ');
    const isUp  = pts[pts.length - 1] >= pts[0];
    const col   = isUp ? '#22c55e' : '#ef4444';
    svgEl.innerHTML = `
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${col}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${pathD} L${x(pts.length-1)},${H} L${pad},${H} Z" fill="url(#cg)"/>
      <path d="${pathD}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    setTimeout(() => { this.errorMessage = ''; this.cdr.detectChanges(); }, 4000);
  }
  private showSuccess(msg: string) {
    this.successMessage = msg;
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
}