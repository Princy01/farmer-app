import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-screen3',
  templateUrl: './screen3.component.html',
  styleUrls: ['./screen3.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class Screen3Component {
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