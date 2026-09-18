import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import {
  CFEnvironment,
  CFPaymentGateway,
  CFSession,
  CFUPIIntentCheckoutPayment,
  CFWebCheckoutPayment,
} from '@awesome-cordova-plugins/cashfree-pg';
import { load } from '@cashfreepayments/cashfree-js';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { CreateBatchOrderRequest } from '../order-confirmation/order.service';

export interface CheckoutSessionCreateResponse {
  status: string;
  message: string;
  data: {
    checkout_session_id: number;
    status: string;
    goods_amount: number;
    delivery_amount: number;
    gross_amount: number;
    platform_fee_amount: number;
    handling_charge_amount: number;
    payable_amount: number;
    order_groups_count: number;
    items_count: number;
  };
}

export interface CheckoutSessionDetailItem {
  selected_id?: number | null;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_id: number;
  unit_name: string;
  price: number;
  discount_amount: number;
  tax_amount: number;
  wholeseller_id: number;
  branch_id?: number | null;
}

export interface CheckoutSessionDetailGroup {
  wholeseller_id: number;
  branch_id?: number | null;
  items: CheckoutSessionDetailItem[];
  total_order_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
}

export interface CheckoutSessionDetailResponse {
  status: string;
  message: string;
  data: {
    checkout_session_id: number;
    status: string;
    retailer_branch_id: number;
    goods_amount: number;
    delivery_amount: number;
    gross_amount: number;
    platform_fee_amount: number;
    handling_charge_amount: number;
    payable_amount: number;
    delivery_address: string;
    current_payment_intent_id?: number | null;
    payment_started_at?: string | null;
    payment_failed_at?: string | null;
    payment_timeout_at?: string | null;
    seconds_until_timeout?: number | null;
    last_payment_error_code?: string | null;
    last_payment_error?: string | null;
    can_resume_payment: boolean;
    can_retry_payment: boolean;
    retry_attempts_used: number;
    max_retry_attempts: number;
    retry_available_at?: string | null;
    retry_block_reason?: string | null;
    can_cancel_checkout: boolean;
    order_groups: CheckoutSessionDetailGroup[];
    created_at: string;
    updated_at: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    order_id: string;
    checkout_session_id?: number | null;
    payment_intent_id?: number | null;
    payment_id?: string | null;
    status: string;
    amount: number;
    order_ids?: number[];
    checkout_status?: string | null;
    materialized_at?: string | null;
    transaction_id?: string | null;
    created_at: string;
    paid_at?: string | null;
    failure_reason?: string | null;
  };
}

export interface InitiatePaymentData {
  payment_id: string;
  status: string;
  payment_url?: string;
  checksum?: string;
  message?: string;
  order_id: string;
  checkout_session_id?: number;
  payment_intent_id?: number;
  gross_amount?: number;
  payment_session_id?: string;
  cf_order_id?: string;
  environment?: string;
  provider_code?: string;
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  data: InitiatePaymentData;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCheckoutSession(payload: CreateBatchOrderRequest): Observable<CheckoutSessionCreateResponse> {
    return this.http.post<CheckoutSessionCreateResponse>(`${this.apiUrl}/CreateRetailerCheckoutSession`, payload);
  }

  getCheckoutSession(checkoutSessionId: number): Observable<CheckoutSessionDetailResponse> {
    return this.http.get<CheckoutSessionDetailResponse>(`${this.apiUrl}/retailer/checkout-sessions/${checkoutSessionId}`);
  }

  initiatePayment(
    checkoutSessionId: number,
    paymentMethod: string,
    amount?: number,
    providerCode: string = 'cashfree'
  ): Observable<InitiatePaymentResponse> {
    const body: any = {
      checkout_session_id: checkoutSessionId,
      payment_method: paymentMethod,
      provider_code: providerCode
    };

    if (amount !== undefined && amount > 0) {
      body.amount = amount;
    }

    return this.http.post<InitiatePaymentResponse>(`${this.apiUrl}/payments/initiate`, body);
  }

  checkPaymentStatus(orderId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.apiUrl}/payments/status/${orderId}`);
  }

  async launchCashfreeCheckout(
    paymentSessionId: string,
    orderId: string,
    environmentMode: string,
    paymentMethod: string
  ): Promise<unknown> {
    if (!paymentSessionId.trim() || !orderId.trim()) {
      throw new Error('Cashfree payment session is incomplete');
    }

    const isProduction = environmentMode.trim().toLowerCase() === 'production';
    if (Capacitor.isNativePlatform()) {
      return this.launchCashfreeNativeCheckout(
        paymentSessionId,
        orderId,
        isProduction,
        paymentMethod
      );
    }

    const cashfree = await load({
      mode: isProduction ? 'production' : 'sandbox'
    });
    if (!cashfree) {
      throw new Error('Cashfree payment SDK could not be loaded');
    }

    return cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_modal'
    });
  }

  private launchCashfreeNativeCheckout(
    paymentSessionId: string,
    orderId: string,
    isProduction: boolean,
    paymentMethod: string
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      try {
        const environmentMode = isProduction
          ? CFEnvironment.PRODUCTION
          : CFEnvironment.SANDBOX;
        const session = new CFSession(paymentSessionId, orderId, environmentMode);

        CFPaymentGateway.setCallback({
          onVerify: (result) => resolve({ verified: true, result }),
          // Cashfree requires final status verification from the backend even
          // when the native SDK reports an error or the user closes checkout.
          onError: (error) => resolve({ verified: false, error })
        });

        if (paymentMethod.trim().toUpperCase() === 'UPI') {
          CFPaymentGateway.doUPIPayment(
            new CFUPIIntentCheckoutPayment(session, null)
          );
          return;
        }

        CFPaymentGateway.doWebCheckoutPayment(
          new CFWebCheckoutPayment(session, null)
        );
      } catch (error) {
        reject(error);
      }
    });
  }
}
