import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  home, business, list, cube, time, analytics, pulse, bulb,
  personOutline, settingsOutline, logOutOutline, closeOutline, menuOutline
} from 'ionicons/icons';
import { MenuService } from './services/menu.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-hamburger-menu',
  template: `
    <ion-menu side="start" menuId="main-menu" contentId="main-content">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>{{ 'MENU.TITLE' | translate }}</ion-title>
          <ion-buttons slot="end">
            <ion-button (click)="closeMenu()">
              <ion-icon name="close-outline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list>
          <ion-item button (click)="navigateToHome()">
            <ion-icon name="home" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.HOME_DASHBOARD' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToBusinessLocations()">
            <ion-icon name="business" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.BUSINESS_LOCATIONS' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToMyOrders()">
            <ion-icon name="list" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.MY_ORDERS' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToUpdateInventory()">
            <ion-icon name="cube" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.UPDATE_INVENTORY' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToPastOrders()">
            <ion-icon name="time" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.PAST_ORDERS' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToRestockingRecommendations()">
            <ion-icon name="bulb" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.RESTOCKING_RECOMMENDATIONS' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToMarketOpportunities()">
            <ion-icon name="analytics" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.MARKET_OPPORTUNITIES' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToTrends()">
            <ion-icon name="pulse" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.TRENDS' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToProfile()">
            <ion-icon name="person-outline" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.PROFILE' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="navigateToSettings()">
            <ion-icon name="settings-outline" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.SETTINGS' | translate }}</ion-label>
          </ion-item>

          <ion-item button (click)="logout()" lines="none">
            <ion-icon name="log-out-outline" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">{{ 'MENU.LOGOUT' | translate }}</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>
  `,
  standalone: true,
  imports: [CommonModule, IonicModule, TranslatePipe]
})
export class HamburgerMenuComponent implements OnInit {

  constructor(public menuService: MenuService) {
    addIcons({
      home, business, list, cube, time, analytics, pulse, bulb,
      personOutline, settingsOutline, logOutOutline, closeOutline, menuOutline
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  closeMenu(): void {
    this.menuService.closeMenu();
  }

  navigateToHome(): void {
    this.menuService.navigateToHome();
  }

  navigateToBusinessLocations(): void {
    this.menuService.navigateToBusinessLocations();
  }

  navigateToMyOrders(): void {
    this.menuService.navigateToMyOrders();
  }

  navigateToUpdateInventory(): void {
    this.menuService.navigateToStockDashboard();
  }

  navigateToPastOrders(): void {
    this.menuService.navigateToPastOrders();
  }

  navigateToRestockingRecommendations(): void {
    this.menuService.navigateToRestockingRecommendations();
  }

  navigateToMarketOpportunities(): void {
    this.menuService.navigateToMarketOpportunities();
  }

  navigateToTrends(): void {
    this.menuService.navigateToTrends();
  }

  navigateToProfile(): void {
    this.menuService.navigateToProfile();
  }

  navigateToSettings(): void {
    this.menuService.navigateToSettings();
  }

  logout(): void {
    this.menuService.logout();
  }
}