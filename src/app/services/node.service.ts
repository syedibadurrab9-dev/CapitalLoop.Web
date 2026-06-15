import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { APIIntegrationNode, PositionItem } from '../store/portfolio.store';

export interface NodeHealthSnapshot {
  nodeId: string;
  uptimePercentage: number;
  totalRequestsHandled: number;
  lastSyncTimestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NodeService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /**
   * 📡 Dynamic API Target Selector
   * Resolves baseline infrastructure routes organically based on your active subnet configuration
   */
  private get baseApiUrl(): string {
    return `${this.authService.getApiBaseUrl()}/api/v1/nodes`;
  }

  /**
   * 📈 Live System Telemetry Ingestor
   * Fetches the current live status and rates of all system ingestion nodes
   */
  public getActiveNodes(): Observable<APIIntegrationNode[]> {
    return this.http.get<APIIntegrationNode[]>(this.baseApiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 💼 User Asset Allocation Resolver
   * Fetches a targeted user's declared asset allocations and position items 
   * Resolves the previous TS2339 compiler blocker inside PortfolioStore pipelines safely.
   * @param email The target customer profile lookup email index string
   */
  public getUserPositions(email: string): Observable<PositionItem[]> {
    return this.http.get<PositionItem[]>(`${this.baseApiUrl}/positions/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * ⚠️ Emergency Rate Override Injector
   * Dispatches emergency administrative price override parameters over HTTP
   * @param nodeId The target broker platform integration key identifier
   * @param overridePrice The manual price value to force into the engine
   */
  public dispatchPriceOverride(nodeId: string, overridePrice: number): Observable<void> {
    const payload = { nodeId, overridePrice };
    return this.http.post<void>(`${this.baseApiUrl}/override`, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🔍 Performance Snapshot Analyzer
   * Pulls detailed performance data and uptime summaries for a specific node broker
   * @param nodeId The unique identifier of the target system node
   */
  public getNodeTelemetrySnapshot(nodeId: string): Observable<NodeHealthSnapshot> {
    return this.http.get<NodeHealthSnapshot>(`${this.baseApiUrl}/telemetry/${nodeId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🔄 Connection Pool Cycle Controller
   * Triggers an explicit network reboot command on a faulted ingestion link
   * @param nodeId The unique identifier of the stalled or offline node
   */
  public cycleNodeConnectionPool(nodeId: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}/reboot/${nodeId}`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🛡️ Defensive Global Exception Tracking Routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[NODE_SERVICE_FAULT]: Encountered system node pipeline communication exception.', error);
    return throwError(() => new Error(error.message || 'Infrastructure node core service communication fault.'));
  }
}