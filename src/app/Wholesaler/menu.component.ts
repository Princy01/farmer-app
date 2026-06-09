import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  home, business, list, cube, time, analytics, pulse, bulb,
  personOutline, settingsOutline, logOutOutline, closeOutline, menuOutline, walletOutline
} from 'ionicons/icons';
import { MenuService } from './services/menu.service';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject } from 'rxjs';

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

          <ion-item button (click)="navigateToEarnings()">
            <ion-icon name="wallet-outline" slot="start"></ion-icon>
            <ion-label>{{ 'MENU.EARNINGS' | translate }}</ion-label>
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
export class HamburgerMenuComponent implements OnDestroy {
  /** Subject for managing subscriptions */
  private destroy$ = new Subject<void>();

  constructor(public menuService: MenuService) {
    addIcons({
      home, business, list, cube, time, analytics, pulse, bulb,
      personOutline, settingsOutline, logOutOutline, closeOutline, menuOutline, walletOutline
    });
  }

  /**
   * Cleanup subscriptions to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Close the menu
   */
  async closeMenu(): Promise<void> {
    await this.menuService.closeMenu();
  }

  /**
   * Navigate to home dashboard
   */
  async navigateToHome(): Promise<void> {
    await this.menuService.navigateToHome();
  }

  /**
   * Navigate to business locations
   */
  async navigateToBusinessLocations(): Promise<void> {
    await this.menuService.navigateToBusinessLocations();
  }

  /**
   * Navigate to my orders
   */
  async navigateToMyOrders(): Promise<void> {
    await this.menuService.navigateToMyOrders();
  }

  /**
   * Navigate to update inventory
   */
  async navigateToUpdateInventory(): Promise<void> {
    await this.menuService.navigateToStockDashboard();
  }

  /**
   * Navigate to past orders
   */
  async navigateToPastOrders(): Promise<void> {
    await this.menuService.navigateToPastOrders();
  }

  /**
   * Navigate to earnings
   */
  async navigateToEarnings(): Promise<void> {
    await this.menuService.navigateToEarnings();
  }

  /**
   * Navigate to restocking recommendations
   */
  async navigateToRestockingRecommendations(): Promise<void> {
    await this.menuService.navigateToRestockingRecommendations();
  }

  /**
   * Navigate to market opportunities
   */
  async navigateToMarketOpportunities(): Promise<void> {
    await this.menuService.navigateToMarketOpportunities();
  }

  /**
   * Navigate to trends
   */
  async navigateToTrends(): Promise<void> {
    await this.menuService.navigateToTrends();
  }

  /**
   * Navigate to profile
   */
  async navigateToProfile(): Promise<void> {
    await this.menuService.navigateToProfile();
  }

  /**
   * Navigate to settings
   */
  async navigateToSettings(): Promise<void> {
    await this.menuService.navigateToSettings();
  }

  /**
   * Logout the user with confirmation
   */
  async logout(): Promise<void> {
    await this.menuService.logout();
  }
}
