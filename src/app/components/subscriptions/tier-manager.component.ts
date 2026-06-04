import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-tier-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tier-manager.component.html', // Pointing cleanly to the dedicated view layer file
  encapsulation: ViewEncapsulation.None        // Forces global styles.scss grids to flow right to the outer margins
})
export class TierManagerComponent {
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * Maps user account email signatures cleanly against the reactive premium Set stream.
   * @param email The unique account identification address string.
   */
  isUserPremium(email: string): boolean {
    // 🚀 FIXED: Replaced premiumUserEmails array tracking with the production Set lookup mechanism to eliminate TS2339
    return this.portfolioStore.premiumUserRegistry().has(email);
  }
}