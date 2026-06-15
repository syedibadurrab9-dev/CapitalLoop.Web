import { inject, computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, map, switchMap, pipe, tap, of } from 'rxjs';
import { NodeService } from '../services/node.service';
import { ComplianceService } from '../services/compliance.service';
import { SubscriptionService } from '../services/subscription.service';

// --- SYSTEM COMPLIANCE INTERFACES ---
export type KycVerificationStatus = 'UNVERIFIED' | 'PENDING' | 'APPROVED';

export interface UserComplianceNode {
  email: string;
  name: string;
  kycStatus: KycVerificationStatus;
  documentUrl?: string;
  submittedAt: Date;
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

// --- STORE STATE DEFINITION SCHEMA ---
export interface PortfolioState {
  usersComplianceQueue: UserComplianceNode[];
  activeNodeStatusList: APIIntegrationNode[];
  selectedUserEmail: string | null;
  userAssetRegistry: Record<string, PositionItem[]>;
  premiumUserRegistry: Set<string>;
  isSystemLoading: boolean;
  structuralErrorTrace: string | null;
}

const initialState: PortfolioState = {
  usersComplianceQueue: [],
  activeNodeStatusList: [],
  selectedUserEmail: null,
  userAssetRegistry: {},
  premiumUserRegistry: new Set<string>(),
  isSystemLoading: false,
  structuralErrorTrace: null
};

// ==============================================================================
// 📊 ENTERPRISE CAPITALLOOP HIGH-PERFORMANCE NGRX SIGNAL STORE MATRIX
// ==============================================================================
export const PortfolioStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  // ==============================================================================
  // 3. COMPUTED REACTIVE SIGNALS EXPOSURE LAYOUTS
  // ==============================================================================
  withComputed((state) => ({
    globalAumPKR: computed(() => {
      return Object.values(state.userAssetRegistry())
        .flat()
        .reduce((sum, item) => sum + item.holdingValuePKR, 0);
    }),

    totalPendingKycCount: computed(() => {
      return state.usersComplianceQueue().filter(u => u.kycStatus === 'PENDING').length;
    }),

    totalApprovedKycCount: computed(() => {
      return state.usersComplianceQueue().filter(u => u.kycStatus === 'APPROVED').length;
    }),

    premiumTierPercentage: computed(() => {
      const queue = state.usersComplianceQueue();
      if (queue.length === 0) return 0;
      const premiumCount = queue.filter(u => state.premiumUserRegistry().has(u.email)).length;
      return Math.round((premiumCount / queue.length) * 100);
    }),

    sectorExposurePercentages: computed(() => {
      const allAssets = Object.values(state.userAssetRegistry()).flat();
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
    }),

    selectedUserAssets: computed(() => {
      const email = state.selectedUserEmail();
      return email ? (state.userAssetRegistry()[email] || []) : [];
    }),

    selectedUserTotalPKR: computed(() => {
      const email = state.selectedUserEmail();
      const assets = email ? (state.userAssetRegistry()[email] || []) : [];
      return assets.reduce((sum, item) => sum + item.holdingValuePKR, 0);
    }),

    selectedUserKycStatus: computed<KycVerificationStatus>(() => {
      const email = state.selectedUserEmail();
      const user = state.usersComplianceQueue().find(u => u.email === email);
      return user ? user.kycStatus : 'UNVERIFIED';
    }),

    selectedUserIsPremium: computed(() => {
      const email = state.selectedUserEmail();
      return email ? state.premiumUserRegistry().has(email) : false;
    })
  })),

