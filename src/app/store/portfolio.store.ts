import { Injectable, computed, signal, inject } from '@angular/core';
import { forkJoin, map, switchMap, of, tap, catchError } from 'rxjs';
import { NodeService } from '../services/node.service';
import { ComplianceService, AdminOperatorNode } from '../services/compliance.service';
import { SubscriptionService } from '../services/subscription.service';

// --- SYSTEM COMPLIANCE INTERFACES ---
export type KycVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED';

export interface UserComplianceNode {
  email: string;
  name: string;
  kycStatus: KycVerificationStatus;
  documentUrl?: string;
  submittedAt: Date;
  documentType?: string;
  documentNumber?: string;
}

// --- PORTFOLIO POSITION INTERFACES ---
export type AssetSectorCategory = 'MUTUAL_FUNDS' | 'STOCKS' | 'GOLD_SILVER' | 'FOREIGN_CURRENCY' | 'DIGITAL_ASSETS';

export interface PositionItem {
  id: string;
  name: string;
  category: AssetSectorCategory;
  holdingValuePKR: number;
}

// --- NETWORK TELEMETRY INTERFACES ---
export interface APIIntegrationNode {
  id: string;
  name: string;
  lastKnownPrice: number;
  latencyMs: number;
  isHealthy: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioStore {
  // Inject backend HTTP REST data brokers
  private readonly nodeService = inject(NodeService);
  private readonly complianceService = inject(ComplianceService);
  private readonly subscriptionService = inject(SubscriptionService);

  // ==============================================================================
  // 1. CORE REAL-TIME WRITABLE SIGNALS STATE BASELINE
  // ==============================================================================
  public readonly usersComplianceQueue = signal<UserComplianceNode[]>([]);
  public readonly activeNodeStatusList = signal<APIIntegrationNode[]>([]);
  public readonly selectedUserEmail = signal<string | null>(null);

  // Live structural backend state mappings
  public readonly userAssetRegistry = signal<Record<string, PositionItem[]>>({});
  public readonly premiumUserRegistry = signal<Set<string>>(new Set());
  public readonly adminOperatorsList = signal<AdminOperatorNode[]>([]);
  
  // Loading and error state tracks for administrative reporting
  public readonly isSystemLoading = signal<boolean>(false);
  public readonly structuralErrorTrace = signal<string | null>(null);

  constructor() {
    // Automatically trigger initial database seed orchestration on startup
    this.hydrateStoreFromBackend();
  }

  // ==============================================================================
  // 2. ORCHESTRATION LAYER: BULK HYDRATION INITIALIZATION
  // ==============================================================================
  
  /**
   * Pulls production state baselines simultaneously from all backend APIs
   */
  public hydrateStoreFromBackend(): void {
    this.isSystemLoading.set(true);
    this.structuralErrorTrace.set(null);

    forkJoin({
      nodes: this.nodeService.getActiveNodes(),
      compliance: this.complianceService.getComplianceQueue(),
      plans: this.subscriptionService.getAllAvailablePlans(),
      operators: this.complianceService.getAdminOperators().pipe(catchError(() => of([])))
    }).pipe(
      switchMap((basePayload) => {
        // Build out a dynamic dictionary mapped array collection tracking each profile
        const activeEmails = basePayload.compliance.map(user => user.email);
        
        // 🚀 FIXED: Routed asset ledger fetching via nodeService instead of complianceService to prevent TS2339
        return forkJoin(
          activeEmails.map(email => 
            this.nodeService.getUserPositions(email).pipe(
              map(positions => ({ email, positions }))
            )
          )
        ).pipe(
          map(userPositionsArray => {
            const assetRegistry: Record<string, PositionItem[]> = {};
            userPositionsArray.forEach(item => {
              assetRegistry[item.email] = item.positions;
            });
            return { ...basePayload, assetRegistry };
          })
        );
      })
    ).subscribe({
      next: (payload) => {
        // Map streaming arrays directly into our fine-grained signals canvas
        this.activeNodeStatusList.set(payload.nodes);
        this.usersComplianceQueue.set(payload.compliance);
        this.userAssetRegistry.set(payload.assetRegistry);
        this.adminOperatorsList.set(payload.operators);
        
        // Dynamically build out our operational premium tracking cache maps
        const premiumSet = new Set<string>();
        payload.compliance.forEach(user => {
          if (user.kycStatus === 'APPROVED') {
            premiumSet.add(user.email);
          }
        });
        this.premiumUserRegistry.set(premiumSet);
        this.isSystemLoading.set(false);
      },
      error: (err) => {
        this.structuralErrorTrace.set(err.message || 'Fatal store initialization handshake failure.');
        this.isSystemLoading.set(false);
      }
    });
  }

  // ==============================================================================
  // 3. COMPUTED REACTIVE SIGNALS EXPOSURE LAYOUTS
  // ==============================================================================
  
  // Executive Dashboard Symmetrical Calculation Metrics
  public readonly globalAumPKR = computed(() => {
    return Object.values(this.userAssetRegistry())
      .flat()
      .reduce((sum, item) => sum + item.holdingValuePKR, 0);
  });

  public readonly totalPendingKycCount = computed(() => {
    return this.usersComplianceQueue().filter(u => u.kycStatus === 'PENDING').length;
  });

  public readonly totalApprovedKycCount = computed(() => {
    return this.usersComplianceQueue().filter(u => u.kycStatus === 'APPROVED').length;
  });

  public readonly premiumTierPercentage = computed(() => {
    const queue = this.usersComplianceQueue();
    if (queue.length === 0) return 0;
    const premiumCount = queue.filter(u => this.premiumUserRegistry().has(u.email)).length;
    return Math.round((premiumCount / queue.length) * 100);
  });

  // Dynamic Macro Market Exposure Grid Calculations
  public readonly sectorExposurePercentages = computed(() => {
    const allAssets = Object.values(this.userAssetRegistry()).flat();
    const total = allAssets.reduce((sum, item) => sum + item.holdingValuePKR, 0);
    
    const categories: AssetSectorCategory[] = ['MUTUAL_FUNDS', 'STOCKS', 'GOLD_SILVER', 'FOREIGN_CURRENCY', 'DIGITAL_ASSETS'];
    if (total === 0) return categories.map(c => ({ category: c, percentage: 0 }));

    return categories.map(cat => {
      const catTotal = allAssets.filter(a => a.category === cat).reduce((sum, item) => sum + item.holdingValuePKR, 0);
      return {
        category: cat,
        percentage: Math.round((catTotal / total) * 100)
      };
    });
  });

  // Dynamic Selected Contextual Escalation Support Getters
  public readonly selectedUserAssets = computed(() => {
    const email = this.selectedUserEmail();
    return email ? (this.userAssetRegistry()[email] || []) : [];
  });

  public readonly selectedUserTotalPKR = computed(() => {
    return this.selectedUserAssets().reduce((sum, item) => sum + item.holdingValuePKR, 0);
  });

  public readonly selectedUserKycStatus = computed<KycVerificationStatus>(() => {
    const email = this.selectedUserEmail();
    const user = this.usersComplianceQueue().find(u => u.email === email);
    return user ? user.kycStatus : 'UNVERIFIED';
  });

  public readonly selectedUserIsPremium = computed(() => {
    const email = this.selectedUserEmail();
    return email ? this.premiumUserRegistry().has(email) : false;
  });

  // ==============================================================================
  // 4. ASYNC MUTATOR ACTIONS & OPTIMISTIC BACKEND WRITERS
  // ==============================================================================
  
  /**
   * Commits an identity status review over HTTP and updates the UI state instantly
   */
  public updateKycStatus(email: string, nextStatus: KycVerificationStatus): void {
    // OPTIMISTIC UPDATE: Alter the UI signature immediately for lag-free interactions
    this.usersComplianceQueue.update(queue => 
      queue.map(user => user.email === email ? { ...user, kycStatus: nextStatus } : user)
    );

    // Persist mutation parameters downstream to the server database cluster
    this.complianceService.evaluateKycStatus(email, nextStatus, 'Administrative clearance review verification.').subscribe({
      error: (err) => {
        this.structuralErrorTrace.set(`KYC update failed for ${email}. Reverting layout state.`);
        this.hydrateStoreFromBackend(); // Rollback local state by re-fetching truth values on failure
      }
    });
  }

  /**
   * Flips subscription tiers and balances system plan allocations live
   */
  public togglePremiumStatus(email: string): void {
    let targetPlanId = 'premium-monthly';
    const isCurrentlyPremium = this.premiumUserRegistry().has(email);

    // OPTIMISTIC UPDATE: Update structural sets right away
    this.premiumUserRegistry.update(premiumSet => {
      const nextSet = new Set(premiumSet);
      if (nextSet.has(email)) {
        nextSet.delete(email);
        targetPlanId = 'standard-free';
      } else {
        nextSet.add(email);
      }
      return nextSet;
    });

    // Sync billing state modifications directly with the API
    this.subscriptionService.overrideUserSubscription(email, targetPlanId).subscribe({
      error: (err) => {
        this.structuralErrorTrace.set(`Licensing modification failed for ${email}. Rolling back components.`);
        this.hydrateStoreFromBackend(); // Rollback layout indicators safely
      }
    });
  }

  /**
   * Bypasses background ingestion hooks to force direct spot-rate mutations
   * 🚀 MATCHED: Aligned naming mapping signature with template executeManualOverride templates cleanly
   */
  public executeManualOverride(nodeId: string, overridePrice: number): void {
    // OPTIMISTIC UPDATE: Force the spot metric to render instantly
    this.activeNodeStatusList.update(nodes =>
      nodes.map(node => node.id === nodeId ? { ...node, lastKnownPrice: overridePrice, latencyMs: 2 } : node)
    );

    // Fire the hardware intercept command via HTTP REST to the broker architecture
    this.nodeService.dispatchPriceOverride(nodeId, overridePrice).subscribe({
      error: (err) => {
        this.structuralErrorTrace.set(`Emergency manual override failed for Node ${nodeId}.`);
        this.nodeService.getActiveNodes().subscribe({
          next: (freshNodes) => this.activeNodeStatusList.set(freshNodes)
        });
      }
    });
  }

  /**
   * Provisions and authorizes a new administrative operator with designated institutional role
   */
  public provisionOperator(name: string, email: string, role: string, licenseNumber?: string) {
    return this.complianceService.provisionOperator({ name, email, role, licenseNumber }).pipe(
      tap(() => this.refreshOperators())
    );
  }

  /**
   * Toggles the active/suspended clearance status of an operator
   */
  public toggleOperator(email: string): void {
    this.complianceService.toggleOperator(email).subscribe({
      next: () => this.refreshOperators(),
      error: (err) => {
        this.structuralErrorTrace.set(`Failed to toggle operator status: ${err.message}`);
      }
    });
  }

  /**
   * Refreshes the active Admin Operator directory
   */
  public refreshOperators(): void {
    this.complianceService.getAdminOperators().subscribe({
      next: (ops) => this.adminOperatorsList.set(ops),
      error: (err) => console.warn('Could not refresh operators:', err)
    });
  }
}