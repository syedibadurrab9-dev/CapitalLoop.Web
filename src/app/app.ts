import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ChatStore } from './store/chat.store';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  // Injecting active enterprise session context tracking drivers
  protected readonly authService = inject(AuthService);
  protected readonly chatStore = inject(ChatStore);

  // Application core telemetry baseline
  protected readonly title = signal('capitalloop-admin-portal');
}