import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ApplyCouponRequest {
  coupon_code: string;
  goods_amount: number;
}

export interface ApplyCouponResponse {
  valid: boolean;
  coupon_code: string;
  discount_percentage: number;
  original_handling_fee: number;
  discount_amount: number;
  final_handling_fee: number;
  message: string;
}

export interface AvailableCoupon {
  code: string;
  title: string;
  description: string;
  discountPercentage: number;
  badgeText: string;
  minOrderValue: number;
}

export const AVAILABLE_COUPONS: AvailableCoupon[] = [
  {
    code: 'MELATO',
    title: 'MELATO',
    description: '100% discount on handling fee',
    discountPercentage: 100,
    badgeText: '100% OFF',
    minOrderValue: 5000
  },
  {
    code: 'DISCOUNT50',
    title: 'DISCOUNT50',
    description: '50% discount on handling fee',
    discountPercentage: 50,
    badgeText: '50% OFF',
    minOrderValue: 5000
  }
];

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  applyCoupon(couponCode: string, goodsAmount: number): Observable<ApplyCouponResponse> {
    const payload: ApplyCouponRequest = {
      coupon_code: couponCode.trim().toUpperCase(),
      goods_amount: Number(goodsAmount) || 0
    };
    return this.http.post<ApplyCouponResponse>(`${this.apiUrl}/ApplyCoupon`, payload);
  }

  getAvailableCoupons(): AvailableCoupon[] {
    return AVAILABLE_COUPONS;
  }
}
