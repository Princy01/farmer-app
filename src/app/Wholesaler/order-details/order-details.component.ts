import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { alertCircleOutline, star, starOutline } from 'ionicons/icons';
import { WholesalerApiService, OrderFullDetails } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  WholesalerRatingsService,
  PeerRatingContextResponse,
  PeerRatingPairOption,
  PeerRatingRecentItem,
} from '../ratings/wholesaler-ratings.service';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslatePipe]
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  orderId!: number;
  orderDetails?: OrderFullDetails;
  loading = true;
  error = false;
  private subscription: Subscription = new Subscription();

  ratingContext: PeerRatingContextResponse | null = null;
  ratingsLoading = false;
  ratingsError: string | null = null;
  selectedPairKey: string | null = null;
  selectedStars = 0;
  ratingComment = '';
  ratingSubmitting = false;
  ratingFeedback: { type: 'success' | 'danger'; message: string } | null = null;
  readonly starValues = [1, 2, 3, 4, 5];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wholesalerService: WholesalerApiService,
    private wholesalerRatingsService: WholesalerRatingsService,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({
      alertCircleOutline,
      star,
      starOutline,
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.orderId = Number(id);

    // Validate order ID
    if (!id || isNaN(this.orderId) || this.orderId <= 0) {
      this.showInvalidOrderIdError();
      return;
    }

    this.checkAuthAndLoadData();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      this.showUnauthorizedError();
      return;
    }

    this.loadOrderDetails();
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDER_DETAILS.AUTH_ERROR'),
      message: this.translate.instant('ORDER_DETAILS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('ORDER_DETAILS.OK'),
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDER_DETAILS.ACCESS_DENIED'),
      message: this.translate.instant('ORDER_DETAILS.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('ORDER_DETAILS.OK'),
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showInvalidOrderIdError() {
    this.loading = false;
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDER_DETAILS.INVALID_ORDER'),
      message: this.translate.instant('ORDER_DETAILS.INVALID_ORDER_ID'),
      buttons: [
        {
          text: this.translate.instant('ORDER_DETAILS.OK'),
          handler: () => {
            this.router.navigate(['/wholesaler/orders']);
          }
        }
      ]
    });
    await alert.present();
  }

  getStatusLabel(statusId: number): string {
    const statusMap: { [key: number]: string } = {
      1: 'ORDER_DETAILS.STATUS_PROCESSING',
      2: 'ORDER_DETAILS.STATUS_CONFIRMED',
      3: 'ORDER_DETAILS.STATUS_PAYMENT_PENDING',
      4: 'ORDER_DETAILS.STATUS_REJECTED',
      5: 'ORDER_DETAILS.STATUS_SUCCESSFUL',
      6: 'ORDER_DETAILS.STATUS_CANCELLED',
      7: 'ORDER_DETAILS.STATUS_RETURNED',
      8: 'ORDER_DETAILS.STATUS_PROCESSING',
      9: 'ORDER_DETAILS.STATUS_RETURN_REQUESTED',
      10: 'ORDER_DETAILS.STATUS_REJECTED'
    };
    return statusMap[statusId] || 'ORDER_DETAILS.STATUS_UNKNOWN';
  }

  getStatusClass(statusId: number): string {
    const statusClassMap: { [key: number]: string } = {
      1: 'processing',
      2: 'confirmed',
      3: 'payment-pending',
      4: 'rejected',
      5: 'successful',
      6: 'cancelled',
      7: 'returned',
      8: 'processing',
      9: 'return-requested',
      10: 'rejected'
    };
    return statusClassMap[statusId] || 'unknown';
  }

  loadOrderDetails() {
    this.loading = true;
    this.error = false;

    const orderSubscription = this.wholesalerService.getOrderFullDetails(this.orderId)
      .pipe(
        catchError(error => {
          this.error = true;

          if (error.status === 401) {
            this.showAuthError();
            return of(null);
          }

          if (error.status === 403) {
            this.showOrderAccessError();
            return of(null);
          }

          if (error.status === 404) {
            this.showOrderNotFoundError();
            return of(null);
          }

          this.showGenericError();
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(data => {
        if (data) {
          this.orderDetails = data;
          this.error = false;
          this.loadRatingContext();
        }
      });

    this.subscription.add(orderSubscription);
  }

  private async showOrderAccessError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDER_DETAILS.ACCESS_DENIED'),
      message: this.translate.instant('ORDER_DETAILS.ORDER_ACCESS_DENIED'),
      buttons: [
        {
          text: this.translate.instant('ORDER_DETAILS.OK'),
          handler: () => {
            this.router.navigate(['/wholesaler/orders']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showOrderNotFoundError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDER_DETAILS.NOT_FOUND'),
      message: this.translate.instant('ORDER_DETAILS.ORDER_NOT_FOUND'),
      buttons: [
        {
          text: this.translate.instant('ORDER_DETAILS.OK'),
          handler: () => {
            this.router.navigate(['/wholesaler/orders']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showGenericError() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ORDER_DETAILS.ERROR'),
      message: this.translate.instant('ORDER_DETAILS.LOAD_ERROR'),
      buttons: [
        {
          text: this.translate.instant('ORDER_DETAILS.DISMISS'),
          role: 'cancel'
        },
        {
          text: this.translate.instant('ORDER_DETAILS.RETRY'),
          handler: () => {
            this.loadOrderDetails();
          }
        }
      ]
    });
    await alert.present();
  }

  goBack() {
    this.router.navigate(['/wholesaler/orders']);
  }

  reportIssue(): void {
    if (!this.orderDetails?.order_id) {
      return;
    }

    this.router.navigate(['/wholesaler/report-issue', this.orderDetails.order_id]);
  }

  openMyIssues(): void {
    if (this.orderDetails?.order_id) {
      this.router.navigate(['/wholesaler/my-issues'], {
        queryParams: { orderId: this.orderDetails.order_id },
      });
      return;
    }

    this.router.navigate(['/wholesaler/my-issues']);
  }

  loadRatingContext(): void {
    if (!this.orderDetails?.order_id) {
      this.ratingContext = null;
      return;
    }

    this.ratingsLoading = true;
    this.ratingsError = null;

    const ratingsSub = this.wholesalerRatingsService
      .getRatingContext(this.orderDetails.order_id)
      .subscribe({
        next: (context) => {
          this.ratingContext = context;
          this.ratingsLoading = false;

          if (context.eligible_pairs?.length > 0) {
            const hasSelection = context.eligible_pairs.some((pair) => pair.pair_key === this.selectedPairKey);
            if (!hasSelection) {
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

    this.subscription.add(ratingsSub);
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
    if (!this.orderDetails?.order_id || !selectedPair) {
      return;
    }

    if (this.selectedStars < 1 || this.selectedStars > 5) {
      this.ratingFeedback = {
        type: 'danger',
        message: this.translate.instant('ORDER_DETAILS.RATING_REQUIRED'),
      };
      return;
    }

    this.ratingSubmitting = true;
    this.ratingFeedback = null;

    const ratingsSub = this.wholesalerRatingsService
      .submitPeerRating({
        order_id: this.orderDetails.order_id,
        job_id: selectedPair.job_id,
        rater_entity_type: selectedPair.rater_entity_type,
        rater_entity_id: selectedPair.rater_entity_id,
        ratee_entity_type: selectedPair.ratee_entity_type,
        ratee_entity_id: selectedPair.ratee_entity_id,
        stars: this.selectedStars,
        comment: this.ratingComment.trim().slice(0, 500),
      })
      .subscribe({
        next: (response) => {
          this.ratingSubmitting = false;
          this.selectedStars = 0;
          this.ratingComment = '';
          this.ratingFeedback = {
            type: 'success',
            message: response.message || this.translate.instant('ORDER_DETAILS.RATING_SUBMIT_SUCCESS'),
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

    this.subscription.add(ratingsSub);
  }


private getRatingErrorMessage(message: string): string {
  if (!message) {
    return this.translate.instant('ORDER_DETAILS.RATING_SUBMIT_ERROR');
  }

  const normalized = message.toLowerCase();
  if (normalized.includes('already exists')) {
    return this.translate.instant('ORDER_DETAILS.RATING_DUPLICATE');
  }
  if (normalized.includes('not valid') || normalized.includes('only available') || normalized.includes('access')) {
    return this.translate.instant('ORDER_DETAILS.RATING_FORBIDDEN');
  }
  if (normalized.includes('must be delivered')) {
    return this.translate.instant('ORDER_DETAILS.RATING_NOT_DELIVERED');
  }
  if (normalized.includes('required') || normalized.includes('invalid')) {
    return this.translate.instant('ORDER_DETAILS.RATING_BAD_REQUEST');
  }
  return message;
}
}