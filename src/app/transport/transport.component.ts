import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { AlertController, MenuController } from '@ionic/angular';
import {
  IonApp, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonMenuToggle,
  IonTitle, IonToolbar, IonRouterOutlet, IonList, IonItem, IonLabel, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  speedometerOutline, pricetagOutline, carOutline, personOutline, navigateOutline,
  locationOutline, checkmarkCircleOutline, cashOutline, timeOutline, notificationsOutline,
  documentTextOutline, checkmarkDoneOutline, personAddOutline, listOutline, personCircleOutline, settingsOutline, alertCircleOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-transport',
  templateUrl: './transport.component.html',
  styleUrls: ['./transport.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    RouterModule, IonApp, IonButtons, IonContent, IonHeader, IonMenu, IonMenuButton, IonMenuToggle,
    IonTitle, IonToolbar, IonRouterOutlet, IonList, IonItem, IonLabel, IonIcon, CommonModule, TranslatePipe
  ]
})
export class TransportComponent implements OnDestroy {
  pageTitle: string = 'Transport';
  activeRoute: string = '';
  private destroy$ = new Subject<void>();

  // Mapping of routes to i18n keys
  titleMap: { [key: string]: string } = {
    '/transport/profile': 'TRANSPORT_MENU.PROFILE',
    '/transport/transport-dashboard': 'TRANSPORT_MENU.DASHBOARD',
    '/transport/transport-update-rates': 'TRANSPORT_MENU.UPDATE_RATES',
    '/transport/manage-vehicles': 'TRANSPORT_MENU.MANAGE_VEHICLES',
    '/transport/manage-drivers': 'TRANSPORT_MENU.MANAGE_DRIVERS',
    '/transport/driver-registration': 'TRANSPORT_MENU.DRIVER_REGISTRATION',
    '/transport/transport-requests': 'TRANSPORT_MENU.TRANSPORT_REQUESTS',
    '/transport/active-deliveries': 'TRANSPORT_MENU.ACTIVE_DELIVERIES',
    '/transport/live-tracking': 'TRANSPORT_MENU.LIVE_TRACKING',
    '/transport/delivery-confirmation': 'TRANSPORT_MENU.DELIVERY_CONFIRMATION',
    '/transport/pickup-orders': 'TRANSPORT_MENU.PICKUP_ORDERS',
    '/transport/pickup-confirmation': 'TRANSPORT_MENU.PICKUP_CONFIRMATION',
    '/transport/customer-chat': 'TRANSPORT_MENU.CUSTOMER_CHAT',
    '/transport/earnings-dashboard': 'TRANSPORT_MENU.EARNINGS_REPORTS',
    '/transport/delivery-history': 'TRANSPORT_MENU.DELIVERY_HISTORY',
    '/transport/dispute-management': 'TRANSPORT_MENU.DISPUTE_MANAGEMENT',
    '/transport/my-issues': 'TRANSPORT_MENU.DISPUTE_MANAGEMENT',
    '/transport/report-issue': 'TRANSPORT_MENU.DISPUTE_MANAGEMENT',
    '/transport/issue-detail': 'TRANSPORT_MENU.DISPUTE_MANAGEMENT',
    '/transport/issue-submitted': 'TRANSPORT_MENU.DISPUTE_MANAGEMENT',
    '/transport/notifications': 'TRANSPORT_MENU.NOTIFICATIONS',
    '/transport/settings': 'TRANSPORT_MENU.SETTINGS'
  };

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private menuCtrl: MenuController
  ) {
    addIcons({personCircleOutline,speedometerOutline,documentTextOutline,personAddOutline,listOutline,checkmarkCircleOutline,timeOutline,alertCircleOutline,settingsOutline,logOutOutline,pricetagOutline,carOutline,personOutline,locationOutline,cashOutline,notificationsOutline,navigateOutline,checkmarkDoneOutline});
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.activeRoute = event.urlAfterRedirects;
          this.pageTitle = this.getPageTitle(this.activeRoute);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Function to get the page title dynamically
  getPageTitle(url: string): string {
    for (const route in this.titleMap) {
      if (url.startsWith(route)) {
        const i18nKey = this.titleMap[route];
        return this.translate.instant(i18nKey);
      }
    }
    return this.translate.instant('TRANSPORT_MENU.TRANSPORT');
  }

  // Function to check if a menu item is active
  isActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }

  async logout(): Promise<void> {
    try {
      await this.menuCtrl.close();

      const alert = await this.alertCtrl.create({
        header: this.translate.instant('MENU.LOGOUT_TITLE'),
        message: this.translate.instant('MENU.LOGOUT_MESSAGE'),
        buttons: [
          {
            text: this.translate.instant('MENU.CANCEL'),
            role: 'cancel'
          },
          {
            text: this.translate.instant('MENU.LOGOUT_CONFIRM'),
            handler: async () => {
              try {
                this.authService.logout();
                await this.router.navigate(['/login']);
              } catch (error) {
                // Silently ignore logout navigation errors
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      // Silently ignore menu/alert errors
    }
  }
}
