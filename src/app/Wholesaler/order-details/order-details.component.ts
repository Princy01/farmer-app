import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WholesalerApiService, OrderFullDetails } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe]
})
export class OrderDetailsComponent implements OnInit {
  orderId!: number;
  orderDetails?: OrderFullDetails;
  loading = true;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wholesalerService: WholesalerApiService,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.checkAuthAndLoadData();
  }

  // authentication check
  private checkAuthAndLoadData() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    // Check if user has wholesaler role
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

  getStatusLabel(statusId: number): string {
    const statusMap: { [key: number]: string } = {
      1: this.translate.instant('ORDER_DETAILS.STATUS_PROCESSING'),
      2: this.translate.instant('ORDER_DETAILS.STATUS_CONFIRMED'),
      3: this.translate.instant('ORDER_DETAILS.STATUS_PAYMENT_PENDING'),
      4: this.translate.instant('ORDER_DETAILS.STATUS_REJECTED'),
      5: this.translate.instant('ORDER_DETAILS.STATUS_SUCCESSFUL'),
      6: this.translate.instant('ORDER_DETAILS.STATUS_CANCELLED'),
      7: this.translate.instant('ORDER_DETAILS.STATUS_RETURNED'),
      8: this.translate.instant('ORDER_DETAILS.STATUS_PROCESSING'),
      9: this.translate.instant('ORDER_DETAILS.STATUS_RETURN_REQUESTED'),
      10: this.translate.instant('ORDER_DETAILS.STATUS_REJECTED')
    };
    return statusMap[statusId] || this.translate.instant('ORDER_DETAILS.STATUS_UNKNOWN');
  }

  loadOrderDetails() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }

    this.loading = true;
    this.error = false;

    // Call service without wholesaler ID - backend will get user_id from JWT
    this.wholesalerService.getOrderFullDetails(this.orderId)
      .pipe(
        catchError(error => {
          console.error('Error loading order details:', error);
          this.error = true;

          // Handle authentication errors
          if (error.status === 401) {
            this.showAuthError();
            return of(null);
          }

          if (error.status === 403) {
            this.showOrderAccessError();
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
        }
      });
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