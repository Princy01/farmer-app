import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  timeOutline,
  checkmarkCircleOutline,
  cubeOutline,
  airplaneOutline,
  carOutline,
  bicycleOutline,
  checkmarkDoneCircle,
  businessOutline,
  locationOutline,
  arrowBackOutline,
  alertCircleOutline,
  flagOutline,
  listOutline,
  star,
  starOutline,
  refreshOutline,
  returnDownBackOutline,
  chevronForwardOutline,
  keyOutline,
} from 'ionicons/icons';
import { RetailerOrderService, RetailerOrderDetails, OrderItem, OrderTransportStatus, ReturnReason, CreateReturnRequest, DeliveryOTP } from './retailer-order-details.service';
import { ReturnRequestModalComponent } from './return-request-modal/return-request-modal.component';
import {
  OrderPostDeliveryStatus,
  getPostDeliveryColor,
  getPostDeliveryLabelKey,
  hasPostDeliveryStatus,
} from 'src/app/shared/order-post-delivery-status';
import {
  BuyerRatingsService,
  PeerRatingContextResponse,
  PeerRatingPairOption,
  PeerRatingRecentItem,
} from '../ratings/buyer-ratings.service';
import { DisputeEvidenceGalleryComponent } from './dispute-evidence-gallery/dispute-evidence-gallery.component';

/**
 * Component for displaying retailer order details.
 * Shows order information, items grouped by wholeseller, and order summary.
 */
@Component({
  selector: 'app-retailer-order-details',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe, DisputeEvidenceGalleryComponent],
  templateUrl: './retailer-order-details.component.html',
  styleUrls: ['./retailer-order-details.component.scss'],
})
export class RetailerOrderDetailsComponent implements OnInit, OnDestroy {
  order: RetailerOrderDetails | null = null;
  loading = true;
  error: string | null = null;

  ratingContext: PeerRatingContextResponse | null = null;
  ratingsLoading = false;
  ratingsError: string | null = null;
  selectedPairKey: string | null = null;
  selectedStars = 0;
  ratingComment = '';
  ratingSubmitting = false;
  ratingFeedback: { type: 'success' | 'danger'; message: string } | null = null;
  readonly starValues = [1, 2, 3, 4, 5];
  isCancelling = false;

  // Return order properties
  isReturning = false;
  returnReasons: ReturnReason[] = [];
  returningOrderIds = new Set<number>();
  returnsSubmittedIds = new Set<number>();
  returnLoadingReasons = false;

  // Pending evidence upload after return submission
  pendingEvidenceFiles: Array<{ file: File; capturedAt: string }> = [];
  pendingEvidenceUploadDelay: any = null;

