import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { UserComplianceNode, KycVerificationStatus } from '../store/portfolio.store';

export interface ComplianceAuditTrailLog {
  logId: string;
  targetEmail: string;
  reviewerAgentEmail: string;
  actionPerformed: 'KYC_APPROVE' | 'KYC_REJECT' | 'DOCUMENT_RE-REQUEST';
  comments?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ComplianceService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /**
   * 📡 Dynamic API Target Selector
   * Resolves baseline endpoints organically based on your active subnet configuration
   */
  private get baseApiUrl(): string {
    return `${this.authService.getApiBaseUrl()}/api/v1/compliance`;
  }

  /**
   * 📋 Compliance Queue Ledger Fetcher
   * Fetches the full queue of incoming identity registration profiles
   */
  public getComplianceQueue(): Observable<UserComplianceNode[]> {
    return this.http.get<UserComplianceNode[]>(this.baseApiUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * ⚖️ KYC Pipeline State Evaluator
   * Commits an administrative verification status modification to the master database ledger
   * @param email The unique user email address profile to review
   * @param status The next structural pipeline verification phase state
   * @param comments Optional reviewer notes explaining approval or refusal conditions
   */
  public evaluateKycStatus(email: string, status: KycVerificationStatus, comments?: string): Observable<void> {
    const payload = { email, status, comments };
    return this.http.post<void>(`${this.baseApiUrl}/evaluate`, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🔍 Audit Trail Track Engine
   * Pulls structural historical action records and security changes matching a target account
   * @param email The target account email to inspect
   */
  public getAccountAuditHistory(email: string): Observable<ComplianceAuditTrailLog[]> {
    return this.http.get<ComplianceAuditTrailLog[]>(`${this.baseApiUrl}/audit/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🖼️ Secure Document Delivery Gateway
   * Generates a dynamic ephemeral access link to inspect submitted file attachments
   * @param fileName The server file reference name string
   */
  public getSecureDocumentUrl(fileName: string): string {
    const token = this.authService.appToken();
    // Resolves base routes dynamically and appends the token for secure file stream bypass
    return `${this.baseApiUrl}/documents/preview/${fileName}?token=${token}`;
  }

  /**
   * 🛡️ Defensive Global Exception Tracking Routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[COMPLIANCE_SERVICE_FAULT]: Encountered verification ledger pipeline exception.', error);
    return throwError(() => new Error(error.message || 'Citizen verification pipeline server error.'));
  }
}