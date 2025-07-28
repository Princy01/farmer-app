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

}