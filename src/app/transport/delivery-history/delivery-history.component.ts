import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService, Delivery } from './delivery-history.service';

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './delivery-history.component.html',
  styleUrls: ['./delivery-history.component.scss']
})
export class DeliveryHistoryComponent implements OnInit {
  searchQuery: string = '';
  deliveries: Delivery[] = [];
  filteredDeliveries: Delivery[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private deliveryService: DeliveryService) {}

  ngOnInit() {
    this.loadDeliveryHistory();
  }

  loadDeliveryHistory() {
  this.isLoading = true;
  this.error = null;

  this.deliveryService.getDeliveryHistory().subscribe({
    next: (response) => {
      if (response && Array.isArray(response.deliveries)) {
        this.deliveries = response.deliveries;
        this.deliveries.forEach(delivery => {
          delivery.hasDispute = Math.random() < 0.3;
        });
        this.filteredDeliveries = [...this.deliveries];
      } else {
        this.deliveries = [];
        this.filteredDeliveries = [];
        this.error = 'No delivery history found or invalid response.';
      }
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to load delivery history', err);
      this.error = 'Failed to load delivery history. Please try again.';
      this.isLoading = false;
    }
  });
}

  filterDeliveries() {
    if (!this.searchQuery.trim()) {
      this.filteredDeliveries = [...this.deliveries];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredDeliveries = this.deliveries.filter(delivery =>
      delivery.pickup_address.toLowerCase().includes(query) ||
      delivery.drop_address.toLowerCase().includes(query) ||
      delivery.order_id.toString().includes(query)
    );
  }

  resolveDispute(jobId: string) {
    console.log(`Resolving dispute for Job ID: ${jobId}`);
    // this.deliveryService.resolveDispute(jobId).subscribe(...)
  }

  goToReports() {
    console.log('Navigating to Reports');
  }
}