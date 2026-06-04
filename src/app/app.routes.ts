import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // --- PUBLIC ANCHOR ROUTE ---
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },

  // --- SECURED ENTERPRISE MANAGEMENT NODES (Gated via authGuard) ---
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    // ✅ NEW: Reallocated Real-Time SignalR Support Hub Chat Desk
    path: 'support-hub',
    loadComponent: () => import('./components/support-hub/chat-desk.component').then(m => m.ChatDeskComponent),
    canActivate: [authGuard]
  },
  {
    path: 'compliance',
    loadComponent: () => import('./components/compliance/kyc-ledger.component').then(m => m.KycLedgerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'node-monitor',
    loadComponent: () => import('./components/node-monitor/node-monitor.component').then(m => m.NodeMonitorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'risk-engine',
    loadComponent: () => import('./components/risk-engine/risk-engine.component').then(m => m.RiskEngineComponent),
    canActivate: [authGuard]
  },
  {
    path: 'subscriptions',
    loadComponent: () => import('./components/subscriptions/tier-manager.component').then(m => m.TierManagerComponent),
    canActivate: [authGuard]
  },

  // --- FALLBACK INTERCEPTORS ---
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];