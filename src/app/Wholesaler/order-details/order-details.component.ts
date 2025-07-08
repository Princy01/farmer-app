import { Component, OnInit } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WholesalerApiService, OrderFullDetails } from '../services/wholesaler-api.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class OrderDetailsComponent implements OnInit {
  orderId!: number;
  orderDetails?: OrderFullDetails;
  loading = true;
  error = false;

  private wholesalerId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wholesalerService: WholesalerApiService,
    private alertCtrl: AlertController) { }

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.initializeWholesaler();
    this.loadOrderDetails();
  }

  private initializeWholesaler() {
    const storedWholesalerId = localStorage.getItem('wholesalerId');
    if (storedWholesalerId) {
      this.wholesalerId = Number(storedWholesalerId);
      this.loadOrderDetails();
    } else {
      // Redirect to login if no wholesaler ID found
      this.showAuthError();
    }
  }

  private async showAuthError() {
    const alert = await this.alertCtrl.create({
      header: 'Authentication Error',
      message: 'Please login again.',
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
    if (!this.wholesalerId) {
      this.showAuthError();
      return;
    }

    this.loading = true;
    this.error = false;

    this.wholesalerService.getOrderFullDetails(this.orderId, this.wholesalerId)
      .pipe(
        catchError(error => {
          console.error('Error loading order details:', error);
          this.error = true;
          if (error.status === 403 || error.status === 401) {
            this.showUnauthorizedError();
          }
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
  private async showUnauthorizedError() {
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

  goBack() {
    this.router.navigate(['/wholesaler/orders']);
  }

}