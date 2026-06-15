import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

// 🚀 Bootstrapping the application using the centralized config provider
// This ensures that APP_INITIALIZER runs the AuthService handshake BEFORE the UI mounts.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('[BOOTSTRAP PANIC CRITICAL ERROR]:', err));