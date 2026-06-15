import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-kyc-ledger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-ledger.component.html'
})
export class KycLedgerComponent implements OnInit {
  // 📥 Injecting the centralized Signal State Store to manage total system TVL & compliance pools
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * ⚡ Lifecycle Initializer Hook
   * Refreshes the on-screen ledger array by hitting the SECP compliance queue route automatically on mount
   */
  public ngOnInit(): void {
    this.hydrateComplianceLedger();
  }

  /**
   * 🔄 Onshore Registry Hydration Dispatcher
   * Instructs the portfolio store to poll fresh OCR and identity documentation records
   */
  private hydrateComplianceLedger(): void {
    if (typeof this.portfolioStore['loadComplianceQueue'] === 'function') {
      // Calls the store thunk action to fetch data arrays from /api/v1/compliance/queue
      this.portfolioStore['loadComplianceQueue']();
    } else {
      console.warn('[COMPLIANCE REGISTRY WARNING]: loadComplianceQueue driver not initialized on state provider.');
    }
  }
}