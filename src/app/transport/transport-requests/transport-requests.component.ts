import { Component, OnInit, inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { AlertController, ToastController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { addIcons } from 'ionicons';
import {
  chevronForwardOutline, funnelOutline, swapVerticalOutline, flashOutline,
  locationOutline, flagOutline, cubeOutline, navigateOutline, calendarOutline,
  pricetagOutline, checkmarkOutline, checkmarkCircleOutline, checkmarkCircle,
  listOutline, carOutline, arrowForwardOutline, timeOutline, flash, closeCircleOutline,
  settingsOutline, mapOutline, cartOutline, leafOutline
} from 'ionicons/icons';
import { FilterModalComponent } from '../filter-modal/filter-modal.component';
import { SortModalComponent } from '../sort-modal/sort-modal.component';
import { LocationSelectionModalComponent } from '../location-selection/location-selection.component';
import { OrderDetailsModalComponent } from './order-model.component';
import { formatDate } from '@angular/common';
import { TransportRequestService, TransportRequest } from './transport-requests.service';
import { LocationPreferenceService } from '../location-selection/location-selection.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-transport-requests',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './transport-requests.component.html',
  styleUrls: ['./transport-requests.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TransportRequestsComponent implements OnInit, OnDestroy {
  transportRequests: TransportRequest[] = [];
  filteredRequests: TransportRequest[] = [];
  private destroy$ = new Subject<void>();
  private subscription = new Subscription();
  private pollInterval: NodeJS.Timeout | undefined;
  private visibilityCheckInterval: NodeJS.Timeout | undefined;
  private citiesCache: Map<number, string> = new Map(); // Cache city ID to name mapping

  // Driver configuration
  transporterId: string = 'T001';
  vehicleId: number = 1;

  // Driver Load Constraints
  readonly minLoad: number = 300;
  readonly maxLoad: number = 1000;
  currentLoad: number = 0;

  // Sorting & Filtering States
  sortOption: string = '';
  priorityDeliveries = false;
  delayedDeliveries = false;
  sharedDeliveries = false;
  singleDelivery = false;
  perishableOnly = false;
  isTogglingAvailability = false;

  // Request states tracking
  acceptedRequests = new Set<number>();
  rejectedRequests = new Set<number>();

  // Transit/Waiting time tracking
  private requestVisibilityMap = new Map<number, {
    isVisible: boolean;
    showCount: number;
    lastToggleTime: number;
  }>();
  private readonly TRANSIT_TIME_MS = 60 * 1000; // 1 minute
  private readonly WAITING_TIME_MS = 3 * 60 * 1000; // 3 minutes
  private readonly MAX_SHOW_COUNT = 3; // Show 3 times maximum

  // Location preferences
  hasLocationPreferences = false;
  locationSummary = '';

  // Driver availability status
  isDriverAvailable: boolean = false;
  isLoadingStatus: boolean = true;
  driverStatus: string = 'inactive';
  isLoadingRequests = false;

  private modalController = inject(ModalController);

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private transportRequestService: TransportRequestService,
    private locationPreferenceService: LocationPreferenceService,
    private translate: TranslateService
  ) {
    addIcons({
      chevronForwardOutline, funnelOutline, swapVerticalOutline, flashOutline,
      locationOutline, flagOutline, cubeOutline, navigateOutline, calendarOutline,
      pricetagOutline, checkmarkOutline, checkmarkCircleOutline, checkmarkCircle,
      listOutline, carOutline, arrowForwardOutline, timeOutline, flash, closeCircleOutline,
      settingsOutline, mapOutline, cartOutline, leafOutline
    });
  }

  ngOnInit() {
    this.loadRejectedRequests();
    this.loadCityNames(); // Load city names for mapping
    this.setupLocationPreferences();
    this.loadDriverStatus();
    this.loadTransportRequests();
    this.startPolling();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
    this.stopPolling();
  }

  private setupLocationPreferences() {
    this.locationPreferenceService.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(preferences => {
        this.hasLocationPreferences = this.locationPreferenceService.hasPreferences();
        this.updateLocationSummary();
        if (this.hasLocationPreferences) {
          this.loadTransportRequests();
        }
      });
  }

  private updateLocationSummary() {
    const preferences = this.locationPreferenceService.getCurrentPreferences();
    const cityCount = preferences.cities.length;
    const branchCount = preferences.branches.length;

    if (cityCount > 0 || branchCount > 0) {
      const parts = [];
      if (cityCount > 0) parts.push(`${cityCount} ${this.translate.instant('TRANSPORT_REQUESTS.CITIES')}`);
      if (branchCount > 0) parts.push(`${branchCount} ${this.translate.instant('TRANSPORT_REQUESTS.BRANCHES')}`);
      this.locationSummary = parts.join(' + ');
    } else {
      this.locationSummary = this.translate.instant('TRANSPORT_REQUESTS.ALL_LOCATIONS');
    }
  }

  private startPolling() {
    // Poll for new requests every 5 seconds
    this.pollInterval = setInterval(() => {
      this.loadTransportRequests();
    }, 5000);

    // Check request visibility states every second
    this.visibilityCheckInterval = setInterval(() => {
      this.updateRequestVisibility();
    }, 1000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval);
    }
  }

  private loadDriverStatus() {
    this.isLoadingStatus = true;
    this.transportRequestService.getDriverStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.driverStatus = response.status;
          this.isDriverAvailable = response.status === 'active';
          this.isLoadingStatus = false;
        },
        error: (error) => {
          this.isLoadingStatus = false;
          this.showToast(this.translate.instant('TRANSPORT_REQUESTS.STATUS_LOAD_FAILED'), 'danger');
        }
      });
  }

  toggleDriverAvailability(event: { target: HTMLIonToggleElement; detail: { checked: boolean } }) {
    const newStatus = event.detail.checked ? 'active' : 'inactive';
    this.isTogglingAvailability = true;
    (event.target as any).disabled = true;

    this.transportRequestService.updateDriverStatus(newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.driverStatus = newStatus;
          this.isDriverAvailable = newStatus === 'active';
          this.isTogglingAvailability = false;
          event.target.disabled = false;

          const messageKey = this.isDriverAvailable
            ? 'TRANSPORT_REQUESTS.NOW_AVAILABLE'
            : 'TRANSPORT_REQUESTS.NOW_UNAVAILABLE';

          this.showToast(this.translate.instant(messageKey), 'success');

          // Reload requests when becoming available
          if (this.isDriverAvailable) {
            this.loadTransportRequests();
          }
        },
        error: (error) => {
          this.isTogglingAvailability = false;
          event.target.disabled = false;
          // Revert toggle on error
          event.target.checked = !event.detail.checked;
          this.showToast(this.translate.instant('TRANSPORT_REQUESTS.STATUS_UPDATE_FAILED'), 'danger');
        }
      });
  }

  private loadTransportRequests() {
    // Only load requests if driver is available
    if (!this.isDriverAvailable) {
      this.transportRequests = [];
      this.filteredRequests = [];
      return;
    }

    this.isLoadingRequests = true;
    const preferences = this.locationPreferenceService.getCurrentPreferences();

    // Use the first city if available (backend accepts single city parameter)
    let cityIds: number[] = [];
    if (preferences.cities.length > 0) {
      const cityId = preferences.cities[0];
      cityIds.push(cityId);
    }

    let branchIds: number[] = [];
    if (preferences.branches.length > 0) {
      branchIds = preferences.branches;
    }

    this.transportRequestService.getTransportRequestDetailed(cityIds, branchIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.transportRequests = response.delivery_requests || [];
          this.initializeRequestVisibility();
          this.applyFilters();
          this.isLoadingRequests = false;
        },
        error: (error) => {
          this.isLoadingRequests = false;
          this.showToast(this.translate.instant('TRANSPORT_REQUESTS.LOAD_FAILED'), 'danger');
        }
      });
  }

  async openLocationPreferences() {
    const modal = await this.modalController.create({
      component: LocationSelectionModalComponent
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.showToast(this.translate.instant('TRANSPORT_REQUESTS.PREFERENCES_UPDATED'), 'success');
    }
  }

  async openOrderDetailsModal(request: TransportRequest) {
    const modal = await this.modalController.create({
      component: OrderDetailsModalComponent,
      componentProps: {
        request: request
      },
      cssClass: 'order-details-modal'
    });

    await modal.present();
  }

  async acceptOrder(request: TransportRequest) {
    if (this.acceptedRequests.has(request.job_id) || this.rejectedRequests.has(request.job_id)) {
      return;
    }

    if (!this.checkLoadWithinCapacity(request.weight)) {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('TRANSPORT_REQUESTS.LOAD_CAPACITY_EXCEEDED'),
        duration: 4000,
        position: 'middle',
        color: 'warning',
        buttons: [{ text: this.translate.instant('TRANSPORT_REQUESTS.OK'), role: 'cancel' }]
      });
      await toast.present();
      return;
    }

    let orderDetails = `${this.translate.instant('TRANSPORT_REQUESTS.JOB_ID')}${request.job_id}\n\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.PICKUP')}: ${this.getPickupLocations(request)}\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.DELIVERY')}: ${this.getDropoffLocation(request)}\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.WEIGHT')}: ${request.weight}kg\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.DISTANCE')}: ${request.distance}km\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.BASE_PRICE')}: ₹${request.base_price}\n`;

    if (request.orders && request.orders.length > 0) {
      orderDetails += `\n${this.translate.instant('TRANSPORT_REQUESTS.ORDERS')}: ${request.orders.length}\n`;
      const totalValue = this.getTotalOrderValue(request);
      const itemCount = this.getTotalItemCount(request);
      orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.TOTAL_ITEMS')}: ${itemCount}\n`;
      orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.ORDER_VALUE')}: ₹${totalValue.toFixed(2)}`;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_REQUESTS.ACCEPT_HEADER'),
      message: orderDetails,
      buttons: [
        { text: this.translate.instant('TRANSPORT_REQUESTS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.ACCEPT'),
          handler: async () => {
            const loadingToast = await this.toastCtrl.create({
              message: this.translate.instant('TRANSPORT_REQUESTS.PROCESSING'),
              duration: 2000,
              position: 'middle'
            });
            await loadingToast.present();

            const sub = this.transportRequestService.acceptTransportRequest(request.job_id, this.vehicleId)
              .subscribe({
                next: () => {
                  this.acceptedRequests.add(request.job_id);
                  this.currentLoad += request.weight;
                  loadingToast.dismiss();
                  this.showToast(this.translate.instant('TRANSPORT_REQUESTS.ACCEPTED_SUCCESS'), 'success');

                  const remainingCapacity = this.maxLoad - this.currentLoad;
                  if (remainingCapacity > 0) {
                    this.promptForMoreOrders(remainingCapacity);
                  }
                },
                error: (error) => {
                  loadingToast.dismiss();
                  this.showToast(this.translate.instant('TRANSPORT_REQUESTS.ACCEPT_FAILED'), 'danger');
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
      header: this.translate.instant('TRANSPORT_REQUESTS.REJECT_HEADER'),
      message: this.translate.instant('TRANSPORT_REQUESTS.REJECT_CONFIRM', {
        jobId: request.job_id,
        pickup: this.getPickupLocations(request),
        delivery: this.getDropoffLocation(request)
      }),
      buttons: [
        { text: this.translate.instant('TRANSPORT_REQUESTS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.REJECT'),
          role: 'destructive',
          handler: async () => {
            this.rejectedRequests.add(request.job_id);
            this.requestVisibilityMap.delete(request.job_id);
            this.saveRejectedRequest(request.job_id);
            this.applyFilters();
            await this.showToast(
              this.translate.instant('TRANSPORT_REQUESTS.REJECTED_SUCCESS'),
              'medium'
            );
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
      message: this.translate.instant('TRANSPORT_REQUESTS.REMAINING_CAPACITY', { capacity: remainingCapacity }),
      duration: 5000,
      position: 'middle',
      color: 'primary',
      buttons: [
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.VIEW_ORDERS'),
          handler: () => {
            this.showAvailableOrders(remainingCapacity);
          }
        },
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.DISMISS'),
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
      this.showToast(this.translate.instant('TRANSPORT_REQUESTS.NO_FITTING_ORDERS'), 'warning');
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
        perishableOnly: this.perishableOnly
      },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.priorityDeliveries = data.priorityDeliveries;
      this.delayedDeliveries = data.delayedDeliveries;
      this.sharedDeliveries = data.sharedDeliveries;
      this.singleDelivery = data.singleDelivery;
      this.perishableOnly = data.perishableOnly || false;
      this.applyFilters();
    }
  }

  applyFilters() {
    let filteredOrders = [...this.transportRequests];
    this.filteredRequests = filteredOrders;

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
      case 'order-value-desc':
        this.filteredRequests.sort((a, b) =>
          this.getTotalOrderValue(b) - this.getTotalOrderValue(a)
        );
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

  getTotalOrderValue(request: TransportRequest): number {
    return this.transportRequestService.getTotalOrderValue(request);
  }

  getTotalItemCount(request: TransportRequest): number {
    return this.transportRequestService.getTotalItemCount(request);
  }

  hasOrders(request: TransportRequest): boolean {
    return request.orders != null && request.orders.length > 0;
  }

  get pendingDeliveries(): TransportRequest[] {
    return this.filteredRequests.filter(request => {
      // Filter out accepted and rejected requests
      if (this.acceptedRequests.has(request.job_id) || this.rejectedRequests.has(request.job_id)) {
        return false;
      }

      // Apply visibility logic - only show if currently visible
      const visibilityState = this.requestVisibilityMap.get(request.job_id);
      return visibilityState?.isVisible ?? true;
    });
  }

  // Initialize visibility tracking for new requests
  private initializeRequestVisibility() {
    this.transportRequests.forEach(request => {
      if (!this.requestVisibilityMap.has(request.job_id)) {
        // New request - show it immediately
        this.requestVisibilityMap.set(request.job_id, {
          isVisible: true,
          showCount: 1,
          lastToggleTime: Date.now()
        });
      }
    });

    // Clean up visibility map for requests that no longer exist
    const currentJobIds = new Set(this.transportRequests.map(r => r.job_id));
    for (const jobId of this.requestVisibilityMap.keys()) {
      if (!currentJobIds.has(jobId) && !this.acceptedRequests.has(jobId) && !this.rejectedRequests.has(jobId)) {
        this.requestVisibilityMap.delete(jobId);
      }
    }
  }

  // Update request visibility based on transit/waiting time logic
  private updateRequestVisibility() {
    const now = Date.now();

    this.requestVisibilityMap.forEach((state, jobId) => {
      // Skip if max show count reached
      if (state.showCount >= this.MAX_SHOW_COUNT) {
        state.isVisible = false;
        return;
      }

      const timeSinceLastToggle = now - state.lastToggleTime;

      if (state.isVisible) {
        // Currently visible - check if transit time (1 min) has passed
        if (timeSinceLastToggle >= this.TRANSIT_TIME_MS) {
          state.isVisible = false;
          state.lastToggleTime = now;
          console.log(`Job ${jobId} entering waiting period (shown ${state.showCount}/${this.MAX_SHOW_COUNT} times)`);
        }
      } else {
        // Currently hidden - check if waiting time (3 min) has passed
        if (timeSinceLastToggle >= this.WAITING_TIME_MS) {
          state.isVisible = true;
          state.showCount++;
          state.lastToggleTime = now;
          console.log(`Job ${jobId} becoming visible again (${state.showCount}/${this.MAX_SHOW_COUNT})`);
        }
      }
    });

    // Trigger change detection by updating filtered requests
    this.applyFilters();
  }

  // Load rejected requests from localStorage
  private loadRejectedRequests() {
    const stored = localStorage.getItem('rejected_transport_requests');
    if (stored) {
      try {
        const rejectedArray = JSON.parse(stored) as number[];
        this.rejectedRequests = new Set(rejectedArray);
      } catch (error) {
        // Silently handle JSON parse error - storage may be corrupted
      }
    }
  }

  // Save rejected request to localStorage
  private saveRejectedRequest(jobId: number) {
    const rejectedArray = Array.from(this.rejectedRequests);
    localStorage.setItem('rejected_transport_requests', JSON.stringify(rejectedArray));
  }

  // Load city names and cache them
  private loadCityNames() {
    this.locationPreferenceService.getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cities) => {
          cities.forEach(city => {
            this.citiesCache.set(city.id, city.city_name);
          });
        },
        error: (error) => {
          // Silently handle city load error - not critical
        }
      });
  }

  // Get unique pickup locations from all order items
  getPickupLocations(request: TransportRequest): string {
    if (!request.orders || request.orders.length === 0) {
      return this.translate.instant('TRANSPORT_REQUESTS.NO_PICKUP_INFO');
    }

    const pickupLocations = new Set<string>();

    request.orders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          if (item.branch && item.branch.branch_address) {
            pickupLocations.add(item.branch.branch_address);
          }
        });
      }
    });

    return Array.from(pickupLocations).join(', ') || this.translate.instant('TRANSPORT_REQUESTS.MULTIPLE_LOCATIONS');
  }

  // Get dropoff location from retailer branch or delivery address
  getDropoffLocation(request: TransportRequest): string {
    if (!request.orders || request.orders.length === 0) {
      return this.translate.instant('TRANSPORT_REQUESTS.NO_DELIVERY_INFO');
    }

    // Use first order's delivery address
    const firstOrder = request.orders[0];

    // First try retailer_branch if it exists
    if (firstOrder.retailer_branch &&
      Object.keys(firstOrder.retailer_branch).length > 0 &&
      firstOrder.retailer_branch.branch_address) {
      return firstOrder.retailer_branch.branch_address;
    }

    // Otherwise use delivery_address
    return firstOrder.delivery_address || this.translate.instant('TRANSPORT_REQUESTS.ADDRESS_NOT_AVAILABLE');
  }
}