import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  leafOutline,
  starOutline,
  warningOutline,
  cubeOutline,
  cashOutline,
  calendarOutline,
  locationOutline,
  addCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-screen3',
  templateUrl: './for-sale.component.html',
  styleUrls: ['./for-sale.component.scss'],
  standalone: true,
  imports: [IonicModule, ReactiveFormsModule, CommonModule]
})
export class ForSaleComponent implements OnInit {
  orderForm: FormGroup | null = null;
  qualities = ['High', 'Medium', 'Low'];
  wastages = ['None', 'Minimal', 'High'];

  constructor(private fb: FormBuilder) {
    addIcons({
      leafOutline,
      starOutline,
      warningOutline,
      cubeOutline,
      cashOutline,
      calendarOutline,
      locationOutline,
      addCircleOutline
    });
  }

  ngOnInit() {
    this.orderForm = this.fb.group({
      item: ['', Validators.required],
      quality: ['', Validators.required],
      wastage: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      price: ['', [Validators.required, Validators.min(0)]],
      dateTime: ['', Validators.required],
      location: ['', Validators.required]
    });
  }

  createOrder() {
    if (this.orderForm!.valid) {
      console.log('Order Created:', this.orderForm!.value);
      alert('Order created successfully!');
    } else {
      alert('Please fill all required fields correctly.');
    }
  }
}