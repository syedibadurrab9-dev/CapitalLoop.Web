import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortfolioStore } from '../../store/portfolio.store';

@Component({
  selector: 'app-kyc-ledger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyc-ledger.component.html', // Linked out seamlessly here
  encapsulation: ViewEncapsulation.None  // Active global design channel transmission
})
export class KycLedgerComponent {
  protected readonly portfolioStore = inject(PortfolioStore);
}