  // Delivery OTP (mirrors the OTP the driver has generated in their app,
  // shown here so the retailer can verify/hand over the order)
  deliveryOtp: DeliveryOTP | null = null;
  otpLoading = false;
  otpError: string | null = null;
  otpCountdownText = '';
  private otpCountdownInterval: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: RetailerOrderService,
    private ratingsService: BuyerRatingsService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService
  ) {
    addIcons({
      timeOutline,
      checkmarkCircleOutline,
      cubeOutline,
      airplaneOutline,
      carOutline,
      bicycleOutline,
      checkmarkDoneCircle,
      businessOutline,
      locationOutline,
      arrowBackOutline,
      alertCircleOutline,
      flagOutline,
      listOutline,
      star,
      starOutline,
      refreshOutline,
      returnDownBackOutline,
      chevronForwardOutline,
      keyOutline,
    });
  }

  ngOnInit(): void {
    this.loadOrderDetails();
  }

  ngOnDestroy(): void {
    if (this.pendingEvidenceUploadDelay) {
      clearTimeout(this.pendingEvidenceUploadDelay);
    }
    this.clearOtpCountdown();
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTransportStatusLabel(transport?: OrderTransportStatus | null): string {
    const key = this.getTransportStatusLabelKey(transport);
    if (key) {
      return this.translate.instant(key);
    }
    return transport?.status_label || '';
  }

  getTransportStatusNote(transport?: OrderTransportStatus | null): string {
    const key = this.getTransportStatusNoteKey(transport);
    if (key) {
      return this.translate.instant(key);
    }
    return transport?.status_note || '';
  }

  private getTransportStatusLabelKey(transport?: OrderTransportStatus | null): string | null {
    if (!transport) return null;
    const jobStatus = (transport.job_status || '').toLowerCase();
    const deliveryStatus = (transport.delivery_status || '').toLowerCase();

    if (transport.needs_admin_action) return 'TRANSPORT_STATUS.ADMIN_REVIEW';
    if (jobStatus === 'cancelled' || jobStatus === 'canceled') return 'TRANSPORT_STATUS.CANCELLED';
    if (jobStatus === 'expired') return 'TRANSPORT_STATUS.NOT_ASSIGNED';
    if (jobStatus === 'ride_offered') return 'TRANSPORT_STATUS.BEING_OFFERED';
    if (jobStatus === 'open') return 'TRANSPORT_STATUS.REQUEST_OPEN';
    if (jobStatus === 'accepted' && deliveryStatus === 'pending') return 'TRANSPORT_STATUS.ACCEPTED_PICKUP_PENDING';
    if (jobStatus === 'accepted') return 'TRANSPORT_STATUS.DRIVER_ASSIGNED';
    if (jobStatus === 'picked_up' || deliveryStatus === 'picked_up') return 'TRANSPORT_STATUS.PICKED_UP_DELIVERY_PENDING';
    if (jobStatus === 'delivered' || deliveryStatus === 'delivered') return 'TRANSPORT_STATUS.DELIVERED';
    return null;
  }

  private getTransportStatusNoteKey(transport?: OrderTransportStatus | null): string | null {
    if (!transport) return null;
    const jobStatus = (transport.job_status || '').toLowerCase();

    if (transport.needs_admin_action) return 'TRANSPORT_STATUS.NOTES.ADMIN_REVIEW';
    if (jobStatus === 'cancelled' || jobStatus === 'canceled') return 'TRANSPORT_STATUS.NOTES.CANCELLED';
    if (jobStatus === 'expired') return 'TRANSPORT_STATUS.NOTES.NOT_ASSIGNED';
    if (jobStatus === 'open') return 'TRANSPORT_STATUS.NOTES.REQUEST_OPEN';
    return null;
  }

  /**
   * Loads order details from the API based on order ID from route parameters.
   */
  private loadOrderDetails(): void {
    const orderId = this.route.snapshot.paramMap.get('id');

    if (!orderId || isNaN(+orderId)) {
      this.error = this.translate.instant('RETAILER_ORDER_DETAILS.ERROR_INVALID_ID');
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    this.orderService
      .getOrderDetails(+orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: RetailerOrderDetails) => {
          this.order = data;
          this.loading = false;
          this.error = null;
          this.loadRatingContext();
          this.refreshDeliveryOtpState();
        },
        error: (err: Error) => {
          const translationKey = err.message || 'RETAILER_ORDER_DETAILS.ERROR_LOAD_FAILED';
          this.error = this.translate.instant(translationKey);
          this.loading = false;
        },
      });
  }

  /**
   * Decides whether an active delivery OTP should be shown for the current
   * order's transport job, and fetches/clears it accordingly. Called whenever
   * the order (and therefore its transport status) is (re)loaded.
   */
  private refreshDeliveryOtpState(): void {
    if (this.canShowDeliveryOtp()) {
      this.loadDeliveryOtp();
    } else {
      this.deliveryOtp = null;
      this.otpError = null;
      this.clearOtpCountdown();
    }
  }

  /**
   * Whether the driver could plausibly have an active delivery OTP for this
   * order right now, i.e. a job has been assigned and picked up but delivery
   * has not yet been confirmed.
   */
  canShowDeliveryOtp(): boolean {
    const transport = this.order?.transport;
    if (!transport || !transport.job_id || transport.needs_admin_action) {
      return false;
    }
    const jobStatus = (transport.job_status || '').toLowerCase();
    return jobStatus === 'accepted' || jobStatus === 'picked_up';
  }

  /**
   * Fetches the active delivery OTP for the current transport job.
   */
  loadDeliveryOtp(): void {
    const jobId = this.order?.transport?.job_id;
    if (!jobId) {
      return;
    }

    this.otpLoading = true;
    this.otpError = null;

    this.orderService
      .getActiveDeliveryOTP(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (otp: DeliveryOTP) => {
          this.deliveryOtp = otp;
          this.otpLoading = false;
          this.otpError = null;
          this.startOtpCountdown();
        },
        error: (err: Error) => {
          this.otpLoading = false;
          this.deliveryOtp = null;
          this.clearOtpCountdown();
          // NOT_FOUND simply means the driver hasn't generated an OTP yet —
          // that's an expected waiting state, not an error to alarm the retailer with.
          this.otpError = err.message === 'NOT_FOUND'
            ? null
            : this.translate.instant('RETAILER_ORDER_DETAILS.OTP_ERROR');
        },
      });
  }

  /**
   * Manual refresh triggered by the retailer (e.g. after the countdown ends
   * or if they suspect the driver has regenerated the code).
   */
  refreshDeliveryOtp(): void {
    this.loadDeliveryOtp();
  }

  private startOtpCountdown(): void {
    this.clearOtpCountdown();
    if (!this.deliveryOtp?.expires_at) {
      this.otpCountdownText = '';
      return;
    }
    this.updateOtpCountdown();
    this.otpCountdownInterval = setInterval(() => this.updateOtpCountdown(), 1000);
  }

  private updateOtpCountdown(): void {
    if (!this.deliveryOtp?.expires_at) {
      this.otpCountdownText = '';
      this.clearOtpCountdown();
      return;
    }

    const remainingMs = new Date(this.deliveryOtp.expires_at).getTime() - Date.now();

    if (remainingMs <= 0) {
      this.otpCountdownText = this.translate.instant('RETAILER_ORDER_DETAILS.OTP_EXPIRED');
      this.clearOtpCountdown();
      // The driver's app may have generated a fresh code — check for one.
      this.loadDeliveryOtp();
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.otpCountdownText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private clearOtpCountdown(): void {
    if (this.otpCountdownInterval) {
      clearInterval(this.otpCountdownInterval);
      this.otpCountdownInterval = null;
    }
  }

  loadRatingContext(): void {
    if (!this.order?.order_id) {
      this.ratingContext = null;
      return;
    }

    this.ratingsLoading = true;
    this.ratingsError = null;
    this.ratingFeedback = null;

    this.ratingsService
      .getRatingContext(this.order.order_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (context) => {
          this.ratingContext = context;
          this.ratingsLoading = false;

          if (context.eligible_pairs?.length > 0) {
            const hasSelectedPair = context.eligible_pairs.some(
              (pair) => pair.pair_key === this.selectedPairKey
            );
            if (!hasSelectedPair) {
              this.selectedPairKey = context.eligible_pairs[0].pair_key;
            }
          } else {
            this.selectedPairKey = null;
          }
        },
        error: (err: Error) => {
          this.ratingsLoading = false;
          this.ratingsError = this.getRatingErrorMessage(err.message);
        },
      });
  }

  get selectedPair(): PeerRatingPairOption | null {
    if (!this.ratingContext?.eligible_pairs?.length || !this.selectedPairKey) {
      return null;
    }
    return this.ratingContext.eligible_pairs.find((pair) => pair.pair_key === this.selectedPairKey) ?? null;
  }

  get existingRatings(): PeerRatingRecentItem[] {
    return this.ratingContext?.existing_ratings ?? [];
  }

  setStars(value: number): void {
    this.selectedStars = value;
  }

  canSubmitRating(): boolean {
    return !!this.selectedPair && this.selectedStars >= 1 && this.selectedStars <= 5 && !this.ratingSubmitting;
  }

  submitRating(): void {
    const selectedPair = this.selectedPair;
    if (!this.order?.order_id || !selectedPair) {
      return;
    }

    if (this.selectedStars < 1 || this.selectedStars > 5) {
      this.ratingFeedback = {
        type: 'danger',
        message: this.translate.instant('RETAILER_ORDER_DETAILS.RATING_REQUIRED'),
      };
      return;
    }

    this.ratingSubmitting = true;
    this.ratingFeedback = null;

    this.ratingsService
      .submitPeerRating({
        order_id: this.order.order_id,
        job_id: selectedPair.job_id,
        rater_entity_type: selectedPair.rater_entity_type,
        rater_entity_id: selectedPair.rater_entity_id,
        ratee_entity_type: selectedPair.ratee_entity_type,
        ratee_entity_id: selectedPair.ratee_entity_id,
        stars: this.selectedStars,
        comment: this.ratingComment.trim().slice(0, 500),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.ratingSubmitting = false;
          this.selectedStars = 0;
          this.ratingComment = '';
          this.ratingFeedback = {
            type: 'success',
            message:
              response.message || this.translate.instant('RETAILER_ORDER_DETAILS.RATING_SUBMIT_SUCCESS'),
          };
          this.loadRatingContext();
        },
        error: (err: Error) => {
          this.ratingSubmitting = false;
          this.ratingFeedback = {
            type: 'danger',
            message: this.getRatingErrorMessage(err.message),
          };
        },
      });
  }

  private getRatingErrorMessage(errorKey: string): string {
    if (!errorKey) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_SUBMIT_ERROR');
    }

    const keyMap: Record<string, string> = {
      'NETWORK_ERROR': 'RETAILER_ORDER_DETAILS.RATING_NETWORK_ERROR',
      'REQUEST_TIMEOUT_ERROR': 'RETAILER_ORDER_DETAILS.RATING_NETWORK_ERROR',
      'SERVER_ERROR': 'RETAILER_ORDER_DETAILS.RATING_SUBMIT_ERROR',
      'SESSION_EXPIRED': 'SESSION_EXPIRED',
      'ACCESS_DENIED': 'RETAILER_ORDER_DETAILS.RATING_FORBIDDEN',
      'NOT_FOUND': 'RETAILER_ORDER_DETAILS.RATING_SUBMIT_ERROR',
    };

    if (keyMap[errorKey]) {
      return this.translate.instant(keyMap[errorKey]);
    }

    const normalized = errorKey.toLowerCase();
    if (normalized.includes('already exists')) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_DUPLICATE');
    }
    if (normalized.includes('not valid') || normalized.includes('only available') || normalized.includes('access')) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_FORBIDDEN');
    }
    if (normalized.includes('must be delivered')) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_NOT_DELIVERED');
    }
    if (normalized.includes('required') || normalized.includes('invalid')) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_BAD_REQUEST');
    }

    return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_SUBMIT_ERROR');
  }

  /**
   * Retries loading order details after an error.
   */
  retry(): void {
    this.loadOrderDetails();
  }

  getOrderNumberDisplay(): string {
    const orderIds = this.order?.order_ids ?? [];
    if (orderIds.length > 0) {
      return orderIds.map((orderId) => `#${orderId}`).join(', ');
    }
    return this.order?.order_id ? `#${this.order.order_id}` : '#';
  }

  /**
   * Navigates back to the order history page.
   */
  goBack(): void {
    this.router.navigate(['/buyer/retailer-order-history']);
  }

  /**
   * Navigates to the buyer Report Issue screen for this order.
   */
  reportIssue(): void {
    if (!this.order?.order_id) {
      return;
    }

    this.router.navigate(['/buyer/report-issue', this.order.order_id]);
  }

  /**
   * Navigates to buyer My Issues screen and applies this order as filter.
   */
  openMyIssues(): void {
    if (this.order?.order_id) {
      this.router.navigate(['/buyer/my-issues'], {
        queryParams: { orderId: this.order.order_id },
      });
      return;
    }

    this.router.navigate(['/buyer/my-issues']);
  }

  getStatusName(status: number): string {
    return this.order?.order_status_name || this.translate.instant('RETAILER_ORDER_DETAILS.STATUS_UNKNOWN');
  }

  getStatusDisplay(status: number): string {
    return this.order?.order_status_name || this.translate.instant('RETAILER_ORDER_DETAILS.STATUS_UNKNOWN');
  }

  canCancelOrder(): boolean {
    if (!this.order) {
      return false;
    }

    if (this.hasPostDelivery() || this.returnsSubmittedIds.has(this.order.order_id)) {
      return false;
    }

    const statusName = (this.order.order_status_name || '').toLowerCase();
    if (statusName.includes('cancel') || statusName.includes('return') || statusName.includes('reject')) {
      return false;
    }

    const blockedStatuses = new Set([5, 6, 7, 9, 10]);
    if (blockedStatuses.has(this.order.order_status)) {
      return false;
    }

    return true;
  }

  async promptCancelOrder(): Promise<void> {
    if (!this.order || this.isCancelling) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_CONFIRM_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_CONFIRM_MESSAGE'),
      inputs: [
        {
          name: 'reason',
          type: 'text',
          placeholder: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_REASON_PLACEHOLDER')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_ABORT'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_ACTION'),
          handler: (data) => this.submitCancelOrder(data?.reason)
        }
      ]
    });

    await alert.present();
  }

  private async submitCancelOrder(reason?: string): Promise<void> {
    if (!this.order || this.isCancelling) {
      return;
    }

    this.isCancelling = true;
    const cancellationReason = (reason || '').trim() || 'retailer_cancelled';
    const orderId = this.order.order_id;

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_ORDER_DETAILS.CANCELLING_ORDER'),
    });
    await loading.present();

    this.orderService.cancelOrder(orderId, cancellationReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          await loading.dismiss();
          this.isCancelling = false;
          await this.showCancelSuccess();
          this.loadOrderDetails();
        },
        error: async (err: Error) => {
          await loading.dismiss();
          this.isCancelling = false;
          await this.showCancelError(err?.message, cancellationReason);
        }
      });
  }

  private async showCancelSuccess(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_SUCCESS_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_SUCCESS_MESSAGE'),
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
    });
    await alert.present();
  }

  private async showCancelError(errorKey?: string, cancellationReason?: string): Promise<void> {
    const networkKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR']);
    const isNetworkError = errorKey && networkKeys.has(errorKey);

    const message = isNetworkError
      ? this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_NETWORK_ERROR')
      : this.translate.instant(errorKey || 'RETAILER_ORDER_DETAILS.CANCEL_ORDER_ERROR_MESSAGE');

    const buttons: any[] = [
      { text: this.translate.instant('RETAILER_ORDER_DETAILS.OK'), role: 'cancel' }
    ];

    const retryableKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR', 'SERVER_ERROR']);
    if (errorKey && retryableKeys.has(errorKey) && cancellationReason) {
      buttons.unshift({
        text: this.translate.instant('RETAILER_ORDER_DETAILS.RETRY'),
        handler: () => this.submitCancelOrder(cancellationReason)
      });
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_ERROR_TITLE'),
      message,
      buttons
    });
    await alert.present();
  }

  isSuccessfulStatus(statusName: string): boolean {
    const value = statusName.toLowerCase();
    return value.includes('successful') || value.includes('delivered') || value.includes('complete');
  }

  /**
   * Checks if order can be returned (only delivered orders).
   */
  canReturnOrder(): boolean {
    if (!this.order) {
      return false;
    }

    if (
      this.returningOrderIds.has(this.order.order_id) ||
      this.returnsSubmittedIds.has(this.order.order_id) ||
      this.hasPostDelivery()
    ) {
      return false;
    }

    return this.isSuccessfulStatus(this.order.order_status_name);
  }

  getReturnStatusBadge(): string | null {
    if (!this.order) {
      return null;
    }

    if (this.returningOrderIds.has(this.order.order_id)) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.PROCESSING_RETURN');
    }

    if (this.returnsSubmittedIds.has(this.order.order_id)) {
      return this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_REQUESTED_BADGE');
    }

    return null;
  }

  hasReturnRequest(): boolean {
    if (!this.order) {
      return false;
    }
    const postDeliveryType = this.order.post_delivery?.post_delivery_type || 'none';
    return this.returnsSubmittedIds.has(this.order.order_id) ||
      postDeliveryType === 'return' ||
      postDeliveryType === 'return_dispute';
  }

  hasPostDelivery(): boolean {
    return hasPostDeliveryStatus(this.order?.post_delivery);
  }

  getPostDeliveryColor(status?: OrderPostDeliveryStatus | null): string {
    return getPostDeliveryColor(status);
  }

  getPostDeliveryLabel(status?: OrderPostDeliveryStatus | null): string {
    const key = getPostDeliveryLabelKey(status);
    if (key) {
      const translated = this.translate.instant(key);
      if (translated !== key) {
        return translated;
      }
    }

    return status?.return_status_description ||
      status?.return_status_name ||
      status?.dispute_status ||
      status?.finance_exception_status ||
      '';
  }

  /**
   * Returns the dispute ID from post_delivery if one exists.
   */
  getReturnDisputeId(): number | null {
    const disputeId = this.order?.post_delivery?.return_dispute_id ?? this.order?.post_delivery?.dispute_case_id;
    if (typeof disputeId === 'number' && disputeId > 0) {
      return disputeId;
    }
    return null;
  }

  /**
   * Whether to show the dispute evidence gallery card.
   * Requires a dispute ID to be present on the order.
   */
  canShowReturnEvidence(): boolean {
    return this.getReturnDisputeId() !== null;
  }

  /**
   * Opens modal to initiate return request.
   */
  async promptReturnOrder(): Promise<void> {
    if (!this.order || this.isReturning || this.returningOrderIds.has(this.order.order_id)) {
      return;
    }

    if (this.returnReasons.length === 0) {
      const errorKey = await this.loadReturnReasons();

      if (this.returnReasons.length === 0) {
        const networkKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR']);
        const retryableKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR', 'SERVER_ERROR']);
        const isNetwork = errorKey && networkKeys.has(errorKey);

        const message = isNetwork
          ? this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_REASONS_NETWORK_ERROR')
          : this.translate.instant(errorKey || 'RETAILER_ORDER_DETAILS.RETURN_REASONS_LOAD_FAILED');

        const buttons: any[] = [
          { text: this.translate.instant('RETAILER_ORDER_DETAILS.OK'), role: 'cancel' }
        ];

        if (errorKey && retryableKeys.has(errorKey)) {
          buttons.unshift({
            text: this.translate.instant('RETAILER_ORDER_DETAILS.RETRY'),
            handler: () => this.promptReturnOrder()
          });
        }

        const alert = await this.alertCtrl.create({
          header: this.translate.instant('RETAILER_ORDER_DETAILS.ERROR'),
          message,
          buttons
        });
        await alert.present();
        return;
      }
    }

    const modal = await this.modalCtrl.create({
      component: ReturnRequestModalComponent,
      componentProps: {
        returnReasons: this.returnReasons
      },
      breakpoints: [0, 0.95],
      initialBreakpoint: 0.95
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role !== 'backdrop' && data?.returnReasonId) {
      await this.submitReturnOrder(data.returnReasonId, data.remarks || '', data.evidenceFiles || []);
    }
  }

  /**
   * Loads return reasons from backend.
   */
  private loadReturnReasons(): Promise<string | null> {
    return new Promise((resolve) => {
      this.returnLoadingReasons = true;

      this.orderService
        .getReturnReasons('retailer')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (reasons) => {
            this.returnReasons = reasons || [];
            this.returnLoadingReasons = false;
            resolve(null);
          },
          error: (err: Error) => {
            console.error('Failed to load return reasons:', err);
            this.returnReasons = [];
            this.returnLoadingReasons = false;
            resolve(err?.message || 'RETAILER_ORDER_DETAILS.RETURN_REASONS_LOAD_FAILED');
          }
        });
    });
  }

  /**
   * Submits return request with selected items and reason.
   * Evidence files are collected locally in the modal. The return response includes
   * the linked dispute case id, so evidence can be uploaded to /disputes/{id}/evidence
   * immediately. The delayed reload fallback is kept for older backend responses.
   */
  private async submitReturnOrder(
    returnReasonId: number,
    remarks: string,
    evidenceFiles: Array<{ file: File; capturedAt: string }> = []
  ): Promise<void> {
    if (!this.order || this.isReturning) {
      return;
    }

    const uniqueWholesellers = [...new Set(this.order.items.map(item => item.wholeseller_id))];

    this.isReturning = true;
    this.returningOrderIds.add(this.order.order_id);

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_ORDER_DETAILS.PROCESSING_RETURN'),
    });
    await loading.present();

    let successCount = 0;
    const failedWholesellers: string[] = [];
    let lastErrorKey: string | null = null;
    const createdDisputeIds: number[] = [];

    for (const wholesellerId of uniqueWholesellers) {
      const wholesellerItems = this.order.items.filter(item => item.wholeseller_id === wholesellerId);
      const returnItems = wholesellerItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit: item.unit_name || 'kg'
      }));

      const returnRequest: CreateReturnRequest = {
        order_id: this.order.order_id,
        wholeseller_id: wholesellerId,
        return_reason_id: returnReasonId,
        items: returnItems,
        remarks: remarks
      };

      try {
        await new Promise<void>((resolve, reject) => {
          this.orderService
            .createReturnRequest(returnRequest)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (response) => {
                successCount++;
                if (typeof response?.dispute_case_id === 'number' && response.dispute_case_id > 0) {
                  createdDisputeIds.push(response.dispute_case_id);
                }
                resolve();
              },
              error: (err: Error) => {
                const wholesellerName = wholesellerItems[0]?.wholeseller_name || `Wholeseller ${wholesellerId}`;
                failedWholesellers.push(wholesellerName);
                lastErrorKey = err?.message || null;
                resolve();
              }
            });
        });
      } catch (err: any) {
        const wholesellerName = wholesellerItems[0]?.wholeseller_name || `Wholeseller ${wholesellerId}`;
        failedWholesellers.push(wholesellerName);
        lastErrorKey = err?.message || null;
      }
    }

    await loading.dismiss();
    this.isReturning = false;

    if (successCount > 0 && failedWholesellers.length === 0) {
      this.returnsSubmittedIds.add(this.order!.order_id);
      if (evidenceFiles.length > 0 && createdDisputeIds.length > 0) {
        await this.uploadEvidenceFilesToDisputes(createdDisputeIds, evidenceFiles);
      }
      await this.showReturnSuccess();

      this.loadOrderDetails();

      if (evidenceFiles.length > 0 && createdDisputeIds.length === 0) {
        this.pendingEvidenceFiles = evidenceFiles;
        if (this.pendingEvidenceUploadDelay) {
          clearTimeout(this.pendingEvidenceUploadDelay);
        }
        this.pendingEvidenceUploadDelay = setTimeout(() => {
          this.uploadPendingEvidenceToDispute();
        }, 1500); // Wait for order to reload with dispute_id
      }
    } else if (successCount > 0 && failedWholesellers.length > 0) {
      this.returnsSubmittedIds.add(this.order!.order_id);
      if (evidenceFiles.length > 0 && createdDisputeIds.length > 0) {
        await this.uploadEvidenceFilesToDisputes(createdDisputeIds, evidenceFiles);
      }
      await this.showReturnPartialError(failedWholesellers, lastErrorKey);
      this.loadOrderDetails();

      if (evidenceFiles.length > 0 && createdDisputeIds.length === 0) {
        this.pendingEvidenceFiles = evidenceFiles;
        if (this.pendingEvidenceUploadDelay) {
          clearTimeout(this.pendingEvidenceUploadDelay);
        }
        this.pendingEvidenceUploadDelay = setTimeout(() => {
          this.uploadPendingEvidenceToDispute();
        }, 1500);
      }
    } else {
      await this.showReturnError(lastErrorKey, returnReasonId, remarks, evidenceFiles);
    }

    this.returningOrderIds.delete(this.order!.order_id);
  }

  private async uploadEvidenceFilesToDisputes(
    disputeIds: number[],
    evidenceFiles: Array<{ file: File; capturedAt: string }>
  ): Promise<void> {
    const uniqueDisputeIds = [...new Set(disputeIds.filter((id) => id > 0))];
    for (const disputeId of uniqueDisputeIds) {
      for (let index = 0; index < evidenceFiles.length; index++) {
        const evidence = evidenceFiles[index];
        try {
          await firstValueFrom(
            this.orderService
              .addReturnDisputeEvidence(disputeId, evidence.file, {
                caption: `Return evidence ${index + 1}`,
                capturedAt: evidence.capturedAt,
              })
              .pipe(takeUntil(this.destroy$))
          );
        } catch (err) {
          console.error(`Failed to upload return evidence ${index + 1} for dispute ${disputeId}:`, err);
        }
      }
    }
  }

  /**
   * Uploads pending evidence files to the dispute after return is created.
   * Called after order reloads with the dispute_id.
   */
  private uploadPendingEvidenceToDispute(): void {
    const disputeId = this.getReturnDisputeId();
    if (!disputeId || this.pendingEvidenceFiles.length === 0) {
      this.pendingEvidenceFiles = [];
      return;
    }

    // Upload files sequentially to avoid race conditions
    const uploadNext = (index: number): void => {
      if (index >= this.pendingEvidenceFiles.length) {
        this.pendingEvidenceFiles = [];
        return;
      }

      const evidence = this.pendingEvidenceFiles[index];
      this.orderService
        .addReturnDisputeEvidence(disputeId, evidence.file, {
          caption: `Return evidence ${index + 1}`,
          capturedAt: evidence.capturedAt,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            uploadNext(index + 1);
          },
          error: (err: Error) => {
            console.error(`Failed to upload evidence file ${index + 1}:`, err);
            uploadNext(index + 1);
          }
        });
    };

    uploadNext(0);
  }

  private async showReturnSuccess(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_SUCCESS_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_SUCCESS_MESSAGE'),
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
    });
    await alert.present();
  }

  private async showReturnPartialError(failedWholesellers: string[], errorKey?: string | null): Promise<void> {
    const networkKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR']);
    const hint = errorKey && networkKeys.has(errorKey)
      ? ` ${this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_PARTIAL_NETWORK_HINT')}`
      : '';

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_PARTIAL_ERROR_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_PARTIAL_ERROR_MESSAGE', {
        wholesellers: failedWholesellers.join(', ')
      }) + hint,
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
    });
    await alert.present();
  }

  private async showReturnError(
    errorKey?: string | null,
    returnReasonId?: number,
    remarks?: string,
    evidenceFiles: Array<{ file: File; capturedAt: string }> = []
  ): Promise<void> {
    const networkKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR']);
    const retryableKeys = new Set(['NETWORK_ERROR', 'REQUEST_TIMEOUT_ERROR', 'SERVER_ERROR']);
    const isNetwork = errorKey && networkKeys.has(errorKey);

    const message = isNetwork
      ? this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_NETWORK_ERROR')
      : this.translate.instant(errorKey || 'RETAILER_ORDER_DETAILS.RETURN_ERROR_MESSAGE');

    const buttons: any[] = [
      { text: this.translate.instant('RETAILER_ORDER_DETAILS.OK'), role: 'cancel' }
    ];

    if (errorKey && retryableKeys.has(errorKey) && returnReasonId != null) {
      buttons.unshift({
        text: this.translate.instant('RETAILER_ORDER_DETAILS.RETRY'),
        handler: () => this.submitReturnOrder(returnReasonId, remarks || '', evidenceFiles)
      });
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_ERROR_TITLE'),
      message,
      buttons
    });
    await alert.present();
  }

  /**
   * Returns the Ionic color for an order status badge.
   */
  getStatusColor(status: number): string {
    const colors: { [key: number]: string } = {
      1: 'medium',
      2: 'primary',
      3: 'secondary',
      4: 'tertiary',
      5: 'warning',
      6: 'success',
    };
    return colors[status] || 'medium';
  }

  /**
   * Returns the Ionicon name for an order status.
   */
  getStatusIcon(status: number): string {
    const icons: { [key: number]: string } = {
      1: 'time-outline',
      2: 'checkmark-circle-outline',
      3: 'cube-outline',
      4: 'airplane-outline',
      5: 'car-outline',
      6: 'checkmark-done-circle',
    };
    return icons[status] || 'help-outline';
  }

  getSubtotal(): number {
    return this.order?.total_order_amount || 0;
  }

  getTotal(): number {
    return (this.order?.final_amount || 0) + (this.order?.delivery_amount || 0);
  }

  getDeliveryAmount(): number {
    return this.order?.delivery_amount || 0;
  }

  getItemTotal(item: OrderItem): number {
    return item.quantity * item.price;
  }

  getItemDiscount(item: OrderItem): number {
    return item.discount_amount || 0;
  }

  getItemTax(item: OrderItem): number {
    return item.tax_amount || 0;
  }

  getItemFinalTotal(item: OrderItem): number {
    const subtotal = this.getItemTotal(item);
    const discount = this.getItemDiscount(item);
    const tax = this.getItemTax(item);
    return subtotal - discount + tax;
  }
}