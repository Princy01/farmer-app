import { Component } from '@angular/core';
import { IonicModule } from "@ionic/angular";
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { checkmarkCircle} from 'ionicons/icons';

interface PickItem {
  productName: string;
  quantityKg: number;
  batchConfirmed?: string;
  packed?: boolean;
  crateId?: string;
}

interface TransportDetails {
  driverId: string;
  vehicleId: string;
  estimatedDeliveryTime: string;
}

interface DispatchOrder {
  orderId: string;
  retailerName: string;
  mandiName?: string;
  picklist: PickItem[];
  status: 'Pending' | 'Picklist Ready' | 'Packing' | 'Dispatched' | 'Packed';
  transportInfo?: TransportDetails;
}

@Component({
  selector: 'app-dispatch-order-management',
  templateUrl: './dispatch-order-management.component.html',
  styleUrls: ['./dispatch-order-management.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class DispatchOrderManagementComponent {
  constructor() {
    addIcons({
      checkmarkCircle
    });
  }
  orders: DispatchOrder[] = [
    {
      orderId: 'ORD001',
      retailerName: 'GreenMart Retailer',
      picklist: [
        { productName: 'Tomatoes', quantityKg: 50 },
        { productName: 'Onions', quantityKg: 20 }
      ],
      status: 'Pending'
    },
    {
      orderId: 'ORD002',
      retailerName: 'FreshVeg Mandi',
      picklist: [
        { productName: 'Potatoes', quantityKg: 30 },
        { productName: 'Cabbage', quantityKg: 10 }
      ],
      status: 'Picklist Ready'
    }
  ];

  selectedOrder: DispatchOrder | null = null;

  viewDetails(order: DispatchOrder) {
    this.selectedOrder = order;
  }

  closeDetails() {
    this.selectedOrder = null;
  }

  generatePicklist(order: DispatchOrder) {
    order.status = 'Picklist Ready';
  }

  markAsPicked(order: DispatchOrder) {
    order.picklist.forEach(item => item.batchConfirmed = 'Batch #203');
    order.status = 'Packing';
  }

  markAsPacked(order: DispatchOrder) {
    order.picklist.forEach((item, i) => {
      item.packed = true;
      item.crateId = `Crate-${i + 1}`;
    });
    order.status = 'Packed';
  }

  assignTransport(order: DispatchOrder) {
    order.transportInfo = {
      driverId: 'DRV-101',
      vehicleId: 'VH-202',
      estimatedDeliveryTime: '2 hrs'
    };
    order.status = 'Dispatched';
  }
}
