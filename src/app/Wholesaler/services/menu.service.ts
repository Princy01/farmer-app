import { Injectable } from '@angular/core';
import { MenuController, AlertController, ToastController } from '@ionic/angular';
import { Router, NavigationExtras } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController,
    private toastController: ToastController,
    private translate: TranslateService
  ) { }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      buttons: [
        {
          text: this.translate.instant('MENU.DISMISS'),
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }

  private async navigateSafely(route: string[], extras?: NavigationExtras): Promise<boolean> {
    try {
      await this.closeMenu();
      const result = await this.router.navigate(route, extras);
      if (!result) {
        this.showErrorToast(this.translate.instant('MENU.NAVIGATION_ERROR'));
      }
      return result;
    } catch (error) {
      console.error('Navigation error:', error);
      this.showErrorToast(this.translate.instant('MENU.NAVIGATION_ERROR'));
      return false;
    }
  }

  async openMenu() {
    try {
      await this.menuCtrl.open('main-menu');
    } catch (error) {
      console.error('Error opening menu:', error);
    }
  }

  async closeMenu() {
    try {
      await this.menuCtrl.close('main-menu');
    } catch (error) {
      console.error('Error closing menu:', error);
    }
  }

  async navigateToHome() {
    return this.navigateSafely(['/wholesaler/home']);
  }

  async navigateToBusinessLocations() {
    return this.navigateSafely(['/wholesaler/business-locations']);
  }

  async navigateToMyOrders() {
    return this.navigateSafely(['/wholesaler/orders']);
  }

  async navigateToStockDashboard() {
    return this.navigateSafely(['/wholesaler/stock-dashboard']);
  }

  async navigateToPastOrders() {
    return this.navigateSafely(['/wholesaler/past-orders']);
  }

  async navigateToRestockingRecommendations() {
    return this.navigateSafely(['/wholesaler/restocking-recommendations']);
  }

  async navigateToMarketOpportunities() {
    return this.navigateSafely(['/wholesaler/market-opportunities']);
  }

  async navigateToTrends() {
    return this.navigateSafely(['/wholesaler/trends']);
  }

  async navigateToProfile() {
    return this.navigateSafely(['/wholesaler/profile']);
  }

  async navigateToSettings() {
    return this.navigateSafely(['/wholesaler/settings']);
  }

  async logout() {
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
              await this.closeMenu();
              this.authService.logout();
              await this.router.navigate(['/login']);
            } catch (error) {
              console.error('Error during logout:', error);
              this.showErrorToast(this.translate.instant('MENU.LOGOUT_ERROR'));
            }
          }
        }
      ]
    });
    await alert.present();
  }
}