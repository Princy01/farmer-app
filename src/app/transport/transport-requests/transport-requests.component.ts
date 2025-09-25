import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { AlertController, ToastController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, funnelOutline, swapVerticalOutline, flashOutline,
  locationOutline, flagOutline, cubeOutline, navigateOutline, calendarOutline,
  pricetagOutline, checkmarkOutline, checkmarkCircleOutline, checkmarkCircle,
  listOutline, carOutline, arrowForwardOutline, timeOutline, flash, closeCircleOutline,
  settingsOutline, mapOutline
} from 'ionicons/icons';
import { FilterModalComponent } from '../filter-modal/filter-modal.component';
import { SortModalComponent } from '../sort-modal/sort-modal.component';
import { LocationSelectionModalComponent } from '../location-selection/location-selection.component';
import { formatDate } from '@angular/common';
import { TransportRequestService, TransportRequest } from './transport-requests.service';
import { LocationPreferenceService } from '../location-selection/location-selection.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transport-requests',
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule],
  templateUrl: './transport-requests.component.html',
  styleUrls: ['./transport-requests.component.scss'],
})
export class TransportRequestsComponent implements OnInit, OnDestroy {
  transportRequests: TransportRequest[] = [];
  filteredRequests: TransportRequest[] = [];
  private subscription = new Subscription();
  private pollInterval: any;

  // Driver configuration
  transporterId: string = 'T001';
  vehicleId: number = 1;

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

  // Request states tracking
  acceptedRequests = new Set<number>();
  rejectedRequests = new Set<number>();

  // Location preferences
  hasLocationPreferences = false;
  locationSummary = '';

