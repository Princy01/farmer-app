import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController, LoadingController, ModalController, ActionSheetController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, location, business, create, eye, home, list, cube, time,
  analytics, pulse, notifications, person, menu, logOut, settings,
  bulb, barChart, close
} from 'ionicons/icons';
import { BusinessLocationsService, BusinessLocation } from '../services/business-locations.service';
import { LocationDetailsModalComponent } from './location-details-modal.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-business-locations',
  templateUrl: './business-locations.component.html',
  styleUrls: ['./business-locations.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class BusinessLocationsComponent implements OnInit {
  businessLocations: BusinessLocation[] = [];
  isLoading = true;

  constructor(
    private businessService: BusinessLocationsService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private authService: AuthService

  ) {
    addIcons({
      add, location, business, create, eye, home, list, cube, time,
      analytics, pulse, notifications, person, menu, logOut, settings,
      bulb, barChart, close
    });
  }

  ngOnInit() {
    this.loadBusinessLocations();
  }

  ionViewWillEnter() {
    this.loadBusinessLocations();
  }

  async loadBusinessLocations() {
    const loading = await this.loadingController.create({
      message: 'Loading locations...'
    });
    await loading.present();

    try {
      const userId = '1';
      this.businessService.getAllBusinessesOfWholesaler(userId).subscribe({
        next: (locations: BusinessLocation[]) => {
          this.businessLocations = locations;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading locations:', error);
          this.isLoading = false;
        },
        complete: () => {
          loading.dismiss();
        }
      });
    } catch (error) {
      this.isLoading = false;
      loading.dismiss();
    }
  }

  addNewLocation() {
    this.router.navigate(['/wholesaler/add-business-location']);
  }

  async modifyLocation(location: BusinessLocation) {
    this.router.navigate(['/wholesaler/add-business-location'], {
      queryParams: {
        mode: 'edit',
        locationId: location.id
      }
    });
  }

  async viewLocationDetails(location: BusinessLocation) {
    const modal = await this.modalController.create({
      component: LocationDetailsModalComponent,
      componentProps: {
        location: location
      },
      presentingElement: undefined,
      showBackdrop: true,
      backdropDismiss: true
    });

    await modal.present();
  }

  navigateToHome() {
    this.router.navigate(['/wholesaler/home']);
  }

  navigateToMyOrders() {
    this.router.navigate(['wholesaler/orders']);
  }

  navigateToUpdateInventory() {
    this.router.navigate(['wholesaler/for-sale']);
  }

  navigateToPastOrders() {
    this.router.navigate(['/wholesaler/past-orders']);
  }

  navigateToRestockingRecommendations() {
    this.router.navigate(['/wholesaler/restocking-recommendations']);
  }

  navigateToMarketOpportunities() {
    this.router.navigate(['/wholesaler/market-opportunities']);
  }

  navigateToTrends() {
    this.router.navigate(['/wholesaler/trends']);
  }

  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Quick Actions',
      backdropDismiss: true,
      buttons: [
        {
          text: 'Home Dashboard',
          icon: 'home',
          handler: () => this.navigateToHome()
        },
        {
          text: 'My Orders',
          icon: 'list',
          handler: () => this.navigateToMyOrders()
        },
        {
          text: 'Update Inventory',
          icon: 'cube',
          handler: () => this.navigateToUpdateInventory()
        },
        {
          text: 'Past Orders',
          icon: 'time',
          handler: () => this.navigateToPastOrders()
        },
        {
          text: 'Restocking Recommendations',
          icon: 'bulb',
          handler: () => this.navigateToRestockingRecommendations()
        },
        {
          text: 'Market Opportunities',
          icon: 'analytics',
          handler: () => this.navigateToMarketOpportunities()
        },
        {
          text: 'Trends',
          icon: 'pulse',
          handler: () => this.navigateToTrends()
        },
        {
          text: 'Settings',
          icon: 'settings',
          handler: () => this.router.navigate(['/wholesaler/settings'])
        },
        {
          text: 'Logout',
          icon: 'close',
          cssClass: 'custom-action-sheet-btn',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        },
        
      ]
    });

    await actionSheet.present();
  }

  // Method for logout
  async logout() {
    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }
}