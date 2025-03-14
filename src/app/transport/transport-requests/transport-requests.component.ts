import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { AssignDriverModalComponent } from '../assign-driver-modal/assign-driver-modal.component';

interface DeliveryOrder {
  id: number;
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;
  type: string;
  distance: number;
  deliveryDate: string;
  suggestedPrice: number;
  accepted?: boolean; // Track acceptance in-memory
  assigned?: boolean; // Track if vehicle & driver are assigned
}

@Component({
  selector: 'app-transport-requests',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './transport-requests.component.html',
  styleUrls: ['./transport-requests.component.scss'],
})
export class TransportRequestsComponent implements OnInit {
  pendingDeliveries: DeliveryOrder[] = [];

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private modalController: ModalController
  ) {
    addIcons({ chevronForwardOutline });
  }

  ngOnInit() {
    this.loadPendingDeliveries();
  }

  loadPendingDeliveries() {
    // Sample orders (Replace with API response)
    this.pendingDeliveries = [
      {
        id: 1,
        pickupLocation: 'Mandi A',
        dropoffLocation: 'Retailer X',
        weight: 500,
        type: 'Vegetables',
        distance: 120,
        deliveryDate: '2025-03-17',
        suggestedPrice: 1500,
        accepted: false,
        assigned: false,
      },
      {
        id: 2,
        pickupLocation: 'Mandi B',
        dropoffLocation: 'Retailer Y',
        weight: 300,
        type: 'Pulses',
        distance: 80,
        deliveryDate: '2025-03-18',
        suggestedPrice: 1000,
        accepted: false,
        assigned: false,
      },
    ];
  }

  async acceptOrder(order: DeliveryOrder) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delivery',
      message: `Do you want to accept this delivery for ₹${order.suggestedPrice}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Accept',
          handler: () => {
            this.markAsAccepted(order);
          },
        },
      ],
    });
    await alert.present();
  }

  markAsAccepted(order: DeliveryOrder) {
    order.accepted = true; // Update status to show "Assign Vehicle & Driver"
    this.showToast('Delivery Accepted!');
  }

  async openAssignDriverModal(order: DeliveryOrder) {
    const modal = await this.modalController.create({
      component: AssignDriverModalComponent,
      componentProps: { order },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.assigned) {
      order.assigned = true;
      this.showToast(`Vehicle & Driver Assigned for Order ${order.id}`);
    }
  }

  async autoAssignTransporter() {
    if (this.pendingDeliveries.length === 0) {
      this.showToast('No orders to assign.');
      return;
    }

    // Accept and assign all orders
    this.pendingDeliveries.forEach(order => {
      order.accepted = true;
      order.assigned = true;
      this.showToast(`Order ${order.id} auto-assigned at ₹${order.suggestedPrice}`);
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }
}
