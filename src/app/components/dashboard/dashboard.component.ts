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
  protected readonly portfolioStore = inject(PortfolioStore);

  public ngOnInit(): void {
    // Automatically trigger store hydration to guarantee fresh telemetry upon entering the station
    if (this.portfolioStore.usersComplianceQueue().length === 0) {
      this.portfolioStore.hydrateStoreFromBackend();
    }
  }
}