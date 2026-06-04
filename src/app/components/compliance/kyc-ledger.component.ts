import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-kyc-ledger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-grid-layout">
      <header class="col-span-12" style="border-bottom: 1px solid #1F2937; padding-bottom: 16px;">
        <h2 style="font-size: 22px; font-weight: 700; color: #FFFFFF;">Citizen KYC Verification Ledger</h2>
        <p style="font-size: 13px; color: #9CA3AF; margin-top: 4px;">Review and authenticate pending registration documentation packages.</p>
      </header>

      <section class="executive-surface-card col-span-12">
        <div class="admin-table-wrapper">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>Profile Node</th>
                <th>Current Phase State</th>
                <th style="text-align: right;">Verification Processing Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of portfolioStore.usersComplianceQueue(); track user.email) {
                <tr>
                  <td>
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                      <strong style="color: #FFFFFF;">{{ user.name }}</strong>
                      <span style="font-size: 11px; color: #6B7280; font-family: monospace;">{{ user.email }}</span>
                    </div>
                  </td>
                  <td>
                    <span [style.color]="user.kycStatus === 'APPROVED' ? '#10B981' : '#F59E0B'" style="font-size: 12px; font-weight: 700;">
                      ● {{ user.kycStatus }}
                    </span>
                  </td>
                  <td style="text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                    @if (user.kycStatus !== 'APPROVED') {
                      <button class="admin-action-btn btn-success" style="padding: 6px 12px; font-size: 12px;" (click)="portfolioStore.updateKycStatus(user.email, 'APPROVED')">Approve Pass</button>
                    }
                    @if (user.kycStatus !== 'UNVERIFIED') {
                      <button class="admin-action-btn btn-danger" style="padding: 6px 12px; font-size: 12px;" (click)="portfolioStore.updateKycStatus(user.email, 'UNVERIFIED')">Reject Clear</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `
})
export class KycLedgerComponent {
  protected readonly portfolioStore = inject(PortfolioStore);
}