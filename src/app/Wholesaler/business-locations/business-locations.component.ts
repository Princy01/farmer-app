import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ModalController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  add, location, business, create, eye, home, list, cube, time,
  analytics, pulse, notifications, person, menu, logOut, settings,
  bulb, barChart, close, card, call, mail, arrowBack
} from 'ionicons/icons';

import { BusinessLocationsService, BusinessBranchWithNames } from './business-locations.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-business-locations',
  templateUrl: './business-locations.component.html',
  styleUrls: ['./business-locations.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe]
})
export class BusinessLocationsComponent implements OnInit {
  businessLocations: BusinessBranchWithNames[] = [];
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
      bulb, barChart, close, card, call, mail, arrowBack
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadLocations();
  }

  ionViewWillEnter() {
    this.checkAuthAndLoadLocations();
  }

  private async checkAuthAndLoadLocations() {
    if (!this.authService.isAuthenticated()) {
      await this.showAuthError();
      return;
    }

    if (!this.authService.hasRole('wholesaler')) {
      await this.showUnauthorizedError();
      return;
    }

    await this.loadBusinessLocations();
  }

  private async showAuthError() {
    const alert = await this.alertController.create({
      header: 'Authentication Error',
      message: 'Your session has expired. Please login again.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  private async showUnauthorizedError() {
    const alert = await this.alertController.create({
      header: 'Access Denied',
      message: 'You do not have permission to access this page.',
      buttons: [
        {
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  async loadBusinessLocations() {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Loading locations...'
    });
    await loading.present();

    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        this.isLoading = false;
        this.businessLocations = [];
        loading.dismiss();
        await this.showAuthError();
        return;
      }

      this.businessService.getAllBusinessesWithNameOfWholesaler().subscribe({
        next: (locations: BusinessBranchWithNames[]) => {
          this.businessLocations = locations || [];
          this.isLoading = false;
        },
        error: async (error: any) => {
          this.isLoading = false;
          this.businessLocations = [];
          loading.dismiss();

          console.error('Error loading business locations:', error);

          if (error.status === 401) {
            await this.showAuthError();
            return;
          }

          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Failed to load locations. Please try again later.',
            buttons: ['OK']
          });
          await alert.present();
        },
        complete: () => {
          loading.dismiss();
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.businessLocations = [];
      loading.dismiss();

      console.error('Unexpected error:', error);

      const alert = await this.alertController.create({
        header: 'Error',
        message: 'An unexpected error occurred.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  addNewLocation() {
    this.router.navigate(['/wholesaler/add-business-location']);
  }

  async modifyLocation(location: BusinessBranchWithNames) {
    this.router.navigate(['/wholesaler/add-business-location'], {
      queryParams: {
        mode: 'edit',
        locationId: location.branch_id
      },
      state: {
        location: location
      }
    });
  }

  viewProducts(location: BusinessBranchWithNames) {
  this.router.navigate(['/wholesaler/branch-products'], {
    queryParams: { branchId: location.branch_id, branchName: location.shop_name }
  });
}

goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}