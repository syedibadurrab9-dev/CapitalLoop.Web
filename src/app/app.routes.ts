import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // --- PUBLIC/UNPROTECTED IDENTITY GATEWAY ---
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },

  // =============================================================================
  // 🔗 UNGUARDED DEEP-LINK ANCHOR PORTAL [CL-403]
  // Bypasses authGuard checkpoints to smoothly expand shared asset/chart snapshots
  // =============================================================================
  {
    path: 'shared-chart',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // =============================================================================
  // 🛡️ SECURED ENTERPRISE MANAGEMENT NODES (Gated via Parameterized authGuard)
  // =============================================================================
  
  // 📊 Central Dashboard Hub (Accessible by all internal operational roles)
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { expectedTiers: ['agent', 'agent-backoffice', 'advisor-wealth', 'tax-consultant-tier'] }
  },

  // 🖥️ Transaction Verification & Exchange Sync Pipeline Node Monitor [CL-201]
  {
    path: 'node-monitor',
    loadComponent: () => import('./components/node-monitor/node-monitor.component').then(m => m.NodeMonitorComponent),
    canActivate: [authGuard],
    data: { expectedTiers: ['agent', 'agent-backoffice', 'advisor-wealth', 'tax-consultant-tier'] }
  },

  // 💬 Real-Time SignalR Support Hub Chat Desk Operational Hub [CL-404]
  // 👥 Cleared For: Syed Ibad Ur Rab (Agent)
  {
    path: 'support-hub',
    loadComponent: () => import('./components/support-hub/chat-desk.component').then(m => m.ChatDeskComponent),
    canActivate: [authGuard],
    data: { expectedTiers: ['agent', 'agent-backoffice'] }
  },

  // 💳 Workspace Monetization & Subscription Tier Controls Manager [CL-503]
  // 👥 Cleared For: Syed Ibad Ur Rab (Agent)
  {
    path: 'subscriptions/override',
    loadComponent: () => import('./components/subscriptions/tier-manager.component').then(m => m.TierManagerComponent),
    canActivate: [authGuard],
    data: { expectedTiers: ['agent', 'agent-backoffice'] }
  },

  // 🎯 Sector Density Multi-Asset Risk Engine Balance Monitor [CL-302]
  // 👥 Cleared For: Syed Ibadurrab (Advisor)
  {
    path: 'risk-engine',
    loadComponent: () => import('./components/risk-engine/risk-engine.component').then(m => m.RiskEngineComponent),
    canActivate: [authGuard],
    data: { expectedTiers: ['advisor-wealth'] }
  },

  // 🏛️ Onshore Compliance Validation Registry & FBR Audit Deck [CL-104]
  // 👥 Cleared For: Zai Bach (Tax Consultant)
  {
    path: 'compliance/kyc-ledger',
    loadComponent: () => import('./components/compliance/kyc-ledger.component').then(m => m.KycLedgerComponent),
    canActivate: [authGuard],
    data: { expectedTiers: ['tax-consultant-tier'] }
  },

  // --- FALLBACK AND ROUTING INTERCEPTORS ---
  {
    path: 'unauthorized',
    // loadComponent: () => import('./components/shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
    loadComponent: () => import('./components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  }
];