  // ==============================================================================
  // 4. ASYNC MUTATOR ACTIONS & OPTIMISTIC BACKEND WRITERS
  // ==============================================================================
  withMethods((state, nodeService = inject(NodeService), complianceService = inject(ComplianceService), subscriptionService = inject(SubscriptionService)) => ({
    
    setSelectedUserEmail: (email: string | null): void => {
      patchState(state, { selectedUserEmail: email });
    },

    /**
     * Pulls production state baselines simultaneously from all backend APIs using rxMethod wrapper
     */
    loadComplianceQueue: rxMethod<void>(
      pipe(
        tap(() => patchState(state, { isSystemLoading: true, structuralErrorTrace: null })),
        switchMap(() =>
          forkJoin({
            nodes: nodeService.getActiveNodes(),
            compliance: complianceService.getComplianceQueue(),
            plans: subscriptionService.getAllAvailablePlans()
          }).pipe(
            switchMap((basePayload) => {
              // 🚀 FIXED: Defensive check to normalize object schemas into arrays before looping maps
              const localizedComplianceArray: UserComplianceNode[] = Array.isArray(basePayload.compliance)
                ? basePayload.compliance
                : (basePayload.compliance ? [basePayload.compliance as unknown as UserComplianceNode] : []);

              const activeEmails = localizedComplianceArray.map(user => user.email);

              // Edge Case Isolation: If the compliance array returns empty, drop a clear, blank registry shortcut
              if (activeEmails.length === 0) {
                return of({ 
                  nodes: basePayload.nodes || [], 
                  compliance: [], 
                  assetRegistry: {} 
                });
              }

              return forkJoin(
                activeEmails.map(email => 
                  nodeService.getUserPositions(email).pipe(
                    map(positions => ({ email, positions }))
                  )
                )
              ).pipe(
                map(userPositionsArray => {
                  const assetRegistry: Record<string, PositionItem[]> = {};
                  userPositionsArray.forEach(item => {
                    assetRegistry[item.email] = item.positions || [];
                  });
                  return { 
                    nodes: basePayload.nodes || [],
                    compliance: localizedComplianceArray, 
                    assetRegistry 
                  };
                })
              );
            })
          )
        ),
        tap({
          next: (payload) => {
            const premiumSet = new Set<string>();
            payload.compliance.forEach(user => {
              if (user.kycStatus === 'APPROVED') premiumSet.add(user.email);
            });

            patchState(state, {
              activeNodeStatusList: payload.nodes,
              usersComplianceQueue: payload.compliance,
              userAssetRegistry: payload.assetRegistry,
              premiumUserRegistry: premiumSet,
              isSystemLoading: false
            });
          },
          error: (err) => {
            patchState(state, {
              structuralErrorTrace: err.message || 'Fatal store initialization handshake failure.',
              isSystemLoading: false
            });
          }
        })
      )
    ),

    /**
     * Commits identity status review updates with optimistic UI updates
     */
    updateKycStatus: (email: string, nextStatus: KycVerificationStatus): void => {
      const originalQueue = state.usersComplianceQueue();
      
      // OPTIMISTIC UPDATE: Instant rendering transition
      patchState(state, {
        usersComplianceQueue: originalQueue.map(user => 
          user.email === email ? { ...user, kycStatus: nextStatus } : user
        )
      });

      complianceService.evaluateKycStatus(email, nextStatus, 'Administrative clearance review verification.').subscribe({
        error: (err) => {
          patchState(state, { 
            structuralErrorTrace: `KYC update failed for ${email}. Reverting layout state.`,
            usersComplianceQueue: originalQueue // Safe structural rollback
          });
        }
      });
    },

    /**
     * Flips user subscription tiers optimistically
     */
    togglePremiumStatus: (email: string): void => {
      const originalSet = state.premiumUserRegistry();
      let targetPlanId = 'premium-monthly';
      const nextSet = new Set(originalSet);

      if (nextSet.has(email)) {
        nextSet.delete(email);
        targetPlanId = 'standard-free';
      } else {
        nextSet.add(email);
      }

      // OPTIMISTIC UPDATE: Structural cache set allocation
      patchState(state, { premiumUserRegistry: nextSet });

      subscriptionService.overrideUserSubscription(email, targetPlanId).subscribe({
        error: (err) => {
          patchState(state, {
            structuralErrorTrace: `Licensing modification failed for ${email}. Rolling back components.`,
            premiumUserRegistry: originalSet // Rollback state
          });
        }
      });
    },

    /**
     * Emergency Broker Platform Override Mutator
     */
    executeManualOverride: (nodeId: string, overridePrice: number): void => {
      const originalNodes = state.activeNodeStatusList();

      // OPTIMISTIC UPDATE: Push spot rates to view instantly
      patchState(state, {
        activeNodeStatusList: originalNodes.map(node => 
          node.id === nodeId ? { ...node, lastKnownPrice: overridePrice, latencyMs: 2 } : node
        )
      });

      nodeService.dispatchPriceOverride(nodeId, overridePrice).subscribe({
        error: (err) => {
          patchState(state, {
            structuralErrorTrace: `Emergency manual override failed for Node ${nodeId}.`,
            activeNodeStatusList: originalNodes // Revert on hardware rejection
          });
        }
      });
    }
  }))
);