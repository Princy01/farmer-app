import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  home, business, list, cube, time, analytics, pulse, bulb,
  personOutline, settingsOutline, logOutOutline, closeOutline, menuOutline
} from 'ionicons/icons';
import { MenuService } from './services/menu.service';

@Component({
  selector: 'app-hamburger-menu',
  template: `
    <ion-menu side="start" menuId="main-menu" contentId="main-content">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menu</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="menuService.closeMenu()">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>
          <ion-item button (click)="menuService.navigateToHome()">
            <ion-icon name="home" slot="start"></ion-icon>
            <ion-label>Home Dashboard</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToBusinessLocations()">
            <ion-icon name="business" slot="start"></ion-icon>
            <ion-label>Business Locations</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToMyOrders()">
            <ion-icon name="list" slot="start"></ion-icon>
            <ion-label>My Orders</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToUpdateInventory()">
            <ion-icon name="cube" slot="start"></ion-icon>
            <ion-label>Update Inventory</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToPastOrders()">
            <ion-icon name="time" slot="start"></ion-icon>
            <ion-label>Past Orders</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToRestockingRecommendations()">
            <ion-icon name="bulb" slot="start"></ion-icon>
            <ion-label>Restocking Recommendations</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToMarketOpportunities()">
            <ion-icon name="analytics" slot="start"></ion-icon>
            <ion-label>Market Opportunities</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToTrends()">
            <ion-icon name="pulse" slot="start"></ion-icon>
            <ion-label>Trends</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToProfile()">
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-label>Profile</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.navigateToSettings()">
            <ion-icon name="settings-outline" slot="start"></ion-icon>
            <ion-label>Settings</ion-label>
          </ion-item>

          <ion-item button (click)="menuService.logout()" lines="none">
            <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">Logout</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HamburgerMenuComponent {

  constructor(public menuService: MenuService) {
    addIcons({
      home, business, list, cube, time, analytics, pulse, bulb,
      personOutline, settingsOutline, logOutOutline, closeOutline, menuOutline
    });
  }
}