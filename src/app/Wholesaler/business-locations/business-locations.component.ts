import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController, ModalController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  add, location, business, create, eye, home, list, cube, time,
  analytics, pulse, notifications, person, menu, logOut, settings,
  bulb, barChart, close, card, call, mail, arrowBack
} from 'ionicons/icons';

import { BusinessLocationsService, BusinessBranchWithNames } from './business-locations.service';
import { AuthService } from 'src/app/auth/auth.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-business-locations',
  templateUrl: './business-locations.component.html',
  styleUrls: ['./business-locations.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TranslatePipe]
})
export class BusinessLocationsComponent implements OnInit, OnDestroy {
  businessLocations: BusinessBranchWithNames[] = [];
  isLoading = true;
  isRetrying = false;
  private destroy$ = new Subject<void>();

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
      bulb, barChart, close, card, call, mail, arrowBack
    });
  }

  ngOnInit() {
    this.checkAuthAndLoadLocations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
      header: this.translate.instant('BUSINESS_LOCATIONS.AUTH_ERROR'),
      message: this.translate.instant('BUSINESS_LOCATIONS.SESSION_EXPIRED'),
      backdropDismiss: false,
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

      this.businessService.getAllBusinessesWithNameOfWholesaler()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (locations: BusinessBranchWithNames[]) => {
            if (!locations || !Array.isArray(locations)) {
              this.businessLocations = [];
            } else {
              this.businessLocations = locations;
            }
            this.isLoading = false;
            this.isRetrying = false;
          },
          error: async (error: any) => {
            this.isLoading = false;
            this.businessLocations = [];
            loading.dismiss();

            if (error?.status === 401) {
              await this.showAuthError();
              return;
            }

            if (error?.status === 403) {
              await this.showUnauthorizedError();
              return;
            }

            let errorMessage = 'BUSINESS_LOCATIONS.LOAD_ERROR';
            if (error?.status === 0 || error?.status === undefined) {
              errorMessage = 'BUSINESS_LOCATIONS.NETWORK_ERROR';
            } else if (error?.status === 500 || error?.status >= 500) {
              errorMessage = 'BUSINESS_LOCATIONS.SERVER_ERROR';
            } else if (error?.status === 404) {
              errorMessage = 'BUSINESS_LOCATIONS.NOT_FOUND_ERROR';
            }

            const alert = await this.alertController.create({
              header: this.translate.instant('BUSINESS_LOCATIONS.ERROR'),
              message: this.translate.instant(errorMessage),
              backdropDismiss: false,
              buttons: [
                {
                  text: this.translate.instant('BUSINESS_LOCATIONS.RETRY'),
                  handler: () => {
                    this.isRetrying = true;
                    this.loadBusinessLocations();
                  }
                },
                {
                  text: this.translate.instant('BUSINESS_LOCATIONS.BACK'),
                  handler: () => {
                    this.goBack();
                  }
                }
              ]
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

      const alert = await this.alertController.create({
        header: this.translate.instant('BUSINESS_LOCATIONS.ERROR'),
        message: this.translate.instant('BUSINESS_LOCATIONS.UNEXPECTED_ERROR'),
        backdropDismiss: false,
        buttons: [
          {
            text: this.translate.instant('BUSINESS_LOCATIONS.RETRY'),
            handler: () => {
              this.isRetrying = true;
              this.loadBusinessLocations();
            }
          },
          {
            text: this.translate.instant('BUSINESS_LOCATIONS.BACK'),
            handler: () => {
              this.goBack();
            }
          }
        ]
      });
      await alert.present();
    }
  }

  addNewLocation() {
    if (!this.authService.isAuthenticated()) {
      this.showAuthError();
      return;
    }
    this.router.navigate(['/wholesaler/add-business-location']);
  }

  async modifyLocation(location: BusinessBranchWithNames) {
    if (!location?.branch_id) {
      const alert = await this.alertController.create({
        header: this.translate.instant('BUSINESS_LOCATIONS.ERROR'),
        message: this.translate.instant('BUSINESS_LOCATIONS.INVALID_LOCATION'),
        buttons: [this.translate.instant('BUSINESS_LOCATIONS.OK')]
      });
      await alert.present();
      return;
    }
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

  async viewProducts(location: BusinessBranchWithNames) {
    if (!location?.branch_id || !location?.shop_name) {
      const alert = await this.alertController.create({
        header: this.translate.instant('BUSINESS_LOCATIONS.ERROR'),
        message: this.translate.instant('BUSINESS_LOCATIONS.INVALID_LOCATION'),
        buttons: [this.translate.instant('BUSINESS_LOCATIONS.OK')]
      });
      await alert.present();
      return;
    }
    this.router.navigate(['/wholesaler/branch-products'], {
      queryParams: { branchId: location.branch_id, branchName: location.shop_name }
    });
  }

  goBack() {
    this.router.navigate(['/wholesaler/home']);
  }
}