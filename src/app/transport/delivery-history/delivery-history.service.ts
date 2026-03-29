import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, retry, catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Delivery {
  job_id: string;
  pickup_address: string;
  drop_address: string;
  order_id: number;
  order_ids: number[];
  weight_kg: number;
  base_price: number;
  delivery_date: string;
  orders: DeliveryOrder[];
  hasDispute?: boolean;
}

export interface DeliveryOrder {
  order_id: number;
  delivery_address: string;
  order_status: string;
  final_amount: number;
  pickup_branch?: DeliveryBranch;
  dropoff_branch?: DeliveryBranch;
  items: DeliveryItem[];
}

export interface DeliveryBranch {
  branch_id: number;
  branch_name: string;
  branch_address: string;
  branch_number: string;
  city_id: number;
}

export interface DeliveryItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_name: string;
  wholeseller_price: number;
}

interface DeliveryHistoryResponse {
  deliveries: BackendDelivery[];
}

interface BackendDelivery {
  job_id: number;
  order_ids?: number[] | null;
  weight_kg: number;
  base_price: number;
  delivery_date: string;
  orders?: BackendOrder[] | null;
}

interface BackendOrder {
  order_id: number;
  delivery_address?: string;
  order_status?: string;
  final_amount?: number;
  pickup_branch?: {
    branch_id?: number;
    branch_name?: string;
    branch_address?: string;
    branch_number?: string;
    city_id?: number;
  };
  dropoff_branch?: {
    branch_id?: number;
    branch_name?: string;
    branch_address?: string;
    branch_number?: string;
    city_id?: number;
  };
  items?: Array<{
    product_id?: number;
    product_name?: string;
    quantity?: number;
    unit_name?: string;
    wholeseller_price?: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getDeliveryHistory(): Observable<{ deliveries: Delivery[] }> {
    return this.http.get<DeliveryHistoryResponse>(`${this.apiUrl}/transportation/delivery/delivery-history`).pipe(
      map((response) => ({
        deliveries: (response?.deliveries ?? []).map((delivery) => {
          const normalizedOrders = (delivery.orders ?? []).map((order) => ({
            order_id: order.order_id,
            delivery_address: order.delivery_address ?? '',
            order_status: order.order_status ?? '',
            final_amount: order.final_amount ?? 0,
            pickup_branch: {
              branch_id: order.pickup_branch?.branch_id ?? 0,
              branch_name: order.pickup_branch?.branch_name ?? '',
              branch_address: order.pickup_branch?.branch_address ?? '',
              branch_number: order.pickup_branch?.branch_number ?? '',
              city_id: order.pickup_branch?.city_id ?? 0,
            },
            dropoff_branch: {
              branch_id: order.dropoff_branch?.branch_id ?? 0,
              branch_name: order.dropoff_branch?.branch_name ?? '',
              branch_address: order.dropoff_branch?.branch_address ?? '',
              branch_number: order.dropoff_branch?.branch_number ?? '',
              city_id: order.dropoff_branch?.city_id ?? 0,
            },
            items: (order.items ?? []).map((item) => ({
              product_id: item.product_id ?? 0,
              product_name: item.product_name ?? '',
              quantity: item.quantity ?? 0,
              unit_name: item.unit_name ?? '',
              wholeseller_price: item.wholeseller_price ?? 0,
            })),
          }));

          const firstOrder = delivery.orders?.[0];
          return {
            job_id: String(delivery.job_id),
            order_id: firstOrder?.order_id ?? delivery.order_ids?.[0] ?? 0,
            order_ids: delivery.order_ids ?? [],
            pickup_address: firstOrder?.pickup_branch?.branch_address ?? '',
            drop_address: firstOrder?.dropoff_branch?.branch_address ?? '',
            weight_kg: delivery.weight_kg,
            base_price: delivery.base_price,
            delivery_date: delivery.delivery_date,
            orders: normalizedOrders,
            hasDispute: false,
          };
        }),
      })),
      timeout(30000),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  resolveDispute(jobId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/transportation/delivery/resolve-dispute`, { job_id: jobId }).pipe(
      timeout(30000),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}