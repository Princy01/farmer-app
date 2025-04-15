import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-admin-order-detail',
  imports: [CommonModule, IonicModule],
  templateUrl: './admin-order-detail.page.html',
  styleUrls: ['./admin-order-detail.page.scss'],
})
export class AdminOrderDetailPage {
  order: any;

  constructor(private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.order = nav?.extras.state?.['order'];
  }
}