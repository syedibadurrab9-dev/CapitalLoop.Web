import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PortfolioStore, PositionItem } from '../../store/portfolio.store';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface StressScenario {
  id: string;
  name: string;
  devaluationPercentage: number;
  description: string;
}

export interface SectorStressRow {
  category: string;
  basePKR: number;
  stressedPKR: number;
  weightPct: number;
  nominalDeltaPKR: number;
  hedgeType: 'FULL_DOLLAR_HEDGE' | 'PARTIAL_EXPORT_HEDGE' | 'UNHEDGED_NOMINAL';
}

@Component({
  selector: 'app-risk-engine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './risk-engine.component.html',
  styleUrls: ['./risk-engine.component.scss'],
})
export class RiskEngineComponent {
  protected readonly portfolioStore = inject(PortfolioStore);

  // Exchange rate base (PKR per 1 USD)
  public readonly baseUsdRate = 278.50;

  // Scenarios
  public readonly predefinedScenarios: StressScenario[] = [
    {
      id: 'mild',
      name: 'Mild Inflationary Shock (-5%)',
      devaluationPercentage: 5,
      description: 'Minor SBP currency depreciation from import bill payments.',
    },
    {
      id: 'moderate',
      name: 'Moderate Macro Shift (-15%)',
      devaluationPercentage: 15,
      description: 'IMF structural adjustment and foreign reserve drawdown pressure.',
    },
    {
      id: 'severe',
      name: 'Severe Currency Crisis (-25%)',
      devaluationPercentage: 25,
      description: 'Critical balance of payments distress and sharp currency slide.',
    },
  ];

  // Reactive state signals
  public readonly selectedUserFilter = signal<string>('GLOBAL_AUM');
  public readonly simulatedDevaluationPct = signal<number>(15);

  // Active user options for selector
  public readonly userOptions = computed(() => {
    return this.portfolioStore.usersComplianceQueue().map((u) => u.email);
  });

  // Base assets in scope
  public readonly targetAssets = computed<PositionItem[]>(() => {
    const filter = this.selectedUserFilter();
    const registry = this.portfolioStore.userAssetRegistry();

    if (filter === 'GLOBAL_AUM') {
      return Object.values(registry).flat();
    }

    return registry[filter] || [];
  });

  // Base portfolio total in PKR
  public readonly baseTotalPKR = computed(() => {
    return this.targetAssets().reduce((sum, item) => sum + item.holdingValuePKR, 0);
  });

  // Base portfolio total in USD
  public readonly baseTotalUSD = computed(() => {
    const pkr = this.baseTotalPKR();
    return pkr > 0 ? Math.round((pkr / this.baseUsdRate) * 100) / 100 : 0;
  });

  // Simulated exchange rate after devaluation
  public readonly stressedUsdRate = computed(() => {
    const deval = this.simulatedDevaluationPct() / 100;
    if (deval >= 0.99) return this.baseUsdRate * 2;
    return Math.round((this.baseUsdRate / (1 - deval)) * 100) / 100;
  });

  // Stress calculation by sector
  public readonly sectorStressMatrix = computed<SectorStressRow[]>(() => {
    const assets = this.targetAssets();
    const total = this.baseTotalPKR();
    const devalRatio = this.simulatedDevaluationPct() / 100;

    const categories = ['MUTUAL_FUNDS', 'STOCKS', 'GOLD_SILVER', 'FOREIGN_CURRENCY', 'DIGITAL_ASSETS'];
    if (total === 0) {
      return categories.map((cat) => ({
        category: cat,
        basePKR: 0,
        stressedPKR: 0,
        weightPct: 0,
        nominalDeltaPKR: 0,
        hedgeType: this.getHedgeClassification(cat),
      }));
    }

    return categories.map((cat) => {
      const catAssets = assets.filter((a) => a.category === cat);
      const catBaseVal = catAssets.reduce((sum, a) => sum + a.holdingValuePKR, 0);
      const weight = Math.round((catBaseVal / total) * 1000) / 10;

      let stressedVal = catBaseVal;
      const hedgeType = this.getHedgeClassification(cat);

      if (hedgeType === 'FULL_DOLLAR_HEDGE') {
        // Gold, Foreign Currency, Crypto reprice 1:1 with USD devaluation in PKR terms
        stressedVal = catBaseVal * (1 + devalRatio);
      } else if (hedgeType === 'PARTIAL_EXPORT_HEDGE') {
        // PSX blue chips capture approx 45% of dollar gains through export revenue
        stressedVal = catBaseVal * (1 + devalRatio * 0.45);
      } else {
        // Nominal unhedged liquid PKR
        stressedVal = catBaseVal;
      }

      const delta = stressedVal - catBaseVal;

      return {
        category: cat,
        basePKR: catBaseVal,
        stressedPKR: Math.round(stressedVal),
        weightPct: weight,
        nominalDeltaPKR: Math.round(delta),
        hedgeType,
      };
    });
  });

