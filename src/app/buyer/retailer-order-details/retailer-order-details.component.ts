// - Adapt to backend response: order_status as number, no wholesalerName/Phone (remove), no paymentMethod (remove), etc.
// - Map status number to display (assuming common codes: 0=Placed, 1=Confirmed, 2=Packed, 3=Shipped, 4=In Transit, 5=Out for Delivery, 6=Delivered, 7=Cancelled)
// - No imageUrl in items (backend doesn't provide - can add later if needed)

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { RetailerOrderService, RetailerOrderDetails, OrderItem } from './retailer-order-details.service';

@Component({
  selector: 'app-retailer-order-details',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './retailer-order-details.component.html',
  styleUrls: ['./retailer-order-details.component.scss'],
})
export class RetailerOrderDetailsComponent implements OnInit {
  order!: RetailerOrderDetails;
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: RetailerOrderService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (!orderId || isNaN(+orderId)) {
      this.error = this.translate.instant('RETAILER_ORDER_DETAILS.ERROR_INVALID_ID');
      this.loading = false;
      return;
    }

    this.orderService.getOrderDetails(+orderId).subscribe({
      next: (data) => {
        this.order = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching order:', err);
        this.error = this.translate.instant('RETAILER_ORDER_DETAILS.ERROR_LOAD_FAILED');
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/buyer/retailer-order-tracking']);
  }

  getStatusLabel(status: number): string {
    const labels: { [key: number]: string } = {
      0: 'Placed',
      1: 'Confirmed',
      2: 'Packed',
      3: 'Shipped',
      4: 'In Transit',
      5: 'Out for Delivery',
      6: 'Delivered',
      7: 'Cancelled'
    };
    return labels[status] || 'Unknown';
  }

  getStatusColor(status: number): string {
    const colors: { [key: number]: string } = {
      0: 'medium',
      1: 'primary',
      2: 'secondary',
      3: 'tertiary',
      4: 'warning',
      5: 'warning',
      6: 'success',
      7: 'danger'
    };
    return colors[status] || 'medium';
  }

  getStatusIcon(status: number): string {
    const icons: { [key: number]: string } = {
      0: 'time-outline',
      1: 'checkmark-circle-outline',
      2: 'cube-outline',
      3: 'airplane-outline',
      4: 'car-outline',
      5: 'bicycle-outline',
      6: 'checkmark-done-circle',
      7: 'close-circle-outline'
    };
    return icons[status] || 'help-outline';
  }

  getTranslatedStatus(status: number): string {
    const label = this.getStatusLabel(status);
    const key = 'RETAILER_ORDER_DETAILS.STATUS_' + label.toUpperCase().replace(/\s+/g, '_');
    return this.translate.instant(key);
  }

  getSubtotal(): number {
    return this.order.total_order_amount;
  }

  getTotal(): number {
    return this.order.final_amount;
  }

  getItemTotal(item: OrderItem): number {
    return item.quantity * item.price;
  }
}