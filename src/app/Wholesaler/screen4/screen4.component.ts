import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { IonicModule, NavController, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowBackCircleSharp } from 'ionicons/icons';
import { HeatmapComponent } from '../heatmap/heatmap.component';
import { TrendsComponent } from '../trends/trends.component';


@Component({
  selector: 'app-screen4',
  templateUrl: './screen4.component.html',
  styleUrls: ['./screen4.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HeatmapComponent, TrendsComponent]
})
export class Screen4Component implements AfterViewInit {
  @ViewChild(IonContent) content!: IonContent;

  orders = [
    { id: 1, item: 'Order1', qty: 50, price: 500, location: 'Location A' },
    { id: 2, item: 'Order2', qty: 100, price: 1000, location: 'Location B' },
    { id: 3, item: 'Order3', qty: 75, price: 750, location: 'Location C' },
    { id: 4, item: 'Order4', qty: 30, price: 300, location: 'Location D' },
    { id: 5, item: 'Order5', qty: 200, price: 2000, location: 'Location E' },
    { id: 6, item: 'Order6', qty: 60, price: 600, location: 'Location F' },
    { id: 7, item: 'Order7', qty: 90, price: 900, location: 'Location G' },
    { id: 8, item: 'Order8', qty: 40, price: 400, location: 'Location H' },
    { id: 9, item: 'Order9', qty: 120, price: 1200, location: 'Location I' },
  ];

  filters = ['D minus 1', 'D minus 2', 'D minus 3', 'D minus 4', 'Custom search'];
  selectedFilter: string | null = null;
  selectedOrderId: number | null = null;

  notifications = 5;  // Example notification count
  messages = 3;

  showHeatmap = false;
  showTrends = false;


  constructor(private router: Router, private navCtrl: NavController) {
    addIcons({ chatbubblesSharp, notificationsCircleSharp, logoAndroid, personCircleSharp, arrowBackCircleSharp });
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
  ngAfterViewInit() {
    this.content.scrollEvents = true;
  }

  applyFilter(filter: string) {
    this.selectedFilter = filter;
    console.log('Filter applied:', filter);
  }

  viewOrderDetails(order: any) {
    this.selectedOrderId = this.selectedOrderId === order.id ? null : order.id;
  }

  trackById(index: number, order: any) {
    return order.id;
  }

  loadHeatmap(event: any) {
    setTimeout(() => {
      this.showHeatmap = true;
      console.log(this.showHeatmap,event)
      // event.target.complete();
    }, 1000);
  }

  loadTrends(event: any) {
    setTimeout(() => {
      this.showTrends = true;
      console.log(this.showTrends,event)
      // event.target.complete();
    }, 1000);
  }

  navigateToHome() {
    this.navCtrl.navigateBack('/home');
  }

}
