import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [IonicModule, CommonModule],
})
export class NotificationsComponent {
  notifications = [
    { title: '🚚 New Order Available!', message: 'A new delivery request is waiting.', time: 'Just now', icon: 'cart', color: 'success' },
    { title: '🚦 Traffic Alert!', message: 'Your route has been updated.', time: '5 min ago', icon: 'car', color: 'warning' },
    { title: '⏳ Delayed Order Alert', message: 'An order is delayed due to traffic.', time: '10 min ago', icon: 'alert-circle', color: 'danger' },
    { title: '✅ Payment Received', message: '₹5000 received for Order #XYZ.', time: '1 hour ago', icon: 'cash', color: 'success' }
  ];

  constructor(private router: Router) {}

  goToOrdersDashboard() {
    this.router.navigate(['/orders-dashboard']);
  }
}
