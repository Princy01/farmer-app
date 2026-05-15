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
import { formatDate } from '@angular/common';
import { TransportRequestService, DriverJobOffer } from './transport-requests.service';
import { TransportRealtimeService } from './transport-realtime.service';
import { LocationPreferenceService } from '../location-selection/location-selection.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-transport-requests',
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  templateUrl: './transport-requests.component.html',
  styleUrls: ['./transport-requests.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class TransportRequestsComponent implements OnInit, OnDestroy {
  transportRequests: DriverJobOffer[] = [];
  filteredRequests: DriverJobOffer[] = [];
  private destroy$ = new Subject<void>();
  private subscription = new Subscription();
  private expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private cooldownCheckTimer: ReturnType<typeof setTimeout> | null = null;
  private fallbackRefreshTimer: ReturnType<typeof setInterval> | null = null;
  private loadRequestsSubscription: Subscription | null = null;
  private latestLoadRequestId = 0;
  private readonly FALLBACK_REFRESH_MS = 5000;

  // Driver configuration (will be loaded dynamically)
  transporterId: string = '';
  vehicleId: number = 0;

  // Driver Load Constraints (will be loaded from API)
  minLoad: number = 0;
  maxLoad: number = 0;
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
  acceptedRequests = new Set<string>(); // ride_id-attempt_no
  rejectedRequests = new Set<string>();

  // Error recovery & retry
  failedOperations = new Map<string, { type: string; error: string; timestamp: number }>(); // operation_id -> error info
  isRetrying = false;
  retryingOperationId: string | null = null;

  // Loading states for different operations
  isLoadingOffers = false;
  isAcceptingOffer: { [key: string]: boolean } = {};
  isRejectingOffer: { [key: string]: boolean } = {};
  isCancellingOffer: { [key: string]: boolean } = {};

  // Cooldown handling (6-hour cooldown after cancel)
  driverCooldownUntil: Date | null = null;
  isUnderCooldown = false;

  // Availability lock handling (dispute/admin lock)
  isAvailabilityLocked = false;
  lockedUntil: Date | null = null;

  // Location preferences
  hasLocationPreferences = false;
  locationSummary = '';

  // Driver availability status
  isDriverAvailable: boolean = false;
  isLoadingStatus: boolean = true;
  driverStatus: string = 'inactive';
  driverOnboardingStatus: string = 'pending_documents';
  driverVerificationNotes: string = '';
  isDriverVerifiedForLiveJobs: boolean = false;
  isLoadingRequests = false;
  wsConnected = false;
  wsConnectionMessage: string = '';
  isReconnecting = false;

  private modalController = inject(ModalController);

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private transportRequestService: TransportRequestService,
    private transportRealtimeService: TransportRealtimeService,
    private locationPreferenceService: LocationPreferenceService,
    private translate: TranslateService,
    private authService: AuthService
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
    this.loadDriverConfiguration();
    this.loadRejectedRequests();
    this.setupLocationPreferences();
    this.loadDriverStatus();
    this.loadDriverOnboardingStatus();
    this.connectRealtime();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscription.unsubscribe();
    this.loadRequestsSubscription?.unsubscribe();
    this.loadRequestsSubscription = null;
    this.transportRealtimeService.disconnect();
    this.stopFallbackPolling();
    if (this.cooldownCheckTimer) {
      clearTimeout(this.cooldownCheckTimer);
      this.cooldownCheckTimer = null;
    }
    this.clearExpiryTimers();
    this.failedOperations.clear();
  }

  private startCooldownTimer() {
    if (!this.driverCooldownUntil) return;

    if (this.cooldownCheckTimer) {
      clearTimeout(this.cooldownCheckTimer);
      this.cooldownCheckTimer = null;
    }

    const checkCooldown = () => {
      if (this.driverCooldownUntil && new Date() >= this.driverCooldownUntil) {
        this.isUnderCooldown = false;
        this.driverCooldownUntil = null;
        this.cooldownCheckTimer = null;
        this.showToast(
          this.translate.instant('TRANSPORT_REQUESTS.COOLDOWN_EXPIRED'),
          'success'
        );
      } else {
        this.cooldownCheckTimer = setTimeout(checkCooldown, 30000); // Check every 30 seconds
      }
    };
    checkCooldown();
  }

  getRemainingCooldownMinutes(): number {
    if (!this.driverCooldownUntil) return 0;
    const remaining = this.driverCooldownUntil.getTime() - Date.now();
    return Math.ceil(remaining / 60000);
  }

  private loadDriverConfiguration() {
    try {
      // Fetch driver ID from AuthService
      const userId = this.authService.getUserId();
      this.transporterId = userId ? String(userId) : 'UNKNOWN_DRIVER';

      // Set default vehicle constraints
      // Note: Actual vehicle config may come from dedicated driver service if needed
      this.vehicleId = 0;
      this.minLoad = 0;
      this.maxLoad = 1000;

      // Reset current load on initialization
      this.currentLoad = 0;
    } catch (error) {
      // Fall back to defaults if fetching fails
      this.transporterId = '';
      this.vehicleId = 0;
      this.minLoad = 0;
      this.maxLoad = 1000;
      this.currentLoad = 0;
    }
  }

  private setupLocationPreferences() {
    this.locationPreferenceService.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(preferences => {
        this.hasLocationPreferences = this.locationPreferenceService.hasPreferences();
        this.updateLocationSummary();
        this.syncRequestLoadingState();
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

  private connectRealtime() {
    // Connect to WebSocket
    this.transportRealtimeService.connect();
    this.wsConnectionMessage = this.translate.instant('TRANSPORT_REQUESTS.WS_CONNECTING');
    this.isReconnecting = true;

    // Listen for connection status changes
    this.subscription.add(
      this.transportRealtimeService.connectionStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe(isConnected => {
          this.wsConnected = isConnected;

          if (isConnected) {
            this.wsConnectionMessage = this.translate.instant('TRANSPORT_REQUESTS.WS_CONNECTED');
            this.isReconnecting = false;
            this.stopFallbackPolling();

            this.syncRequestLoadingState();
          } else {
            this.wsConnectionMessage = this.translate.instant('TRANSPORT_REQUESTS.WS_RECONNECTING');
            this.isReconnecting = true;
            this.startFallbackPolling();
          }
        })
    );

    // Listen for all offers (initial load or updates)
    this.subscription.add(
      this.transportRealtimeService.offers$
        .pipe(takeUntil(this.destroy$))
        .subscribe(offers => {
          this.transportRequests = this.deduplicateRequests(offers);
          this.applyFilters();
          this.setupExpiryTimers();
        })
    );

    // Listen for new offers
    this.subscription.add(
      this.transportRealtimeService.newOffer$
        .pipe(takeUntil(this.destroy$))
        .subscribe(offer => {
          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.NEW_OFFER_AVAILABLE'),
            'success'
          );
        })
    );

    // Listen for removed offers (accepted, expired, or rejected)
    this.subscription.add(
      this.transportRealtimeService.offerRemoved$
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.removeExpiredOffer(data.ride_id, data.attempt_no);
        })
    );

    // Listen for errors
    this.subscription.add(
      this.transportRealtimeService.error$
        .pipe(takeUntil(this.destroy$))
        .subscribe(errorKey => {
          this.showToast(this.translate.instant(errorKey), 'danger');
        })
    );

    // Listen for driver availability locks (dispute/admin)
    this.subscription.add(
      this.transportRealtimeService.availabilityLocked$
        ?.pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.isAvailabilityLocked = true;
          this.transportRequests = []; // Clear all offers
          this.filteredRequests = [];
          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.AVAILABILITY_LOCKED'),
            'danger'
          );
        }) || new Subject()
    );

    // Listen for cancel cooldown
    this.subscription.add(
      this.transportRealtimeService.cancelCooldown$
        ?.pipe(takeUntil(this.destroy$))
        .subscribe((cooldownUntil: Date) => {
          this.driverCooldownUntil = cooldownUntil;
          this.isUnderCooldown = true;
          this.startCooldownTimer();
          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.UNDER_COOLDOWN', {
              hours: 6
            }),
            'warning'
          );
        }) || new Subject()
    );
  }

  private setupExpiryTimers() {
    this.clearExpiryTimers();
    this.transportRequests.forEach(request => {
      if (request.expires_at) {
        const expiryTime = new Date(request.expires_at).getTime();
        const now = Date.now();
        const delay = expiryTime - now;
        if (delay > 0) {
          const timer = setTimeout(() => {
            this.removeExpiredOffer(request.ride_id, request.attempt_no);
          }, delay);
          this.expiryTimers.set(this.getRequestKey(request.ride_id, request.attempt_no), timer);
        } else {
          // Already expired
          this.removeExpiredOffer(request.ride_id, request.attempt_no);
        }
      }
    });
  }

  private clearExpiryTimers() {
    this.expiryTimers.forEach(timer => clearTimeout(timer));
    this.expiryTimers.clear();
  }

  private removeExpiredOffer(rideId: number, attemptNo: number) {
    const requestKey = this.getRequestKey(rideId, attemptNo);
    const existingTimer = this.expiryTimers.get(requestKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.expiryTimers.delete(requestKey);
    }

    this.transportRequests = this.transportRequests.filter(
      r => !(r.ride_id === rideId && r.attempt_no === attemptNo)
    );
    this.applyFilters();
  }

  private getRequestKey(rideId: number, attemptNo: number): string {
    return `${rideId}-${attemptNo}`;
  }

  private deduplicateRequests(requests: DriverJobOffer[] | null | undefined): DriverJobOffer[] {
    if (!requests || requests.length === 0) {
      return [];
    }

    const uniqueRequests = new Map<string, DriverJobOffer>();
    for (const request of requests) {
      const requestKey = `${request.ride_id}-${request.attempt_no}`;
      uniqueRequests.set(requestKey, request);
    }

    return Array.from(uniqueRequests.values());
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
          this.syncRequestLoadingState();
        },
        error: (error) => {
          this.isLoadingStatus = false;
          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.STATUS_LOAD_FAILED'),
            'danger'
          );
        }
      });
  }

  private loadDriverOnboardingStatus() {
    this.transportRequestService.getDriverOnboardingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.driverOnboardingStatus = response.onboarding_verification_status;
          this.driverVerificationNotes = response.verification_notes || '';
          this.isDriverVerifiedForLiveJobs = response.can_act_on_live_jobs;
        },
        error: () => {
          this.driverOnboardingStatus = 'pending_documents';
          this.driverVerificationNotes = this.translate.instant('TRANSPORT_REQUESTS.VERIFICATION_REQUIRED_MESSAGE');
          this.isDriverVerifiedForLiveJobs = false;
        }
      });
  }

  private canActOnLiveRequests(): boolean {
    return this.isDriverVerifiedForLiveJobs;
  }

  private showVerificationRequiredMessage(): void {
    this.showToast(
      this.translate.instant('TRANSPORT_REQUESTS.ERROR_VERIFICATION_REQUIRED'),
      'warning'
    );
  }

  toggleDriverAvailability(
    event: { target: HTMLIonToggleElement; detail: { checked: boolean } }
  ) {
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

          this.syncRequestLoadingState();
        },
        error: (error) => {
          this.isTogglingAvailability = false;
          event.target.disabled = false;
          // Revert toggle on error
          event.target.checked = !event.detail.checked;
          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.STATUS_UPDATE_FAILED'),
            'danger'
          );
        }
      });
  }

  private canLoadRequests(): boolean {
    return this.isDriverAvailable && this.hasLocationPreferences && !this.isAvailabilityLocked;
  }

  private syncRequestLoadingState() {
    if (!this.canLoadRequests()) {
      this.stopFallbackPolling();
      this.loadRequestsSubscription?.unsubscribe();
      this.loadRequestsSubscription = null;
      this.isLoadingRequests = false;
      if (!this.isDriverAvailable || this.isAvailabilityLocked || !this.hasLocationPreferences) {
        this.transportRequests = [];
        this.filteredRequests = [];
      }
      return;
    }

    this.loadTransportRequests();
    if (this.wsConnected) {
      this.stopFallbackPolling();
    } else {
      this.startFallbackPolling();
    }
  }

  private startFallbackPolling() {
    if (this.fallbackRefreshTimer || this.wsConnected) {
      return;
    }

    this.fallbackRefreshTimer = setInterval(() => {
      if (!this.canLoadRequests() || this.wsConnected) {
        this.stopFallbackPolling();
        return;
      }
      this.loadTransportRequests();
    }, this.FALLBACK_REFRESH_MS);
  }

  private stopFallbackPolling() {
    if (this.fallbackRefreshTimer) {
      clearInterval(this.fallbackRefreshTimer);
      this.fallbackRefreshTimer = null;
    }
  }

  private loadTransportRequests() {
    // Only load requests if driver is available
    if (!this.canLoadRequests()) {
      this.loadRequestsSubscription?.unsubscribe();
      this.loadRequestsSubscription = null;
      this.isLoadingRequests = false;
      this.transportRequests = [];
      this.filteredRequests = [];
      return;
    }

    const requestId = ++this.latestLoadRequestId;

    this.loadRequestsSubscription?.unsubscribe();
    this.loadRequestsSubscription = null;

    this.isLoadingRequests = true;
    const preferences = this.locationPreferenceService.getCurrentPreferences();

    let cityIds: number[] = [];
    if (preferences.cities.length > 0) {
      cityIds = preferences.cities;
    }

    let branchIds: number[] = [];
    if (preferences.branches.length > 0) {
      branchIds = preferences.branches;
    }

    this.loadRequestsSubscription = this.transportRequestService.getTransportRequestDetailed(cityIds, branchIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (requestId !== this.latestLoadRequestId) {
            return;
          }
          this.transportRequests = this.deduplicateRequests(response);
          this.applyFilters();
          this.isLoadingRequests = false;
          this.loadRequestsSubscription = null;
        },
        error: (error) => {
          if (requestId !== this.latestLoadRequestId) {
            return;
          }
          this.isLoadingRequests = false;
          this.loadRequestsSubscription = null;
          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.LOAD_FAILED'),
            'danger'
          );
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
      this.showToast(
        this.translate.instant('TRANSPORT_REQUESTS.PREFERENCES_UPDATED'),
        'success'
      );
    }
  }

  async acceptOrder(request: DriverJobOffer) {
    const requestKey = `${request.ride_id}-${request.attempt_no}`;
    if (!this.canActOnLiveRequests()) {
      this.showVerificationRequiredMessage();
      return;
    }
    if (
      this.acceptedRequests.has(requestKey) ||
      this.rejectedRequests.has(requestKey) ||
      this.isUnderCooldown ||
      this.isAvailabilityLocked
    ) {
      this.showToast(
        this.isUnderCooldown
          ? this.translate.instant('TRANSPORT_REQUESTS.CANNOT_ACCEPT_COOLDOWN')
          : this.translate.instant('TRANSPORT_REQUESTS.CANNOT_ACCEPT_LOCKED'),
        'warning'
      );
      return;
    }

    if (!this.checkLoadWithinCapacity(request.load_weight_kg)) {
      const toast = await this.toastCtrl.create({
        message: this.translate.instant('TRANSPORT_REQUESTS.LOAD_CAPACITY_EXCEEDED'),
        duration: 4000,
        position: 'middle',
        color: 'warning',
        buttons: [
          { text: this.translate.instant('TRANSPORT_REQUESTS.OK'), role: 'cancel' }
        ]
      });
      await toast.present();
      return;
    }

    let orderDetails = `${this.translate.instant('TRANSPORT_REQUESTS.JOB_ID')}: ${request.job_id}\n\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.PICKUP')}: ${request.pickup_address}\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.DELIVERY')}: ${request.drop_address}\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.WEIGHT')}: ${request.load_weight_kg}kg\n`;
    orderDetails += `${this.translate.instant('TRANSPORT_REQUESTS.BASE_PRICE')}: ₹${request.offered_rate}\n`;

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_REQUESTS.ACCEPT_HEADER'),
      message: orderDetails,
      buttons: [
        { text: this.translate.instant('TRANSPORT_REQUESTS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.ACCEPT'),
          handler: async () => {
            this.isAcceptingOffer[requestKey] = true;
            const operationId = `accept-${request.ride_id}-${request.attempt_no}-${Date.now()}`;

            const sub = this.transportRequestService
              .acceptJob(request.ride_id, request.attempt_no)
              .subscribe({
                next: () => {
                  this.acceptedRequests.add(requestKey);
                  this.currentLoad += request.load_weight_kg;
                  this.isAcceptingOffer[requestKey] = false;
                  this.failedOperations.delete(operationId);

                  this.showToast(
                    this.translate.instant('TRANSPORT_REQUESTS.ACCEPTED_SUCCESS'),
                    'success'
                  );

                  const remainingCapacity = this.maxLoad - this.currentLoad;
                  if (remainingCapacity > 0) {
                    this.promptForMoreOrders(remainingCapacity);
                  }
                },
                error: (error) => {
                  this.isAcceptingOffer[requestKey] = false;
                  if (this.isPaymentDetailsRequiredError(error)) {
                    this.failedOperations.delete(operationId);
                    return;
                  }
                  const errorMsg = this.getErrorMessage(error, 'TRANSPORT_REQUESTS.ACCEPT_FAILED');
                  this.failedOperations.set(operationId, {
                    type: 'accept',
                    error: errorMsg,
                    timestamp: Date.now()
                  });
                  this.showToast(errorMsg, 'danger');
                  this.showRetryOption(request, 'accept', operationId);
                }
              });

            this.subscription.add(sub);
          }
        }
      ]
    });
    await alert.present();
  }

  async rejectOrder(request: DriverJobOffer) {
    const requestKey = `${request.ride_id}-${request.attempt_no}`;
    if (!this.canActOnLiveRequests()) {
      this.showVerificationRequiredMessage();
      return;
    }
    if (
      this.acceptedRequests.has(requestKey) ||
      this.rejectedRequests.has(requestKey)
    ) {
      return;
    }

    if (this.isUnderCooldown) {
      this.showToast(
        this.translate.instant('TRANSPORT_REQUESTS.CANNOT_REJECT_COOLDOWN'),
        'warning'
      );
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_REQUESTS.REJECT_HEADER'),
      message: this.translate.instant('TRANSPORT_REQUESTS.REJECT_CONFIRM', {
        jobId: request.job_id,
        pickup: request.pickup_address,
        delivery: request.drop_address
      }),
      buttons: [
        { text: this.translate.instant('TRANSPORT_REQUESTS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.REJECT'),
          role: 'destructive',
          handler: async () => {
            this.isRejectingOffer[requestKey] = true;
            const operationId = `reject-${request.ride_id}-${request.attempt_no}-${Date.now()}`;

            const sub = this.transportRequestService
              .rejectJob(request.ride_id, request.attempt_no)
              .subscribe({
                next: () => {
                  this.rejectedRequests.add(requestKey);
                  this.saveRejectedRequest(request.ride_id, request.attempt_no);
                  this.isRejectingOffer[requestKey] = false;
                  this.failedOperations.delete(operationId);
                  this.applyFilters();

                  this.showToast(
                    this.translate.instant('TRANSPORT_REQUESTS.REJECTED_SUCCESS'),
                    'success'
                  );
                },
                error: (error) => {
                  this.isRejectingOffer[requestKey] = false;
                  const errorMsg = this.getErrorMessage(error, 'TRANSPORT_REQUESTS.REJECT_FAILED');
                  this.failedOperations.set(operationId, {
                    type: 'reject',
                    error: errorMsg,
                    timestamp: Date.now()
                  });
                  this.showToast(errorMsg, 'danger');
                  this.showRetryOption(request, 'reject', operationId);
                }
              });
            this.subscription.add(sub);
          }
        }
      ]
    });
    await alert.present();
  }

  private checkLoadWithinCapacity(orderWeight: number): boolean {
    return this.maxLoad >= this.currentLoad + orderWeight;
  }

  async promptForMoreOrders(remainingCapacity: number) {
    const toast = await this.toastCtrl.create({
      message: this.translate.instant('TRANSPORT_REQUESTS.REMAINING_CAPACITY', {
        capacity: remainingCapacity
      }),
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
    const availableOrders = this.filteredRequests.filter(
      request =>
        !this.acceptedRequests.has(
          `${request.ride_id}-${request.attempt_no}`
        ) &&
        !this.rejectedRequests.has(
          `${request.ride_id}-${request.attempt_no}`
        ) &&
        request.load_weight_kg <= remainingCapacity
    );

    if (availableOrders.length === 0) {
      this.showToast(
        this.translate.instant('TRANSPORT_REQUESTS.NO_FITTING_ORDERS'),
        'warning'
      );
      return;
    }

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
      }
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

    // Filter out accepted and rejected requests
    filteredOrders = filteredOrders.filter(request => {
      const requestKey = `${request.ride_id}-${request.attempt_no}`;
      return !this.acceptedRequests.has(requestKey) && !this.rejectedRequests.has(requestKey);
    });

    // Filter by priority deliveries (high priority tier)
    if (this.priorityDeliveries) {
      filteredOrders = filteredOrders.filter(request =>
        request.capacity_warning === true // High priority items have capacity warnings
      );
    }

    // Filter by weight constraints
    if (this.singleDelivery) {
      // Show only deliveries that fit within remaining capacity
      filteredOrders = filteredOrders.filter(request =>
        this.checkLoadWithinCapacity(request.load_weight_kg)
      );
    }

    // Additional filtering options can be added here
    // - delayedDeliveries: filter by delivery time priority
    // - sharedDeliveries: filter by ride_id grouping
    // - perishableOnly: filter by product type/category

    this.filteredRequests = filteredOrders;

    if (this.sortOption) {
      this.applySort();
    }
  }

  async openSortModal() {
    const modal = await this.modalController.create({
      component: SortModalComponent,
      componentProps: { sortOption: this.sortOption }
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
      case 'price-desc':
        this.filteredRequests.sort(
          (a: DriverJobOffer, b: DriverJobOffer) =>
            (b.offered_rate || 0) - (a.offered_rate || 0)
        );
        break;
      case 'quantity-asc':
        this.filteredRequests.sort(
          (a: DriverJobOffer, b: DriverJobOffer) =>
            (a.load_weight_kg || 0) - (b.load_weight_kg || 0)
        );
        break;
      case 'quantity-desc':
        this.filteredRequests.sort(
          (a: DriverJobOffer, b: DriverJobOffer) =>
            (b.load_weight_kg || 0) - (a.load_weight_kg || 0)
        );
        break;
      case 'order-value-desc':
        this.filteredRequests.sort(
          (a: DriverJobOffer, b: DriverJobOffer) =>
            this.getTotalOrderValue(b) - this.getTotalOrderValue(a)
        );
        break;
    }
  }

  private getErrorMessage(error: any, defaultKey: string): string {
    if (!error) {
      return this.translate.instant(defaultKey);
    }

    // Handle backend error codes
    const errorCode = error?.error?.error_code || error?.error?.error || error?.status;
    const errorCodeMap: { [key: string]: string } = {
      'offer_already_taken': 'TRANSPORT_REQUESTS.ERROR_OFFER_TAKEN',
      'offer_not_open': 'TRANSPORT_REQUESTS.ERROR_OFFER_EXPIRED',
      'schedule_conflict': 'TRANSPORT_REQUESTS.ERROR_SCHEDULE_CONFLICT',
      'driver_busy': 'TRANSPORT_REQUESTS.ERROR_DRIVER_BUSY',
      'payment_details_required': 'PAYMENT_DETAILS.MISSING_MESSAGE',
      'job_not_cancelable': 'TRANSPORT_REQUESTS.ERROR_NOT_CANCELABLE',
      'driver_under_cooldown': 'TRANSPORT_REQUESTS.ERROR_UNDER_COOLDOWN',
      'driver_under_dispute': 'TRANSPORT_REQUESTS.ERROR_UNDER_DISPUTE',
      'driver_verification_required': 'TRANSPORT_REQUESTS.ERROR_VERIFICATION_REQUIRED',
      409: 'TRANSPORT_REQUESTS.ERROR_CONFLICT',
      404: 'TRANSPORT_REQUESTS.ERROR_NOT_FOUND',
      403: 'TRANSPORT_REQUESTS.ERROR_VERIFICATION_REQUIRED',
      429: 'TRANSPORT_REQUESTS.ERROR_RATE_LIMITED'
    };

    const messageKey = errorCodeMap[errorCode] || defaultKey;
    return this.translate.instant(messageKey);
  }

  private isPaymentDetailsRequiredError(error: any): boolean {
    const errorBody = error?.error || {};
    return error?.status === 403 && (
      errorBody?.error_code === 'payment_details_required' ||
      errorBody?.error === 'payment_details_required'
    );
  }

  private async showRetryOption(
    request: DriverJobOffer,
    operationType: 'accept' | 'reject',
    operationId: string
  ) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('TRANSPORT_REQUESTS.OPERATION_FAILED'),
      message: this.failedOperations.get(operationId)?.error || 'Unknown error',
      buttons: [
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.DISMISS'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('TRANSPORT_REQUESTS.RETRY'),
          handler: () => {
            if (operationType === 'accept') {
              this.retryAcceptOrder(request);
            } else {
              this.retryRejectOrder(request);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private retryAcceptOrder(request: DriverJobOffer) {
    this.retryingOperationId = `retry-accept-${request.ride_id}-${request.attempt_no}`;
    const requestKey = `${request.ride_id}-${request.attempt_no}`;
    this.isAcceptingOffer[requestKey] = true;

    const sub = this.transportRequestService
      .acceptJob(request.ride_id, request.attempt_no)
      .subscribe({
        next: () => {
          this.acceptedRequests.add(requestKey);
          this.currentLoad += request.load_weight_kg;
          this.isAcceptingOffer[requestKey] = false;
          this.retryingOperationId = null;

          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.ACCEPTED_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.isAcceptingOffer[requestKey] = false;
          this.retryingOperationId = null;
          if (this.isPaymentDetailsRequiredError(error)) {
            return;
          }
          const errorMsg = this.getErrorMessage(error, 'TRANSPORT_REQUESTS.ACCEPT_FAILED');
          this.showToast(errorMsg, 'danger');
        }
      });

    this.subscription.add(sub);
  }

  private retryRejectOrder(request: DriverJobOffer) {
    this.retryingOperationId = `retry-reject-${request.ride_id}-${request.attempt_no}`;
    const requestKey = `${request.ride_id}-${request.attempt_no}`;
    this.isRejectingOffer[requestKey] = true;

    const sub = this.transportRequestService
      .rejectJob(request.ride_id, request.attempt_no)
      .subscribe({
        next: () => {
          this.rejectedRequests.add(requestKey);
          this.saveRejectedRequest(request.ride_id, request.attempt_no);
          this.isRejectingOffer[requestKey] = false;
          this.retryingOperationId = null;
          this.applyFilters();

          this.showToast(
            this.translate.instant('TRANSPORT_REQUESTS.REJECTED_SUCCESS'),
            'success'
          );
        },
        error: (error) => {
          this.isRejectingOffer[requestKey] = false;
          this.retryingOperationId = null;
          const errorMsg = this.getErrorMessage(error, 'TRANSPORT_REQUESTS.REJECT_FAILED');
          this.showToast(errorMsg, 'danger');
        }
      });

    this.subscription.add(sub);
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 4000 : 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    return formatDate(dateString, 'dd MMM yyyy', 'en-US');
  }

  getUrgencyColor(request: DriverJobOffer): string {
    const urgency = this.getUrgency(request);
    switch (urgency.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'standard':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'medium';
    }
  }

  getUrgencyIcon(request: DriverJobOffer): string {
    const urgency = this.getUrgency(request);
    switch (urgency.toLowerCase()) {
      case 'high':
        return 'flash';
      case 'standard':
        return 'time';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  }

  getUrgency(request: DriverJobOffer): string {
    if (request.capacity_warning) return 'high';
    return 'standard';
  }

  isRequestAccepted(rideId: number, attemptNo: number): boolean {
    return this.acceptedRequests.has(`${rideId}-${attemptNo}`);
  }

  isRequestRejected(rideId: number, attemptNo: number): boolean {
    return this.rejectedRequests.has(`${rideId}-${attemptNo}`);
  }

  getTotalOrderValue(request: DriverJobOffer): number {
    return this.transportRequestService.getTotalOrderValue(request);
  }

  getTotalItemCount(request: DriverJobOffer): number {
    return this.transportRequestService.getTotalItemCount(request);
  }

  hasOrders(request: DriverJobOffer): boolean {
    return false; // DriverJobOffer doesn't include orders
  }

  get pendingDeliveries(): DriverJobOffer[] {
    return this.filteredRequests.filter(request => {
      const requestKey = `${request.ride_id}-${request.attempt_no}`;
      return (
        !this.acceptedRequests.has(requestKey) &&
        !this.rejectedRequests.has(requestKey)
      );
    });
  }

  private loadRejectedRequests() {
    const stored = localStorage.getItem('rejected_transport_requests');
    if (stored) {
      try {
        const rejectedArray = JSON.parse(stored) as string[];
        this.rejectedRequests = new Set(rejectedArray);
      } catch (error) {
        // Silently handle JSON parse error
      }
    }
  }

  private saveRejectedRequest(rideId: number, attemptNo: number) {
    const requestKey = this.getRequestKey(rideId, attemptNo);
    this.rejectedRequests.add(requestKey);
    const rejectedArray = Array.from(this.rejectedRequests);
    localStorage.setItem('rejected_transport_requests', JSON.stringify(rejectedArray));
  }
}
