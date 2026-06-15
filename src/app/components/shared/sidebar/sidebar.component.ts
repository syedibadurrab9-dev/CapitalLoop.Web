import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HasTierDirective } from './../../../directives/has-tier.directive';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    HasTierDirective
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * 🚀 SIGNALS UPGRADE: Exposes the core application Signal layout property 
   * to resolve compilation path exceptions instantly.
   */
  public get currentUserProfileSignal() {
    return this.authService.currentUserProfile;
  }

  /**
   * 🚪 Terminate Active Session Lifecycle
   */
  public onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}