import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  /**
   * 📊 Injects the central administration signal store state engine.
   * Grants our template reactive access to total AUM, system nodes, and metrics.
   */
  protected readonly portfolioStore = inject(PortfolioStore);

  /**
   * ⚡ Lifecycle Initializer Hook
   * Refreshes the executive dashboard telemetry pools automatically on screen mounting
   */
  public ngOnInit(): void {
    this.refreshExecutiveMetrics();
  }

  /**
   * 🔄 Core Database Hydration Dispatcher
   * Forces a clean asynchronous pull down from all active backend gateway services
   */
  private refreshExecutiveMetrics(): void {
    if (typeof this.portfolioStore.loadComplianceQueue === 'function') {
      // Calls the store rxMethod to poll fresh network baselines safely
      this.portfolioStore.loadComplianceQueue();
    } else {
      console.warn('[DASHBOARD CRITICAL WARNING]: loadComplianceQueue action is missing from the state provider instance.');
    }
  }
}