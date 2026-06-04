import { Component, inject } from '@angular/core';
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
//  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  /**
   * ✅ Injects the central administration signal store state engine.
   * This grants our template instant reactive access to:
   * - globalAumPKR()
   * - totalPendingKycCount()
   * - activeNodeStatusList()
   * - sectorExposurePercentages()
   */
  protected readonly portfolioStore = inject(PortfolioStore);
}