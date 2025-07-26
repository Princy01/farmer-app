import { Injectable } from '@angular/core';
import { MenuController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private authService: AuthService,
    private alertCtrl: AlertController
  ) { }

  async openMenu() {
    await this.menuCtrl.open('main-menu');
  }

  async closeMenu() {
    await this.menuCtrl.close('main-menu');
  }

  async navigateToHome() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/home']);
  }

  async navigateToBusinessLocations() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/business-locations']);
  }

  async navigateToMyOrders() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/orders']);
  }

  async navigateToUpdateInventory() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/for-sale']);
  }

  async navigateToPastOrders() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/past-orders']);
  }

  async navigateToRestockingRecommendations() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/restocking-recommendations']);
  }

  async navigateToMarketOpportunities() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/market-opportunities']);
  }

  async navigateToTrends() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/trends']);
  }

  async navigateToProfile() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/profile']);
  }

  async navigateToSettings() {
    await this.closeMenu();
    this.router.navigate(['/wholesaler/settings']);
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: async () => {
            await this.closeMenu();
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }
}