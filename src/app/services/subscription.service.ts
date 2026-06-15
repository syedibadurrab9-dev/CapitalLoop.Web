import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  
  /**
   * 📡 Dynamic API Target Selector
   * Resolves baseline monetization and billing routes based on your active subnet configuration
   */
  private get baseApiUrl(): string {
    return `${this.authService.getApiBaseUrl()}/api/v1/subscriptions`;
  }

  /**
   * 🥇 Pricing Tier Catalog Fetcher
   * Fetches the complete tier array currently configured in the database
   */
  public getAllAvailablePlans(): Observable<SubscriptionPlanDetails[]> {
    return this.http.get<SubscriptionPlanDetails[]>(`${this.baseApiUrl}/plans`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 👑 Tier Modification Controller Override
   * Forces an administrative tier modification override for a targeted user
   * @param email Target user email identifier
   * @param planId The unique identifier of the target tier plan
   */
  public overrideUserSubscription(email: string, planId: string): Observable<void> {
    const payload = { email, planId };
    return this.http.post<void>(`${this.baseApiUrl}/override`, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🧾 Billing and Invoicing History Engine
   * Pulls structural transaction item histories and invoices for a user profile
   * @param email Target user email address
   */
  public getBillingHistory(email: string): Observable<UserSubscriptionHistory[]> {
    return this.http.get<UserSubscriptionHistory[]>(`${this.baseApiUrl}/history/${email}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 💸 Administrative Invoice Refund Dispatcher
   * Issues an administrative refund flag parameter for a specific invoice ID
   * @param invoiceId Target transaction hash identifier
   */
  public processInvoiceRefund(invoiceId: string): Observable<void> {
    return this.http.post<void>(`${this.baseApiUrl}/refund/${invoiceId}`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * 🛡️ Defensive Global Exception Tracking Routine
   */
  private handleError(error: any): Observable<never> {
    console.error('[SUBSCRIPTION_SERVICE_FAULT]: Encountered system billing pipeline communication exception.', error);
    return throwError(() => new Error(error.message || 'Server subscription cluster transaction error.'));
  }
}