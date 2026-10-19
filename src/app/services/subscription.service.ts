import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface SubscriptionPlanDetails {
  planId: string;
  name: string;
  pricePKR: number;
  billingInterval: 'MONTHLY' | 'ANNUAL';
  features: string[];
}

export interface UserSubscriptionHistory {
  invoiceId: string;
  email: string;
  planName: string;
  amountPaid: number;
  transactionDate: Date;
  paymentStatus: 'PAID' | 'FAILED' | 'REFUNDED';
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly baseApiUrl = 'https://periodically-emails-whereas-evans.trycloudflare.com/api/subscriptions';

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
   * Fetches the complete tier array currently configured in the database
   */
  public getAllAvailablePlans(): Observable<SubscriptionPlanDetails[]> {
    return this.http.get<SubscriptionPlanDetails[]>(`${this.baseApiUrl}/plans`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Forces an administrative tier modification override for a targeted user
   * @param email Target user email identifier
   * @param planId The unique identifier of the target tier plan
   */
  public overrideUserSubscription(email: string, planId: string): Observable<void> {
    const payload = { email, planId };
    return this.http.post<void>(`${this.baseApiUrl}/override`, payload, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Pulls structural transaction item histories and invoices for a user profile
   * @param email Target user email address
   */
  public getBillingHistory(email: string): Observable<UserSubscriptionHistory[]> {
    return this.http.get<UserSubscriptionHistory[]>(`${this.baseApiUrl}/history/${email}`, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Issues an administrative refund flag parameter for a specific invoice ID
   * @param invoiceId Target transaction hash identifier
   */
  public processInvoiceRefund(invoiceId: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}/refund/${invoiceId}`, {}, {
      headers: this.getRequestHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Defensive global exception tracking routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[SUBSCRIPTION_SERVICE_FAULT]:', error);
    return throwError(() => new Error(error.message || 'Server subscription cluster transaction error.'));
  }
}