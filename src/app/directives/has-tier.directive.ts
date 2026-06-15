import { 
  Directive, 
  Input, 
  TemplateRef, 
  ViewContainerRef, 
  inject, 
  effect 
} from '@angular/core';
import { SubscriptionTier } from '../models/subscription-tier.model';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[clHasTier]', // 🚀 FIXED: Changed from 'name' to 'selector'
  standalone: true
})
export class HasTierDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);
  
  private targetTiers: SubscriptionTier[] = [];
  private isViewCreated = false;

  /**
   * Accepts a single subscription tier token or an array matrix of multiple authorized roles.
   * Usage Example: *clHasTier="['agent-backoffice', 'advisor-wealth']"
   */
  @Input() set clHasTier(tiers: SubscriptionTier | SubscriptionTier[]) {
    this.targetTiers = Array.isArray(tiers) ? tiers : [tiers];
    this.evaluateVisibilityMatrix();
  }

  constructor() {
    /**
     * 🪐 Reactive Signal Execution Context: Automatically tracks state changes 
     * emitted by the computed store signal and re-runs evaluation logic cleanly.
     */
    effect(() => {
      this.evaluateVisibilityMatrix();
    });
  }

  private evaluateVisibilityMatrix(): void {
    // 🛡️ FIXED: Reads the synchronous layout state directly from your existing Signal node
    const currentProfile = this.authService.currentUserProfile();
    
    // Compute authorization validation rules mapping to string tokens
    const hasAuthorizedTier = !!currentProfile && this.targetTiers.includes(currentProfile.tier as SubscriptionTier);

    // Dynamic DOM Manipulation Matrix
    if (hasAuthorizedTier && !this.isViewCreated) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isViewCreated = true;
    } else if (!hasAuthorizedTier && this.isViewCreated) {
      this.viewContainer.clear();
      this.isViewCreated = false;
    }
  }
}