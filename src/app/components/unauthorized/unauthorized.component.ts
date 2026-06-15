import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * 🚀 SIGNALS ALIGNMENT: Exposes the core application profile Signal 
   * to drive real-time contextual inspection tables safely in the template.
   */
  public get currentUserProfileSignal() {
    return this.authService.currentUserProfile;
  }

  /**
   * ↩️ Dynamic Return Route Evaluation Matrix
   * Automatically inspects the current user tier flag and safely routes them 
   * back to their respective database-cleared platform module dashboards.
   */
  public onNavigateHome(): void {
    const tier = this.authService.userTier();

    if (!tier) {
      this.router.navigate(['/login']);
      return;
    }

    switch (tier.toLowerCase()) {
      case 'agent':
      case 'agent-backoffice':
        this.router.navigate(['/dashboard']);
        break;

      case 'advisor-wealth':
        this.router.navigate(['/risk-engine']);
        break;

      case 'tax-consultant-tier':
        this.router.navigate(['/compliance/kyc-ledger']);
        break;

      default:
        console.warn('⚠️ Fallback Gating Triggered: Untracked profile tier signature:', tier);
        this.onLogout();
        break;
    }
  }

  /**
   * 🚪 Terminate Active Session Lifecycle
   * Purges local state tokens and returns the terminal back to the public login gate.
   */
  public onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}