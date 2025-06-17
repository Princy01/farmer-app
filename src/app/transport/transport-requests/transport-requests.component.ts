import { Component, OnInit, inject } from '@angular/core';
import { AlertController, ToastController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, funnelOutline, swapVerticalOutline, flashOutline,
  locationOutline, flagOutline, cubeOutline, navigateOutline, calendarOutline,
  pricetagOutline, checkmarkOutline, checkmarkCircleOutline, checkmarkCircle,
  listOutline, carOutline, arrowForwardOutline, timeOutline, flash
} from 'ionicons/icons';
import { FilterModalComponent } from '../filter-modal/filter-modal.component';
import { SortModalComponent } from '../sort-modal/sort-modal.component';
import { formatDate } from '@angular/common';
import { DatabaseService } from '../../services/database.service';
import { MockDataService } from '../../services/mock-data.service';

interface DeliveryOrder {
  id: string;
  items: CartItem[];
  paymentMethod: string;
  total: number;
  deliveryType: string;
  urgency: string;
  transporterId: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  weight: number;
  distance: number;
  suggestedPrice: number;
  accepted?: boolean;
  assigned?: boolean;
  createdAt: string;
  deliveryDate: string;
}

interface CartItem {
  id: number;
  name: string;
  image: string;
  hindiName: string;
  quantity: number;
  price: number;
  weight: number;
}

@Component({
  selector: 'app-transport-requests',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './transport-requests.component.html',
  styleUrls: ['./transport-requests.component.scss'],
})
export class TransportRequestsComponent implements OnInit {
  unassignedOrders: any[] = [];
  private pollInterval: any;

  transporterId: string = 'T001'; // Replace with actual driver ID
  transporterDetails: any;

  private modalController = inject(ModalController);

  pendingDeliveries: DeliveryOrder[] = [];
  originalDeliveries: DeliveryOrder[] = [];

  // Driver Load Constraints
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
    private toastCtrl: ToastController,
    private databaseService: DatabaseService,
    private mockDataService: MockDataService
  ) {
    addIcons({
      chevronForwardOutline, funnelOutline, swapVerticalOutline, flashOutline,
      locationOutline, flagOutline, cubeOutline, navigateOutline, calendarOutline,
      pricetagOutline, checkmarkOutline, checkmarkCircleOutline, checkmarkCircle,
      listOutline, carOutline, arrowForwardOutline, timeOutline, flash
    });
  }

  ngOnInit() {
    this.transporterDetails = this.databaseService.getTransporterDetails(this.transporterId);
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    this.loadUnassignedOrders();
    this.loadPendingDeliveries();
    this.pollInterval = setInterval(() => {
      this.transporterDetails = this.databaseService.getTransporterDetails(this.transporterId);
      this.loadUnassignedOrders();
      this.loadPendingDeliveries();
    }, 5000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private checkLoadWithinCapacity(orderWeight: number) {
    const currentLoad = this.transporterDetails.assignedOrders.reduce((acc: number, current: any) => {
      return current.weight + acc;
    }, 0);
    return this.transporterDetails.loadCapacity >= currentLoad + orderWeight;
  }

  private loadUnassignedOrders() {
    const orders = this.databaseService.getUnassignedOrders();
    this.unassignedOrders = orders.filter((order: any) => {
      const orderAge = Date.now() - new Date(order.createdAt).getTime();
      return orderAge < 120000 && !order.assigned;
    });

    if (orders.length !== this.unassignedOrders.length) {
      this.databaseService.saveUnassignedOrders(this.unassignedOrders);
    }
  }

  async acceptUnassignedOrder(order: any) {
    const withinCapacity = this.checkLoadWithinCapacity(order.load.weight);

    if (!withinCapacity) {
      const alert = await this.alertCtrl.create({
        header: 'Capacity Exceeded',
        message: 'This order exceeds your current load capacity. Please complete some deliveries first.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Accept Urgent Request',
      message: `
        <strong>Pickup:</strong> ${order.pickup}<br>
        <strong>Delivery:</strong> ${order.delivery}<br>
        <strong>Distance:</strong> ${order.distance} km<br>
        <strong>Load:</strong> ${order.load.weight} kg (${order.load.type})<br>
        <strong>Base Price:</strong> ₹${order.basePrice}<br>
        <strong>Date:</strong> ${order.requestedDate}
      `,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Accept',
          handler: () => {
            const accepted = this.databaseService.acceptUnassignedOrder(
              order.id,
              this.transporterId
            );

            if (accepted) {
              this.showToast('Order accepted successfully!');
              this.loadUnassignedOrders();
            } else {
              this.showToast('Failed to accept order');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  loadPendingDeliveries() {
    this.originalDeliveries = this.databaseService.getPendingDeliveriesFromLocalStorage(this.transporterId);
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
  }

  async acceptOrder(order: DeliveryOrder) {
    const withinCapacity = this.checkLoadWithinCapacity(order.weight);

    if (!withinCapacity) {
      const alert = await this.alertCtrl.create({
        header: 'Capacity Exceeded',
        message: 'This order exceeds your current load capacity. Please complete some deliveries first.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const calculatedPrice = this.databaseService.calculateBasePrice(
      order.pickupLocation,
      order.dropoffLocation,
      order.weight,
      order.deliveryType,
      order.urgency,
      this.transporterId
    );

    const alert = await this.alertCtrl.create({
      header: 'Accept Delivery Order',
      message: `
        <strong>Order #${order.id}</strong><br>
        <strong>Items:</strong> ${order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}<br>
        <strong>Total Weight:</strong> ${order.weight}kg<br>
        <strong>Distance:</strong> ${order.distance}km<br>
        <strong>Calculated Price:</strong> ₹${calculatedPrice}
      `,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Accept',
          handler: async () => {
            order.transporterId = this.transporterId;
            order.accepted = true;
            this.databaseService.updateOrderForTransporterInLocalStorage(
              this.transporterId,
              order.id,
              { accepted: true }
            );
            this.currentLoad += order.weight;
            this.showToast('Delivery order accepted successfully!');

            const remainingCapacity = this.maxLoad - this.currentLoad;
            if (remainingCapacity > 0) {
              this.promptForMoreOrders(remainingCapacity);
            }
          },
        },
      ]
    });
    await alert.present();
  }

  async promptForMoreOrders(remainingCapacity: number) {
    const alert = await this.alertCtrl.create({
      header: 'More Capacity Available',
      message: `You still have ${remainingCapacity} kg of available capacity. Would you like to accept more orders?`,
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
  }

  async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    return formatDate(dateString, 'dd MMM yyyy', 'en-US');
  }

  getUrgencyColor(urgency: string): string {
    switch (urgency.toLowerCase()) {
      case 'high': return 'danger';
      case 'standard': return 'warning';
      case 'low': return 'success';
      default: return 'medium';
    }
  }

  getUrgencyIcon(urgency: string): string {
    switch (urgency.toLowerCase()) {
      case 'high': return 'flash';
      case 'standard': return 'time';
      case 'low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  }
}