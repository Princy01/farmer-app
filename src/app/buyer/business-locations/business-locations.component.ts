import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ModalController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  add, location, business, create, eye, home, list, cube, time,
  analytics, pulse, notifications, person, menu, logOut, settings,
  bulb, barChart, close, arrowBack
} from 'ionicons/icons';

import { BusinessLocationsService, BusinessBranchWithNames } from './business-locations.service';
import { LocationDetailsModalComponent } from './location-details-modal.component';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

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
    private authService: AuthService,
    private translate: TranslateService
  ) {
    addIcons({
      add, location, business, create, eye, home, list, cube, time,
      analytics, pulse, notifications, person, menu, logOut, settings,
      bulb, barChart, close, arrowBack
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

    if (!this.authService.hasRole('retailer')) {
      await this.showUnauthorizedError();
      return;
    }

    await this.loadBusinessLocations();
  }

  private async showAuthError() {
    const alert = await this.alertController.create({
      header: this.translate.instant('BUSINESS_LOCATIONS.AUTH_ERROR'),
      message: this.translate.instant('BUSINESS_LOCATIONS.SESSION_EXPIRED'),
      buttons: [
        {
          text: this.translate.instant('BUSINESS_LOCATIONS.OK'),
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
      header: this.translate.instant('BUSINESS_LOCATIONS.ACCESS_DENIED'),
      message: this.translate.instant('BUSINESS_LOCATIONS.NO_PERMISSION'),
      buttons: [
        {
          text: this.translate.instant('BUSINESS_LOCATIONS.OK'),
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
      message: this.translate.instant('BUSINESS_LOCATIONS.LOADING')
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

      this.businessService.getAllBusinessesWithNameOfUser().subscribe({
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
            header: this.translate.instant('BUSINESS_LOCATIONS.ERROR'),
            message: this.translate.instant('BUSINESS_LOCATIONS.LOAD_ERROR'),
            buttons: [this.translate.instant('BUSINESS_LOCATIONS.OK')]
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
        header: this.translate.instant('BUSINESS_LOCATIONS.ERROR'),
        message: this.translate.instant('BUSINESS_LOCATIONS.UNEXPECTED_ERROR'),
        buttons: [this.translate.instant('BUSINESS_LOCATIONS.OK')]
      });
      await alert.present();
    }
  }

  addNewLocation() {
    this.router.navigate(['/buyer/add-business-location']);
  }

  async modifyLocation(location: BusinessBranchWithNames) {
    this.router.navigate(['/buyer/add-business-location'], {
      queryParams: {
        mode: 'edit',
        locationId: location.branch_id
      },
      state: {
        location: location
      }
    });
  }

  async viewLocationDetails(location: BusinessBranchWithNames) {
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

  goBack() {
    this.router.navigate(['/buyer/buyer-home']);
  }
}