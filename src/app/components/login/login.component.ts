import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {
  // 🚀 FIXED: Swapped 'protected' for 'public' so the HTML template can execute login() without drops
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    /**
     * ⚡ Reactive Authorization State Observer
     * Monitors changes via fine-grained signal tracking. The exact millisecond 
     * 'isLoggedIn' evaluates to true, the user is forwarded to the dashboard.
     */
   // Update the 'agent' check to include 'agent-backoffice'
effect(() => {
  const tier = this.authService.userTier();
  if (this.authService.isLoggedIn() && (tier === 'agent' || tier === 'agent-backoffice')) {
    this.router.navigate(['/dashboard']);
  }
});
  }

  /**
   * 🛡️ Pre-Flight Verification Gate Check
   * If an administrative session footprint is already established on mount,
   * pass the user directly through to prevent redundant sign-in cycles.
   */
  public ngOnInit(): void {
    if (this.authService.isLoggedIn() && this.authService.userTier() === 'agent-backoffice') {
      this.router.navigate(['/dashboard']);
    }
  }
}