import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html'
 // styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Injecting active verification session drivers and workspace router
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * ✅ Intercepts entry initialization.
   * If an administrative session footprint is already established and verified,
   * pass the user directly through the gate to prevent redundant sign-in cycles.
   */
  public ngOnInit(): void {
    this.authService.isExchangingCode.set(false);
    this.authService.clearClearanceError();

    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }
}