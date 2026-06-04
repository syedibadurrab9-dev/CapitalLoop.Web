import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-tier-manager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tier-manager.component.html',
//  styleUrls: ['./tier-manager.component.scss']
})
export class TierManagerComponent {
  /**
   * ✅ Injects the central administrative signals engine.
   * Grants the template reactive tracking over core state baselines and density profiles:
   * - portfolioStore.usersComplianceQueue()
   * - portfolioStore.premiumTierPercentage()
   */
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * ✅ Checks whether a user has premium privileges.
   * Leverages the custom computed signal from the central store to match active user registries.
   * @param email The registered email identifier of the user to check.
   */
  protected isUserPremium(email: string): boolean {
    // Temporarily set the selected user email to utilize the store's computed premium status check
    const previousSelection = this.portfolioStore.selectedUserEmail();
    this.portfolioStore.selectedUserEmail.set(email);
    const premiumStatus = this.portfolioStore.selectedUserIsPremium();
    
    // Restore the previous global selection state to protect multi-view background navigation loops
    this.portfolioStore.selectedUserEmail.set(previousSelection);
    
    return premiumStatus;
  }
}