import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { personAddOutline, locationOutline, navigateOutline, calendarOutline, cashOutline, clipboardOutline } from 'ionicons/icons';
import { AssignDriverModalComponent } from '../assign-driver-modal/assign-driver-modal.component';

// Define the Transport Order model
interface TransportOrder {
  id: number;
  pickupLocation: string;
  deliveryLocation: string;
  deliveryDate: string;
  cost: number;
  assigned?: boolean; // Tracks if a driver & vehicle have been assigned
}

@Component({
  selector: 'app-accepted-orders',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './accepted-orders.component.html',
  styleUrls: ['./accepted-orders.component.scss'],
})
export class AcceptedOrdersComponent implements OnInit {
  acceptedOrders: TransportOrder[] = [];
  loading = true;

  constructor(private modalCtrl: ModalController) {
    // Add icons for use in templates
    addIcons({ personAddOutline, locationOutline, navigateOutline, calendarOutline, cashOutline, clipboardOutline });
  }

  ngOnInit() {
    this.loadAcceptedOrders();
  }

  /**
   * Fetch accepted transport orders from the backend (simulated for now)
   */
  loadAcceptedOrders(event?: any) {
    this.loading = true;

    // Simulated API Call
    setTimeout(() => {
      this.acceptedOrders = [
        {
          id: 1,
          pickupLocation: 'Farm A',
          deliveryLocation: 'Market X',
          deliveryDate: '2025-03-15',
          cost: 2500,
          assigned: false
        },
        {
          id: 2,
          pickupLocation: 'Farm B',
          deliveryLocation: 'Market Y',
          deliveryDate: '2025-03-16',
          cost: 3000,
          assigned: false
        }
      ];

      this.loading = false;
      if (event) event.target.complete();
    }, 1000);
  }

  /**
   * Opens the Assign Driver Modal and updates order status after assignment
   */
  async openAssignDriverModal(order: TransportOrder) {
    const modal = await this.modalCtrl.create({
      component: AssignDriverModalComponent,
      componentProps: { order },
    });

    await modal.present();

    // Handle data returned from the modal (if any)
    const { data } = await modal.onWillDismiss();
    if (data?.assigned) {
      // Update the order as assigned
      this.acceptedOrders = this.acceptedOrders.map(o =>
        o.id === order.id ? { ...o, assigned: true } : o
      );
    }
  }
}
