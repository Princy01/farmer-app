import { Component, OnInit, inject } from '@angular/core';
import { AlertController, ToastController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, funnelOutline, swapVerticalOutline } from 'ionicons/icons';
import { AssignDriverModalComponent } from '../assign-driver-modal/assign-driver-modal.component';
import { FilterModalComponent } from '../filter-modal/filter-modal.component';
import { SortModalComponent } from '../sort-modal/sort-modal.component';
import { formatDate } from '@angular/common';

interface DeliveryOrder {
  id: number;
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;
  type: string;
  distance: number;
  deliveryDate: string;
  suggestedPrice: number;
  accepted?: boolean;
  assigned?: boolean;
}

@Component({
  selector: 'app-transport-requests',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './transport-requests.component.html',
  styleUrls: ['./transport-requests.component.scss'],
})
export class TransportRequestsComponent implements OnInit {
  private modalController = inject(ModalController);

  pendingDeliveries: DeliveryOrder[] = [];
  originalDeliveries: DeliveryOrder[] = []; // Store original dataset
  evenOrders: DeliveryOrder[] = [];
  oddOrders: DeliveryOrder[] = [];

  // Transporter Load Constraints
  minLoad: number = 300;
  maxLoad: number = 1000;
  currentLoad: number = 0;

  // Sorting & Filtering States
  sortOption: string = '';
  priorityDeliveries = false;
  delayedDeliveries = false;
  sharedDeliveries = false;
  singleDelivery = false;

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    addIcons({ chevronForwardOutline, funnelOutline, swapVerticalOutline });
  }

  ngOnInit() {
    this.loadPendingDeliveries();
  }

  loadPendingDeliveries() {
    this.originalDeliveries = [
      { id: 1, pickupLocation: 'Mandi A', dropoffLocation: 'Retailer X', weight: 500, type: 'Vegetables', distance: 120, deliveryDate: '2025-03-17', suggestedPrice: 1500, accepted: false, assigned: false },
      { id: 2, pickupLocation: 'Mandi B', dropoffLocation: 'Retailer Y', weight: 300, type: 'Pulses', distance: 80, deliveryDate: '2025-03-18', suggestedPrice: 1000, accepted: false, assigned: false },
      { id: 3, pickupLocation: 'Mandi C', dropoffLocation: 'Retailer Z', weight: 400, type: 'Fruits', distance: 95, deliveryDate: '2025-03-19', suggestedPrice: 1300, accepted: false, assigned: false },
      { id: 4, pickupLocation: 'Mandi D', dropoffLocation: 'Retailer A', weight: 600, type: 'Grains', distance: 110, deliveryDate: '2025-03-20', suggestedPrice: 1700, accepted: false, assigned: false },
      { id: 5, pickupLocation: 'Mandi E', dropoffLocation: 'Retailer B', weight: 200, type: 'Dairy', distance: 50, deliveryDate: '2025-03-21', suggestedPrice: 800, accepted: false, assigned: false },
      { id: 6, pickupLocation: 'Mandi F', dropoffLocation: 'Retailer C', weight: 700, type: 'Spices', distance: 140, deliveryDate: '2025-03-22', suggestedPrice: 2000, accepted: false, assigned: false },
    ];

    // Initialize pending deliveries
    this.pendingDeliveries = [...this.originalDeliveries];
    this.applyFilters();
  }

  async openFilterModal() {
    const modal = await this.modalController.create({
      component: FilterModalComponent,
      componentProps: {
        priorityDeliveries: this.priorityDeliveries,
        delayedDeliveries: this.delayedDeliveries,
        sharedDeliveries: this.sharedDeliveries,
        singleDelivery: this.singleDelivery,
      },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.priorityDeliveries = data.priorityDeliveries;
      this.delayedDeliveries = data.delayedDeliveries;
      this.sharedDeliveries = data.sharedDeliveries;
      this.singleDelivery = data.singleDelivery;
      this.applyFilters();
    }
  }

  applyFilters() {
    let filteredOrders = [...this.originalDeliveries];

    // Apply transporter's min/max load constraints
    filteredOrders = filteredOrders.filter(order =>
      order.weight >= this.minLoad && order.weight <= this.maxLoad
    );

    if (this.priorityDeliveries) {
      filteredOrders = filteredOrders.filter(order => order.distance < 100);
    }
    if (this.delayedDeliveries) {
      filteredOrders = filteredOrders.filter(order => new Date(order.deliveryDate) < new Date());
    }
    if (this.sharedDeliveries) {
      filteredOrders = filteredOrders.filter(order => order.weight <= 500);
    }
    if (this.singleDelivery) {
      filteredOrders = filteredOrders.filter(order => order.weight > 500);
    }

    this.pendingDeliveries = filteredOrders;
    this.splitOrders();
  }

  async openSortModal() {
    const modal = await this.modalController.create({
      component: SortModalComponent,
      componentProps: { sortOption: this.sortOption },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.sortOption = data.sortOption;
      this.applySort();
    }
  }

  applySort() {
    switch (this.sortOption) {
      case 'distance-asc':
        this.pendingDeliveries.sort((a, b) => a.distance - b.distance);
        break;
      case 'distance-desc':
        this.pendingDeliveries.sort((a, b) => b.distance - a.distance);
        break;
      case 'price-desc':
        this.pendingDeliveries.sort((a, b) => b.suggestedPrice - a.suggestedPrice);
        break;
      case 'quantity-asc':
        this.pendingDeliveries.sort((a, b) => a.weight - b.weight);
        break;
      case 'quantity-desc':
        this.pendingDeliveries.sort((a, b) => b.weight - a.weight);
        break;
    }
    this.splitOrders();
  }

  splitOrders() {
    this.evenOrders = this.pendingDeliveries.filter((_, index) => index % 2 === 0);
    this.oddOrders = this.pendingDeliveries.filter((_, index) => index % 2 !== 0);
  }

  async acceptOrder(order: DeliveryOrder) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delivery',
      message: `Do you want to accept this delivery for ₹${order.suggestedPrice}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Accept',
          handler: async () => {
            order.accepted = true;
            this.currentLoad += order.weight; // Increase current load
            this.showToast('Delivery Accepted!');

            // Check if transporter still has capacity for more orders
            const remainingCapacity = this.maxLoad - this.currentLoad;
            if (remainingCapacity > 0) {
              this.promptForMoreOrders(remainingCapacity);
            }
          },
        },
      ],
    });
    await alert.present();
  }


  async promptForMoreOrders(remainingCapacity: number) {
    const alert = await this.alertCtrl.create({
      header: 'More Capacity Available',
      message: `You still have ${remainingCapacity} kg of available capacity. Do you want to accept more orders?`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Yes',
          handler: () => {
            this.showAvailableOrders(remainingCapacity);
          },
        },
      ],
    });
    await alert.present();
  }
  
  showAvailableOrders(remainingCapacity: number) {
    const availableOrders = this.pendingDeliveries.filter(order =>
      !order.accepted && order.weight <= remainingCapacity
    );

    if (availableOrders.length === 0) {
      this.showToast('No more orders fit within your remaining capacity.');
      return;
    }

    availableOrders.sort((a, b) => a.distance - b.distance);
    this.pendingDeliveries = availableOrders;
    this.splitOrders();
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

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    return formatDate(dateString, 'dd MMM yyyy', 'en-US');
  }
}
