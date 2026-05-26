import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { addIcons } from 'ionicons';
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
} from 'ionicons/icons';
import { RetailerOrderService, RetailerOrderDetails, OrderItem, OrderTransportStatus, ReturnReason, CreateReturnRequest } from './retailer-order-details.service';
import { ReturnRequestModalComponent } from './return-request-modal/return-request-modal.component';
import {
  BuyerRatingsService,
  PeerRatingContextResponse,
  PeerRatingPairOption,
  PeerRatingRecentItem,
} from '../ratings/buyer-ratings.service';

/**
 * Component for displaying retailer order details.
 * Shows order information, items grouped by wholeseller, and order summary.
 */
@Component({
  selector: 'app-retailer-order-details',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe, ReturnRequestModalComponent],
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
  returningOrderIds = new Set<number>(); // Orders currently submitting returns
  returnsSubmittedIds = new Set<number>(); // Orders with successfully submitted returns
  selectedReturnItems: Map<number, number> = new Map(); // Map of product_id to quantity
  selectedReturnReason: ReturnReason | null = null;
  returnRemarks = '';
  returnLoadingReasons = false;

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
    });
  }

  ngOnInit(): void {
    this.loadOrderDetails();
  }

  ngOnDestroy(): void {
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
   * Handles invalid IDs and API errors gracefully.
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
        },
        error: (err: Error) => {
          // Error message is a translation key from service
          const translationKey = err.message || 'RETAILER_ORDER_DETAILS.ERROR_LOAD_FAILED';
          this.error = this.translate.instant(translationKey);
          this.loading = false;
        },
      });
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

  private getRatingErrorMessage(message: string): string {
  if (!message) {
    return this.translate.instant('RETAILER_ORDER_DETAILS.RATING_SUBMIT_ERROR');
  }

  const normalized = message.toLowerCase();
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
  return message;
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

    // Prevent cancellation if return is already requested
    if (this.returnsSubmittedIds.has(this.order.order_id)) {
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

  private submitCancelOrder(reason?: string): void {
    if (!this.order || this.isCancelling) {
      return;
    }

    this.isCancelling = true;
    const cancellationReason = (reason || '').trim() || 'retailer_cancelled';

    this.orderService.cancelOrder(this.order.order_id, cancellationReason)
      .subscribe({
        next: async () => {
          this.isCancelling = false;
          await this.showCancelSuccess();
          this.loadOrderDetails();
        },
        error: async () => {
          this.isCancelling = false;
          await this.showCancelError();
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

  private async showCancelError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_ERROR_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL_ORDER_ERROR_MESSAGE'),
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
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

    // Don't allow return if already submitted or currently submitting
    if (this.returningOrderIds.has(this.order.order_id) || this.returnsSubmittedIds.has(this.order.order_id)) {
      return false;
    }

    // Only allow return for delivered orders
    return this.isSuccessfulStatus(this.order.order_status_name);
  }

  /**
   * Gets the return status badge text for the order.
   */
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

  /**
   * Checks if order has a pending return request.
   */
  hasReturnRequest(): boolean {
    if (!this.order) {
      return false;
    }
    return this.returnsSubmittedIds.has(this.order.order_id);
  }

  /**
   * Opens modal to initiate return request.
   */
  async promptReturnOrder(): Promise<void> {
    if (!this.order || this.isReturning || this.returningOrderIds.has(this.order.order_id)) {
      return;
    }

    // Load return reasons if not already loaded
    if (this.returnReasons.length === 0) {
      await this.loadReturnReasons();
    }

    if (this.returnReasons.length === 0) {
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('RETAILER_ORDER_DETAILS.ERROR'),
        message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_REASONS_LOAD_FAILED'),
        buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
      });
      await alert.present();
      return;
    }

    // Create and present the modal
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

    // Handle modal result
    if (role !== 'backdrop' && data?.returnReasonId) {
      await this.submitReturnOrder(data.returnReasonId, data.remarks || '');
    }
  }

  /**
   * Prompts user for return remarks after reason selection.
   */
  private async promptReturnRemarks(returnReasonId: number): Promise<void> {
    const remarksAlert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_ORDER_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_ORDER_MESSAGE'),
      inputs: [
        {
          name: 'remarks',
          type: 'textarea',
          placeholder: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_REMARKS_PLACEHOLDER')
        }
      ],
      buttons: [
        {
          text: this.translate.instant('RETAILER_ORDER_DETAILS.CANCEL'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_ORDER_ACTION'),
          handler: (data) => this.submitReturnOrder(returnReasonId, data?.remarks || '')
        }
      ]
    });

    await remarksAlert.present();
  }

  /**
   * Loads return reasons from backend.
   */
  private loadReturnReasons(): Promise<void> {
    return new Promise((resolve) => {
      this.returnLoadingReasons = true;

      this.orderService
        .getReturnReasons('retailer')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (reasons) => {
            console.log('Return reasons loaded:', reasons);
            this.returnReasons = reasons || [];
            this.returnLoadingReasons = false;
            resolve();
          },
          error: (err) => {
            console.error('Failed to load return reasons:', err);
            this.returnReasons = [];
            this.returnLoadingReasons = false;
            resolve();
          }
        });
    });
  }

  /**
   * Submits return request with selected items and reason.
   */
  private async submitReturnOrder(returnReasonId: number, remarks: string): Promise<void> {
    if (!this.order || this.isReturning) {
      return;
    }

    // Get unique wholesellers for this order
    const uniqueWholesellers = [...new Set(this.order.items.map(item => item.wholeseller_id))];

    // For each wholeseller, create a return request for all their items
    this.isReturning = true;
    this.returningOrderIds.add(this.order.order_id);

    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('RETAILER_ORDER_DETAILS.PROCESSING_RETURN'),
    });
    await loading.present();

    let successCount = 0;
    let failedWholesellers: string[] = [];

    // Process returns for each wholeseller
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
                resolve();
              },
              error: (err) => {
                const wholesellerName = wholesellerItems[0]?.wholeseller_name || `Wholeseller ${wholesellerId}`;
                failedWholesellers.push(wholesellerName);
                resolve(); // Continue with other wholesellers
              }
            });
        });
      } catch (err) {
        const wholesellerName = wholesellerItems[0]?.wholeseller_name || `Wholeseller ${wholesellerId}`;
        failedWholesellers.push(wholesellerName);
      }
    }

    await loading.dismiss();
    this.isReturning = false;

    if (successCount > 0 && failedWholesellers.length === 0) {
      // Mark order as having a submitted return
      this.returnsSubmittedIds.add(this.order!.order_id);
      await this.showReturnSuccess();
      this.loadOrderDetails();
    } else if (successCount > 0 && failedWholesellers.length > 0) {
      // Partial success still counts as submitted
      this.returnsSubmittedIds.add(this.order!.order_id);
      await this.showReturnPartialError(failedWholesellers);
      this.loadOrderDetails();
    } else {
      await this.showReturnError();
    }

    this.returningOrderIds.delete(this.order!.order_id);
  }

  private async showReturnSuccess(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_SUCCESS_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_SUCCESS_MESSAGE'),
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
    });
    await alert.present();
  }

  private async showReturnPartialError(failedWholesellers: string[]): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_PARTIAL_ERROR_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_PARTIAL_ERROR_MESSAGE', { wholesellers: failedWholesellers.join(', ') }),
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
    });
    await alert.present();
  }

  private async showReturnError(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_ERROR_TITLE'),
      message: this.translate.instant('RETAILER_ORDER_DETAILS.RETURN_ERROR_MESSAGE'),
      buttons: [this.translate.instant('RETAILER_ORDER_DETAILS.OK')]
    });
    await alert.present();
  }

  /**
   * Returns the Ionic color for an order status badge.
   * @param status Order status code
   * @returns Color name suitable for Ionic color attribute
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
   * @param status Order status code
   * @returns Ionicon name
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


  /**
   * Calculates the subtotal for the order (before discount and tax).
   * @returns Subtotal amount
   */
  getSubtotal(): number {
    return this.order?.total_order_amount || 0;
  }

  /**
   * Calculates the final total for the order (after discount and tax).
   * @returns Final total amount
   */
  getTotal(): number {
    return (this.order?.final_amount || 0) + (this.order?.delivery_amount || 0);
  }

  getDeliveryAmount(): number {
    return this.order?.delivery_amount || 0;
  }

  /**
   * Calculates the subtotal for a single item (quantity × price).
   * @param item Order item
   * @returns Item subtotal
   */
  getItemTotal(item: OrderItem): number {
    return item.quantity * item.price;
  }

  /**
   * Gets the discount amount for an item.
   * @param item Order item
   * @returns Discount amount or 0
   */
  getItemDiscount(item: OrderItem): number {
    return item.discount_amount || 0;
  }

  /**
   * Gets the tax amount for an item.
   * @param item Order item
   * @returns Tax amount or 0
   */
  getItemTax(item: OrderItem): number {
    return item.tax_amount || 0;
  }

  /**
   * Calculates the final total for a single item (subtotal - discount + tax).
   * @param item Order item
   * @returns Final item total
   */
  getItemFinalTotal(item: OrderItem): number {
    const subtotal = this.getItemTotal(item);
    const discount = this.getItemDiscount(item);
    const tax = this.getItemTax(item);
    return subtotal - discount + tax;
  }
}
