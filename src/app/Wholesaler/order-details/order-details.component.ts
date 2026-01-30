import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WholesalerApiService, OrderFullDetails } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  orderId!: number;
  orderDetails?: OrderFullDetails;
  loading = true;
  error = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wholesalerService: WholesalerApiService,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private translate: TranslateService
  ) { }

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
}