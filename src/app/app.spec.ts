import { describe, beforeEach, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app';
import { AuthService } from './services/auth.service';
import { ChatStore } from './store/chat.store';

describe('AppComponent', () => {
  // Mock implementations to isolate the test runner environment from real network loops
  let mockAuthService: Partial<AuthService>;
  let mockChatStore: any;

  beforeEach(async () => {
    // Configure predictable stub returns for our validation template checks
    mockAuthService = {
      isLoggedIn: true,
      logout: () => {}
    };

    mockChatStore = {
      connectionStatus: () => 'Connected'
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]), // Stubs path mapping contexts for router-outlet structures
        { provide: AuthService, useValue: mockAuthService },
        { provide: ChatStore, useValue: mockChatStore }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the administration brand identity text', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges(); // Directs Angular to compile template binding nodes instantly
    await fixture.whenStable();
    
    const compiled = fixture.nativeElement as HTMLElement;
    // ✅ Updated target string query to check against your active structural title footprint
    expect(compiled.querySelector('h1')?.textContent).toContain('CapitalLoop Admin Station');
  });
});