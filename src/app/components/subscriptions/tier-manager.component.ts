import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-tier-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tier-manager.component.html',
  encapsulation: ViewEncapsulation.None
})
export class TierManagerComponent {
  protected readonly portfolioStore = inject(PortfolioStore);

  // Active view tab state: Operators Directory vs Investor Tier Ledger
  public readonly activeTab = signal<'OPERATORS' | 'INVESTORS'>('OPERATORS');

  // New Admin Operator Form State
  public operatorName: string = '';
  public operatorEmail: string = '';
  public operatorRole: string = 'ComplianceOfficer';
  public operatorLicense: string = 'SECP-ADV-';

  public readonly onboardError = signal<string | null>(null);
  public readonly onboardSuccess = signal<string | null>(null);
  public readonly isSubmitting = signal<boolean>(false);

  /**
   * Onboards and authorizes a new administrative operator in the SQL Server registry
   */
  public submitOnboardOperator(): void {
    this.onboardError.set(null);
    this.onboardSuccess.set(null);

    const name = this.operatorName.trim();
    const email = this.operatorEmail.trim().toLowerCase();
    const role = this.operatorRole;
    const license = this.operatorLicense.trim();

    if (!name || !email) {
      this.onboardError.set('Operator legal name and Google account email are required.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      this.onboardError.set('Please provide a valid Google email address.');
      return;
    }

    this.isSubmitting.set(true);

    this.portfolioStore.provisionOperator(name, email, role, license).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.onboardSuccess.set(`Operator "${name}" (${email}) successfully provisioned as ${role}. They can now sign in via Google SSO!`);
        this.operatorName = '';
        this.operatorEmail = '';
        this.operatorLicense = 'SECP-ADV-';
        setTimeout(() => this.onboardSuccess.set(null), 6000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.onboardError.set(err.message || 'Operator onboarding failed. Please ensure the email is valid and unique.');
      }
    });
  }

  /**
   * Toggles the active/suspended clearance status of an operator
   */
  public toggleOperator(email: string): void {
    this.portfolioStore.toggleOperator(email);
  }

  /**
   * Maps user account email signatures cleanly against the reactive premium Set stream.
   * @param email The unique account identification address string.
   */
  public isUserPremium(email: string): boolean {
    return this.portfolioStore.premiumUserRegistry().has(email);
  }
}