import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TranslatePipe } from '@ngx-translate/core';

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  imageUrl?: string;
}

interface Order {
  orderId: string;
  placedAt: string;
  status: 'Placed' | 'Confirmed' | 'Packed' | 'Shipped' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  wholesalerName: string;
  wholesalerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  deliveredAt?: string;
  paymentMethod: string;
  orderNotes?: string;
}

@Component({
  selector: 'app-retailer-order-tracking',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './retailer-order-tracking.component.html',
  styleUrls: ['./retailer-order-tracking.component.scss'],
})
export class RetailerOrderTrackingComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  selectedFilter: string = 'all';
  isLoading: boolean = false;

  constructor(private router: Router, private translate: TranslateService) {}

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.isLoading = true;

    // Simulate API delay
    setTimeout(() => {
      // Mock data - replace with actual API call
      this.orders = [
        {
          orderId: 'ORD-2025-001',
          placedAt: '2025-09-24T10:30:00Z',
          status: 'In Transit',
          wholesalerName: 'Rajesh Kumar Wholesaler',
          wholesalerPhone: '+91 98765 43210',
          deliveryAddress: '123 Market Street, Connaught Place, New Delhi - 110001',
          estimatedDelivery: '2025-09-26T18:00:00Z',
          trackingNumber: 'TRK123456789',
          totalAmount: 2500,
          paymentMethod: 'UPI',
          items: [
            {
              productName: 'Organic Tomatoes',
              quantity: 10,
              unitPrice: 80,
              total: 800,
              imageUrl: 'https://images.unsplash.com/photo-1546470427-227e6e63f38e?w=100&h=100&fit=crop'
            },
            {
              productName: 'Fresh Onions',
              quantity: 15,
              unitPrice: 60,
              total: 900,
              imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=100&h=100&fit=crop'
            },
            {
              productName: 'Green Chilies',
              quantity: 5,
              unitPrice: 160,
              total: 800,
              imageUrl: 'https://images.unsplash.com/photo-1583328656345-a1978d84c163?w=100&h=100&fit=crop'
            }
          ]
        },
        {
          orderId: 'ORD-2025-002',
          placedAt: '2025-09-23T14:20:00Z',
          status: 'Confirmed',
          wholesalerName: 'Priya Sharma Traders',
          wholesalerPhone: '+91 87654 32109',
          deliveryAddress: '456 Commercial Complex, Bandra West, Mumbai - 400050',
          estimatedDelivery: '2025-09-27T16:00:00Z',
          totalAmount: 3200,
          paymentMethod: 'Card',
          items: [
            {
              productName: 'Fresh Carrots',
              quantity: 20,
              unitPrice: 70,
              total: 1400,
              imageUrl: 'https://images.unsplash.com/photo-1582515073490-39981397c445?w=100&h=100&fit=crop'
            },
            {
              productName: 'Organic Potatoes',
              quantity: 25,
              unitPrice: 72,
              total: 1800,
              imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop'
            }
          ]
        },
        {
          orderId: 'ORD-2025-003',
          placedAt: '2025-09-22T09:15:00Z',
          status: 'Delivered',
          wholesalerName: 'Amit Patel & Co',
          wholesalerPhone: '+91 76543 21098',
          deliveryAddress: '789 Retail Plaza, Koramangala, Bangalore - 560034',
          deliveredAt: '2025-09-22T17:30:00Z',
          totalAmount: 4500,
          paymentMethod: 'Cash on Delivery',
          items: [
            {
              productName: 'Fresh Spinach',
              quantity: 30,
              unitPrice: 50,
              total: 1500,
              imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop'
            },
            {
              productName: 'Organic Broccoli',
              quantity: 12,
              unitPrice: 120,
              total: 1440,
              imageUrl: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop'
            },
            {
              productName: 'Bell Peppers',
              quantity: 18,
              unitPrice: 90,
              total: 1620,
              imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=100&h=100&fit=crop'
            }
          ]
        },
        {
          orderId: 'ORD-2025-004',
          placedAt: '2025-09-20T16:45:00Z',
          status: 'Cancelled',
          wholesalerName: 'Sunita Singh Wholesale',
          wholesalerPhone: '+91 65432 10987',
          deliveryAddress: '321 Shopping Center, T. Nagar, Chennai - 600017',
          totalAmount: 1800,
          paymentMethod: 'UPI',
          orderNotes: 'Cancelled due to product unavailability',
          items: [
            {
              productName: 'Fresh Cauliflower',
              quantity: 8,
              unitPrice: 90,
              total: 720,
              imageUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=100&h=100&fit=crop'
            },
            {
              productName: 'Green Beans',
              quantity: 12,
              unitPrice: 90,
              total: 1080,
              imageUrl: 'https://images.unsplash.com/photo-1593594107081-6d610b70b412?w=100&h=100&fit=crop'
            }
          ]
        }
      ];

      // Sort by newest first
      this.orders.sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      this.filteredOrders = [...this.orders];
      this.isLoading = false;
    }, 1000);
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    if (value) {
      this.filterOrders(value);
    }
  }

  filterOrders(status: string) {
    this.selectedFilter = status;
    if (status === 'all') {
      this.filteredOrders = [...this.orders];
    } else if (status === 'active') {
      // Active orders include: Placed, Confirmed, Packed, Shipped, In Transit, Out for Delivery
      this.filteredOrders = this.orders.filter(order =>
        ['Placed', 'Confirmed', 'Packed', 'Shipped', 'In Transit', 'Out for Delivery'].includes(order.status)
      );
    } else {
      this.filteredOrders = this.orders.filter(order =>
        order.status.toLowerCase() === status.toLowerCase()
      );
    }
  }

  getStatusColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'Placed': 'medium',
      'Confirmed': 'primary',
      'Packed': 'secondary',
      'Shipped': 'tertiary',
      'In Transit': 'warning',
      'Out for Delivery': 'warning',
      'Delivered': 'success',
      'Cancelled': 'danger'
    };
    return statusColors[status] || 'medium';
  }

  getStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'Placed': 'time-outline',
      'Confirmed': 'checkmark-circle-outline',
      'Packed': 'cube-outline',
      'Shipped': 'airplane-outline',
      'In Transit': 'car-outline',
      'Out for Delivery': 'bicycle-outline',
      'Delivered': 'checkmark-done-circle',
      'Cancelled': 'close-circle-outline'
    };
    return statusIcons[status] || 'help-outline';
  }

  onOrderClick(order: Order) {
    // Navigate directly to order details page
    this.navigateToOrderDetails(order);
  }

  navigateToOrderDetails(order: Order) {
    // Navigate to retailer-order-details page with order data
    this.router.navigate(['/buyer/retailer-order-details'], {
      state: { order: order }
    });
  }

  getTotalItems(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getOrderProgress(status: string): number {
    const progressMap: { [key: string]: number } = {
      'Placed': 0.2,
      'Confirmed': 0.4,
      'Packed': 0.6,
      'Shipped': 0.7,
      'In Transit': 0.8,
      'Out for Delivery': 0.9,
      'Delivered': 1.0,
      'Cancelled': 0
    };
    return progressMap[status] || 0;
  }

  getTranslatedStatus(status: string): string {
    const key = 'RETAILER_ORDER_DETAILS.STATUS_' + status.toUpperCase().replace(/\s+/g, '_');
    return this.translate.instant(key);
  }

  getTranslatedFilterLabel(filter: string): string {
    const key = 'RETAILER_ORDER_TRACKING.FILTER_' + filter.toUpperCase();
    return this.translate.instant(key);
  }

  getNoOrdersMessage(filter: string): string {
    if (filter === 'all') {
      return this.translate.instant('RETAILER_ORDER_TRACKING.NO_ORDERS_DESC_ALL');
    } else {
      return this.translate.instant('RETAILER_ORDER_TRACKING.NO_ORDERS_DESC_FILTER', { filter: this.getTranslatedFilterLabel(filter) });
    }
  }
}