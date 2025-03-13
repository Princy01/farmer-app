import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Define an interface for Bids
interface Bid {
  transporter: string;
  bidAmount: number;
}

interface Order {
  id: string;
  buyer: string;
  location: string;
  items: { product: string; quantity: number; weight: string }[];
  deliveryDate: string;
  timeSlot: string;
  distance: number;
  bids: Bid[];
  selectedBid: Bid | null;
}

@Component({
  selector: 'app-orders-to-deliver',
  standalone: true,
  templateUrl: './orders-to-deliver.component.html',
  styleUrls: ['./orders-to-deliver.component.scss'],
  imports: [IonicModule, CommonModule, FormsModule]
})
export class OrdersToDeliverComponent {
  orders: Order[] = [
    {
      id: 'ORD12345',
      buyer: 'Retailer A',
      location: 'Market X',
      items: [
        { product: 'Tomatoes', quantity: 50, weight: '25kg' },
        { product: 'Potatoes', quantity: 30, weight: '20kg' }
      ],
      deliveryDate: '2025-03-15',
      timeSlot: '10:00 AM - 12:00 PM',
      distance: 15,
      bids: [],
      selectedBid: null
    },
    {
      id: 'ORD67890',
      buyer: 'Retailer B',
      location: 'Market Y',
      items: [
        { product: 'Onions', quantity: 40, weight: '20kg' },
        { product: 'Carrots', quantity: 20, weight: '15kg' }
      ],
      deliveryDate: '2025-03-16',
      timeSlot: '2:00 PM - 4:00 PM',
      distance: 25,
      bids: [],
      selectedBid: null
    }
  ];

  placeBid(orderId: string, transporter: string, bidAmount: number) {
    const order = this.orders.find(o => o.id === orderId);
    if (order) {
      order.bids.push({ transporter, bidAmount });
    }
  }

  totalQuantity(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
