import { Component } from '@angular/core';
import { IonicModule, NavController, MenuController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {addIcons} from 'ionicons';
import { chatbubblesSharp, notificationsCircleSharp,logoAndroid, personCircleSharp, arrowForwardCircleSharp,
   chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomePage {
  items = [
    { name: 'Potato1', qty: 5000, orders: 200 },
    { name: 'Potato2', qty: 500, orders: 200 },
    { name: 'Tomato1', qty: 1000, orders: 150 },
    { name: 'Tomato2', qty: 2000, orders: 500 },
  ];

  notifications = 5;  // Example notification count
  messages = 3;       // Example message count


  constructor(private navCtrl: NavController, private router: Router, private menuCtrl: MenuController
  ) {
    addIcons({chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowForwardCircleSharp,
       chevronForwardOutline, listCircleOutline, addCircleOutline, timeOutline, statsChartOutline});
  }
  createOrder() {
    this.router.navigate(['/wholesaler/for-sale']);
  }

  viewMyOrders() {
    this.router.navigate(['/wholesaler/orders']);
  }

  viewPastOrders() {
    this.router.navigate(['/wholesaler/screen4']);
  }

  searchItems(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.items = this.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm)
    );
  }
  async toggleMenu() {
    await this.menuCtrl.toggle();
  }

  viewDetails(item: any) {
    console.log('Item details:', item);
  }

  loadMore() {
    console.log('Load more items');
  }

  openProfile() {
    this.navCtrl.navigateForward('/profile');
  }

  openNotifications() {
    console.log('Opening notifications');
    // Add logic to navigate to notifications page if needed
  }

  openMessages() {
    console.log('Opening messages');
    // Add logic to navigate to messages page if needed
  }

  openTrends() {
    this.router.navigate(['/wholesaler/trends']);
}
}