  private modalController = inject(ModalController);

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private transportRequestService: TransportRequestService,
    private locationPreferenceService: LocationPreferenceService
  ) {
    addIcons({
      chevronForwardOutline, funnelOutline, swapVerticalOutline, flashOutline,
      locationOutline, flagOutline, cubeOutline, navigateOutline, calendarOutline,
      pricetagOutline, checkmarkOutline, checkmarkCircleOutline, checkmarkCircle,
      listOutline, carOutline, arrowForwardOutline, timeOutline, flash, closeCircleOutline,
      settingsOutline, mapOutline
    });
  }

  ngOnInit() {
    this.setupLocationPreferences();
    this.loadTransportRequests();
    this.startPolling();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.stopPolling();
  }

  private setupLocationPreferences() {
    // Subscribe to location preference changes
    const prefSub = this.locationPreferenceService.preferences$.subscribe(preferences => {
      this.hasLocationPreferences = this.locationPreferenceService.hasPreferences();
      this.updateLocationSummary();
      // Reload requests when preferences change
      if (this.hasLocationPreferences) {
        this.loadTransportRequests();
      }
    });
    this.subscription.add(prefSub);
  }

  private updateLocationSummary() {
    const preferences = this.locationPreferenceService.getCurrentPreferences();
    const cityCount = preferences.cities.length;
    const branchCount = preferences.branches.length;

    if (cityCount > 0 || branchCount > 0) {
      const parts = [];
      if (cityCount > 0) parts.push(`${cityCount} cities`);
      if (branchCount > 0) parts.push(`${branchCount} branches`);
      this.locationSummary = parts.join(' + ');
    } else {
      this.locationSummary = 'All locations';
    }
  }

  private startPolling() {
    this.pollInterval = setInterval(() => {
      this.loadTransportRequests();
    }, 30000); // Poll every 30 seconds
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  private loadTransportRequests() {
    const preferences = this.locationPreferenceService.getCurrentPreferences();

    const sub = this.transportRequestService.getTransportRequests(
      preferences.cities.length > 0 ? preferences.cities : undefined,
      preferences.branches.length > 0 ? preferences.branches : undefined
    ).subscribe({
      next: (response) => {
        this.transportRequests = response.delivery_requests || [];
        this.applyFilters();
        console.log(`Loaded ${this.transportRequests.length} transport requests`);
      },
      error: (error) => {
        console.error('Failed to load transport requests:', error);
        this.showToast('Failed to load requests. Please try again.', 'danger');
      }
    });

    this.subscription.add(sub);
  }

  async openLocationPreferences() {
    const modal = await this.modalController.create({
      component: LocationSelectionModalComponent
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.showToast('Location preferences updated successfully!', 'success');
      // The subscription will automatically reload requests when preferences change
    }
  }

  async acceptOrder(request: TransportRequest) {
    // Check if already accepted or rejected
    if (this.acceptedRequests.has(request.job_id) || this.rejectedRequests.has(request.job_id)) {
      return;
    }

    // Check load capacity
    if (!this.checkLoadWithinCapacity(request.weight)) {
      const toast = await this.toastCtrl.create({
        message: 'This order exceeds your current load capacity. Please complete some deliveries first.',
        duration: 4000,
        position: 'middle',
        color: 'warning',
        buttons: [
          {
            text: 'OK',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Accept Transport Request',
      message: `Job #${request.job_id}\n\nPickup: ${request.pickup_location}\nDelivery: ${request.dropoff_location}\nWeight: ${request.weight}kg\nDistance: ${request.distance}km\nPrice: ₹${request.base_price}`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Accept',
          handler: async () => {
            const loadingToast = await this.toastCtrl.create({
              message: 'Processing request...',
              duration: 2000,
              position: 'middle'
            });
            await loadingToast.present();

            const sub = this.transportRequestService.acceptTransportRequest(request.job_id, this.vehicleId)
              .subscribe({
                next: (response) => {
                  this.acceptedRequests.add(request.job_id);
                  this.currentLoad += request.weight;
                  loadingToast.dismiss();
                  this.showToast('Request accepted successfully!', 'success');

                  const remainingCapacity = this.maxLoad - this.currentLoad;
                  if (remainingCapacity > 0) {
                    this.promptForMoreOrders(remainingCapacity);
                  }
                },
                error: (error) => {
                  console.error('Failed to accept request:', error);
                  loadingToast.dismiss();
                  this.showToast('Failed to accept request. Please try again.', 'danger');
                }
              });

            this.subscription.add(sub);
          },
        },
      ]
    });
    await alert.present();
  }

  async rejectOrder(request: TransportRequest) {
    if (this.acceptedRequests.has(request.job_id) || this.rejectedRequests.has(request.job_id)) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Reject Request',
      message: `Are you sure you want to reject Job #${request.job_id}?\n\nPickup: ${request.pickup_location}\nDelivery: ${request.dropoff_location}`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          role: 'destructive',
          handler: async () => {
            const sub = this.transportRequestService.rejectTransportRequest(request.job_id)
              .subscribe({
                next: (response) => {
                  this.rejectedRequests.add(request.job_id);
                  this.showToast('Request rejected', 'warning');
                },
                error: (error) => {
                  console.error('Failed to reject request:', error);
                  this.showToast('Failed to reject request. Please try again.', 'danger');
                }
              });

            this.subscription.add(sub);
          },
        },
      ]
    });
    await alert.present();
  }

  private checkLoadWithinCapacity(orderWeight: number): boolean {
    return this.maxLoad >= this.currentLoad + orderWeight;
  }

  async promptForMoreOrders(remainingCapacity: number) {
    const toast = await this.toastCtrl.create({
      message: `You still have ${remainingCapacity}kg capacity available. Check for more orders!`,
      duration: 5000,
      position: 'middle',
      color: 'primary',
      buttons: [
        {
          text: 'View Orders',
          handler: () => {
            this.showAvailableOrders(remainingCapacity);
          }
        },
        {
          text: 'Dismiss',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  showAvailableOrders(remainingCapacity: number) {
    const availableOrders = this.filteredRequests.filter(request =>
      !this.acceptedRequests.has(request.job_id) &&
      !this.rejectedRequests.has(request.job_id) &&
      request.weight <= remainingCapacity
    );

    if (availableOrders.length === 0) {
      this.showToast('No more orders fit within your remaining capacity.', 'warning');
      return;
    }

    availableOrders.sort((a, b) => a.distance - b.distance);
    this.filteredRequests = availableOrders;
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
    let filteredOrders = [...this.transportRequests];

    // Apply load capacity filters
    filteredOrders = filteredOrders.filter(order =>
      order.weight >= this.minLoad && order.weight <= this.maxLoad
    );

    // Apply priority filters
    if (this.priorityDeliveries) {
      filteredOrders = filteredOrders.filter(order => order.urgency.toLowerCase() === 'high');
    }

    if (this.delayedDeliveries) {
      filteredOrders = filteredOrders.filter(order => new Date(order.delivery_date) < new Date());
    }

    if (this.sharedDeliveries) {
      filteredOrders = filteredOrders.filter(order => order.weight <= 500);
    }

    if (this.singleDelivery) {
      filteredOrders = filteredOrders.filter(order => order.weight > 500);
    }

    this.filteredRequests = filteredOrders;

    // Apply current sort if any
    if (this.sortOption) {
      this.applySort();
    }
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
        this.filteredRequests.sort((a, b) => a.distance - b.distance);
        break;
      case 'distance-desc':
        this.filteredRequests.sort((a, b) => b.distance - a.distance);
        break;
      case 'price-desc':
        this.filteredRequests.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'quantity-asc':
        this.filteredRequests.sort((a, b) => a.weight - b.weight);
        break;
      case 'quantity-desc':
        this.filteredRequests.sort((a, b) => b.weight - a.weight);
        break;
    }
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
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

  isRequestAccepted(jobId: number): boolean {
    return this.acceptedRequests.has(jobId);
  }

  isRequestRejected(jobId: number): boolean {
    return this.rejectedRequests.has(jobId);
  }

  // Getter for template compatibility
  get pendingDeliveries(): TransportRequest[] {
    return this.filteredRequests;
  }
}