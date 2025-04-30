import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { WholesalerApiService } from '../services/wholesaler-api.service';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class OrderDetailsComponent implements OnInit {
  orderId!: number;
  orderDetails: any;
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

  async loadOrderDetails() {
    try {
      this.wholesalerService.getOrderDetails(this.orderId).subscribe({
        next: (data) => {
          this.orderDetails = data;
          this.loading = false;
        },
        error: (error) => {
          this.error = true;
          this.loading = false;
        }
      });
    } catch (err) {
      this.error = true;
      this.loading = false;
    }
  }
}