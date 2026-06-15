import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-risk-engine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-engine.component.html'
})
export class RiskEngineComponent implements OnInit {
  /**
   * 📊 Injects the central administrative signals engine.
   * Grants the template reactive tracking over computed exposure matrices.
   */
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * ⚡ Lifecycle Initializer Hook
   * Pulls fresh macro market allocations and sector density trends on initialization
   */
  public ngOnInit(): void {
    this.refreshRiskDataBaselines();
  }

  /**
   * 🔄 Risk Metric Refresh Pipeline
   * Instructs the centralized store container to poll and evaluate current asset pools
   */
  private refreshRiskDataBaselines(): void {
    if (typeof this.portfolioStore.loadComplianceQueue === 'function') {
      // Direct call to trigger background synchronization streams across the current LAN network profile
      this.portfolioStore.loadComplianceQueue();
    } else {
      console.warn('[RISK ENGINE WARNING]: loadComplianceQueue thread hook is uninitialized on the current state provider.');
    }
  }
}