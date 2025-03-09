import { Component } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {addIcons} from 'ionicons';
import { chatbubblesSharp, notificationsCircleSharp,logoAndroid, personCircleSharp, arrowForwardCircleSharp, chevronForwardOutline } from 'ionicons/icons';
import { Screen2Component } from '../screen2/screen2.component';
import { Screen3Component } from '../screen3/screen3.component';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, Screen2Component,Screen3Component]
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


  showScreen2 = false;
  showScreen3 = false;


  constructor(private navCtrl: NavController) {
    addIcons({chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowForwardCircleSharp, chevronForwardOutline});
  }

  searchItems(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.items = this.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm)
    );
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

  openLogoPage() {
    console.log('Opening logo page');
    // Add navigation logic if there's a specific page for the logo
  }

  loadScreen2(event: any) {
    setTimeout(() => {
      this.showScreen2 = true;
      console.log(this.showScreen2,event)
      // event.target.complete();
    }, 1000);
  }

  loadScreen3(event: any) {
    setTimeout(() => {
      this.showScreen3 = true;
      console.log(this.showScreen3,event)
      // event.target.complete();
    }, 1000);
  }

  navigateToScreen4() {
    this.navCtrl.navigateForward('/screen4');
  }
}