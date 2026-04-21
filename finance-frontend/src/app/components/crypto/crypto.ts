import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CryptoService } from '../../services/crypto';
import { NavbarComponent } from '../navbar/navbar';
import { COINS, CryptoPricesMap } from '../../models/transaction.model';

interface CoinDisplay {
  id: string;
  sym: string;
  name: string;
  price: number;
  change: number;
}

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './crypto.html',
  styleUrls: ['./crypto.css'],
})
export class CryptoComponent implements OnInit, OnDestroy {
  @ViewChild('chartSvg') chartSvg!: ElementRef<SVGElement>;

  coins: CoinDisplay[] = [];
  selectedCoin: CoinDisplay | null = null;
  buyAmount: number | null = null;
  errorMessage = '';
  successMessage = '';
  loading = true;
  buying = false;
  private refreshInterval: any;
  readonly KZT_PER_USD = 470;

  constructor(private cryptoService: CryptoService) {}

  ngOnInit() {
    this.fetchPrices();
    this.refreshInterval = setInterval(() => this.fetchPrices(), 60000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
  }

  fetchPrices() {
    this.cryptoService.getLivePrices().subscribe({
      next: (data: CryptoPricesMap) => {
        this.coins = COINS.map((c) => ({
          ...c,
          price: data[c.id]?.usd ?? 0,
          change: data[c.id]?.usd_24h_change ?? 0,
        })).filter((c) => c.price > 0);
        this.loading = false;
        if (this.selectedCoin) {
          const updated = this.coins.find((c) => c.sym === this.selectedCoin!.sym);
          if (updated) this.selectedCoin = updated;
        }
      },
      error: () => {
        this.loading = false;
        this.showError('Failed to load prices. Please check your connection.');
      },
    });
  }

  selectCoin(coin: CoinDisplay) {
    this.selectedCoin = coin;
    this.buyAmount = null;
    setTimeout(() => this.drawChart(coin), 50);
  }

  drawChart(coin: CoinDisplay) {
    const svgEl = document.getElementById('crypto-chart-svg') as unknown as SVGSVGElement;
    if (!svgEl) return;

    const pts: number[] = [];
    let v = coin.price * (0.85 + Math.random() * 0.1);
    for (let i = 0; i < 24; i++) {
      v += v * (Math.random() - 0.48) * 0.04;
      pts.push(v);
    }
    pts[pts.length - 1] = coin.price;

    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const W = 300, H = 90, pad = 4;
    const x = (i: number) => pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = (val: number) => H - pad - ((val - min) / range) * (H - pad * 2);

    const pathD = pts.map((val, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(' ');
    const isUp = pts[pts.length - 1] >= pts[0];
    const col = isUp ? '#22c55e' : '#ef4444';
    const areaD = `${pathD} L${x(pts.length - 1)},${H} L${pad},${H} Z`;

    svgEl.innerHTML = `
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${col}" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="${col}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#cg)"/>
      <path d="${pathD}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  }

  get totalCostUSD(): number {
    if (!this.selectedCoin || !this.buyAmount) return 0;
    return this.buyAmount * this.selectedCoin.price;
  }

  get totalCostKZT(): number {
    return this.totalCostUSD * this.KZT_PER_USD;
  }

  buyCrypto() {
    if (!this.selectedCoin || !this.buyAmount || this.buyAmount <= 0) {
      this.showError('Please enter a valid amount to buy.');
      return;
    }
    this.buying = true;
    this.cryptoService.buyCrypto({
      symbol: this.selectedCoin.sym,
      amount: this.buyAmount,
      price_usd: this.selectedCoin.price,
    }).subscribe({
      next: (res: any) => {
        this.buying = false;
        this.buyAmount = null;
        this.showSuccess(`🚀 Purchased ${this.selectedCoin!.sym}! +${Math.round(this.totalCostUSD * 0.5)} XP`);
      },
      error: (err: any) => {
        this.buying = false;
        this.showError(err?.error?.error || 'Not enough funds or server error. Please try again.');
      },
    });
  }

  private showError(msg: string) {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = ''), 3500);
  }

  private showSuccess(msg: string) {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = ''), 3000);
  }
}