import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CryptoComponent } from './components/crypto/crypto';
import { WalletComponent } from './components/wallet/wallet';
import { HistoryComponent } from './components/history/history';
import { StatisticsComponent } from './components/statistics/statistics';
import { AuthGuard } from './guards/auth.guard';
import { TopupComponent } from './components/topup/topup';

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login',component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
  {path: 'crypto', component: CryptoComponent, canActivate: [AuthGuard]},
  {path: 'wallet', component: WalletComponent, canActivate: [AuthGuard]},
  {path: 'history',component: HistoryComponent, canActivate: [AuthGuard]},
  {path: 'statistics',component: StatisticsComponent, canActivate: [AuthGuard]},
  {path: 'topup', component: TopupComponent, canActivate: [AuthGuard] },
  {path: '**', redirectTo: '/login' },
];