  // Stressed total PKR
  public readonly stressedTotalPKR = computed(() => {
    return this.sectorStressMatrix().reduce((sum, row) => sum + row.stressedPKR, 0);
  });

  // Stressed total in USD
  public readonly stressedTotalUSD = computed(() => {
    const stressedPkr = this.stressedTotalPKR();
    const rate = this.stressedUsdRate();
    return rate > 0 ? Math.round((stressedPkr / rate) * 100) / 100 : 0;
  });

  // Net purchasing power loss in USD
  public readonly usdPurchasingPowerLoss = computed(() => {
    const base = this.baseTotalUSD();
    const stressed = this.stressedTotalUSD();
    return Math.max(0, Math.round((base - stressed) * 100) / 100);
  });

  // Net portfolio resilience score (0% to 100%)
  public readonly resilienceScore = computed(() => {
    const baseUsd = this.baseTotalUSD();
    if (baseUsd === 0) return 100;
    const stressedUsd = this.stressedTotalUSD();
    return Math.min(100, Math.max(0, Math.round((stressedUsd / baseUsd) * 100)));
  });

  // Composite Risk Level
  public readonly compositeRiskLevel = computed<RiskLevel>(() => {
    const resilience = this.resilienceScore();
    const deval = this.simulatedDevaluationPct();

    if (resilience >= 85) return 'LOW';
    if (resilience >= 70) return 'MEDIUM';
    if (resilience >= 50) return 'HIGH';
    return 'CRITICAL';
  });

  // Automated SECP & Devaluation Rebalancing Recommendations
  public readonly rebalancingRecommendations = computed<string[]>(() => {
    const matrix = this.sectorStressMatrix();
    const actions: string[] = [];

    const goldRow = matrix.find((r) => r.category === 'GOLD_SILVER');
    const cryptoRow = matrix.find((r) => r.category === 'DIGITAL_ASSETS');
    const mutualRow = matrix.find((r) => r.category === 'MUTUAL_FUNDS');
    const stocksRow = matrix.find((r) => r.category === 'STOCKS');

    const goldWeight = goldRow ? goldRow.weightPct : 0;
    const cryptoWeight = cryptoRow ? cryptoRow.weightPct : 0;
    const stocksWeight = stocksRow ? stocksRow.weightPct : 0;
    const mutualWeight = mutualRow ? mutualRow.weightPct : 0;

    // SECP 2026 Sandbox Rules & Devaluation guardrails
    if (goldWeight < 15) {
      actions.push(
        `SECP HEDGE DEFICIT: Precious Metals allocation is only ${goldWeight}% (Recommended min: 15%). Accumulate Physical Gold Tolas or Meezan Gold Fund to buffer against currency slide.`
      );
    }

    if (cryptoWeight > 15) {
      actions.push(
        `SECP POLICY BREACH: Digital Assets exposure is ${cryptoWeight}%, exceeding SECP maximum limit (15%). Trim ${cryptoWeight - 15}% and reallocate into capital-protected Sukuk.`
      );
    }

    if (stocksWeight > 50) {
      actions.push(
        `EQUITY OVER-CONCENTRATION: PSX holdings represent ${stocksWeight}% of net worth. Rotate into high-dividend dollar-earning exporters (Textiles, IT, Fertilizer).`
      );
    }

    if (mutualWeight > 45 && this.simulatedDevaluationPct() >= 15) {
      actions.push(
        `CASH DRAG WARNING: Liquid Mutual Funds and fixed deposits face severe purchasing power erosion. Allocate a portion into dollar-hedged assets.`
      );
    }

    if (actions.length === 0) {
      actions.push(
        'PORTFOLIO RESILIENT: Asset allocation aligns strictly with SECP diversification rules and displays adequate currency hedging buffers.'
      );
    }

    return actions;
  });

  public selectScenario(scenario: StressScenario): void {
    this.simulatedDevaluationPct.set(scenario.devaluationPercentage);
  }

  public onDevaluationChange(value: number): void {
    this.simulatedDevaluationPct.set(Number(value));
  }

  public onUserFilterChange(email: string): void {
    this.selectedUserFilter.set(email);
  }

  private getHedgeClassification(
    category: string
  ): 'FULL_DOLLAR_HEDGE' | 'PARTIAL_EXPORT_HEDGE' | 'UNHEDGED_NOMINAL' {
    switch (category) {
      case 'GOLD_SILVER':
      case 'FOREIGN_CURRENCY':
      case 'DIGITAL_ASSETS':
        return 'FULL_DOLLAR_HEDGE';
      case 'STOCKS':
        return 'PARTIAL_EXPORT_HEDGE';
      default:
        return 'UNHEDGED_NOMINAL';
    }
  }
}