import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  constructor(
    private route: ActivatedRoute,
    private wholesalerService: WholesalerApiService
  ) {}

  ngOnInit() {
    this.orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadOrderDetails();
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
    this.loading = true;
    this.error = false;

    this.wholesalerService.getOrderFullDetails(this.orderId)
      .pipe(
        catchError(error => {
          console.error('Error loading order details:', error);
          this.error = true;
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
}