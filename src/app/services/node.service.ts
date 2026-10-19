import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // Enterprise administration base endpoint for infrastructure microservices
  private readonly baseApiUrl = 'http://localhost:5156/api/nodes';

  /**
   * Helper utility to assemble authenticated bearer token headers
   */
  private getRequestHeaders(): HttpHeaders {
    const token = this.authService.appToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Fetches the current live status and rates of all system ingestion nodes
   */
  public getActiveNodes(): Observable<APIIntegrationNode[]> {
    return this.http.get<APIIntegrationNode[]>(this.baseApiUrl, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * 🚀 ADDED: Fetches a targeted user's declared asset allocations and position items 
   * Resolves the previous TS2339 compiler blocker inside PortfolioStore pipelines safely.
   * @param email The target customer profile lookup email index string
   */
  public getUserPositions(email: string): Observable<PositionItem[]> {
    return this.http.get<PositionItem[]>(`${this.baseApiUrl}/positions/${email}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Dispatches an emergency administrative price override parameters over HTTP
   * @param nodeId The target broker platform integration key identifier
   * @param overridePrice The manual price value to force into the engine
   */
  public dispatchPriceOverride(nodeId: string, overridePrice: number): Observable<void> {
    const payload = { nodeId, overridePrice };
    return this.http.post<void>(`${this.baseApiUrl}/override`, payload, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pulls detailed performance data and uptime summaries for a specific node broker
   * @param nodeId The unique identifier of the target system node
   */
  public getNodeTelemetrySnapshot(nodeId: string): Observable<NodeHealthSnapshot> {
    return this.http.get<NodeHealthSnapshot>(`${this.baseApiUrl}/telemetry/${nodeId}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Triggers an explicit network reboot command on a faulted ingestion link
   * @param nodeId The unique identifier of the stalled or offline node
   */
  public cycleNodeConnectionPool(nodeId: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}/reboot/${nodeId}`, {}, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Defensive global exception tracking routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[NODE_SERVICE_FAULT]:', error);
    return throwError(() => new Error(error.message || 'Infrastructure node core service communication fault.'));
  }
}