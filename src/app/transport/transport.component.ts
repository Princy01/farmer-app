import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import {
  IonApp, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonMenuToggle,
  IonTitle, IonToolbar, IonRouterOutlet, IonList, IonItem, IonLabel, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline, pricetagOutline, carOutline, personOutline, navigateOutline,
  locationOutline, checkmarkCircleOutline, cashOutline, timeOutline, notificationsOutline, documentTextOutline, checkmarkDoneOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-transport',
  templateUrl: './transport.component.html',
  styleUrls: ['./transport.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterModule, IonApp, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonMenuToggle,
    IonTitle, IonToolbar, IonRouterOutlet, IonList, IonItem, IonLabel, IonIcon
  ]
})
export class TransportComponent implements OnInit {
  pageTitle: string = 'Transport';

  // Mapping of routes to titles
  titleMap: { [key: string]: string } = {
    '/transport/transport-dashboard': 'Dashboard',
    '/transport/transport-update-rates': 'Update Rates',
    '/transport/manage-vehicles': 'Manage Vehicles',
    '/transport/manage-drivers': 'Manage Drivers',
    '/transport/transport-requests': 'Requests',
    '/transport/active-deliveries': 'Active Deliveries',
    '/transport/live-tracking': 'Live Tracking',
    '/transport/delivery-confirmation': 'Delivery Confirmation',
    '/transport/earnings': 'Earnings & Reports',
    '/transport/history': 'Delivery History',
    '/transport/notifications': 'Notifications',
  };

  constructor(private router: Router) {
    addIcons({
      speedometerOutline, pricetagOutline, carOutline, personOutline, navigateOutline,
      locationOutline, checkmarkCircleOutline, cashOutline, timeOutline, notificationsOutline, documentTextOutline, checkmarkDoneOutline
    });

    // Listen for route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const currentRoute = event.urlAfterRedirects; // Get final redirected URL
        this.pageTitle = this.getPageTitle(currentRoute);
      }
    });
  }

  ngOnInit() { }

  // Function to get the page title dynamically
  getPageTitle(url: string): string {
    for (const route in this.titleMap) {
      if (url.startsWith(route)) {
        return this.titleMap[route];
      }
    }
    return 'Transport'; // Default title
  }
}
