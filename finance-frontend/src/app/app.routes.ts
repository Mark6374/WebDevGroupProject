import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CryptoComponent } from './components/crypto/crypto';
import { WalletComponent } from './components/wallet/wallet';
import { HistoryComponent } from './components/history/history';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: 'login',component: LoginComponent},
  {path: 'register', component: RegisterComponent},
  {path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard]},
  {path: 'crypto', component: CryptoComponent, canActivate: [AuthGuard]},
  {path: 'wallet', component: WalletComponent, canActivate: [AuthGuard]},
  {path: 'history',component: HistoryComponent, canActivate: [AuthGuard]},
  {path: '**', redirectTo: '/login' },
];