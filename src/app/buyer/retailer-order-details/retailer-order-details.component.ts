import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
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
} from 'ionicons/icons';
import { RetailerOrderService, RetailerOrderDetails, OrderItem } from './retailer-order-details.service';
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
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe],
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

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private orderService: RetailerOrderService,
    private ratingsService: BuyerRatingsService,
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
    });
  }

  ngOnInit(): void {
    this.loadOrderDetails();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  isSuccessfulStatus(statusName: string): boolean {
    const value = statusName.toLowerCase();
    return value.includes('successful') || value.includes('delivered') || value.includes('complete');
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
    return this.order?.final_amount || 0;
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