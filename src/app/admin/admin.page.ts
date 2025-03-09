import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import {
  IonApp, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonMenuToggle,
  IonTitle, IonToolbar, IonRouterOutlet, IonList, IonItem, IonLabel, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, carOutline, pricetagsOutline, storefrontOutline,
  locationOutline, mapOutline, alertCircleOutline, cubeOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterModule, IonApp, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonMenuToggle,
    IonTitle, IonToolbar, IonRouterOutlet, IonList, IonItem, IonLabel, IonIcon
  ]
})
export class AdminPage implements OnInit {
  pageTitle: string = 'Admin';

  // Mapping of routes to titles
  titleMap: { [key: string]: string } = {
    '/admin/driver': 'Driver',
    '/admin/vehicle': 'Vehicle',
    '/admin/category': 'Category',
    '/admin/mandi': 'Mandi',
    '/admin/location': 'Location',
    '/admin/states': 'State',
    '/admin/violation': 'Violation',
    '/admin/product': 'Product',
  };

  constructor(private router: Router) {
    addIcons({
      personOutline, carOutline, pricetagsOutline, storefrontOutline,
      locationOutline, mapOutline, alertCircleOutline, cubeOutline
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

  // Function to get the page title
  getPageTitle(url: string): string {
    for (const route in this.titleMap) {
      if (url.startsWith(route)) {
        return this.titleMap[route];
      }
    }
    return 'Admin'; // Default title
  }
}
