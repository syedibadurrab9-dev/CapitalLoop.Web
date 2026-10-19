import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore, UserComplianceNode } from '../../store/portfolio.store';
import { ComplianceService, ComplianceAuditTrailLog } from '../../services/compliance.service';

@Component({
  selector: 'app-kyc-ledger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-ledger.component.html',
  styleUrls: ['./kyc-ledger.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class KycLedgerComponent {
  protected readonly portfolioStore = inject(PortfolioStore);
  private readonly complianceService = inject(ComplianceService);

  // SECP Audit Trail Modal State
  public readonly selectedUserForAudit = signal<UserComplianceNode | null>(null);
  public readonly auditLogs = signal<ComplianceAuditTrailLog[]>([]);
  public readonly isAuditLoading = signal<boolean>(false);

  /**
   * Opens the SECP Compliance Audit Trail for a specific investor profile.
   */
  public inspectAuditTrail(user: UserComplianceNode): void {
    this.selectedUserForAudit.set(user);
    this.isAuditLoading.set(true);

    this.complianceService.getAccountAuditHistory(user.email).subscribe({
      next: (logs) => {
        this.auditLogs.set(logs);
        this.isAuditLoading.set(false);
      },
      error: () => {
        this.auditLogs.set([]);
        this.isAuditLoading.set(false);
      }
    });
  }

  /**
   * Closes the audit trail modal.
   */
  public closeAuditModal(): void {
    this.selectedUserForAudit.set(null);
    this.auditLogs.set([]);
  }

  /**
   * Evaluates and updates an investor's KYC status with custom SECP audit comments.
   */
  public updateStatus(user: UserComplianceNode, nextStatus: 'APPROVED' | 'UNVERIFIED', comments?: string): void {
    this.portfolioStore.updateKycStatus(user.email, nextStatus);
    // If audit modal is currently open for this user, refresh it
    if (this.selectedUserForAudit()?.email === user.email) {
      setTimeout(() => this.inspectAuditTrail(user), 500);
    }
  }

  /**
   * Resolves a secure preview link for the investor's identity document.
   */
  public getDocumentUrl(fileName?: string): string {
    if (!fileName) return '#';
    return this.complianceService.getSecureDocumentUrl(fileName);
  }
}