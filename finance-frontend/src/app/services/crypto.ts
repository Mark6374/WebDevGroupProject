import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CryptoPricesMap, WalletData, COINS } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class CryptoService {
  private apiUrl = 'http://localhost:8000/api';
  private cgUrl = 'https://api.coingecko.com/api/v3';

  constructor(private http: HttpClient) {}

  getLivePrices(): Observable<CryptoPricesMap> {
    const ids = COINS.map(c => c.id).join(',');
    return this.http.get<CryptoPricesMap>(
      `${this.cgUrl}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
  }

  buyCrypto(data: { symbol: string; amount: number; price_usd: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/crypto/buy/`, data);
  }

  getWallet(): Observable<WalletData> {
    return this.http.get<WalletData>(`${this.apiUrl}/crypto/wallet/`);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile/`);
  }
}