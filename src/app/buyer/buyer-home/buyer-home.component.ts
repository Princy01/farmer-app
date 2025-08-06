import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonContent, MenuController, AlertController } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { BuyerApiService } from '../services/buyer-api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { addIcons } from 'ionicons';
import {
  personCircleOutline,
  locationOutline,
  chevronForwardOutline,
  heartOutline,
  cartOutline,
  personOutline,
  archiveOutline,
  linkOutline,
  settingsOutline,
  closeOutline,
  statsChartOutline,
  gridOutline,
  alertCircleOutline,
  refreshOutline,
  menuOutline,
  createOutline,
  logOutOutline
} from 'ionicons/icons';

interface Category {
  id: number;
  name: string;
  image: string;
}

@Component({
  selector: 'app-buyer-home',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './buyer-home.component.html',
  styleUrls: ['./buyer-home.component.scss'],
})
export class BuyerHomeComponent {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  hideHeader = false;
  loadingCategories = false;
  errorLoadingCategories = false;
  categories: any[] = [];

  constructor(
    private router: Router,
    private menuCtrl: MenuController,
    private buyerApiService: BuyerApiService,
    private authService: AuthService,
    private alertCtrl: AlertController
  ) {
    addIcons({
      personCircleOutline,
      locationOutline,
      chevronForwardOutline,
      heartOutline,
      cartOutline,
      personOutline,
      archiveOutline,
      linkOutline,
      settingsOutline,
      closeOutline,
      statsChartOutline,
      gridOutline,
      alertCircleOutline,
      refreshOutline,
      menuOutline,
      createOutline,
      logOutOutline
    });
  }

  fetchCategories() {
    this.loadingCategories = true;
    this.errorLoadingCategories = false;

    this.buyerApiService.getSuperCategories().subscribe({
      next: (response) => {
        this.categories = response;
        this.loadingCategories = false;
        console.log('Categories:', this.categories);
      },
      error: (error) => {
        this.errorLoadingCategories = true;
        this.loadingCategories = false;
        console.error('Error fetching categories:', error);
      }
    });
  }

  ngOnInit() {
    this.fetchCategories();
  }

  onScroll(event: any) {
    this.hideHeader = event.detail.scrollTop > 100;
  }

  onImageError(event: any) {
    // Set a default image when category image fails to load
    event.target.src = '';
  }

  // Menu functions
  openMenu() {
    this.menuCtrl.open('buyer-menu');
  }

  closeMenu() {
    this.menuCtrl.close('buyer-menu');
  }

  // Navigation functions
  async navigateToProfile() {
    await this.closeMenu();
    this.router.navigate(['/buyer/profile']);
  }

  async navigateToTrackOrders() {
    await this.closeMenu();
    this.router.navigate(['/buyer/retailer-order-tracking'], {
      queryParams: { id: 'ORD123456' }
    });
  }

  navigateToBusinessLocations() {
    this.router.navigate(['/buyer/business-locations']);
  }

  navigateToUpdateBusiness() {
    this.router.navigate(['/buyer/update-business']);
  }


  async navigateToSettings() {
    await this.closeMenu();
    this.router.navigate(['/buyer/settings']);
  }

  async logout() {
    await this.closeMenu();

    const alert = await this.alertCtrl.create({
      header: 'Confirm Logout',
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

  openTrends() {
    this.router.navigate(['/buyer/RetailerTrends']);
  }
}