import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioStore } from '../../store/portfolio.store';

export interface SovereignTransaction {
  id: string;
  title: string;
  category: string;
  timestamp: string;
  status: 'Settled' | 'Secured' | 'Processed' | 'Cleared';
  amountPKR: number;
  isPositive: boolean;
  avatarIcon: string;
  avatarBg: string;
}

export interface SovereignVaultCard {
  id: string;
  title: string;
  regulatoryCode: string;
  cardType: string;
  categoryKey: string;
  theme: 'lime' | 'emerald' | 'titanium';
  cardNumber: string;
  settlementEngine: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  protected readonly portfolioStore = inject(PortfolioStore);

  public readonly selectedPeriod = signal<'1Y' | '6M' | '30D'>('1Y');

  // Real Pakistani Sovereign Asset Cards
  public readonly vaultCards: SovereignVaultCard[] = [
    {
      id: 'vc-1',
      title: 'PSX Sovereign Equities',
      regulatoryCode: 'KSE-100 / CDC',
      cardType: 'Direct Equity Sub-Account',
      categoryKey: 'STOCKS',
      theme: 'lime',
      cardNumber: '•••• 8115',
      settlementEngine: 'T+2 KATS Clearing'
    },
    {
      id: 'vc-2',
      title: 'Sovereign Sukuk & Funds',
      regulatoryCode: 'SBP / SECP Shariah',
      cardType: 'Fixed Income Sukuk Pool',
      categoryKey: 'MUTUAL_FUNDS',
      theme: 'emerald',
      cardNumber: '•••• 6312',
      settlementEngine: 'Semi-Annual Coupon'
    },
    {
      id: 'vc-3',
      title: 'Sarafa Bullion Vault',
      regulatoryCode: '24K Karachi Sarafa',
      cardType: 'Physical Gold Tola Custody',
      categoryKey: 'GOLD_SILVER',
      theme: 'titanium',
      cardNumber: '•••• 4920',
      settlementEngine: 'Sovereign Depository'
    }
  ];

  // Real Pakistani Investment Market Transactions Ledger
  public readonly sovereignTransactions: SovereignTransaction[] = [
    {
      id: 'st-1',
      title: 'PSX Dividend Credit (ENGRO Corp)',
      category: 'KSE-100 Equity Cash Dividend',
      timestamp: 'Today, 11:32 AM',
      status: 'Settled',
      amountPKR: 45000,
      isPositive: true,
      avatarIcon: '📈',
      avatarBg: '#DCFCE7'
    },
    {
      id: 'st-2',
      title: '24K Sarafa Gold Tola Purchase',
      category: 'Bullion Physical Custody',
      timestamp: 'Yesterday, 03:15 PM',
      status: 'Secured',
      amountPKR: 284500,
      isPositive: false,
      avatarIcon: '🪙',
      avatarBg: '#FEF3C7'
    },
    {
      id: 'st-3',
      title: 'Meezan Islamic Sukuk Coupon',
      category: 'SBP Sovereign Fixed Yield',
      timestamp: '18 Oct, 09:40 AM',
      status: 'Settled',
      amountPKR: 32500,
      isPositive: true,
      avatarIcon: '📜',
      avatarBg: '#EFF6FF'
    },
    {
      id: 'st-4',
      title: 'DHA Phase 9 Plot Installment',
      category: 'Real Estate Capital Equity',
      timestamp: '15 Oct, 02:20 PM',
      status: 'Processed',
      amountPKR: 150000,
      isPositive: false,
      avatarIcon: '🏛️',
      avatarBg: '#F3E8FF'
    },
    {
      id: 'st-5',
      title: 'FBR WHT Section 236A Deduction',
      category: 'ATL Active Tax Filer Ledger',
      timestamp: '14 Oct, 10:14 AM',
      status: 'Cleared',
      amountPKR: 4875,
      isPositive: false,
      avatarIcon: '⚖️',
      avatarBg: '#FEE2E2'
    },
    {
      id: 'st-6',
      title: 'NADRA Bio-Verisys Biometric Fee',
      category: 'PDPB/SECP AML Identity Gate',
      timestamp: '12 Oct, 11:00 AM',
      status: 'Cleared',
      amountPKR: 100,
      isPositive: false,
      avatarIcon: '🆔',
      avatarBg: '#ECFDF5'
    }
  ];

  public ngOnInit(): void {
    if (this.portfolioStore.usersComplianceQueue().length === 0) {
      this.portfolioStore.hydrateStoreFromBackend();
    }
  }

  public setPeriod(p: '1Y' | '6M' | '30D'): void {
    this.selectedPeriod.set(p);
  }

  /**
   * Helper to retrieve calculated asset category holding value from real store
   */
  public getCategoryBalancePKR(categoryKey: string): number {
    const allAssets = Object.values(this.portfolioStore.userAssetRegistry()).flat();
    return allAssets
      .filter(a => a.category.toUpperCase() === categoryKey.toUpperCase())
      .reduce((sum, item) => sum + item.holdingValuePKR, 0);
  }

  public getCategoryBalanceUSD(categoryKey: string): number {
    const pkr = this.getCategoryBalancePKR(categoryKey);
    return Math.round(pkr / 278.45);
  }
}
