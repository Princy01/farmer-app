import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
  imports: [IonicModule, FormsModule, CommonModule]
})
export class ForSaleComponent {
  constructor() {
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
  order = {
    item: '',
    quality: '',
    wastage: '',
    quantity: '',
    price: '',
    dateTime: '',
    location: ''
  };

  qualities = ['High', 'Medium', 'Low'];
  wastages = ['None', 'Minimal', 'High'];

  createOrder() {
    console.log('Order Created:', this.order);
    alert('Order created successfully!');
  }
}