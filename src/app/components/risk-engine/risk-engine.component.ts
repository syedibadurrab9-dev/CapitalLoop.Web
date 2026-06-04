import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-risk-engine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-engine.component.html',
 // styleUrls: ['./risk-engine.component.scss']
})
export class RiskEngineComponent {
  /**
   * ✅ Injects the central administrative signals engine.
   * Grants the template reactive tracking over computed exposure matrices:
   * portfolioStore.sectorExposurePercentages()
   */
  protected readonly portfolioStore = inject(PortfolioStore);
}