import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PortfolioStore } from '../../store/portfolio.store';

export interface DashboardTransaction {
  id: string;
  name: string;
  category: string;
  date: string;
  status: 'Success' | 'Failed' | 'Pending';
  amount: number;
  isPositive: boolean;
  avatarIcon: string;
  avatarBg: string;
}

export interface AssetCardItem {
  id: string;
  title: string;
  accountType: 'Debit Card' | 'Credit Card' | 'Vault Card';
  balancePKR: number;
  balanceUSD: number;
  cardNumber: string;
  expiry: string;
  theme: 'lime' | 'emerald' | 'titanium';
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
  public readonly activeCardTab = signal<number>(0);

  public readonly cardsList: AssetCardItem[] = [
    {
      id: 'c1',
      title: 'PSX Equities Tier',
      accountType: 'Debit Card',
      balancePKR: 2150000,
      balanceUSD: 48658.24,
      cardNumber: '**** 5682',
      expiry: '02/29',
      theme: 'lime'
    },
    {
      id: 'c2',
      title: 'Sovereign Sukuk Pool',
      accountType: 'Credit Card',
      balancePKR: 1850000,
      balanceUSD: 115412.00,
      cardNumber: '**** 7706',
      expiry: '04/26',
      theme: 'emerald'
    },
    {
      id: 'c3',
      title: 'Sarafa Bullion Vault',
      accountType: 'Vault Card',
      balancePKR: 852500,
      balanceUSD: 68241.56,
      cardNumber: '**** 4548',
      expiry: '07/28',
      theme: 'titanium'
    }
  ];

  public readonly transactions: DashboardTransaction[] = [
    {
      id: 't1',
      name: 'James Taylor',
      category: 'Transfer',
      date: '8 Sep, 11:32 AM',
      status: 'Success',
      amount: 500.00,
      isPositive: false,
      avatarIcon: '👤',
      avatarBg: '#E0F2FE'
    },
    {
      id: 't2',
      name: "McDonald's",
      category: 'Purchase',
      date: '8 Sep, 11:02 AM',
      status: 'Success',
      amount: 29.99,
      isPositive: false,
      avatarIcon: '🍔',
      avatarBg: '#FEF3C7'
    },
    {
      id: 't3',
      name: 'PayPal Global',
      category: 'Deposit',
      date: '8 Sep, 04:35 AM',
      status: 'Success',
      amount: 300.25,
      isPositive: true,
      avatarIcon: '🅿️',
      avatarBg: '#EFF6FF'
    },
    {
      id: 't4',
      name: 'Apple Services',
      category: 'Purchase',
      date: '7 Sep, 09:20 PM',
      status: 'Failed',
      amount: 299.00,
      isPositive: false,
      avatarIcon: '🍎',
      avatarBg: '#FEE2E2'
    },
    {
      id: 't5',
      name: 'Adobe Creative Cloud',
      category: 'Subscription',
      date: '6 Sep, 10:14 AM',
      status: 'Success',
      amount: 52.00,
      isPositive: false,
      avatarIcon: '🎨',
      avatarBg: '#F3E8FF'
    },
    {
      id: 't6',
      name: 'Walmart Supercenter',
      category: 'Groceries',
      date: '6 Aug, 10:00 PM',
      status: 'Success',
      amount: 18.75,
      isPositive: false,
      avatarIcon: '🛒',
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
}
