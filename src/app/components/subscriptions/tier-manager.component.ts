import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-tier-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tier-manager.component.html'
})
export class TierManagerComponent implements OnInit {
  // 📥 Injects the centralized Signal State Store to manage account licensing maps
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * ⚡ Lifecycle Initializer Hook
   * Pulls fresh user validation profiles and licensing pools automatically on screen mounting
   */
  public ngOnInit(): void {
    this.hydrateLicensingLedger();
  }

  /**
   * 🔄 Account Registry Hydration Dispatcher
   * Forces the store to synchronize licensing matrices down from your backend gateway services
   */
  private hydrateLicensingLedger(): void {
    if (typeof this.portfolioStore.loadComplianceQueue === 'function') {
      // Fires the unified store rxMethod to poll fresh data across your active network profile
      this.portfolioStore.loadComplianceQueue();
    } else {
      console.warn('[TIER MANAGER WARNING]: loadComplianceQueue driver is missing from your state provider.');
    }
  }

  /**
   * 🥇 Reactive Subscription Set Inspector
   * Maps user account email signatures cleanly against the modern NgRx Signal Store Set object wrapper.
   * @param email The unique account identification address string.
   */
  public isUserPremium(email: string): boolean {
    return this.portfolioStore.premiumUserRegistry().has(email);
  }
}