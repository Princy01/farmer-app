import { Component, Input } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TransportRequest } from './transport-requests.service';

export interface OrderItem {
  quantity: number;
  wholeseller_price: number;
  product: {
    product_name: string;
    nutrition_factor?: string;
  };
}

export interface Order {
  order_id: number;
  date_of_order: string;
  delivery_address: string;
  order_status: number;
  items: OrderItem[];
  discount_amount: number;
  tax_amount: number;
  total_order_amount: number;
  final_amount: number;
}

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Order Details - Job #{{ request?.job_id }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="dismiss()">
            <ion-icon name="close" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="order-modal-content">
      <!-- Summary Section -->
      <div class="modal-summary">
        <div class="summary-card">
          <div class="summary-item">
            <ion-icon name="cart-outline" class="summary-icon"></ion-icon>
            <div class="summary-info">
              <span class="summary-label">{{ 'ORDER_MODAL.TOTAL_ORDERS' | translate }}</span>
              <span class="summary-value">{{ request?.orders?.length || 0 }}</span>
            </div>
          </div>
          <div class="summary-item">
            <ion-icon name="cube-outline" class="summary-icon"></ion-icon>
            <div class="summary-info">
              <span class="summary-label">{{ 'ORDER_MODAL.TOTAL_ITEMS' | translate }}</span>
              <span class="summary-value">{{ getTotalItemCount() }}</span>
            </div>
          </div>
          <div class="summary-item">
            <ion-icon name="pricetag-outline" class="summary-icon"></ion-icon>
            <div class="summary-info">
              <span class="summary-label">{{ 'ORDER_MODAL.ORDER_VALUE' | translate }}</span>
              <span class="summary-value primary">₹{{ getTotalOrderValue() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Orders List -->
      <div class="orders-container">
          <div class="order-card" *ngFor="let order of request?.orders">
          <div class="order-card-header">
            <div class="order-number">
              <ion-icon name="receipt-outline"></ion-icon>
              <span>{{ 'ORDER_MODAL.ORDER' | translate }} #{{ order.order_id }}</span>
            </div>
            <div class="order-badge">
              <ion-badge [color]="getOrderStatusColor(order.order_status)">
                {{ getOrderStatusText(order.order_status) }}
              </ion-badge>
            </div>
          </div>

          <div class="order-meta">
            <div class="meta-item">
              <ion-icon name="calendar-outline"></ion-icon>
              <span>{{ formatDate(order.date_of_order) }}</span>
            </div>
            <div class="meta-item">
              <ion-icon name="location-outline"></ion-icon>
              <span>{{ order.delivery_address }}</span>
            </div>
          </div>

          <!-- Order Items -->
          <div class="items-section">
            <div class="items-header">
              <span>{{ 'ORDER_MODAL.ITEMS' | translate }} ({{ order.items.length }})</span>
            </div>
            <div class="item-list">
              <div class="item-row" *ngFor="let item of order.items">
                <div class="item-main">
                  <div class="item-name">{{ item.product.product_name }}</div>
                  <div class="item-details">
                    <span class="item-quantity">{{ item.quantity }} {{ 'ORDER_MODAL.UNITS' | translate }}</span>
                    <span class="item-separator">×</span>
                    <span class="item-price">₹{{ item.wholeseller_price }}</span>
                  </div>
                  <div class="item-nutrition" *ngIf="item.product.nutrition_factor">
                    <ion-icon name="nutrition-outline"></ion-icon>
                    <span>{{ item.product.nutrition_factor }}</span>
                  </div>
                </div>
                <div class="item-total">
                  ₹{{ (item.quantity * item.wholeseller_price).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="order-summary">
            <div class="summary-row" *ngIf="order.discount_amount > 0">
              <span>{{ 'ORDER_MODAL.SUBTOTAL' | translate }}</span>
              <span>₹{{ (order.total_order_amount + order.discount_amount).toFixed(2) }}</span>
            </div>
            <div class="summary-row" *ngIf="order.discount_amount > 0">
              <span>{{ 'ORDER_MODAL.DISCOUNT' | translate }}</span>
              <span class="discount">-₹{{ order.discount_amount.toFixed(2) }}</span>
            </div>
            <div class="summary-row" *ngIf="order.tax_amount > 0">
              <span>{{ 'ORDER_MODAL.TAX' | translate }}</span>
              <span>₹{{ order.tax_amount.toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <span>{{ 'ORDER_MODAL.TOTAL_AMOUNT' | translate }}</span>
              <span>₹{{ order.final_amount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <div class="modal-footer">
          <ion-button expand="block" color="primary" (click)="dismiss()">
            {{ 'COMMON.CLOSE' | translate }}
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .order-modal-content {
      --background: #f8f9fa;
    }

    .modal-summary {
      padding: 1rem;
      background: #fff;
      margin-bottom: 1rem;
    }

    .summary-card {
      display: flex;
      gap: 1rem;
      justify-content: space-around;
      padding: 1rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .summary-icon {
        font-size: 1.8rem;
        color: rgb(136, 172, 140);
      }

      .summary-info {
        display: flex;
        flex-direction: column;

        .summary-label {
          font-size: 0.75rem;
          color: #666;
          font-weight: 500;
        }

        .summary-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #333;

          &.primary {
            color: rgb(136, 172, 140);
          }
        }
      }
    }

    .orders-container {
      padding: 0 1rem 1rem;
    }

    .order-card {
      background: #fff;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:last-child {
        margin-bottom: 0;
      }
    }

    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f0f0f0;

      .order-number {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
        color: #333;

        ion-icon {
          color: rgb(136, 172, 140);
          font-size: 1.2rem;
        }
      }
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #666;

        ion-icon {
          color: rgb(136, 172, 140);
          font-size: 1rem;
        }
      }
    }

    .items-section {
      margin-bottom: 1rem;

      .items-header {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.75rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .item-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      transition: background 0.2s;

      &:hover {
        background: #e9ecef;
      }

      .item-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .item-name {
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }

        .item-details {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #666;

          .item-quantity {
            font-weight: 500;
          }

          .item-separator {
            color: #999;
          }

          .item-price {
            color: rgb(136, 172, 140);
            font-weight: 500;
          }
        }

        .item-nutrition {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: #4caf50;

          ion-icon {
            font-size: 0.9rem;
          }
        }
      }

      .item-total {
        font-weight: 600;
        color: rgb(136, 172, 140);
        font-size: 0.95rem;
        margin-left: 1rem;
      }
    }

    .order-summary {
      border-top: 2px solid #f0f0f0;
      padding-top: 0.75rem;
      margin-top: 1rem;

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0;
        font-size: 0.9rem;
        color: #666;

        .discount {
          color: #f44336;
        }

        &.total {
          font-weight: 700;
          font-size: 1.1rem;
          color: #333;
          padding-top: 0.75rem;
          border-top: 1px solid #e0e0e0;
          margin-top: 0.5rem;

          span:last-child {
            color: rgb(136, 172, 140);
          }
        }
      }
    }

    .modal-footer {
      padding: 1rem;

      ion-button {
        --border-radius: 12px;
        font-weight: 600;
        text-transform: none;
      }
    }

    @media (max-width: 480px) {
      .summary-card {
        flex-direction: column;
        gap: 0.75rem;
      }

      .summary-item {
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 8px;
      }

      .item-row {
        flex-direction: column;
        gap: 0.5rem;

        .item-total {
          margin-left: 0;
          align-self: flex-end;
        }
      }
    }
  `]
})
export class OrderDetailsModalComponent {
  @Input() request?: TransportRequest;

  constructor(private modalCtrl: ModalController, private translate: TranslateService) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  getTotalItemCount(): number {
    if (!this.request?.orders) return 0;
    return this.request.orders.reduce((total: number, order: Order) =>
      total + order.items.reduce((itemTotal: number, item: OrderItem) => itemTotal + item.quantity, 0), 0
    );
  }

  getTotalOrderValue(): string {
    if (!this.request?.orders) return '0.00';
    const total = this.request.orders.reduce((sum: number, order: Order) => sum + order.final_amount, 0);
    return total.toFixed(2);
  }

  getOrderStatusColor(status: number): string {
    switch (status) {
      case 1: return 'warning';  // Processing
      case 2: return 'success';  // Confirmed
      case 3: return 'warning';  // Payment Pending
      case 4: return 'danger';   // Rejected
      case 5: return 'success';  // Successful
      case 6: return 'medium';   // Cancelled
      case 7: return 'danger';   // Returned
      case 8: return 'warning';  // Processing
      case 9: return 'medium';   // Return Initiated
      case 10: return 'danger';  // Rejected
      default: return 'medium';
    }
  }

  getOrderStatusText(status: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'ORDER_STATUS.PROCESSING',
      2: 'ORDER_STATUS.CONFIRMED',
      3: 'ORDER_STATUS.PAYMENT_PENDING',
      4: 'ORDER_STATUS.REJECTED',
      5: 'ORDER_STATUS.SUCCESSFUL',
      6: 'ORDER_STATUS.CANCELLED',
      7: 'ORDER_STATUS.RETURNED',
      8: 'ORDER_STATUS.PROCESSING',
      9: 'ORDER_STATUS.RETURN_INITIATED',
      10: 'ORDER_STATUS.REJECTED'
    };
    return this.translate.instant(statusMap[status] || 'ORDER_STATUS.UNKNOWN');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(this.translate.currentLang || 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}