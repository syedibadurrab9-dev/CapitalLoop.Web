import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ChatStore } from './store/chat.store';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component'; // 🚀 FIXED: Imported your new multi-tier navigation frame

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SidebarComponent // 🚀 FIXED: Added to structural imports array to wire up your 5-tier layout guards
  ],
  templateUrl: './app.html'
})
export class AppComponent {
  // Injecting active enterprise session context tracking drivers
  protected readonly authService = inject(AuthService);
  protected readonly chatStore = inject(ChatStore);

  // Application core telemetry baseline
  protected readonly title = signal('capitalloop-admin-portal');

  /**
   * 🛡️ Layout Shell Gating Strategy
   * Exposes the reactive authentication state to your app.html file. This ensures 
   * the sidebar panel only occupies layout screen real-estate when a specialist is fully logged in.
   */
  public get isLoggedInSignal() {
    return this.authService.isLoggedIn;
  }
}