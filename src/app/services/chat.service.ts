import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ChatMessageBackupPayload {
  messageId: string;
  senderEmail: string;
  senderName: string;
  text: string;
  isAgentSender: boolean;
  timestamp: Date;
}

export interface SupportSessionSummary {
  investorEmail: string;
  investorName: string;
  status: 'UNASSIGNED' | 'ENGAGED' | 'RESOLVED';
  assignedAdvisorEmail?: string | null;
  assignedAdvisorName?: string | null;
  assignedAdvisorLicense?: string | null;
  openedAt: Date;
  engagedAt?: Date | null;
  lastActivityAt: Date;
  isOnline: boolean;
  unreadCountByAdvisor: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get baseApiUrl(): string {
    return `${environment.apiUrl}/api/chat`;
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
   * Pulls the historical persistent chat transcript database record for a given client user
   * @param clientEmail The target client email address profile
   */
  public getChatHistoryLog(clientEmail: string): Observable<ChatMessageBackupPayload[]> {
    return this.http.get<ChatMessageBackupPayload[]>(`${this.baseApiUrl}/history/${clientEmail}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches all active sessions with real-time advisor engagement states
   */
  public getActiveSessions(): Observable<SupportSessionSummary[]> {
    return this.http.get<SupportSessionSummary[]>(`${this.baseApiUrl}/sessions`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Claims an investor session for the authenticated advisor
   */
  public claimSession(clientEmail: string, license?: string, force: boolean = false): Observable<any> {
    const query = new URLSearchParams();
    if (license) query.set('license', license);
    if (force) query.set('force', 'true');
    const queryString = query.toString() ? `?${query.toString()}` : '';

    return this.http.post<any>(`${this.baseApiUrl}/claim/${clientEmail}${queryString}`, {}, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Releases an investor session back to the unassigned common pool
   */
  public releaseSession(clientEmail: string): Observable<any> {
    return this.http.post<any>(`${this.baseApiUrl}/release/${clientEmail}`, {}, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Fetches a list of historical or archived support sessions matching an audit request
   */
  public getClosedSessionsArchive(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseApiUrl}/archive`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Flushes unread notification indices on the server cluster for an active thread pool
   * @param clientEmail The target client email channel to acknowledge
   */
  public markThreadAsRead(clientEmail: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}/acknowledge/${clientEmail}`, {}, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Defensive global exception tracking routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[CHAT_SERVICE_FAULT]:', error);
    return throwError(() => new Error(error.message || 'Support hub message database synchronization fault.'));
  }
}
