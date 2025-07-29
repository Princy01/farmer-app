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
import { BusinessLocationsService, BusinessLocation } from './business-locations.service';
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
        loading.dismiss();
        await this.showAuthError();
        return;
      }
      this.businessService.getAllBusinessesOfWholesaler().subscribe({
        next: (locations: BusinessLocation[]) => {
          this.businessLocations = locations;
          this.isLoading = false;
        },
        error: async (error: any) => {
          this.isLoading = false;
          loading.dismiss();
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
      loading.dismiss();
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

  async modifyLocation(location: BusinessLocation) {
    this.router.navigate(['/wholesaler/add-business-location'], {
      queryParams: {
        mode: 'edit',
        locationId: location.b_branch_id
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

}