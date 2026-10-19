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
  sessionToken: string;
  clientEmail: string;
  clientName: string;
  openedAt: Date;
  isArchived: boolean;
  assignedAgentEmail?: string;
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
   * Fetches a list of historical or archived support sessions matching an audit request
   */
  public getClosedSessionsArchive(): Observable<SupportSessionSummary[]> {
    return this.http.get<SupportSessionSummary[]>(`${this.baseApiUrl}/archive`, {
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
   * Administratively archives an active support session thread, removing it from the open live connection map
   * @param sessionToken The unique session token block to close
   */
  public archiveSupportSession(sessionToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}/session/archive/${sessionToken}`, {}, {
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