import { Component, ElementRef, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrderStatusService, OrderStatus } from '../../services/order-status.service';

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './order-status.component.html',
  styleUrls: ['./order-status.component.scss']
})
export class OrderStatusComponent implements OnInit {
  orderStatus: FormGroup;
  orderStatusList: OrderStatus[] = []; // To store fetched order statuses
  isLoading = false; // Loading state for API calls

  constructor(
    private fb: FormBuilder,
    private el: ElementRef,
    private orderStatusService: OrderStatusService,
    private navCtrl: NavController
  ) {
    // Initialize the form with validation rules
    this.orderStatus = this.fb.group({
      order_status: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  ngOnInit() {
    this.loadOrderStatuses(); // Fetch order statuses on component load
  }

  // Fetch order statuses from the backend
  loadOrderStatuses() {
    this.isLoading = true;
    this.orderStatusService.getOrderStatuses().subscribe({
      next: (data) => {
        this.orderStatusList = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching order statuses:', error);
        this.isLoading = false;
      }
    });
  }

  // Check if a field is invalid for form validation
  isFieldInvalid(field: string): boolean {
    const control = this.orderStatus.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Handle form submission for inserting or updating an order status
  submitForm() {
    if (this.orderStatus.valid) {
      const orderData: OrderStatus = this.orderStatus.value;
      this.isLoading = true;

      this.orderStatusService.insertOrderStatus(orderData).subscribe({
        next: (response) => {
          console.log('Order Status Inserted:', response);
          this.orderStatus.reset();
          this.loadOrderStatuses(); // Refresh list after insertion
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error inserting order status:', error);
          this.isLoading = false;
        }
      });
    } else {
      // Scroll to the first invalid field
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Update an existing order status
  updateOrderStatus() {
    if (this.orderStatus.valid) {
      const orderData: OrderStatus = this.orderStatus.value;
      this.isLoading = true;

      this.orderStatusService.updateOrderStatus(orderData).subscribe({
        next: (response) => {
          console.log('Order Status Updated:', response);
          this.orderStatus.reset();
          this.loadOrderStatuses(); // Refresh list after update
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating order status:', error);
          this.isLoading = false;
        }
      });
    } else {
      // Scroll to the first invalid field
      const firstInvalid = this.el.nativeElement.querySelector('.ng-invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
