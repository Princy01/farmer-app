import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WholesalerApiService, OrderFullDetails } from '../services/wholesaler-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe, TranslateDirective]
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
    private authService: AuthService
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
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
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
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
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
      1: 'Processing',
      2: 'Confirmed',
      3: 'Payment Pending',
      4: 'Rejected',
      5: 'Successful',
      6: 'Cancelled',
      7: 'Returned',
      8: 'Processing',
      9: 'Return Requested',
      10: 'Rejected'
    };
    return statusMap[statusId] || 'Unknown';
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
      header: 'Access Denied',
      message: 'You are not authorized to view this order.',
      buttons: [
        {
          text: 'OK',
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
      header: 'Error',
      message: 'Failed to load order details. Please try again later.',
      buttons: [
        {
          text: 'Dismiss',
          role: 'cancel'
        },
        {
          text: 'Retry',
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