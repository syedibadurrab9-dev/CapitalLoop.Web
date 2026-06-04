import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-kyc-ledger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-grid-layout full-viewport-horizon">
      
      <header class="col-span-12 system-banner-shelf">
        <div class="banner-meta">
          <h2>Identity Verification Ledger</h2>
          <p>Review submitted user verification profiles, audit document files, and update system status parameters.</p>
        </div>
        
        <div class="banner-telemetry-pill">
          Pending Reviews: <span class="attention-count-val">{{ portfolioStore.totalPendingKycCount() }} files</span>
        </div>
      </header>

      <section class="executive-surface-card col-span-12 ledger-analytics-card">
        <div class="card-title-node">Verification Queue</div>
        
        <div class="admin-table-wrapper">
          <table class="admin-data-table">
            <thead>
              <tr>
                <th>User Account Profile</th>
                <th>Submission Date</th>
                <th>Verification Status</th>
                <th style="text-align: right;">Review Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of portfolioStore.usersComplianceQueue(); track user.email) {
                <tr>
                  <td>
                    <div class="table-user-profile-cell">
                      <div class="user-avatar-placeholder">📁</div>
                      <div class="profile-meta">
                        <strong>{{ user.name }}</strong>
                        <span class="user-email-label font-mono">{{ user.email }}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td class="font-mono table-timestamp-cell">
                    {{ user.submittedAt ? (user.submittedAt | date:'mediumDate') : 'Pending' }}
                  </td>
                  
                  <td>
                    <span class="compliance-badge-pill" [ngClass]="user.kycStatus.toLowerCase()">
                      {{ user.kycStatus }}
                    </span>
                  </td>
                  
                  <td style="text-align: right;">
                    <div class="table-action-btn-cluster">
                      @if (user.kycStatus !== 'APPROVED') {
                        <button class="admin-action-btn btn-success btn-table-scale" 
                                (click)="portfolioStore.updateKycStatus(user.email, 'APPROVED')">
                          Approve Profile
                        </button>
                      }
                      @if (user.kycStatus !== 'UNVERIFIED') {
                        <button class="admin-action-btn btn-danger btn-table-scale" 
                                (click)="portfolioStore.updateKycStatus(user.email, 'UNVERIFIED')">
                          Reject Account
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="empty-table-placeholder">
                    <div class="empty-state-content">
                      <span class="empty-icon">📂</span>
                      <p>No compliance or verification requests require review at this time.</p>
                    </div>
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