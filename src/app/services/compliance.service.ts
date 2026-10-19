import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { UserComplianceNode, KycVerificationStatus } from '../store/portfolio.store';

export interface ComplianceAuditTrailLog {
  logId: string;
  targetEmail: string;
  reviewerAgentEmail: string;
  actionPerformed: 'KYC_APPROVE' | 'KYC_REJECT' | 'DOCUMENT_RE-REQUEST' | 'ADMIN_OPERATOR_PROVISIONED' | 'ADMIN_OPERATOR_REACTIVATED' | 'ADMIN_OPERATOR_DEACTIVATED';
  comments?: string;
  timestamp: Date;
}

export interface AdminOperatorNode {
  id: string;
  name: string;
  email: string;
  role: string;
  licenseNumber?: string;
  isActive: boolean;
  onboardedUtc: string;
  onboardedBy: string;
}

export interface ProvisionOperatorPayload {
  name: string;
  email: string;
  role: string;
  licenseNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // Enterprise administration base endpoint for citizen validation pipelines
  private get baseApiUrl(): string {
    return `${environment.apiUrl}/api/compliance`;
  }

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
   * Fetches the full queue of incoming identity registration profiles
   */
  public getComplianceQueue(): Observable<UserComplianceNode[]> {
    return this.http.get<UserComplianceNode[]>(this.baseApiUrl, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Commits an administrative verification status modification to the master database ledger
   * @param email The unique citizen email address profile to review
   * @param status The next structural pipeline verification phase state
   * @param comments Optional reviewer notes explaining approval or refusal conditions
   */
  public evaluateKycStatus(email: string, status: KycVerificationStatus, comments?: string): Observable<void> {
    const payload = { email, status, comments };
    return this.http.post<void>(`${this.baseApiUrl}/evaluate`, payload, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pulls structural historical action records and security changes matching a target account
   * @param email The target account email to inspect
   */
  public getAccountAuditHistory(email: string): Observable<ComplianceAuditTrailLog[]> {
    return this.http.get<ComplianceAuditTrailLog[]>(`${this.baseApiUrl}/audit/${email}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Securely generates an ephemeral access link to inspect citizen document attachments
   * @param fileName The server file reference name string
   */
  public getSecureDocumentUrl(fileName: string): string {
    const token = this.authService.appToken();
    // Appends the operational authorization signature as a query variable for file stream access
    return `${this.baseApiUrl}/documents/preview/${fileName}?token=${token}`;
  }

  /**
   * Fetches the live registry of all authorized institutional admin operators and SECP consultants
   */
  public getAdminOperators(): Observable<AdminOperatorNode[]> {
    return this.http.get<AdminOperatorNode[]>(`${this.baseApiUrl}/operators`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Provisions and authorizes a new administrative operator with designated institutional role
   */
  public provisionOperator(payload: ProvisionOperatorPayload): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/operators`, payload, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Toggles the active/suspended clearance status of an operator
   */
  public toggleOperator(email: string): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/operators/toggle`, { email }, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Defensive global exception tracking routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[COMPLIANCE_SERVICE_FAULT]:', error);
    return throwError(() => new Error(error.message || 'Citizen verification pipeline server error.'));
  }
}